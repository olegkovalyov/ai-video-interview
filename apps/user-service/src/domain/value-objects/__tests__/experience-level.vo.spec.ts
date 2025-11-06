import { ExperienceLevel } from '../experience-level.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('ExperienceLevel Value Object', () => {
  describe('Creation - Factory Methods', () => {
    it('should create JUNIOR level', () => {
      const level = ExperienceLevel.junior();
      expect(level.value).toBe('junior');
      expect(level.isJunior()).toBe(true);
      expect(level.isMid()).toBe(false);
      expect(level.isSenior()).toBe(false);
      expect(level.isLead()).toBe(false);
    });

    it('should create MID level', () => {
      const level = ExperienceLevel.mid();
      expect(level.value).toBe('mid');
      expect(level.isJunior()).toBe(false);
      expect(level.isMid()).toBe(true);
      expect(level.isSenior()).toBe(false);
      expect(level.isLead()).toBe(false);
    });

    it('should create SENIOR level', () => {
      const level = ExperienceLevel.senior();
      expect(level.value).toBe('senior');
      expect(level.isJunior()).toBe(false);
      expect(level.isMid()).toBe(false);
      expect(level.isSenior()).toBe(true);
      expect(level.isLead()).toBe(false);
    });

    it('should create LEAD level', () => {
      const level = ExperienceLevel.lead();
      expect(level.value).toBe('lead');
      expect(level.isJunior()).toBe(false);
      expect(level.isMid()).toBe(false);
      expect(level.isSenior()).toBe(false);
      expect(level.isLead()).toBe(true);
    });
  });

  describe('Creation - From String', () => {
    it('should create from valid string "junior"', () => {
      const level = ExperienceLevel.fromString('junior');
      expect(level.value).toBe('junior');
      expect(level.isJunior()).toBe(true);
    });

    it('should create from valid string "mid"', () => {
      const level = ExperienceLevel.fromString('mid');
      expect(level.value).toBe('mid');
      expect(level.isMid()).toBe(true);
    });

    it('should create from valid string "senior"', () => {
      const level = ExperienceLevel.fromString('senior');
      expect(level.value).toBe('senior');
      expect(level.isSenior()).toBe(true);
    });

    it('should create from valid string "lead"', () => {
      const level = ExperienceLevel.fromString('lead');
      expect(level.value).toBe('lead');
      expect(level.isLead()).toBe(true);
    });

    it('should normalize level to lowercase', () => {
      const level = ExperienceLevel.fromString('SENIOR');
      expect(level.value).toBe('senior');
      expect(level.isSenior()).toBe(true);
    });

    it('should trim whitespace', () => {
      const level = ExperienceLevel.fromString('  mid  ');
      expect(level.value).toBe('mid');
      expect(level.isMid()).toBe(true);
    });

    it('should normalize and trim together', () => {
      const level = ExperienceLevel.fromString('  LEAD  ');
      expect(level.value).toBe('lead');
      expect(level.isLead()).toBe(true);
    });

    it('should throw error for invalid level', () => {
      expect(() => ExperienceLevel.fromString('invalid')).toThrow(DomainException);
      expect(() => ExperienceLevel.fromString('invalid')).toThrow('Invalid experience level');
    });

    it('should throw error for empty string', () => {
      expect(() => ExperienceLevel.fromString('')).toThrow(DomainException);
    });

    it('should throw error for unknown level', () => {
      expect(() => ExperienceLevel.fromString('expert')).toThrow(DomainException);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify junior level', () => {
      const level = ExperienceLevel.junior();
      expect(level.isJunior()).toBe(true);
      expect(level.isMid()).toBe(false);
      expect(level.isSenior()).toBe(false);
      expect(level.isLead()).toBe(false);
    });

    it('should correctly identify mid level', () => {
      const level = ExperienceLevel.mid();
      expect(level.isJunior()).toBe(false);
      expect(level.isMid()).toBe(true);
      expect(level.isSenior()).toBe(false);
      expect(level.isLead()).toBe(false);
    });

    it('should correctly identify senior level', () => {
      const level = ExperienceLevel.senior();
      expect(level.isJunior()).toBe(false);
      expect(level.isMid()).toBe(false);
      expect(level.isSenior()).toBe(true);
      expect(level.isLead()).toBe(false);
    });

    it('should correctly identify lead level', () => {
      const level = ExperienceLevel.lead();
      expect(level.isJunior()).toBe(false);
      expect(level.isMid()).toBe(false);
      expect(level.isSenior()).toBe(false);
      expect(level.isLead()).toBe(true);
    });
  });

  describe('Years Range', () => {
    it('should return correct years range for junior', () => {
      const level = ExperienceLevel.junior();
      expect(level.getYearsRange()).toBe('0-2 years');
    });

    it('should return correct years range for mid', () => {
      const level = ExperienceLevel.mid();
      expect(level.getYearsRange()).toBe('2-5 years');
    });

    it('should return correct years range for senior', () => {
      const level = ExperienceLevel.senior();
      expect(level.getYearsRange()).toBe('5+ years');
    });

    it('should return correct years range for lead', () => {
      const level = ExperienceLevel.lead();
      expect(level.getYearsRange()).toBe('7+ years');
    });
  });

  describe('Display Names', () => {
    it('should return correct display name for junior', () => {
      const level = ExperienceLevel.junior();
      expect(level.getDisplayName()).toBe('Junior');
    });

    it('should return correct display name for mid', () => {
      const level = ExperienceLevel.mid();
      expect(level.getDisplayName()).toBe('Mid-Level');
    });

    it('should return correct display name for senior', () => {
      const level = ExperienceLevel.senior();
      expect(level.getDisplayName()).toBe('Senior');
    });

    it('should return correct display name for lead', () => {
      const level = ExperienceLevel.lead();
      expect(level.getDisplayName()).toBe('Lead/Architect');
    });
  });

  describe('Value Object Behavior', () => {
    it('should be equal when same level', () => {
      const level1 = ExperienceLevel.senior();
      const level2 = ExperienceLevel.senior();
      expect(level1.equals(level2)).toBe(true);
    });

    it('should not be equal when different levels', () => {
      const level1 = ExperienceLevel.junior();
      const level2 = ExperienceLevel.senior();
      expect(level1.equals(level2)).toBe(false);
    });

    it('should be equal when created via different methods', () => {
      const level1 = ExperienceLevel.mid();
      const level2 = ExperienceLevel.fromString('mid');
      expect(level1.equals(level2)).toBe(true);
    });

    it('should be equal after normalization', () => {
      const level1 = ExperienceLevel.senior();
      const level2 = ExperienceLevel.fromString('SENIOR');
      expect(level1.equals(level2)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should convert to string correctly for junior', () => {
      const level = ExperienceLevel.junior();
      expect(level.toString()).toBe('junior');
    });

    it('should convert to string correctly for mid', () => {
      const level = ExperienceLevel.mid();
      expect(level.toString()).toBe('mid');
    });

    it('should convert to string correctly for senior', () => {
      const level = ExperienceLevel.senior();
      expect(level.toString()).toBe('senior');
    });

    it('should convert to string correctly for lead', () => {
      const level = ExperienceLevel.lead();
      expect(level.toString()).toBe('lead');
    });

    it('should have value getter', () => {
      const level = ExperienceLevel.senior();
      expect(level.value).toBe('senior');
    });
  });

  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(ExperienceLevel.JUNIOR).toBe('junior');
      expect(ExperienceLevel.MID).toBe('mid');
      expect(ExperienceLevel.SENIOR).toBe('senior');
      expect(ExperienceLevel.LEAD).toBe('lead');
    });
  });

  describe('Business Logic - Career Progression', () => {
    it('should show progression from junior to lead', () => {
      const junior = ExperienceLevel.junior();
      const mid = ExperienceLevel.mid();
      const senior = ExperienceLevel.senior();
      const lead = ExperienceLevel.lead();

      expect(junior.getYearsRange()).toBe('0-2 years');
      expect(mid.getYearsRange()).toBe('2-5 years');
      expect(senior.getYearsRange()).toBe('5+ years');
      expect(lead.getYearsRange()).toBe('7+ years');
    });
  });
});
