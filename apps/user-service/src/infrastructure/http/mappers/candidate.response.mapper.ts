import { CandidateProfileWithUser } from '../../../domain/repositories/candidate-profile-read.repository.interface';
import { CandidateSkill } from '../../../domain/entities/candidate-skill.entity';
import type { SkillsByCategoryReadModel } from '../../../domain/read-models/candidate-profile.read-model';
import { 
  CandidateProfileResponseDto, 
  CandidateSkillResponseDto, 
  SkillsByCategoryResponseDto,
  CandidateSearchResultItemDto 
} from '../dto/candidates.response.dto';

/**
 * Mapper for converting Candidate domain data to HTTP response DTOs
 * Used ONLY in controllers for API responses
 */
export class CandidateResponseMapper {
  static toProfileDto(data: CandidateProfileWithUser): CandidateProfileResponseDto {
    return {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      experienceLevel: data.experienceLevel,
      isProfileComplete: data.isProfileComplete,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toSkillDto(skill: any): CandidateSkillResponseDto {
    return {
      skillId: skill.skillId,
      skillName: skill.skillName || null,
      description: skill.description || null,
      proficiencyLevel: skill.proficiencyLevel || null,
      yearsOfExperience: skill.yearsOfExperience || null,
      addedAt: skill.createdAt || skill.addedAt,
    };
  }

  static toSkillsByCategoryDto(data: SkillsByCategoryReadModel[]): SkillsByCategoryResponseDto[] {
    return data.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      skills: category.skills.map(skill => this.toSkillDto(skill)),
    }));
  }

  static toSearchResultDto(result: any): CandidateSearchResultItemDto {
    return {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      experienceLevel: result.experienceLevel,
      matchedSkills: result.matchedSkills?.map((skill: CandidateSkill) => this.toSkillDto(skill)) || [],
      matchScore: result.matchScore,
    };
  }

  static toSearchResultsDto(results: any[]): CandidateSearchResultItemDto[] {
    return results.map(result => this.toSearchResultDto(result));
  }
}
