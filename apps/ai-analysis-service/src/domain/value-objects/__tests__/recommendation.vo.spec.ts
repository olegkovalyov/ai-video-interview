import { Recommendation, RecommendationEnum } from '../recommendation.vo';

describe('Recommendation Value Object', () => {
  describe('factory methods', () => {
    it('should create hire recommendation', () => {
      const rec = Recommendation.hire();
      expect(rec.value).toBe(RecommendationEnum.HIRE);
      expect(rec.isHire).toBe(true);
    });

    it('should create consider recommendation', () => {
      const rec = Recommendation.consider();
      expect(rec.value).toBe(RecommendationEnum.CONSIDER);
      expect(rec.isConsider).toBe(true);
    });

    it('should create reject recommendation', () => {
      const rec = Recommendation.reject();
      expect(rec.value).toBe(RecommendationEnum.REJECT);
      expect(rec.isReject).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create recommendation from valid string', () => {
      expect(Recommendation.fromString('hire').isHire).toBe(true);
      expect(Recommendation.fromString('consider').isConsider).toBe(true);
      expect(Recommendation.fromString('reject').isReject).toBe(true);
    });

    it('should throw error for invalid string', () => {
      expect(() => Recommendation.fromString('invalid')).toThrow('Invalid recommendation');
    });
  });

  describe('fromScore', () => {
    it('should return hire for score >= 75', () => {
      expect(Recommendation.fromScore(75).isHire).toBe(true);
      expect(Recommendation.fromScore(100).isHire).toBe(true);
    });

    it('should return consider for score >= 50 and < 75', () => {
      expect(Recommendation.fromScore(50).isConsider).toBe(true);
      expect(Recommendation.fromScore(74).isConsider).toBe(true);
    });

    it('should return reject for score < 50', () => {
      expect(Recommendation.fromScore(0).isReject).toBe(true);
      expect(Recommendation.fromScore(49).isReject).toBe(true);
    });
  });

  describe('label', () => {
    it('should return human-readable labels', () => {
      expect(Recommendation.hire().label).toBe('Recommend to Hire');
      expect(Recommendation.consider().label).toBe('Consider for Further Review');
      expect(Recommendation.reject().label).toBe('Not Recommended');
    });
  });

  describe('equals', () => {
    it('should return true for same recommendation', () => {
      const rec1 = Recommendation.hire();
      const rec2 = Recommendation.hire();
      expect(rec1.equals(rec2)).toBe(true);
    });

    it('should return false for different recommendations', () => {
      const rec1 = Recommendation.hire();
      const rec2 = Recommendation.reject();
      expect(rec1.equals(rec2)).toBe(false);
    });
  });
});
