import { Invitation } from '../../../domain/aggregates/invitation.aggregate';
import { Response } from '../../../domain/entities/response.entity';
import { InvitationStatus } from '../../../domain/value-objects/invitation-status.vo';
import { ResponseType } from '../../../domain/value-objects/response-type.vo';
import { CompletedReason } from '../../../domain/events/invitation-completed.event';
import { InvitationEntity } from '../entities/invitation.entity';
import { ResponseEntity } from '../entities/response.entity';

export class InvitationMapper {
  /**
   * Map TypeORM entity to Domain aggregate
   */
  static toDomain(entity: InvitationEntity): Invitation {
    // Map responses
    const responses = entity.responses
      ? entity.responses.map((r) => this.responseEntityToDomain(r))
      : [];

    // Create status value object
    const status = InvitationStatus.create(entity.status);

    // Reconstruct aggregate
    const invitation = Invitation.reconstitute({
      id: entity.id,
      templateId: entity.templateId,
      candidateId: entity.candidateId,
      companyId: entity.companyId,
      invitedBy: entity.invitedBy,
      status,
      allowPause: entity.allowPause,
      showTimer: entity.showTimer,
      expiresAt: entity.expiresAt,
      startedAt: entity.startedAt || undefined,
      completedAt: entity.completedAt || undefined,
      lastActivityAt: entity.lastActivityAt || undefined,
      completedReason: entity.completedReason as CompletedReason | undefined,
      responses,
      totalQuestions: entity.totalQuestions,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });

    return invitation;
  }

  /**
   * Map Domain aggregate to TypeORM entity
   */
  static toEntity(aggregate: Invitation): InvitationEntity {
    const entity = new InvitationEntity();

    entity.id = aggregate.id;
    entity.templateId = aggregate.templateId;
    entity.candidateId = aggregate.candidateId;
    entity.companyId = aggregate.companyId;
    entity.invitedBy = aggregate.invitedBy;
    entity.status = aggregate.status.toString();
    entity.allowPause = aggregate.allowPause;
    entity.showTimer = aggregate.showTimer;
    entity.expiresAt = aggregate.expiresAt;
    entity.startedAt = aggregate.startedAt || null;
    entity.completedAt = aggregate.completedAt || null;
    entity.lastActivityAt = aggregate.lastActivityAt || null;
    entity.completedReason = aggregate.completedReason || null;
    entity.totalQuestions = aggregate.totalQuestions;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;

    // Map responses
    entity.responses = aggregate.responses.map((r) =>
      this.responseDomainToEntity(r),
    );

    return entity;
  }

  /**
   * Map ResponseEntity to Domain Response
   */
  private static responseEntityToDomain(entity: ResponseEntity): Response {
    const responseType = ResponseType.create(entity.responseType);

    return Response.reconstitute(entity.id, {
      invitationId: entity.invitationId,
      questionId: entity.questionId,
      questionIndex: entity.questionIndex,
      questionText: entity.questionText,
      responseType,
      textAnswer: entity.textAnswer || undefined,
      codeAnswer: entity.codeAnswer || undefined,
      videoUrl: entity.videoUrl || undefined,
      duration: entity.duration,
      submittedAt: entity.submittedAt,
    });
  }

  /**
   * Map Domain Response to ResponseEntity
   */
  private static responseDomainToEntity(response: Response): ResponseEntity {
    const entity = new ResponseEntity();

    entity.id = response.id;
    entity.invitationId = response.invitationId;
    entity.questionId = response.questionId;
    entity.questionIndex = response.questionIndex;
    entity.questionText = response.questionText;
    entity.responseType = response.responseType.toString();
    entity.textAnswer = response.textAnswer || null;
    entity.codeAnswer = response.codeAnswer || null;
    entity.videoUrl = response.videoUrl || null;
    entity.duration = response.duration;
    entity.submittedAt = response.submittedAt;

    return entity;
  }
}
