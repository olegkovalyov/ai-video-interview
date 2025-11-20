import { ProficiencyLevel } from '../proficiency-level.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('ProficiencyLevel Value Object', () => {
  describe('Factory Methods', () => {
    it('should create beginner level', () => {
      const level = ProficiencyLevel.beginner();
      expect(level.value).toBe('beginner');
      expect(level.isBeginner()).toBe(true);
    });

    it('should create intermediate level', () => {
      const level = ProficiencyLevel.intermediate();
      expect(level.value).toBe('intermediate');
      expect(level.isIntermediate()).toBe(true);
    });

    it('should create advanced level', () => {
      const level = ProficiencyLevel.advanced();
      expect(level.value).toBe('advanced');
      expect(level.isAdvanced()).toBe(true);
    });

    it('should create expert level', () => {
      const level = ProficiencyLevel.expert();
      expect(level.value).toBe('expert');
      expect(level.isExpert()).toBe(true);
    });

    it('should create from valid string', () => {
      const level = ProficiencyLevel.fromString('advanced');
      expect(level.value).toBe('advanced');
    });

    it('should handle case-insensitive string', () => {
      const level = ProficiencyLevel.fromString('EXPERT');
      expect(level.value).toBe('expert');
    });

    it('should throw error for invalid level', () => {
      expect(() => ProficiencyLevel.fromString('invalid')).toThrow(DomainException);
      expect(() => ProficiencyLevel.fromString('invalid')).toThrow(
        'Invalid proficiency level: invalid'
      );
    });
  });

  describe('Comparison Methods', () => {
    it('should compare levels correctly', () => {
      const beginner = ProficiencyLevel.beginner();
      const intermediate = ProficiencyLevel.intermediate();
      const advanced = ProficiencyLevel.advanced();
      const expert = ProficiencyLevel.expert();

      expect(beginner.compare(intermediate)).toBeLessThan(0);
      expect(intermediate.compare(beginner)).toBeGreaterThan(0);
      expect(advanced.compare(advanced)).toBe(0);
      expect(expert.compare(beginner)).toBeGreaterThan(0);
    });

    it('should check if at least level', () => {
      const intermediate = ProficiencyLevel.intermediate();
      const advanced = ProficiencyLevel.advanced();

      expect(advanced.isAtLeast(intermediate)).toBe(true);
      expect(intermediate.isAtLeast(advanced)).toBe(false);
      expect(intermediate.isAtLeast(intermediate)).toBe(true);
    });

    it('should check equality', () => {
      const level1 = ProficiencyLevel.advanced();
      const level2 = ProficiencyLevel.advanced();
      const level3 = ProficiencyLevel.expert();

      expect(level1.equals(level2)).toBe(true);
      expect(level1.equals(level3)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      expect(ProficiencyLevel.beginner().toString()).toBe('beginner');
      expect(ProficiencyLevel.expert().toString()).toBe('expert');
    });
  });
});
