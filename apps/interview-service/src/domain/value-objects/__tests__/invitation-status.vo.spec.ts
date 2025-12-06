import { InvitationStatus, InvitationStatusEnum } from '../invitation-status.vo';

describe('InvitationStatus Value Object', () => {
  describe('create', () => {
    it('should create status from valid string', () => {
      const status = InvitationStatus.create('pending');
      expect(status.value).toBe(InvitationStatusEnum.PENDING);
    });

    it('should throw error for invalid status', () => {
      expect(() => InvitationStatus.create('invalid')).toThrow(
        'Invalid invitation status: invalid',
      );
    });
  });

  describe('factory methods', () => {
    it('should create pending status', () => {
      const status = InvitationStatus.pending();
      expect(status.isPending()).toBe(true);
      expect(status.value).toBe(InvitationStatusEnum.PENDING);
    });

    it('should create in_progress status', () => {
      const status = InvitationStatus.inProgress();
      expect(status.isInProgress()).toBe(true);
      expect(status.value).toBe(InvitationStatusEnum.IN_PROGRESS);
    });

    it('should create completed status', () => {
      const status = InvitationStatus.completed();
      expect(status.isCompleted()).toBe(true);
      expect(status.value).toBe(InvitationStatusEnum.COMPLETED);
    });

    it('should create expired status', () => {
      const status = InvitationStatus.expired();
      expect(status.isExpired()).toBe(true);
      expect(status.value).toBe(InvitationStatusEnum.EXPIRED);
    });
  });

  describe('state checks', () => {
    it('pending status can be started', () => {
      const status = InvitationStatus.pending();
      expect(status.canBeStarted()).toBe(true);
      expect(status.canSubmitResponse()).toBe(false);
      expect(status.canBeCompleted()).toBe(false);
      expect(status.isFinished()).toBe(false);
    });

    it('in_progress status can submit responses and be completed', () => {
      const status = InvitationStatus.inProgress();
      expect(status.canBeStarted()).toBe(false);
      expect(status.canSubmitResponse()).toBe(true);
      expect(status.canBeCompleted()).toBe(true);
      expect(status.isFinished()).toBe(false);
    });

    it('completed status is finished', () => {
      const status = InvitationStatus.completed();
      expect(status.canBeStarted()).toBe(false);
      expect(status.canSubmitResponse()).toBe(false);
      expect(status.canBeCompleted()).toBe(false);
      expect(status.isFinished()).toBe(true);
    });

    it('expired status is finished', () => {
      const status = InvitationStatus.expired();
      expect(status.canBeStarted()).toBe(false);
      expect(status.canSubmitResponse()).toBe(false);
      expect(status.canBeCompleted()).toBe(false);
      expect(status.isFinished()).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      expect(InvitationStatus.pending().toString()).toBe('pending');
      expect(InvitationStatus.inProgress().toString()).toBe('in_progress');
      expect(InvitationStatus.completed().toString()).toBe('completed');
      expect(InvitationStatus.expired().toString()).toBe('expired');
    });
  });

  describe('equals', () => {
    it('should return true for equal statuses', () => {
      const status1 = InvitationStatus.pending();
      const status2 = InvitationStatus.pending();
      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = InvitationStatus.pending();
      const status2 = InvitationStatus.inProgress();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
