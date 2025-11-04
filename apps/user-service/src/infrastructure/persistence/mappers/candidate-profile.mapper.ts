import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { ExperienceLevel } from '../../../domain/value-objects/experience-level.vo';
import { CandidateProfileEntity } from '../entities/candidate-profile.entity';

/**
 * Mapper between CandidateProfile domain model and CandidateProfileEntity
 */
export class CandidateProfileMapper {
  /**
   * Map from domain to persistence
   */
  public static toPersistence(profile: CandidateProfile): CandidateProfileEntity {
    const entity = new CandidateProfileEntity();

    entity.userId = profile.userId;
    entity.skills = profile.skills;
    entity.experienceLevel = profile.experienceLevel?.toString() as any || null;
    entity.isProfileComplete = profile.isComplete();
    entity.createdAt = profile.createdAt;
    entity.updatedAt = profile.updatedAt;

    return entity;
  }

  /**
   * Map from persistence to domain
   */
  public static toDomain(entity: CandidateProfileEntity): CandidateProfile {
    return CandidateProfile.reconstitute(
      entity.userId,
      entity.skills,
      entity.experienceLevel ? ExperienceLevel.fromString(entity.experienceLevel) : null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Map array from persistence to domain
   */
  public static toDomainList(entities: CandidateProfileEntity[]): CandidateProfile[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
