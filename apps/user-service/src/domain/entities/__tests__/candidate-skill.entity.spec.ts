import { CandidateSkill } from '../candidate-skill.entity';
import { ProficiencyLevel } from '../../value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../value-objects/years-of-experience.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('CandidateSkill Entity', () => {
  const validId = 'skill-123';
  const validCandidateId = 'candidate-456';
  const validSkillId = 'react-789';
  const validDescription = 'Experienced React developer with 5 years of building SPAs';
  const validProficiency = ProficiencyLevel.advanced();
  const validYears = YearsOfExperience.fromNumber(5);

  describe('Factory Method - create', () => {
    it('should create candidate skill with all fields', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        validProficiency,
        validYears,
      );

      expect(skill.id).toBe(validId);
      expect(skill.candidateId).toBe(validCandidateId);
      expect(skill.skillId).toBe(validSkillId);
      expect(skill.description).toBe(validDescription);
      expect(skill.proficiencyLevel).toBe(validProficiency);
      expect(skill.yearsOfExperience).toBe(validYears);
      expect(skill.createdAt).toBeInstanceOf(Date);
      expect(skill.updatedAt).toBeInstanceOf(Date);
    });

    it('should create without description (null)', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        null,
        validProficiency,
        validYears,
      );

      expect(skill.description).toBeNull();
    });

    it('should trim description', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        '  Some description  ',
        validProficiency,
        validYears,
      );

      expect(skill.description).toBe('Some description');
    });

    it('should throw error for empty candidate ID', () => {
      expect(() =>
        CandidateSkill.create(
          validId,
          '',
          validSkillId,
          validDescription,
          validProficiency,
          validYears,
        )
      ).toThrow(DomainException);
      expect(() =>
        CandidateSkill.create(
          validId,
          '',
          validSkillId,
          validDescription,
          validProficiency,
          validYears,
        )
      ).toThrow('Candidate ID cannot be empty');
    });

    it('should throw error for empty skill ID', () => {
      expect(() =>
        CandidateSkill.create(
          validId,
          validCandidateId,
          '',
          validDescription,
          validProficiency,
          validYears,
        )
      ).toThrow(DomainException);
    });

    it('should throw error for description exceeding max length', () => {
      const longDescription = 'a'.repeat(1001);
      expect(() =>
        CandidateSkill.create(
          validId,
          validCandidateId,
          validSkillId,
          longDescription,
          validProficiency,
          validYears,
        )
      ).toThrow('Skill description is too long (max 1000 characters)');
    });
  });

  describe('Business Logic - updateDescription', () => {
    it('should update description', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        validProficiency,
        validYears,
      );

      const newDescription = 'Updated description';
      const oldUpdatedAt = skill.updatedAt;

      // Wait 1ms to ensure timestamp changes
      jest.useFakeTimers();
      jest.advanceTimersByTime(1);

      skill.updateDescription(newDescription);

      expect(skill.description).toBe(newDescription);
      expect(skill.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should trim description when updating', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        validProficiency,
        validYears,
      );

      skill.updateDescription('  Updated  ');
      expect(skill.description).toBe('Updated');
    });

    it('should throw error if new description is too long', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        validProficiency,
        validYears,
      );

      expect(() => skill.updateDescription('a'.repeat(1001))).toThrow(
        'Skill description is too long (max 1000 characters)'
      );
    });
  });

  describe('Business Logic - updateProficiency', () => {
    it('should update proficiency level', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        ProficiencyLevel.intermediate(),
        validYears,
      );

      skill.updateProficiency(ProficiencyLevel.expert());
      expect(skill.proficiencyLevel!.value).toBe('expert');
    });
  });

  describe('Business Logic - updateYears', () => {
    it('should update years of experience', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        validProficiency,
        YearsOfExperience.fromNumber(3),
      );

      skill.updateYears(YearsOfExperience.fromNumber(7));
      expect(skill.yearsOfExperience!.value).toBe(7);
    });
  });

  describe('Business Logic - update (all fields)', () => {
    it('should update all metadata fields at once', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        'Old description',
        ProficiencyLevel.beginner(),
        YearsOfExperience.fromNumber(1),
      );

      skill.update(
        'New description',
        ProficiencyLevel.advanced(),
        YearsOfExperience.fromNumber(5),
      );

      expect(skill.description).toBe('New description');
      expect(skill.proficiencyLevel!.value).toBe('advanced');
      expect(skill.yearsOfExperience!.value).toBe(5);
    });

    it('should handle null description', () => {
      const skill = CandidateSkill.create(
        validId,
        validCandidateId,
        validSkillId,
        'Old description',
        validProficiency,
        validYears,
      );

      skill.update(null, validProficiency, validYears);
      expect(skill.description).toBeNull();
    });
  });

  describe('Factory Method - reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const skill = CandidateSkill.reconstitute(
        validId,
        validCandidateId,
        validSkillId,
        validDescription,
        validProficiency,
        validYears,
        createdAt,
        updatedAt,
      );

      expect(skill.id).toBe(validId);
      expect(skill.candidateId).toBe(validCandidateId);
      expect(skill.skillId).toBe(validSkillId);
      expect(skill.description).toBe(validDescription);
      expect(skill.proficiencyLevel).toBe(validProficiency);
      expect(skill.yearsOfExperience).toBe(validYears);
      expect(skill.createdAt).toBe(createdAt);
      expect(skill.updatedAt).toBe(updatedAt);
    });
  });
});
