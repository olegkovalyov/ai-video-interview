import { ValueObject } from '../base/base.value-object';

export enum InvitationStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export interface InvitationStatusProps {
  value: InvitationStatusEnum;
}

export class InvitationStatus extends ValueObject<InvitationStatusProps> {
  private constructor(props: InvitationStatusProps) {
    super(props);
  }

  get value(): InvitationStatusEnum {
    return this.props.value;
  }

  static create(value: string): InvitationStatus {
    if (!Object.values(InvitationStatusEnum).includes(value as InvitationStatusEnum)) {
      throw new Error(
        `Invalid invitation status: ${value}. Must be one of: ${Object.values(InvitationStatusEnum).join(', ')}`,
      );
    }

    return new InvitationStatus({ value: value as InvitationStatusEnum });
  }

  static pending(): InvitationStatus {
    return new InvitationStatus({ value: InvitationStatusEnum.PENDING });
  }

  static inProgress(): InvitationStatus {
    return new InvitationStatus({ value: InvitationStatusEnum.IN_PROGRESS });
  }

  static completed(): InvitationStatus {
    return new InvitationStatus({ value: InvitationStatusEnum.COMPLETED });
  }

  static expired(): InvitationStatus {
    return new InvitationStatus({ value: InvitationStatusEnum.EXPIRED });
  }

  isPending(): boolean {
    return this.value === InvitationStatusEnum.PENDING;
  }

  isInProgress(): boolean {
    return this.value === InvitationStatusEnum.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.value === InvitationStatusEnum.COMPLETED;
  }

  isExpired(): boolean {
    return this.value === InvitationStatusEnum.EXPIRED;
  }

  canBeStarted(): boolean {
    return this.isPending();
  }

  canSubmitResponse(): boolean {
    return this.isInProgress();
  }

  canBeCompleted(): boolean {
    return this.isInProgress();
  }

  isFinished(): boolean {
    return this.isCompleted() || this.isExpired();
  }

  toString(): string {
    return this.value;
  }
}
