import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';

/**
 * Candidate Profile Response DTO
 */
export class CandidateProfileResponseDto {
  userId: string;
  skills: string[];
  experienceLevel: string | null;
  isProfileComplete: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(profile: CandidateProfile): CandidateProfileResponseDto {
    const dto = new CandidateProfileResponseDto();
    dto.userId = profile.userId;
    dto.skills = profile.skills;
    dto.experienceLevel = profile.experienceLevel?.toString() || null;
    dto.isProfileComplete = profile.isComplete();
    dto.completionPercentage = profile.getCompletionPercentage();
    dto.createdAt = profile.createdAt;
    dto.updatedAt = profile.updatedAt;
    return dto;
  }
}
