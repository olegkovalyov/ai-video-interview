import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAnalysisResultRepository,
  FindAllOptions,
  PaginatedResult,
} from '../../../domain/repositories/analysis-result.repository.interface';
import { AnalysisResult } from '../../../domain/aggregates/analysis-result.aggregate';
import { AnalysisResultEntity } from '../entities/analysis-result.entity';
import { AnalysisResultPersistenceMapper } from '../mappers/analysis-result-persistence.mapper';

@Injectable()
export class TypeOrmAnalysisResultRepository implements IAnalysisResultRepository {
  constructor(
    @InjectRepository(AnalysisResultEntity)
    private readonly repository: Repository<AnalysisResultEntity>,
    private readonly mapper: AnalysisResultPersistenceMapper,
  ) {}

  async save(analysisResult: AnalysisResult, sourceEventData?: Record<string, unknown>): Promise<void> {
    const entity = this.mapper.toEntity(analysisResult);
    if (sourceEventData !== undefined) {
      entity.sourceEventData = sourceEventData;
    }
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<AnalysisResult | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['questionAnalyses'],
    });

    if (!entity) return null;
    return this.mapper.toDomain(entity);
  }

  async findByInvitationId(invitationId: string): Promise<AnalysisResult | null> {
    const entity = await this.repository.findOne({
      where: { invitationId },
      relations: ['questionAnalyses'],
    });

    if (!entity) return null;
    return this.mapper.toDomain(entity);
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<AnalysisResult>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.repository
      .createQueryBuilder('analysis')
      .loadRelationCountAndMap('analysis.questionAnalysesCount', 'analysis.questionAnalyses');

    if (options.status) {
      qb.andWhere('analysis.status = :status', { status: options.status });
    }

    if (options.candidateId) {
      qb.andWhere('analysis.candidateId = :candidateId', {
        candidateId: options.candidateId,
      });
    }

    if (options.templateId) {
      qb.andWhere('analysis.templateId = :templateId', {
        templateId: options.templateId,
      });
    }

    qb.orderBy('analysis.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      items: entities.map((entity) => this.mapper.toDomain(entity)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async existsByInvitationId(invitationId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { invitationId } });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async saveSourceEventData(analysisId: string, data: Record<string, unknown>): Promise<void> {
    await this.repository.update(analysisId, { sourceEventData: data as any });
  }

  async getSourceEventData(analysisId: string): Promise<Record<string, unknown> | null> {
    const entity = await this.repository.findOne({
      where: { id: analysisId },
      select: ['id', 'sourceEventData'],
    });
    return entity?.sourceEventData ?? null;
  }
}
