import type { CandidateProfileWithUser } from '../../../domain/repositories/candidate-profile-query-service.interface';
import type {
  CandidateSearchResultReadModel,
  SkillsByCategoryReadModel,
} from '../../../domain/read-models/candidate-profile.read-model';
import type {
  CandidateProfileResponseDto,
  CandidateSkillResponseDto,
  SkillsByCategoryResponseDto,
  CandidateSearchResultItemDto,
} from '../dto/candidates.response.dto';

/**
 * Minimal shape the mapper needs to emit a skill DTO. Loose enough to accept
 * both the full CandidateSkillReadModel and lightweight matched-skill entries
 * from the search read model; all fields except `skillId` are optional.
 */
interface SkillDtoInput {
  skillId: string;
  skillName?: string | null;
  description?: string | null;
  proficiencyLevel?: string | null;
  yearsOfExperience?: number | null;
  createdAt?: Date;
  addedAt?: Date;
}

/**
 * Minimal shape for search-result input — `matchedSkills` is optional because
 * not every upstream query fills it in (simple-list mode).
 */
interface SearchResultInput {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  experienceLevel: string | null;
  matchScore: number;
  matchedSkills?: SkillDtoInput[];
}

/**
 * Mapper for converting Candidate domain data to HTTP response DTOs.
 * Used ONLY in controllers for API responses.
 */
export const CandidateResponseMapper = {
  toProfileDto(data: CandidateProfileWithUser): CandidateProfileResponseDto {
    return {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      experienceLevel: data.experienceLevel,
      isProfileComplete: data.isProfileComplete,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },

  toSkillDto(skill: SkillDtoInput): CandidateSkillResponseDto {
    return {
      skillId: skill.skillId,
      skillName: skill.skillName ?? null,
      description: skill.description ?? null,
      proficiencyLevel: skill.proficiencyLevel ?? null,
      yearsOfExperience: skill.yearsOfExperience ?? null,
      // `createdAt` wins when both exist — read models expose it; older callers
      // with `addedAt` still work as a fallback.
      addedAt: skill.createdAt ?? skill.addedAt ?? new Date(0),
    };
  },

  toSkillsByCategoryDto(
    data: SkillsByCategoryReadModel[],
  ): SkillsByCategoryResponseDto[] {
    return data.map((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      skills: category.skills.map((skill) =>
        CandidateResponseMapper.toSkillDto(skill),
      ),
    }));
  },

  toSearchResultDto(result: SearchResultInput): CandidateSearchResultItemDto {
    return {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      experienceLevel: result.experienceLevel,
      matchedSkills:
        result.matchedSkills?.map((skill) =>
          CandidateResponseMapper.toSkillDto(skill),
        ) ?? [],
      matchScore: result.matchScore,
    };
  },

  toSearchResultsDto(
    results: SearchResultInput[],
  ): CandidateSearchResultItemDto[] {
    return results.map((result) =>
      CandidateResponseMapper.toSearchResultDto(result),
    );
  },
};
