import { CandidateResponseMapper } from '../candidate.response.mapper';
import type { CandidateProfileWithUserReadModel } from '../../../../domain/read-models/candidate-profile.read-model';
import type { SkillsByCategoryReadModel } from '../../../../domain/read-models/candidate-profile.read-model';

describe('CandidateResponseMapper', () => {
  const now = new Date('2026-01-15T12:00:00Z');

  const mockProfile: CandidateProfileWithUserReadModel = {
    userId: 'user-1',
    fullName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    avatarUrl: 'https://cdn.example.com/avatar.png',
    timezone: 'UTC',
    language: 'en',
    experienceLevel: 'senior',
    isProfileComplete: true,
    createdAt: now,
    updatedAt: now,
  };

  describe('toProfileDto', () => {
    it('should map profile to response DTO with correct fields', () => {
      const result = CandidateResponseMapper.toProfileDto(mockProfile);

      expect(result).toEqual({
        userId: 'user-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        experienceLevel: 'senior',
        isProfileComplete: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    it('should not expose internal user fields (phone, avatar, timezone, language)', () => {
      const result = CandidateResponseMapper.toProfileDto(mockProfile);

      const keys = Object.keys(result);
      expect(keys).not.toContain('phone');
      expect(keys).not.toContain('avatarUrl');
      expect(keys).not.toContain('timezone');
      expect(keys).not.toContain('language');
      expect(keys).not.toContain('firstName');
      expect(keys).not.toContain('lastName');
    });

    it('should handle null experienceLevel', () => {
      const profile = { ...mockProfile, experienceLevel: null };
      const result = CandidateResponseMapper.toProfileDto(profile);
      expect(result.experienceLevel).toBeNull();
    });
  });

  describe('toSkillDto', () => {
    it('should map skill data to DTO', () => {
      const skill = {
        skillId: 'skill-1',
        skillName: 'React',
        description: 'Frontend framework',
        proficiencyLevel: 'expert',
        yearsOfExperience: 5,
        createdAt: now,
      };

      const result = CandidateResponseMapper.toSkillDto(skill);

      expect(result).toEqual({
        skillId: 'skill-1',
        skillName: 'React',
        description: 'Frontend framework',
        proficiencyLevel: 'expert',
        yearsOfExperience: 5,
        addedAt: now,
      });
    });

    it('should handle nullable fields with defaults', () => {
      const skill = {
        skillId: 'skill-2',
        createdAt: now,
      };

      const result = CandidateResponseMapper.toSkillDto(skill);

      expect(result.skillName).toBeNull();
      expect(result.description).toBeNull();
      expect(result.proficiencyLevel).toBeNull();
      expect(result.yearsOfExperience).toBeNull();
    });

    it('should prefer addedAt over createdAt when both exist', () => {
      const addedAt = new Date('2026-02-01');
      const skill = {
        skillId: 'skill-3',
        addedAt,
        createdAt: now,
      };

      const result = CandidateResponseMapper.toSkillDto(skill);
      expect(result.addedAt).toEqual(now);
    });

    it('should fall back to addedAt when createdAt is missing', () => {
      const addedAt = new Date('2026-02-01');
      const skill = {
        skillId: 'skill-4',
        addedAt,
      };

      const result = CandidateResponseMapper.toSkillDto(skill);
      expect(result.addedAt).toEqual(addedAt);
    });
  });

  describe('toSkillsByCategoryDto', () => {
    it('should group skills by category', () => {
      const data: SkillsByCategoryReadModel[] = [
        {
          categoryId: 'cat-1',
          categoryName: 'Frontend',
          categorySlug: 'frontend',
          skills: [
            {
              id: 'cs-1',
              userId: 'user-1',
              skillId: 'skill-1',
              skillName: 'React',
              skillSlug: 'react',
              categoryId: 'cat-1',
              categoryName: 'Frontend',
              description: null,
              proficiencyLevel: 'expert',
              yearsOfExperience: 5,
              lastUsedAt: null,
              endorsementsCount: 0,
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
      ];

      const result = CandidateResponseMapper.toSkillsByCategoryDto(data);

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('cat-1');
      expect(result[0].categoryName).toBe('Frontend');
      expect(result[0].skills).toHaveLength(1);
      expect(result[0].skills[0].skillId).toBe('skill-1');
      expect(result[0].skills[0].skillName).toBe('React');
    });

    it('should return empty array for empty input', () => {
      const result = CandidateResponseMapper.toSkillsByCategoryDto([]);
      expect(result).toEqual([]);
    });
  });

  describe('toSearchResultDto', () => {
    it('should map search result with matched skills', () => {
      const searchResult = {
        userId: 'user-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        experienceLevel: 'senior',
        matchScore: 95,
        matchedSkills: [
          {
            skillId: 'skill-1',
            skillName: 'React',
            proficiencyLevel: 'expert',
            createdAt: now,
          },
        ],
      };

      const result = CandidateResponseMapper.toSearchResultDto(searchResult);

      expect(result.userId).toBe('user-1');
      expect(result.matchScore).toBe(95);
      expect(result.matchedSkills).toHaveLength(1);
      expect(result.matchedSkills[0].skillId).toBe('skill-1');
    });

    it('should handle missing matchedSkills', () => {
      const searchResult = {
        userId: 'user-2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        experienceLevel: null,
        matchScore: 50,
      };

      const result = CandidateResponseMapper.toSearchResultDto(searchResult);
      expect(result.matchedSkills).toEqual([]);
    });
  });

  describe('toSearchResultsDto', () => {
    it('should map array of search results', () => {
      const results = [
        {
          userId: 'user-1',
          fullName: 'A',
          email: 'a@b.com',
          experienceLevel: 'senior',
          matchScore: 90,
          matchedSkills: [],
        },
        {
          userId: 'user-2',
          fullName: 'B',
          email: 'b@b.com',
          experienceLevel: 'mid',
          matchScore: 70,
          matchedSkills: [],
        },
      ];

      const mapped = CandidateResponseMapper.toSearchResultsDto(results);

      expect(mapped).toHaveLength(2);
      expect(mapped[0].userId).toBe('user-1');
      expect(mapped[1].userId).toBe('user-2');
    });

    it('should return empty array for empty input', () => {
      expect(CandidateResponseMapper.toSearchResultsDto([])).toEqual([]);
    });
  });
});
