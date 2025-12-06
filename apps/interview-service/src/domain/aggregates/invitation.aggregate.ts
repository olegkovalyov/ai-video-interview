import { AggregateRoot } from '../base/base.aggregate-root';
import { Response } from '../entities/response.entity';
import { InvitationStatus } from '../value-objects/invitation-status.vo';
import { ResponseType } from '../value-objects/response-type.vo';
import {
  InvitationCreatedEvent,
  InvitationStartedEvent,
  ResponseSubmittedEvent,
  InvitationCompletedEvent,
  CompletedReason,
} from '../events';

export interface InvitationProps {
  id: string;
  templateId: string;
  candidateId: string;
  companyName: string;
  invitedBy: string;
  status: InvitationStatus;
  allowPause: boolean;
  showTimer: boolean;
  expiresAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastActivityAt?: Date;
  completedReason?: CompletedReason;
  responses: Response[];
  totalQuestions: number; // Total questions in template (for progress tracking)
  createdAt: Date;
  updatedAt: Date;
}

export class Invitation extends AggregateRoot {
  private readonly props: InvitationProps;

  private constructor(props: InvitationProps) {
    super();
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get templateId(): string {
    return this.props.templateId;
  }

  get candidateId(): string {
    return this.props.candidateId;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get invitedBy(): string {
    return this.props.invitedBy;
  }

  get status(): InvitationStatus {
    return this.props.status;
  }

  get allowPause(): boolean {
    return this.props.allowPause;
  }

  get showTimer(): boolean {
    return this.props.showTimer;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get lastActivityAt(): Date | undefined {
    return this.props.lastActivityAt;
  }

  get completedReason(): CompletedReason | undefined {
    return this.props.completedReason;
  }

  get responses(): Response[] {
    return [...this.props.responses];
  }

  get totalQuestions(): number {
    return this.props.totalQuestions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Factory method - Create new invitation
  static create(
    id: string,
    templateId: string,
    candidateId: string,
    companyName: string,
    invitedBy: string,
    expiresAt: Date,
    totalQuestions: number,
    allowPause: boolean = true,
    showTimer: boolean = true,
  ): Invitation {
    // Domain validation
    if (!templateId) {
      throw new Error('Template ID is required');
    }

    if (!candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!companyName || companyName.trim() === '') {
      throw new Error('Company name is required');
    }

    if (!invitedBy) {
      throw new Error('Inviter ID is required');
    }

    if (expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    if (totalQuestions < 1) {
      throw new Error('Template must have at least one question');
    }

    const invitation = new Invitation({
      id,
      templateId,
      candidateId,
      companyName: companyName.trim(),
      invitedBy,
      status: InvitationStatus.pending(),
      allowPause,
      showTimer,
      expiresAt,
      responses: [],
      totalQuestions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Raise domain event
    invitation.apply(
      new InvitationCreatedEvent(
        id,
        templateId,
        candidateId,
        companyName.trim(),
        invitedBy,
        expiresAt,
      ),
    );

    return invitation;
  }

  // Factory method - Reconstitute from persistence
  static reconstitute(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  // Business Methods

  /**
   * Check if invitation has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Start the interview
   * Business Rule: Can only start pending invitation
   * Business Rule: Cannot start expired invitation
   * Business Rule: Only candidate can start their own invitation
   */
  start(userId: string): void {
    if (this.candidateId !== userId) {
      throw new Error('Only the invited candidate can start this interview');
    }

    if (this.isExpired()) {
      this.props.status = InvitationStatus.expired();
      throw new Error('This invitation has expired');
    }

    if (!this.status.canBeStarted()) {
      throw new Error('Interview can only be started from pending status');
    }

    this.props.status = InvitationStatus.inProgress();
    this.props.startedAt = new Date();
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(
      new InvitationStartedEvent(
        this.id,
        this.candidateId,
        this.templateId,
        this.props.startedAt,
      ),
    );
  }

  /**
   * Submit a response to a question
   * Business Rule: Can only submit responses when in_progress
   * Business Rule: Cannot submit duplicate responses for same question
   * Business Rule: Only candidate can submit responses
   */
  submitResponse(
    userId: string,
    response: Response,
  ): void {
    if (this.candidateId !== userId) {
      throw new Error('Only the invited candidate can submit responses');
    }

    if (this.isExpired()) {
      throw new Error('Cannot submit response to expired invitation');
    }

    if (!this.status.canSubmitResponse()) {
      throw new Error('Can only submit responses when interview is in progress');
    }

    // Check for duplicate response
    const existingResponse = this.props.responses.find(
      (r) => r.questionId === response.questionId,
    );
    if (existingResponse) {
      throw new Error('Response for this question already exists');
    }

    this.props.responses.push(response);
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(
      new ResponseSubmittedEvent(
        this.id,
        response.id,
        response.questionId,
        response.responseType.toString(),
        this.props.responses.length,
        this.totalQuestions,
      ),
    );
  }

  /**
   * Complete the interview
   * Business Rule: Can only complete when in_progress
   * Business Rule: For manual completion, all questions must be answered
   * Business Rule: For auto_timeout, complete with whatever answers exist
   */
  complete(userId: string | null, reason: CompletedReason = 'manual'): void {
    // For manual completion, verify user
    if (reason === 'manual') {
      if (!userId || this.candidateId !== userId) {
        throw new Error('Only the invited candidate can complete this interview');
      }
    }

    if (!this.status.canBeCompleted()) {
      throw new Error('Interview can only be completed when in progress');
    }

    // For manual completion, verify all questions are answered
    if (reason === 'manual' && this.props.responses.length < this.totalQuestions) {
      throw new Error(
        `All questions must be answered before completing. Answered: ${this.props.responses.length}/${this.totalQuestions}`,
      );
    }

    this.props.status = InvitationStatus.completed();
    this.props.completedAt = new Date();
    this.props.completedReason = reason;
    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(
      new InvitationCompletedEvent(
        this.id,
        this.candidateId,
        this.templateId,
        reason,
        this.props.responses.length,
        this.totalQuestions,
        this.props.completedAt,
      ),
    );
  }

  /**
   * Mark as expired
   */
  markAsExpired(): void {
    if (this.status.isFinished()) {
      return; // Already finished, ignore
    }

    this.props.status = InvitationStatus.expired();
    this.props.updatedAt = new Date();
  }

  /**
   * Update last activity timestamp (for heartbeat)
   */
  updateLastActivity(): void {
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Get progress
   */
  getProgress(): { answered: number; total: number; percentage: number } {
    const answered = this.props.responses.length;
    const total = this.totalQuestions;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    return { answered, total, percentage };
  }

  /**
   * Check if all questions are answered
   */
  isAllQuestionsAnswered(): boolean {
    return this.props.responses.length >= this.totalQuestions;
  }

  /**
   * Get response for a specific question
   */
  getResponseByQuestionId(questionId: string): Response | undefined {
    return this.props.responses.find((r) => r.questionId === questionId);
  }

  /**
   * Get answered question IDs
   */
  getAnsweredQuestionIds(): string[] {
    return this.props.responses.map((r) => r.questionId);
  }

  /**
   * Check if user is the candidate
   */
  isCandidate(userId: string): boolean {
    return this.candidateId === userId;
  }

  /**
   * Check if user is the inviter (HR)
   */
  isInviter(userId: string): boolean {
    return this.invitedBy === userId;
  }

  /**
   * Check if user can access this invitation
   */
  canBeAccessedBy(userId: string, isAdmin: boolean = false): boolean {
    if (isAdmin) return true;
    return this.isCandidate(userId) || this.isInviter(userId);
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      candidateId: this.candidateId,
      companyName: this.companyName,
      invitedBy: this.invitedBy,
      status: this.status.toString(),
      allowPause: this.allowPause,
      showTimer: this.showTimer,
      expiresAt: this.expiresAt.toISOString(),
      startedAt: this.startedAt?.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      lastActivityAt: this.lastActivityAt?.toISOString(),
      completedReason: this.completedReason,
      responses: this.responses.map((r) => r.toJSON()),
      totalQuestions: this.totalQuestions,
      progress: this.getProgress(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
