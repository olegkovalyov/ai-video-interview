import { HRProfile } from '../../../domain/aggregates/hr-profile.aggregate';
import { HRProfileEntity } from '../entities/hr-profile.entity';

/**
 * Mapper between HRProfile domain model and HRProfileEntity
 */
export class HRProfileMapper {
  /**
   * Map from domain to persistence
   */
  public static toPersistence(profile: HRProfile): HRProfileEntity {
    const entity = new HRProfileEntity();

    entity.userId = profile.userId;
    entity.companyName = profile.companyName;
    entity.position = profile.position;
    entity.isProfileComplete = profile.isComplete();
    entity.createdAt = profile.createdAt;
    entity.updatedAt = profile.updatedAt;

    return entity;
  }

  /**
   * Map from persistence to domain
   */
  public static toDomain(entity: HRProfileEntity): HRProfile {
    return HRProfile.reconstitute(
      entity.userId,
      entity.companyName,
      entity.position,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
