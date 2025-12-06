import { Invitation } from '../aggregates/invitation.aggregate';
import { InvitationStatus } from '../value-objects/invitation-status.vo';

export interface InvitationFilters {
  candidateId?: string;
  invitedBy?: string;
  templateId?: string;
  companyId?: string;
  status?: string;
}

export interface IInvitationRepository {
  /**
   * Save invitation (create or update)
   */
  save(invitation: Invitation): Promise<void>;

  /**
   * Find invitation by ID
   */
  findById(id: string): Promise<Invitation | null>;

  /**
   * Find invitation by ID with template data
   */
  findByIdWithTemplate(id: string): Promise<{
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
  } | null>;

  /**
   * Find invitations by candidate ID
   */
  findByCandidateId(
    candidateId: string,
    filters?: { status?: string },
    skip?: number,
    limit?: number,
  ): Promise<{ invitations: Invitation[]; total: number }>;

  /**
   * Find invitations by HR user ID (invitedBy)
   */
  findByInvitedBy(
    invitedBy: string,
    filters?: { status?: string; templateId?: string },
    skip?: number,
    limit?: number,
  ): Promise<{ invitations: Invitation[]; total: number }>;

  /**
   * Find all invitations with filters and pagination
   */
  findAll(
    filters: InvitationFilters,
    skip: number,
    limit: number,
  ): Promise<{ invitations: Invitation[]; total: number }>;

  /**
   * Check if invitation exists for candidate and template
   */
  existsByCandidateAndTemplate(
    candidateId: string,
    templateId: string,
  ): Promise<boolean>;

  /**
   * Find invitations that should be auto-completed (for cron job)
   * Finds in_progress invitations with allowPause=false and lastActivityAt older than timeout
   */
  findTimedOutInvitations(
    timeoutMinutes: number,
  ): Promise<Invitation[]>;

  /**
   * Find expired invitations (expiresAt passed but not yet marked as expired)
   */
  findExpiredInvitations(): Promise<Invitation[]>;

  /**
   * Update last activity timestamp
   */
  updateLastActivity(id: string): Promise<void>;

  /**
   * Delete invitation
   */
  delete(id: string): Promise<void>;

  /**
   * Check if invitation exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count invitations by candidate
   */
  countByCandidateId(candidateId: string): Promise<number>;

  /**
   * Count invitations by HR user
   */
  countByInvitedBy(invitedBy: string): Promise<number>;
}
