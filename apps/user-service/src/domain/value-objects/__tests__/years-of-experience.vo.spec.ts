import { YearsOfExperience } from '../years-of-experience.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('YearsOfExperience Value Object', () => {
  describe('Factory Methods', () => {
    it('should create from valid number', () => {
      const years = YearsOfExperience.fromNumber(5);
      expect(years.value).toBe(5);
    });

    it('should create zero years', () => {
      const years = YearsOfExperience.zero();
      expect(years.value).toBe(0);
    });

    it('should accept maximum allowed years (50)', () => {
      const years = YearsOfExperience.fromNumber(50);
      expect(years.value).toBe(50);
    });

    it('should throw error for negative years', () => {
      expect(() => YearsOfExperience.fromNumber(-1)).toThrow(DomainException);
      expect(() => YearsOfExperience.fromNumber(-1)).toThrow(
        'Years of experience cannot be negative'
      );
    });

    it('should throw error for years exceeding maximum', () => {
      expect(() => YearsOfExperience.fromNumber(51)).toThrow(DomainException);
      expect(() => YearsOfExperience.fromNumber(51)).toThrow(
        'Years of experience cannot exceed 50'
      );
    });

    it('should throw error for non-integer values', () => {
      expect(() => YearsOfExperience.fromNumber(5.5)).toThrow(DomainException);
      expect(() => YearsOfExperience.fromNumber(5.5)).toThrow(
        'Years of experience must be an integer'
      );
    });
  });

  describe('Comparison Methods', () => {
    it('should compare greater than', () => {
      const five = YearsOfExperience.fromNumber(5);
      const ten = YearsOfExperience.fromNumber(10);

      expect(ten.isGreaterThan(five)).toBe(true);
      expect(five.isGreaterThan(ten)).toBe(false);
      expect(five.isGreaterThan(five)).toBe(false);
    });

    it('should compare less than', () => {
      const five = YearsOfExperience.fromNumber(5);
      const ten = YearsOfExperience.fromNumber(10);

      expect(five.isLessThan(ten)).toBe(true);
      expect(ten.isLessThan(five)).toBe(false);
      expect(five.isLessThan(five)).toBe(false);
    });

    it('should compare greater or equal', () => {
      const five = YearsOfExperience.fromNumber(5);
      const ten = YearsOfExperience.fromNumber(10);
      const anotherFive = YearsOfExperience.fromNumber(5);

      expect(ten.isGreaterOrEqual(five)).toBe(true);
      expect(five.isGreaterOrEqual(ten)).toBe(false);
      expect(five.isGreaterOrEqual(anotherFive)).toBe(true);
    });

    it('should compare less or equal', () => {
      const five = YearsOfExperience.fromNumber(5);
      const ten = YearsOfExperience.fromNumber(10);
      const anotherFive = YearsOfExperience.fromNumber(5);

      expect(five.isLessOrEqual(ten)).toBe(true);
      expect(ten.isLessOrEqual(five)).toBe(false);
      expect(five.isLessOrEqual(anotherFive)).toBe(true);
    });

    it('should check equality', () => {
      const five1 = YearsOfExperience.fromNumber(5);
      const five2 = YearsOfExperience.fromNumber(5);
      const ten = YearsOfExperience.fromNumber(10);

      expect(five1.equals(five2)).toBe(true);
      expect(five1.equals(ten)).toBe(false);
    });
  });

  describe('Operations', () => {
    it('should add years', () => {
      const five = YearsOfExperience.fromNumber(5);
      const result = five.add(3);
      expect(result.value).toBe(8);
    });

    it('should throw when adding results in overflow', () => {
      const forty = YearsOfExperience.fromNumber(40);
      expect(() => forty.add(15)).toThrow(DomainException);
    });
  });

  describe('toString', () => {
    it('should return "No experience" for zero', () => {
      expect(YearsOfExperience.zero().toString()).toBe('No experience');
    });

    it('should return "1 year" for one', () => {
      expect(YearsOfExperience.fromNumber(1).toString()).toBe('1 year');
    });

    it('should return plural for multiple years', () => {
      expect(YearsOfExperience.fromNumber(5).toString()).toBe('5 years');
      expect(YearsOfExperience.fromNumber(10).toString()).toBe('10 years');
    });
  });
});
