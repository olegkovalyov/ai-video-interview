import { CandidateProfile } from '../candidate-profile.aggregate';
import { ExperienceLevel } from '../../value-objects/experience-level.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('CandidateProfile Aggregate', () => {
  const userId = 'user-123';

  describe('Factory Methods', () => {
    describe('create()', () => {
      it('should create new candidate profile with empty defaults', () => {
        const profile = CandidateProfile.create(userId);

        expect(profile.userId).toBe(userId);
        expect(profile.skills).toEqual([]);
        expect(profile.experienceLevel).toBeNull();
        expect(profile.createdAt).toBeInstanceOf(Date);
        expect(profile.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error for empty userId', () => {
        expect(() => CandidateProfile.create('')).toThrow(DomainException);
        expect(() => CandidateProfile.create('')).toThrow('User ID cannot be empty');
      });

      it('should throw error for whitespace-only userId', () => {
        expect(() => CandidateProfile.create('   ')).toThrow(DomainException);
      });

      it('should start with incomplete profile', () => {
        const profile = CandidateProfile.create(userId);

        expect(profile.isComplete()).toBe(false);
        expect(profile.getCompletionPercentage()).toBe(0);
      });
    });

    describe('reconstitute()', () => {
      it('should reconstitute profile from persistence', () => {
        const skills = ['JavaScript', 'TypeScript'];
        const experienceLevel = ExperienceLevel.senior();
        const createdAt = new Date('2024-01-01');
        const updatedAt = new Date('2024-01-15');

        const profile = CandidateProfile.reconstitute(
          userId,
          skills,
          experienceLevel,
          createdAt,
          updatedAt,
        );

        expect(profile.userId).toBe(userId);
        expect(profile.skills).toEqual(skills);
        expect(profile.experienceLevel).toBe(experienceLevel);
        expect(profile.createdAt).toBe(createdAt);
        expect(profile.updatedAt).toBe(updatedAt);
      });

      it('should reconstitute with null experience level', () => {
        const profile = CandidateProfile.reconstitute(
          userId,
          ['JavaScript'],
          null,
          new Date(),
          new Date(),
        );

        expect(profile.experienceLevel).toBeNull();
      });
    });
  });

  describe('Business Logic - Skills Management', () => {
    describe('updateSkills()', () => {
      it('should update skills list', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateSkills(['JavaScript', 'TypeScript', 'React']);

        expect(profile.skills).toEqual(['JavaScript', 'TypeScript', 'React']);
      });

      it('should trim whitespace from skills', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateSkills(['  JavaScript  ', '  TypeScript  ']);

        expect(profile.skills).toEqual(['JavaScript', 'TypeScript']);
      });

      it('should remove empty skills', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateSkills(['JavaScript', '', '   ', 'TypeScript']);

        expect(profile.skills).toEqual(['JavaScript', 'TypeScript']);
      });

      it('should remove duplicate skills (case-insensitive)', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateSkills(['JavaScript', 'javascript', 'JAVASCRIPT', 'TypeScript']);

        expect(profile.skills).toHaveLength(2);
        expect(profile.skills).toContain('JavaScript');
        expect(profile.skills).toContain('TypeScript');
      });

      it('should preserve original case of first occurrence', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateSkills(['JavaScript', 'JAVASCRIPT']);

        expect(profile.skills[0]).toBe('JavaScript');
      });

      it('should update updatedAt timestamp', () => {
        const profile = CandidateProfile.create(userId);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.updateSkills(['JavaScript']);

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should replace existing skills completely', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        
        profile.updateSkills(['Python', 'Go']);

        expect(profile.skills).toEqual(['Python', 'Go']);
      });
    });

    describe('addSkill()', () => {
      it('should add new skill', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.addSkill('JavaScript');

        expect(profile.skills).toContain('JavaScript');
      });

      it('should trim whitespace from skill', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.addSkill('  JavaScript  ');

        expect(profile.skills).toEqual(['JavaScript']);
      });

      it('should throw error for empty skill', () => {
        const profile = CandidateProfile.create(userId);
        
        expect(() => profile.addSkill('')).toThrow(DomainException);
        expect(() => profile.addSkill('')).toThrow('Skill cannot be empty');
      });

      it('should throw error for whitespace-only skill', () => {
        const profile = CandidateProfile.create(userId);
        
        expect(() => profile.addSkill('   ')).toThrow(DomainException);
      });

      it('should not add duplicate skill (case-insensitive)', () => {
        const profile = CandidateProfile.create(userId);
        profile.addSkill('JavaScript');
        
        profile.addSkill('javascript');

        expect(profile.skills).toHaveLength(1);
        expect(profile.skills[0]).toBe('JavaScript');
      });

      it('should add multiple different skills', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.addSkill('JavaScript');
        profile.addSkill('TypeScript');
        profile.addSkill('React');

        expect(profile.skills).toHaveLength(3);
      });

      it('should update updatedAt timestamp', () => {
        const profile = CandidateProfile.create(userId);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.addSkill('JavaScript');

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should not update timestamp if skill already exists', () => {
        const profile = CandidateProfile.create(userId);
        profile.addSkill('JavaScript');
        const oldUpdatedAt = profile.updatedAt;
        
        profile.addSkill('JavaScript');

        expect(profile.updatedAt).toBe(oldUpdatedAt);
      });
    });

    describe('removeSkill()', () => {
      it('should remove existing skill', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript', 'React']);
        
        profile.removeSkill('TypeScript');

        expect(profile.skills).toEqual(['JavaScript', 'React']);
      });

      it('should remove skill case-insensitively', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        
        profile.removeSkill('typescript');

        expect(profile.skills).toEqual(['JavaScript']);
      });

      it('should trim whitespace before removing', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        
        profile.removeSkill('  TypeScript  ');

        expect(profile.skills).toEqual(['JavaScript']);
      });

      it('should do nothing if skill does not exist', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        
        profile.removeSkill('Python');

        expect(profile.skills).toEqual(['JavaScript', 'TypeScript']);
      });

      it('should update updatedAt timestamp', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.removeSkill('TypeScript');

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should allow removing all skills', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        
        profile.removeSkill('JavaScript');
        profile.removeSkill('TypeScript');

        expect(profile.skills).toEqual([]);
      });
    });
  });

  describe('Business Logic - Experience Level', () => {
    describe('updateExperienceLevel()', () => {
      it('should set experience level', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateExperienceLevel(ExperienceLevel.senior());

        expect(profile.experienceLevel?.isSenior()).toBe(true);
      });

      it('should update experience level', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateExperienceLevel(ExperienceLevel.junior());
        
        profile.updateExperienceLevel(ExperienceLevel.senior());

        expect(profile.experienceLevel?.isSenior()).toBe(true);
      });

      it('should update updatedAt timestamp', () => {
        const profile = CandidateProfile.create(userId);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.updateExperienceLevel(ExperienceLevel.mid());

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should handle all experience levels', () => {
        const profile = CandidateProfile.create(userId);
        
        profile.updateExperienceLevel(ExperienceLevel.junior());
        expect(profile.experienceLevel?.isJunior()).toBe(true);
        
        profile.updateExperienceLevel(ExperienceLevel.mid());
        expect(profile.experienceLevel?.isMid()).toBe(true);
        
        profile.updateExperienceLevel(ExperienceLevel.senior());
        expect(profile.experienceLevel?.isSenior()).toBe(true);
        
        profile.updateExperienceLevel(ExperienceLevel.lead());
        expect(profile.experienceLevel?.isLead()).toBe(true);
      });
    });
  });

  describe('Business Logic - Profile Completion', () => {
    describe('isComplete()', () => {
      it('should return false for empty profile', () => {
        const profile = CandidateProfile.create(userId);

        expect(profile.isComplete()).toBe(false);
      });

      it('should return false with only skills', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript']);

        expect(profile.isComplete()).toBe(false);
      });

      it('should return false with only experience level', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateExperienceLevel(ExperienceLevel.senior());

        expect(profile.isComplete()).toBe(false);
      });

      it('should return true with both skills and experience level', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript']);
        profile.updateExperienceLevel(ExperienceLevel.senior());

        expect(profile.isComplete()).toBe(true);
      });
    });

    describe('getCompletionPercentage()', () => {
      it('should return 0% for empty profile', () => {
        const profile = CandidateProfile.create(userId);

        expect(profile.getCompletionPercentage()).toBe(0);
      });

      it('should return 50% with only skills', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript']);

        expect(profile.getCompletionPercentage()).toBe(50);
      });

      it('should return 50% with only experience level', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateExperienceLevel(ExperienceLevel.senior());

        expect(profile.getCompletionPercentage()).toBe(50);
      });

      it('should return 100% when complete', () => {
        const profile = CandidateProfile.create(userId);
        profile.updateSkills(['JavaScript', 'TypeScript']);
        profile.updateExperienceLevel(ExperienceLevel.senior());

        expect(profile.getCompletionPercentage()).toBe(100);
      });
    });
  });

  describe('Getters', () => {
    it('should return immutable copy of skills array', () => {
      const profile = CandidateProfile.create(userId);
      profile.updateSkills(['JavaScript', 'TypeScript']);
      
      const skills = profile.skills;
      skills.push('React');

      expect(profile.skills).toEqual(['JavaScript', 'TypeScript']);
      expect(profile.skills).not.toContain('React');
    });

    it('should return all properties correctly', () => {
      const profile = CandidateProfile.create(userId);
      profile.updateSkills(['JavaScript']);
      profile.updateExperienceLevel(ExperienceLevel.senior());

      expect(profile.userId).toBe(userId);
      expect(profile.skills).toEqual(['JavaScript']);
      expect(profile.experienceLevel).toBeInstanceOf(ExperienceLevel);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle full profile lifecycle', () => {
      // Create profile
      const profile = CandidateProfile.create(userId);
      expect(profile.isComplete()).toBe(false);
      expect(profile.getCompletionPercentage()).toBe(0);

      // Add skills incrementally
      profile.addSkill('JavaScript');
      profile.addSkill('TypeScript');
      expect(profile.getCompletionPercentage()).toBe(50);

      // Set experience level
      profile.updateExperienceLevel(ExperienceLevel.senior());
      expect(profile.isComplete()).toBe(true);
      expect(profile.getCompletionPercentage()).toBe(100);

      // Update skills
      profile.updateSkills(['Python', 'Go', 'Rust']);
      expect(profile.skills).toEqual(['Python', 'Go', 'Rust']);
      expect(profile.isComplete()).toBe(true);

      // Remove a skill
      profile.removeSkill('Go');
      expect(profile.skills).toEqual(['Python', 'Rust']);
      expect(profile.isComplete()).toBe(true);
    });
  });
});
