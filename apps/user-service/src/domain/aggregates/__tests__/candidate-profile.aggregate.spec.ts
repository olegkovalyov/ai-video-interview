import { CandidateProfile } from '../candidate-profile.aggregate';
import { ExperienceLevel } from '../../value-objects/experience-level.vo';
import { ProficiencyLevel } from '../../value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../value-objects/years-of-experience.vo';
import { CandidateSkill } from '../../entities/candidate-skill.entity';
import { DomainException } from '../../exceptions/domain.exception';
import { CandidateSkillAddedEvent } from '../../events/candidate-skill-added.event';
import { CandidateSkillUpdatedEvent } from '../../events/candidate-skill-updated.event';
import { CandidateSkillRemovedEvent } from '../../events/candidate-skill-removed.event';

describe('CandidateProfile Aggregate (Updated)', () => {
  const validUserId = 'user-123';
  const validSkillId = 'skill-react';
  const validCandidateSkillId = 'cs-456';

  describe('Factory Method - create', () => {
    it('should create new candidate profile with empty skills', () => {
      const profile = CandidateProfile.create(validUserId);

      expect(profile.userId).toBe(validUserId);
      expect(profile.experienceLevel).toBeNull();
      expect(profile.skills).toEqual([]);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty user ID', () => {
      expect(() => CandidateProfile.create('')).toThrow(DomainException);
      expect(() => CandidateProfile.create('   ')).toThrow(
        'User ID cannot be empty',
      );
    });
  });

  describe('Business Logic - Experience Level', () => {
    it('should update experience level', () => {
      const profile = CandidateProfile.create(validUserId);
      const level = ExperienceLevel.mid();

      profile.updateExperienceLevel(level);

      expect(profile.experienceLevel).toBe(level);
    });

    it('should update experience level multiple times', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.updateExperienceLevel(ExperienceLevel.junior());
      expect(profile.experienceLevel?.value).toBe('junior');

      profile.updateExperienceLevel(ExperienceLevel.senior());
      expect(profile.experienceLevel?.value).toBe('senior');
    });
  });

  describe('Business Logic - Add Skill', () => {
    it('should add skill to profile', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Experienced with React hooks and state management',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });

      expect(profile.skills).toHaveLength(1);
      expect(profile.skills[0].skillId).toBe(validSkillId);
      expect(profile.skills[0].proficiencyLevel!.value).toBe('advanced');
      expect(profile.skills[0].yearsOfExperience!.value).toBe(5);
    });

    it('should add skill without description', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: null,
        proficiencyLevel: ProficiencyLevel.intermediate(),
        yearsOfExperience: YearsOfExperience.fromNumber(2),
      });

      expect(profile.skills[0].description).toBeNull();
    });

    it('should publish CandidateSkillAddedEvent', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Test description',
        proficiencyLevel: ProficiencyLevel.expert(),
        yearsOfExperience: YearsOfExperience.fromNumber(10),
      });

      const events = profile.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CandidateSkillAddedEvent);

      const event = events[0] as CandidateSkillAddedEvent;
      expect(event.candidateId).toBe(validUserId);
      expect(event.skillId).toBe(validSkillId);
      expect(event.proficiencyLevel).toBe('expert');
      expect(event.yearsOfExperience).toBe(10);
    });

    it('should throw error when adding duplicate skill', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Description',
        proficiencyLevel: ProficiencyLevel.intermediate(),
        yearsOfExperience: YearsOfExperience.fromNumber(3),
      });

      expect(() =>
        profile.addSkill({
          skillId: validSkillId,
          candidateSkillId: 'another-id',
          description: 'Another description',
          proficiencyLevel: ProficiencyLevel.advanced(),
          yearsOfExperience: YearsOfExperience.fromNumber(5),
        }),
      ).toThrow(DomainException);
      expect(() =>
        profile.addSkill({
          skillId: validSkillId,
          candidateSkillId: 'another-id',
          description: 'Another description',
          proficiencyLevel: ProficiencyLevel.advanced(),
          yearsOfExperience: YearsOfExperience.fromNumber(5),
        }),
      ).toThrow('Skill already added to profile');
    });

    it('should add multiple different skills', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: 'react',
        candidateSkillId: 'cs-1',
        description: 'React skills',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });

      profile.addSkill({
        skillId: 'nodejs',
        candidateSkillId: 'cs-2',
        description: 'Node.js skills',
        proficiencyLevel: ProficiencyLevel.intermediate(),
        yearsOfExperience: YearsOfExperience.fromNumber(3),
      });

      expect(profile.skills).toHaveLength(2);
      expect(profile.skills[0].skillId).toBe('react');
      expect(profile.skills[1].skillId).toBe('nodejs');
    });
  });

  describe('Business Logic - Update Skill', () => {
    it('should update existing skill', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Old description',
        proficiencyLevel: ProficiencyLevel.beginner(),
        yearsOfExperience: YearsOfExperience.fromNumber(1),
      });

      profile.clearEvents(); // Clear add event

      profile.updateSkill(
        validSkillId,
        'Updated description',
        ProficiencyLevel.advanced(),
        YearsOfExperience.fromNumber(5),
      );

      const skill = profile.skills.find((s) => s.skillId === validSkillId);
      expect(skill?.description).toBe('Updated description');
      expect(skill?.proficiencyLevel!.value).toBe('advanced');
      expect(skill?.yearsOfExperience!.value).toBe(5);
    });

    it('should publish CandidateSkillUpdatedEvent with changes', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Old description',
        proficiencyLevel: ProficiencyLevel.intermediate(),
        yearsOfExperience: YearsOfExperience.fromNumber(3),
      });

      profile.clearEvents();

      profile.updateSkill(
        validSkillId,
        'New description',
        ProficiencyLevel.expert(),
        YearsOfExperience.fromNumber(7),
      );

      const events = profile.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CandidateSkillUpdatedEvent);

      const event = events[0] as CandidateSkillUpdatedEvent;
      expect(event.skillId).toBe(validSkillId);
      expect(event.changes).toEqual({
        description: 'New description',
        proficiencyLevel: 'expert',
        yearsOfExperience: 7,
      });
    });

    it('should not publish event if no changes', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Description',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });

      profile.clearEvents();

      // Update with same values
      profile.updateSkill(
        validSkillId,
        'Description',
        ProficiencyLevel.advanced(),
        YearsOfExperience.fromNumber(5),
      );

      const events = profile.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw error when updating non-existent skill', () => {
      const profile = CandidateProfile.create(validUserId);

      expect(() =>
        profile.updateSkill(
          'non-existent',
          'Description',
          ProficiencyLevel.advanced(),
          YearsOfExperience.fromNumber(5),
        ),
      ).toThrow(DomainException);
      expect(() =>
        profile.updateSkill(
          'non-existent',
          'Description',
          ProficiencyLevel.advanced(),
          YearsOfExperience.fromNumber(5),
        ),
      ).toThrow('Skill not found in profile');
    });
  });

  describe('Business Logic - Remove Skill', () => {
    it('should remove skill from profile', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Description',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });

      expect(profile.skills).toHaveLength(1);

      profile.removeSkill(validSkillId);

      expect(profile.skills).toHaveLength(0);
    });

    it('should publish CandidateSkillRemovedEvent', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Description',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });

      profile.clearEvents();

      profile.removeSkill(validSkillId);

      const events = profile.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CandidateSkillRemovedEvent);

      const event = events[0] as CandidateSkillRemovedEvent;
      expect(event.candidateId).toBe(validUserId);
      expect(event.skillId).toBe(validSkillId);
    });

    it('should throw error when removing non-existent skill', () => {
      const profile = CandidateProfile.create(validUserId);

      expect(() => profile.removeSkill('non-existent')).toThrow(
        DomainException,
      );
      expect(() => profile.removeSkill('non-existent')).toThrow(
        'Skill not found in profile',
      );
    });

    it('should remove only specified skill', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: 'react',
        candidateSkillId: 'cs-1',
        description: 'React',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });
      profile.addSkill({
        skillId: 'nodejs',
        candidateSkillId: 'cs-2',
        description: 'Node',
        proficiencyLevel: ProficiencyLevel.intermediate(),
        yearsOfExperience: YearsOfExperience.fromNumber(3),
      });
      profile.addSkill({
        skillId: 'postgres',
        candidateSkillId: 'cs-3',
        description: 'PostgreSQL',
        proficiencyLevel: ProficiencyLevel.beginner(),
        yearsOfExperience: YearsOfExperience.fromNumber(1),
      });

      expect(profile.skills).toHaveLength(3);

      profile.removeSkill('nodejs');

      expect(profile.skills).toHaveLength(2);
      expect(profile.skills.find((s) => s.skillId === 'react')).toBeDefined();
      expect(
        profile.skills.find((s) => s.skillId === 'postgres'),
      ).toBeDefined();
      expect(
        profile.skills.find((s) => s.skillId === 'nodejs'),
      ).toBeUndefined();
    });
  });

  describe('Factory Method - reconstitute', () => {
    it('should reconstitute profile from persistence', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const experienceLevel = ExperienceLevel.senior();
      const skills = [
        CandidateSkill.create({
          id: 'cs-1',
          candidateId: validUserId,
          skillId: 'react',
          description: 'React skills',
          proficiencyLevel: ProficiencyLevel.expert(),
          yearsOfExperience: YearsOfExperience.fromNumber(8),
        }),
      ];

      const profile = CandidateProfile.reconstitute({
        userId: validUserId,
        experienceLevel,
        skills,
        createdAt,
        updatedAt,
      });

      expect(profile.userId).toBe(validUserId);
      expect(profile.experienceLevel).toBe(experienceLevel);
      expect(profile.skills).toHaveLength(1);
      expect(profile.skills[0].skillId).toBe('react');
      expect(profile.createdAt).toBe(createdAt);
      expect(profile.updatedAt).toBe(updatedAt);
    });

    it('should reconstitute with null experience level', () => {
      const profile = CandidateProfile.reconstitute({
        userId: validUserId,
        experienceLevel: null,
        skills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(profile.experienceLevel).toBeNull();
      expect(profile.skills).toEqual([]);
    });
  });

  describe('Getters', () => {
    it('should return readonly skills array', () => {
      const profile = CandidateProfile.create(validUserId);

      profile.addSkill({
        skillId: validSkillId,
        candidateSkillId: validCandidateSkillId,
        description: 'Description',
        proficiencyLevel: ProficiencyLevel.advanced(),
        yearsOfExperience: YearsOfExperience.fromNumber(5),
      });

      const skills = profile.skills;
      expect(skills).toHaveLength(1);

      // Should be readonly - TypeScript will prevent modification
      // but at runtime it's the actual array reference
      expect(Array.isArray(skills)).toBe(true);
    });
  });
});
