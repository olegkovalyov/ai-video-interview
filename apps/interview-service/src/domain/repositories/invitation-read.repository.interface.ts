import type {
  InvitationResponseDto,
  InvitationWithTemplateDto,
  PaginatedInvitationsResponseDto,
} from '../../application/dto/invitation.response.dto';

/**
 * Read Repository Interface for Invitations (Query side — CQRS)
 * Returns DTOs directly, bypassing aggregate reconstitution for performance.
 */
export interface IInvitationReadRepository {
  findById(id: string): Promise<InvitationResponseDto | null>;
  findByIdWithTemplate(id: string): Promise<InvitationWithTemplateDto | null>;
  findByCandidateId(
    candidateId: string,
    filters?: { status?: string },
    skip?: number,
    limit?: number,
  ): Promise<PaginatedInvitationsResponseDto>;
  findByInvitedBy(
    invitedBy: string,
    filters?: { status?: string; templateId?: string },
    skip?: number,
    limit?: number,
  ): Promise<PaginatedInvitationsResponseDto>;
  exists(id: string): Promise<boolean>;
}
