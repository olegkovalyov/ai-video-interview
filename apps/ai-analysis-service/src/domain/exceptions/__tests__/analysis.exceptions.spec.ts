import {
  InvalidScoreException,
  InvalidStatusTransitionException,
  AnalysisAlreadyCompletedException,
  AnalysisNotFoundException,
  AnalysisAlreadyExistsException,
  QuestionAnalysisNotFoundException,
} from '../analysis.exceptions';
import { DomainException } from '../../../shared/exceptions/domain.exception';

describe('Analysis Exceptions', () => {
  describe('InvalidScoreException', () => {
    it('should be instance of DomainException', () => {
      const exception = new InvalidScoreException(150);
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should contain score value in message', () => {
      const exception = new InvalidScoreException(-10);
      expect(exception.message).toContain('-10');
      expect(exception.message).toContain('between 0 and 100');
    });

    it('should have correct name', () => {
      const exception = new InvalidScoreException(101);
      expect(exception.name).toBe('InvalidScoreException');
    });
  });

  describe('InvalidStatusTransitionException', () => {
    it('should be instance of DomainException', () => {
      const exception = new InvalidStatusTransitionException('pending', 'completed');
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should contain from and to status in message', () => {
      const exception = new InvalidStatusTransitionException('pending', 'completed');
      expect(exception.message).toContain('pending');
      expect(exception.message).toContain('completed');
    });

    it('should have correct name', () => {
      const exception = new InvalidStatusTransitionException('a', 'b');
      expect(exception.name).toBe('InvalidStatusTransitionException');
    });
  });

  describe('AnalysisAlreadyCompletedException', () => {
    it('should be instance of DomainException', () => {
      const exception = new AnalysisAlreadyCompletedException('analysis-123');
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should contain analysis id in message', () => {
      const exception = new AnalysisAlreadyCompletedException('analysis-123');
      expect(exception.message).toContain('analysis-123');
      expect(exception.message).toContain('already completed');
    });

    it('should have correct name', () => {
      const exception = new AnalysisAlreadyCompletedException('id');
      expect(exception.name).toBe('AnalysisAlreadyCompletedException');
    });
  });

  describe('AnalysisNotFoundException', () => {
    it('should be instance of DomainException', () => {
      const exception = new AnalysisNotFoundException('analysis-123');
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should contain identifier in message', () => {
      const exception = new AnalysisNotFoundException('analysis-123');
      expect(exception.message).toContain('analysis-123');
      expect(exception.message).toContain('not found');
    });

    it('should have correct name', () => {
      const exception = new AnalysisNotFoundException('id');
      expect(exception.name).toBe('AnalysisNotFoundException');
    });
  });

  describe('AnalysisAlreadyExistsException', () => {
    it('should be instance of DomainException', () => {
      const exception = new AnalysisAlreadyExistsException('invitation-123');
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should contain invitation id in message', () => {
      const exception = new AnalysisAlreadyExistsException('invitation-123');
      expect(exception.message).toContain('invitation-123');
      expect(exception.message).toContain('already exists');
    });

    it('should have correct name', () => {
      const exception = new AnalysisAlreadyExistsException('id');
      expect(exception.name).toBe('AnalysisAlreadyExistsException');
    });
  });

  describe('QuestionAnalysisNotFoundException', () => {
    it('should be instance of DomainException', () => {
      const exception = new QuestionAnalysisNotFoundException('question-123');
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should contain question id in message', () => {
      const exception = new QuestionAnalysisNotFoundException('question-123');
      expect(exception.message).toContain('question-123');
      expect(exception.message).toContain('not found');
    });

    it('should have correct name', () => {
      const exception = new QuestionAnalysisNotFoundException('id');
      expect(exception.name).toBe('QuestionAnalysisNotFoundException');
    });
  });
});
