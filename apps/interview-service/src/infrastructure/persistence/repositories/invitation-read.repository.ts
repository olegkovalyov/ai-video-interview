import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InvitationEntity } from '../entities/invitation.entity';
import { ResponseEntity } from '../entities/response.entity';
import {
  InvitationResponseDto,
  InvitationWithTemplateDto,
  InvitationListItemDto,
  PaginatedInvitationsResponseDto,
  ResponseItemDto,
  InvitationProgressDto,
  AnalysisResultDto,
} from '../../../application/dto/invitation.response.dto';
import { IInvitationReadRepository } from '../../../domain/repositories/invitation-read.repository.interface';

/**
 * Read Repository для Query side (CQRS)
 * Работает напрямую с TypeORM entities без Domain aggregates
 */
@Injectable()
export class InvitationReadRepository implements IInvitationReadRepository {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(ResponseEntity)
    private readonly responseRepository: Repository<ResponseEntity>,
  ) {}

  /**
   * Get single invitation (для GetInvitationQuery)
   */
  async findById(id: string): Promise<InvitationResponseDto | null> {
    const entity = await this.invitationRepository.findOne({
      where: { id },
      relations: ['responses'],
    });

    if (!entity) {
      return null;
    }

    return this.mapToDto(entity);
  }

  /**
   * Get invitation with template data (для GetInvitationQuery с includeTemplate)
   */
  async findByIdWithTemplate(id: string): Promise<InvitationWithTemplateDto | null> {
    const entity = await this.invitationRepository.findOne({
      where: { id },
      relations: ['responses', 'template', 'template.questions'],
    });

    if (!entity || !entity.template) {
      return null;
    }

    return this.mapToWithTemplateDto(entity);
  }

  /**
   * List invitations for candidate (для ListCandidateInvitationsQuery)
   */
  async findByCandidateId(
    candidateId: string,
    filters?: { status?: string },
    skip: number = 0,
    limit: number = 10,
  ): Promise<PaginatedInvitationsResponseDto> {
    const where: any = { candidateId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [entities, total] = await this.invitationRepository.findAndCount({
      where,
      relations: ['responses', 'template'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = entities.map((entity) => this.mapToListItemDto(entity));
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(skip / limit) + 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * List invitations created by HR (для ListHRInvitationsQuery)
   */
  async findByInvitedBy(
    invitedBy: string,
    filters?: { status?: string; templateId?: string },
    skip: number = 0,
    limit: number = 10,
  ): Promise<PaginatedInvitationsResponseDto> {
    const where: any = { invitedBy };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.templateId) {
      where.templateId = filters.templateId;
    }

    const [entities, total] = await this.invitationRepository.findAndCount({
      where,
      relations: ['responses', 'template'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = entities.map((entity) => this.mapToListItemDto(entity));
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(skip / limit) + 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Check if invitation exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.invitationRepository.count({ where: { id } });
    return count > 0;
  }

  // =========== PRIVATE MAPPERS ===========

  /**
   * Calculate progress from responses count
   */
  private calculateProgress(
    responsesCount: number,
    totalQuestions: number,
  ): InvitationProgressDto {
    const percentage =
      totalQuestions > 0
        ? Math.round((responsesCount / totalQuestions) * 100)
        : 0;

    return {
      answered: responsesCount,
      total: totalQuestions,
      percentage,
    };
  }

  /**
   * Map Response Entity to DTO
   */
  private mapResponseToDto(entity: ResponseEntity): ResponseItemDto {
    return {
      id: entity.id,
      questionId: entity.questionId,
      questionIndex: entity.questionIndex,
      questionText: entity.questionText,
      responseType: entity.responseType,
      textAnswer: entity.textAnswer || undefined,
      codeAnswer: entity.codeAnswer || undefined,
      videoUrl: entity.videoUrl || undefined,
      duration: entity.duration,
      submittedAt: entity.submittedAt,
    };
  }

  /**
   * Map Entity to Full DTO (для GetInvitationQuery)
   */
  private mapToDto(entity: InvitationEntity): InvitationResponseDto {
    const responses = entity.responses
      ? entity.responses
          .sort((a, b) => a.questionIndex - b.questionIndex)
          .map((r) => this.mapResponseToDto(r))
      : [];

    return {
      id: entity.id,
      templateId: entity.templateId,
      candidateId: entity.candidateId,
      companyName: entity.companyName,
      invitedBy: entity.invitedBy,
      status: entity.status,
      allowPause: entity.allowPause,
      showTimer: entity.showTimer,
      expiresAt: entity.expiresAt,
      startedAt: entity.startedAt || undefined,
      completedAt: entity.completedAt || undefined,
      completedReason: entity.completedReason || undefined,
      progress: this.calculateProgress(responses.length, entity.totalQuestions),
      responses,
      analysis: this.mapAnalysisToDto(entity),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map Analysis fields to DTO
   */
  private mapAnalysisToDto(entity: InvitationEntity): AnalysisResultDto | undefined {
    if (!entity.analysisId && !entity.analysisStatus) {
      return undefined;
    }

    return {
      analysisId: entity.analysisId || undefined,
      status: entity.analysisStatus || undefined,
      score: entity.analysisScore || undefined,
      recommendation: entity.analysisRecommendation || undefined,
      completedAt: entity.analysisCompletedAt || undefined,
      errorMessage: entity.analysisErrorMessage || undefined,
    };
  }

  /**
   * Map Entity to DTO with Template (для GetInvitationQuery с includeTemplate)
   */
  private mapToWithTemplateDto(entity: InvitationEntity): InvitationWithTemplateDto {
    const baseDto = this.mapToDto(entity);

    const questions = entity.template.questions
      ? entity.template.questions
          .sort((a, b) => a.order - b.order)
          .map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            order: q.order,
            timeLimit: q.timeLimit,
            required: q.required,
            hints: q.hints || undefined,
            options: q.options || undefined,
          }))
      : [];

    return {
      ...baseDto,
      templateTitle: entity.template.title,
      templateDescription: entity.template.description,
      questions,
    };
  }

  /**
   * Map Entity to List Item DTO (для ListInvitationsQuery)
   */
  private mapToListItemDto(entity: InvitationEntity): InvitationListItemDto {
    const responsesCount = entity.responses ? entity.responses.length : 0;

    return {
      id: entity.id,
      templateId: entity.templateId,
      templateTitle: entity.template?.title || '',
      candidateId: entity.candidateId,
      companyName: entity.companyName,
      status: entity.status,
      allowPause: entity.allowPause,
      expiresAt: entity.expiresAt,
      progress: this.calculateProgress(responsesCount, entity.totalQuestions),
      analysisStatus: entity.analysisStatus || undefined,
      analysisScore: entity.analysisScore || undefined,
      analysisRecommendation: entity.analysisRecommendation || undefined,
      createdAt: entity.createdAt,
    };
  }
}
