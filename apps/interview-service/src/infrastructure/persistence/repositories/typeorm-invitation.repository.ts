import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { IInvitationRepository, InvitationFilters } from '../../../domain/repositories/invitation.repository.interface';
import { Invitation } from '../../../domain/aggregates/invitation.aggregate';
import { InvitationEntity } from '../entities/invitation.entity';
import { ResponseEntity } from '../entities/response.entity';
import { InvitationMapper } from '../mappers/invitation.mapper';

@Injectable()
export class TypeOrmInvitationRepository implements IInvitationRepository {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly repository: Repository<InvitationEntity>,
    @InjectRepository(ResponseEntity)
    private readonly responseRepository: Repository<ResponseEntity>,
  ) {}

  async save(invitation: Invitation): Promise<void> {
    const entity = InvitationMapper.toEntity(invitation);
    
    // Save invitation
    await this.repository.save(entity);
    
    // Save responses separately to handle cascade properly
    if (entity.responses && entity.responses.length > 0) {
      await this.responseRepository.save(entity.responses);
    }
  }

  async findById(id: string): Promise<Invitation | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['responses'],
    });

    if (!entity) {
      return null;
    }

    return InvitationMapper.toDomain(entity);
  }

  async findByIdWithTemplate(id: string): Promise<{
    invitation: Invitation;
    template: {
      id: string;
      title: string;
      description: string;
      questions: Array<{
        id: string;
        text: string;
        type: string;
        order: number;
        timeLimit: number;
        required: boolean;
      }>;
    };
  } | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['responses', 'template', 'template.questions'],
    });

    if (!entity || !entity.template) {
      return null;
    }

    const invitation = InvitationMapper.toDomain(entity);

    return {
      invitation,
      template: {
        id: entity.template.id,
        title: entity.template.title,
        description: entity.template.description,
        questions: entity.template.questions
          .sort((a, b) => a.order - b.order)
          .map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            order: q.order,
            timeLimit: q.timeLimit,
            required: q.required,
          })),
      },
    };
  }

  async findByCandidateId(
    candidateId: string,
    filters?: { status?: string },
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ invitations: Invitation[]; total: number }> {
    const where: any = { candidateId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      relations: ['responses'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const invitations = entities.map((entity) =>
      InvitationMapper.toDomain(entity),
    );

    return { invitations, total };
  }

  async findByInvitedBy(
    invitedBy: string,
    filters?: { status?: string; templateId?: string },
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ invitations: Invitation[]; total: number }> {
    const where: any = { invitedBy };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.templateId) {
      where.templateId = filters.templateId;
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      relations: ['responses'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const invitations = entities.map((entity) =>
      InvitationMapper.toDomain(entity),
    );

    return { invitations, total };
  }

  async findAll(
    filters: InvitationFilters,
    skip: number,
    limit: number,
  ): Promise<{ invitations: Invitation[]; total: number }> {
    const where: any = {};

    if (filters.candidateId) {
      where.candidateId = filters.candidateId;
    }

    if (filters.invitedBy) {
      where.invitedBy = filters.invitedBy;
    }

    if (filters.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      relations: ['responses'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const invitations = entities.map((entity) =>
      InvitationMapper.toDomain(entity),
    );

    return { invitations, total };
  }

  async existsByCandidateAndTemplate(
    candidateId: string,
    templateId: string,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: { candidateId, templateId },
    });
    return count > 0;
  }

  async findTimedOutInvitations(timeoutMinutes: number): Promise<Invitation[]> {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const entities = await this.repository.find({
      where: {
        status: 'in_progress',
        allowPause: false,
        lastActivityAt: LessThan(timeoutDate),
      },
      relations: ['responses'],
    });

    return entities.map((entity) => InvitationMapper.toDomain(entity));
  }

  async findExpiredInvitations(): Promise<Invitation[]> {
    const now = new Date();

    const entities = await this.repository.find({
      where: [
        { status: 'pending', expiresAt: LessThan(now) },
        { status: 'in_progress', expiresAt: LessThan(now) },
      ],
      relations: ['responses'],
    });

    return entities.map((entity) => InvitationMapper.toDomain(entity));
  }

  async updateLastActivity(id: string): Promise<void> {
    await this.repository.update(id, {
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async countByCandidateId(candidateId: string): Promise<number> {
    return this.repository.count({ where: { candidateId } });
  }

  async countByInvitedBy(invitedBy: string): Promise<number> {
    return this.repository.count({ where: { invitedBy } });
  }
}
