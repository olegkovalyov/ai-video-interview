import { CriteriaScore, CriterionType } from '../criteria-score.vo';

describe('CriteriaScore Value Object', () => {
  describe('create', () => {
    it('should create criteria score with valid values', () => {
      const criteriaScore = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.3);
      
      expect(criteriaScore.criterion).toBe(CriterionType.RELEVANCE);
      expect(criteriaScore.score.value).toBe(80);
      expect(criteriaScore.weight).toBe(0.3);
    });

    it('should create criteria score for all criterion types', () => {
      const relevance = CriteriaScore.create(CriterionType.RELEVANCE, 75, 0.25);
      const completeness = CriteriaScore.create(CriterionType.COMPLETENESS, 80, 0.25);
      const clarity = CriteriaScore.create(CriterionType.CLARITY, 85, 0.25);
      const depth = CriteriaScore.create(CriterionType.DEPTH, 70, 0.25);

      expect(relevance.criterion).toBe(CriterionType.RELEVANCE);
      expect(completeness.criterion).toBe(CriterionType.COMPLETENESS);
      expect(clarity.criterion).toBe(CriterionType.CLARITY);
      expect(depth.criterion).toBe(CriterionType.DEPTH);
    });

    it('should throw error for weight < 0', () => {
      expect(() => CriteriaScore.create(CriterionType.RELEVANCE, 80, -0.1)).toThrow(
        'Invalid weight',
      );
    });

    it('should throw error for weight > 1', () => {
      expect(() => CriteriaScore.create(CriterionType.RELEVANCE, 80, 1.1)).toThrow(
        'Invalid weight',
      );
    });

    it('should accept weight of 0', () => {
      const criteriaScore = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0);
      expect(criteriaScore.weight).toBe(0);
    });

    it('should accept weight of 1', () => {
      const criteriaScore = CriteriaScore.create(CriterionType.RELEVANCE, 80, 1);
      expect(criteriaScore.weight).toBe(1);
    });
  });

  describe('weightedScore', () => {
    it('should calculate weighted score correctly', () => {
      const criteriaScore = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25);
      expect(criteriaScore.weightedScore).toBe(20); // 80 * 0.25 = 20
    });

    it('should return 0 for weight of 0', () => {
      const criteriaScore = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0);
      expect(criteriaScore.weightedScore).toBe(0);
    });

    it('should return full score for weight of 1', () => {
      const criteriaScore = CriteriaScore.create(CriterionType.RELEVANCE, 80, 1);
      expect(criteriaScore.weightedScore).toBe(80);
    });
  });

  describe('criterionLabel', () => {
    it('should return human-readable labels', () => {
      expect(CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25).criterionLabel).toBe(
        'Relevance',
      );
      expect(CriteriaScore.create(CriterionType.COMPLETENESS, 80, 0.25).criterionLabel).toBe(
        'Completeness',
      );
      expect(CriteriaScore.create(CriterionType.CLARITY, 80, 0.25).criterionLabel).toBe('Clarity');
      expect(CriteriaScore.create(CriterionType.DEPTH, 80, 0.25).criterionLabel).toBe('Depth');
    });
  });

  describe('equals', () => {
    it('should return true for same criteria scores', () => {
      const cs1 = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25);
      const cs2 = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25);
      expect(cs1.equals(cs2)).toBe(true);
    });

    it('should return false for different criterion', () => {
      const cs1 = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25);
      const cs2 = CriteriaScore.create(CriterionType.CLARITY, 80, 0.25);
      expect(cs1.equals(cs2)).toBe(false);
    });

    it('should return false for different score', () => {
      const cs1 = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25);
      const cs2 = CriteriaScore.create(CriterionType.RELEVANCE, 90, 0.25);
      expect(cs1.equals(cs2)).toBe(false);
    });

    it('should return false for different weight', () => {
      const cs1 = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.25);
      const cs2 = CriteriaScore.create(CriterionType.RELEVANCE, 80, 0.5);
      expect(cs1.equals(cs2)).toBe(false);
    });
  });
});
