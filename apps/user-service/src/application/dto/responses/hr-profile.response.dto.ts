import { HRProfile } from '../../../domain/aggregates/hr-profile.aggregate';

/**
 * HR Profile Response DTO
 */
export class HRProfileResponseDto {
  userId: string;
  companyName: string | null;
  position: string | null;
  isProfileComplete: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(profile: HRProfile): HRProfileResponseDto {
    const dto = new HRProfileResponseDto();
    dto.userId = profile.userId;
    dto.companyName = profile.companyName;
    dto.position = profile.position;
    dto.isProfileComplete = profile.isComplete();
    dto.completionPercentage = profile.getCompletionPercentage();
    dto.createdAt = profile.createdAt;
    dto.updatedAt = profile.updatedAt;
    return dto;
  }
}
