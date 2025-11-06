import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { ICandidateProfileRepository } from '../../../domain/repositories/candidate-profile.repository.interface';
import { CandidateProfileEntity } from '../entities/candidate-profile.entity';
import { CandidateProfileMapper } from '../mappers/candidate-profile.mapper';

/**
 * TypeORM implementation of CandidateProfile repository
 */
@Injectable()
export class TypeOrmCandidateProfileRepository implements ICandidateProfileRepository {
  constructor(
    @InjectRepository(CandidateProfileEntity)
    private readonly repository: Repository<CandidateProfileEntity>,
  ) {}

  /**
   * Save candidate profile (create or update)
   */
  async save(profile: CandidateProfile): Promise<CandidateProfile> {
    const entity = CandidateProfileMapper.toPersistence(profile);
    const saved = await this.repository.save(entity);
    return CandidateProfileMapper.toDomain(saved);
  }

  /**
   * Find candidate profile by user ID
   */
  async findByUserId(userId: string): Promise<CandidateProfile | null> {
    const entity = await this.repository.findOne({
      where: { userId },
    });

    return entity ? CandidateProfileMapper.toDomain(entity) : null;
  }

  /**
   * Delete candidate profile
   */
  async delete(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  /**
   * Find all complete profiles (for HR search)
   */
  async findCompleteProfiles(limit: number = 50, offset: number = 0): Promise<CandidateProfile[]> {
    const entities = await this.repository.find({
      where: { isProfileComplete: true },
      take: limit,
      skip: offset,
      order: { updatedAt: 'DESC' },
    });

    return CandidateProfileMapper.toDomainList(entities);
  }

  /**
   * Search candidates by skills (case-insensitive, partial match)
   */
  async searchBySkills(skills: string[], limit: number = 50): Promise<CandidateProfile[]> {
    if (skills.length === 0) {
      return [];
    }

    // Build query for skills array overlap
    // PostgreSQL array overlap operator: &&
    const query = this.repository
      .createQueryBuilder('profile')
      .where('profile.skills && :skills', { skills })
      .andWhere('profile.is_profile_complete = :complete', { complete: true })
      .orderBy('profile.updated_at', 'DESC')
      .take(limit);

    const entities = await query.getMany();
    return CandidateProfileMapper.toDomainList(entities);
  }
}
