import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import { InterviewTemplate } from '../../../domain/aggregates/interview-template.aggregate';
import { TemplateStatus } from '../../../domain/value-objects/template-status.vo';
import { InterviewTemplateEntity } from '../entities/interview-template.entity';
import { InterviewTemplateMapper } from '../mappers/interview-template.mapper';

@Injectable()
export class TypeOrmInterviewTemplateRepository
  implements IInterviewTemplateRepository
{
  constructor(
    @InjectRepository(InterviewTemplateEntity)
    private readonly repository: Repository<InterviewTemplateEntity>,
  ) {}

  async save(template: InterviewTemplate): Promise<void> {
    const entity = InterviewTemplateMapper.toEntity(template);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<InterviewTemplate | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!entity) {
      return null;
    }

    return InterviewTemplateMapper.toDomain(entity);
  }

  async findByCreatedBy(userId: string): Promise<InterviewTemplate[]> {
    const entities = await this.repository.find({
      where: { createdBy: userId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InterviewTemplateMapper.toDomain(entity));
  }

  async findByStatus(status: TemplateStatus): Promise<InterviewTemplate[]> {
    const entities = await this.repository.find({
      where: { status: status.toString() },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InterviewTemplateMapper.toDomain(entity));
  }

  async findByCreatedByAndStatus(
    userId: string,
    status: TemplateStatus,
  ): Promise<InterviewTemplate[]> {
    const entities = await this.repository.find({
      where: {
        createdBy: userId,
        status: status.toString(),
      },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InterviewTemplateMapper.toDomain(entity));
  }

  async findAll(
    filters: {
      createdBy?: string;
      status?: string;
    },
    skip: number,
    limit: number,
  ): Promise<{ templates: InterviewTemplate[]; total: number }> {
    const where: any = {};

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      relations: ['questions'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const templates = entities.map((entity) =>
      InterviewTemplateMapper.toDomain(entity),
    );

    return { templates, total };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async countByCreatedBy(userId: string): Promise<number> {
    return this.repository.count({ where: { createdBy: userId } });
  }

  async countByStatus(status: TemplateStatus): Promise<number> {
    return this.repository.count({ where: { status: status.toString() } });
  }
}
