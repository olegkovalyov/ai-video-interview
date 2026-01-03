import { Score } from '../score.vo';
import { InvalidScoreException } from '../../exceptions/analysis.exceptions';

describe('Score Value Object', () => {
  describe('create', () => {
    it('should create a score with valid value', () => {
      const score = Score.create(75);
      expect(score.value).toBe(75);
    });

    it('should round decimal values', () => {
      const score = Score.create(75.6);
      expect(score.value).toBe(76);
    });

    it('should create score with 0', () => {
      const score = Score.create(0);
      expect(score.value).toBe(0);
    });

    it('should create score with 100', () => {
      const score = Score.create(100);
      expect(score.value).toBe(100);
    });

    it('should throw InvalidScoreException for negative value', () => {
      expect(() => Score.create(-1)).toThrow(InvalidScoreException);
    });

    it('should throw InvalidScoreException for value > 100', () => {
      expect(() => Score.create(101)).toThrow(InvalidScoreException);
    });
  });

  describe('zero', () => {
    it('should create a score with value 0', () => {
      const score = Score.zero();
      expect(score.value).toBe(0);
    });
  });

  describe('grade', () => {
    it('should return "excellent" for score >= 90', () => {
      expect(Score.create(90).grade).toBe('excellent');
      expect(Score.create(100).grade).toBe('excellent');
    });

    it('should return "good" for score >= 75 and < 90', () => {
      expect(Score.create(75).grade).toBe('good');
      expect(Score.create(89).grade).toBe('good');
    });

    it('should return "satisfactory" for score >= 60 and < 75', () => {
      expect(Score.create(60).grade).toBe('satisfactory');
      expect(Score.create(74).grade).toBe('satisfactory');
    });

    it('should return "below_average" for score >= 40 and < 60', () => {
      expect(Score.create(40).grade).toBe('below_average');
      expect(Score.create(59).grade).toBe('below_average');
    });

    it('should return "poor" for score < 40', () => {
      expect(Score.create(0).grade).toBe('poor');
      expect(Score.create(39).grade).toBe('poor');
    });
  });

  describe('gradeLabel', () => {
    it('should return human-readable labels', () => {
      expect(Score.create(95).gradeLabel).toBe('Excellent');
      expect(Score.create(80).gradeLabel).toBe('Good');
      expect(Score.create(65).gradeLabel).toBe('Satisfactory');
      expect(Score.create(50).gradeLabel).toBe('Below Average');
      expect(Score.create(20).gradeLabel).toBe('Poor');
    });
  });

  describe('equals', () => {
    it('should return true for scores with same value', () => {
      const score1 = Score.create(75);
      const score2 = Score.create(75);
      expect(score1.equals(score2)).toBe(true);
    });

    it('should return false for scores with different values', () => {
      const score1 = Score.create(75);
      const score2 = Score.create(80);
      expect(score1.equals(score2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const score = Score.create(75);
      expect(score.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const score = Score.create(75);
      expect(score.equals(undefined)).toBe(false);
    });
  });
});
