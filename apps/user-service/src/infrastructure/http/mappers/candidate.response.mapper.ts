import { CandidateProfileWithUser } from '../../../domain/repositories/candidate-profile-read.repository.interface';
import { CandidateSkill } from '../../../domain/entities/candidate-skill.entity';
import { SkillsByCategory } from '../../../application/queries/candidate/get-candidate-skills.handler';

/**
 * Mapper for converting Candidate domain data to HTTP response DTOs
 * Used ONLY in controllers for API responses
 */
export class CandidateResponseMapper {
  static toProfileDto(data: CandidateProfileWithUser) {
    return {
      userId: data.profile.userId,
      fullName: data.fullName,
      email: data.email,
      experienceLevel: data.profile.experienceLevel?.value || null,
      createdAt: data.profile.createdAt,
      updatedAt: data.profile.updatedAt,
    };
  }

  static toSkillDto(skill: any) {
    return {
      skillId: skill.skillId,
      skillName: skill.skillName || null,
      description: skill.description,
      proficiencyLevel: skill.proficiencyLevel?.value || null,
      yearsOfExperience: skill.yearsOfExperience?.value || null,
      addedAt: skill.createdAt || skill.addedAt,
    };
  }

  static toSkillsByCategoryDto(data: SkillsByCategory[]) {
    return data.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      skills: category.skills.map(skill => this.toSkillDto(skill)),
    }));
  }

  static toSearchResultDto(result: any) {
    return {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      experienceLevel: result.experienceLevel,
      matchedSkills: result.matchedSkills?.map((skill: CandidateSkill) => this.toSkillDto(skill)) || [],
      matchScore: result.matchScore,
    };
  }

  static toSearchResultsDto(results: any[]) {
    return results.map(result => this.toSearchResultDto(result));
  }
}
