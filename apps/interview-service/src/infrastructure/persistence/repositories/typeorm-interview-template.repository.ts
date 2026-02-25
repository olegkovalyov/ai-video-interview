import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { ITransactionContext } from '../../../application/interfaces/transaction-context.interface';
import { InterviewTemplate } from '../../../domain/aggregates/interview-template.aggregate';
import { TemplateStatus } from '../../../domain/value-objects/template-status.vo';
import { InterviewTemplateEntity } from '../entities/interview-template.entity';
import { QuestionEntity } from '../entities/question.entity';
import { InterviewTemplateMapper } from '../mappers/interview-template.mapper';

@Injectable()
export class TypeOrmInterviewTemplateRepository
  implements IInterviewTemplateRepository
{
  constructor(
    @InjectRepository(InterviewTemplateEntity)
    private readonly repository: Repository<InterviewTemplateEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
  ) {}

  async save(template: InterviewTemplate, tx?: ITransactionContext): Promise<void> {
    const entity = InterviewTemplateMapper.toEntity(template);
    if (tx) {
      await (tx as unknown as EntityManager).save(InterviewTemplateEntity, entity);
    } else {
      await this.repository.save(entity);
    }
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

  async delete(id: string, tx?: ITransactionContext): Promise<void> {
    if (tx) {
      await (tx as unknown as EntityManager).delete(InterviewTemplateEntity, id);
    } else {
      await this.repository.delete(id);
    }
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

  /**
   * Reorder questions using batch UPDATE with CASE WHEN
   * Uses transaction to avoid unique constraint violations
   */
  async reorderQuestions(
    templateId: string,
    questionIds: string[],
    tx?: ITransactionContext,
  ): Promise<void> {
    const doReorder = async (manager: EntityManager) => {
      // Step 1: Set all to negative values to avoid unique constraint conflicts
      let negativeCase = 'CASE ';
      questionIds.forEach((questionId, index) => {
        const tempOrder = -(index + 1);
        negativeCase += `WHEN id = '${questionId}' THEN ${tempOrder} `;
      });
      negativeCase += 'END';

      await manager
        .createQueryBuilder()
        .update(QuestionEntity)
        .set({ order: () => negativeCase })
        .where('template_id = :templateId', { templateId })
        .execute();

      // Step 2: Set to final positive values
      let positiveCase = 'CASE ';
      questionIds.forEach((questionId, index) => {
        const newOrder = index + 1;
        positiveCase += `WHEN id = '${questionId}' THEN ${newOrder} `;
      });
      positiveCase += 'END';

      await manager
        .createQueryBuilder()
        .update(QuestionEntity)
        .set({ order: () => positiveCase })
        .where('template_id = :templateId', { templateId })
        .execute();
    };

    if (tx) {
      await doReorder(tx as unknown as EntityManager);
    } else {
      await this.questionRepository.manager.transaction(async (manager) => {
        await doReorder(manager);
      });
    }
  }
}
