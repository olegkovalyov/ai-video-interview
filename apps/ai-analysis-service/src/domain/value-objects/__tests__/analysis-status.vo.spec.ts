import { AnalysisStatus, AnalysisStatusEnum } from '../analysis-status.vo';
import { InvalidStatusTransitionException } from '../../exceptions/analysis.exceptions';

describe('AnalysisStatus Value Object', () => {
  describe('factory methods', () => {
    it('should create pending status', () => {
      const status = AnalysisStatus.pending();
      expect(status.value).toBe(AnalysisStatusEnum.PENDING);
      expect(status.isPending).toBe(true);
    });

    it('should create in_progress status', () => {
      const status = AnalysisStatus.inProgress();
      expect(status.value).toBe(AnalysisStatusEnum.IN_PROGRESS);
      expect(status.isInProgress).toBe(true);
    });

    it('should create completed status', () => {
      const status = AnalysisStatus.completed();
      expect(status.value).toBe(AnalysisStatusEnum.COMPLETED);
      expect(status.isCompleted).toBe(true);
    });

    it('should create failed status', () => {
      const status = AnalysisStatus.failed();
      expect(status.value).toBe(AnalysisStatusEnum.FAILED);
      expect(status.isFailed).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create status from valid string', () => {
      expect(AnalysisStatus.fromString('pending').isPending).toBe(true);
      expect(AnalysisStatus.fromString('in_progress').isInProgress).toBe(true);
      expect(AnalysisStatus.fromString('completed').isCompleted).toBe(true);
      expect(AnalysisStatus.fromString('failed').isFailed).toBe(true);
    });

    it('should throw error for invalid string', () => {
      expect(() => AnalysisStatus.fromString('invalid')).toThrow('Invalid analysis status');
    });
  });

  describe('isTerminal', () => {
    it('should return true for completed status', () => {
      expect(AnalysisStatus.completed().isTerminal).toBe(true);
    });

    it('should return true for failed status', () => {
      expect(AnalysisStatus.failed().isTerminal).toBe(true);
    });

    it('should return false for pending status', () => {
      expect(AnalysisStatus.pending().isTerminal).toBe(false);
    });

    it('should return false for in_progress status', () => {
      expect(AnalysisStatus.inProgress().isTerminal).toBe(false);
    });
  });

  describe('canTransitionTo', () => {
    it('should allow pending -> in_progress', () => {
      const pending = AnalysisStatus.pending();
      expect(pending.canTransitionTo(AnalysisStatus.inProgress())).toBe(true);
    });

    it('should not allow pending -> completed', () => {
      const pending = AnalysisStatus.pending();
      expect(pending.canTransitionTo(AnalysisStatus.completed())).toBe(false);
    });

    it('should not allow pending -> failed', () => {
      const pending = AnalysisStatus.pending();
      expect(pending.canTransitionTo(AnalysisStatus.failed())).toBe(false);
    });

    it('should allow in_progress -> completed', () => {
      const inProgress = AnalysisStatus.inProgress();
      expect(inProgress.canTransitionTo(AnalysisStatus.completed())).toBe(true);
    });

    it('should allow in_progress -> failed', () => {
      const inProgress = AnalysisStatus.inProgress();
      expect(inProgress.canTransitionTo(AnalysisStatus.failed())).toBe(true);
    });

    it('should not allow in_progress -> pending', () => {
      const inProgress = AnalysisStatus.inProgress();
      expect(inProgress.canTransitionTo(AnalysisStatus.pending())).toBe(false);
    });

    it('should not allow transitions from completed', () => {
      const completed = AnalysisStatus.completed();
      expect(completed.canTransitionTo(AnalysisStatus.pending())).toBe(false);
      expect(completed.canTransitionTo(AnalysisStatus.inProgress())).toBe(false);
      expect(completed.canTransitionTo(AnalysisStatus.failed())).toBe(false);
    });

    it('should not allow transitions from failed', () => {
      const failed = AnalysisStatus.failed();
      expect(failed.canTransitionTo(AnalysisStatus.pending())).toBe(false);
      expect(failed.canTransitionTo(AnalysisStatus.inProgress())).toBe(false);
      expect(failed.canTransitionTo(AnalysisStatus.completed())).toBe(false);
    });
  });

  describe('transitionTo', () => {
    it('should transition from pending to in_progress', () => {
      const pending = AnalysisStatus.pending();
      const newStatus = pending.transitionTo(AnalysisStatus.inProgress());
      expect(newStatus.isInProgress).toBe(true);
    });

    it('should transition from in_progress to completed', () => {
      const inProgress = AnalysisStatus.inProgress();
      const newStatus = inProgress.transitionTo(AnalysisStatus.completed());
      expect(newStatus.isCompleted).toBe(true);
    });

    it('should transition from in_progress to failed', () => {
      const inProgress = AnalysisStatus.inProgress();
      const newStatus = inProgress.transitionTo(AnalysisStatus.failed());
      expect(newStatus.isFailed).toBe(true);
    });

    it('should throw InvalidStatusTransitionException for invalid transition', () => {
      const pending = AnalysisStatus.pending();
      expect(() => pending.transitionTo(AnalysisStatus.completed())).toThrow(
        InvalidStatusTransitionException,
      );
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const status1 = AnalysisStatus.pending();
      const status2 = AnalysisStatus.pending();
      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different status', () => {
      const status1 = AnalysisStatus.pending();
      const status2 = AnalysisStatus.inProgress();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
