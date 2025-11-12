import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ICandidateProfileRepository } from '../../../domain/repositories/candidate-profile.repository.interface';
import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { CandidateSkillEntity } from '../entities/candidate-skill.entity';
import { CandidateSkillMapper } from '../mappers/candidate-skill.mapper';
import { ExperienceLevel } from '../../../domain/value-objects/experience-level.vo';

/**
 * TypeORM CandidateProfile Repository (Write)
 * Updated to handle CandidateSkill entities
 */
@Injectable()
export class TypeOrmCandidateProfileRepository implements ICandidateProfileRepository {
  constructor(
    @InjectRepository(CandidateSkillEntity)
    private readonly skillRepository: Repository<CandidateSkillEntity>,
    private readonly skillMapper: CandidateSkillMapper,
    private readonly dataSource: DataSource,
  ) {}

  async save(profile: CandidateProfile): Promise<void> {
    await this.dataSource.transaction(async manager => {
      // Save experience_level in candidate_profiles table
      await manager.query(
        `INSERT INTO candidate_profiles (user_id, experience_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id)
         DO UPDATE SET experience_level = $2, updated_at = $4`,
        [
          profile.userId,
          profile.experienceLevel?.value || null,
          profile.createdAt,
          profile.updatedAt,
        ],
      );

      // Remove existing skills
      await manager.delete(CandidateSkillEntity, { candidateId: profile.userId });

      // Save skills
      if (profile.skills.length > 0) {
        const skillEntities = profile.skills.map(skill =>
          this.skillMapper.toEntity(skill),
        );
        await manager.save(CandidateSkillEntity, skillEntities);
      }
    });
  }

  async findByUserId(userId: string): Promise<CandidateProfile | null> {
    // Load experience_level from candidate_profiles
    const profileData = await this.dataSource.query(
      `SELECT experience_level, created_at, updated_at 
       FROM candidate_profiles 
       WHERE user_id = $1`,
      [userId],
    );

    if (profileData.length === 0) return null;

    const { experience_level, created_at, updated_at } = profileData[0];

    // Load skills
    const skillEntities = await this.skillRepository.find({
      where: { candidateId: userId },
    });

    const skills = this.skillMapper.toDomainList(skillEntities);

    const experienceLevel = experience_level
      ? ExperienceLevel.fromString(experience_level)
      : null;

    return CandidateProfile.reconstitute(
      userId,
      experienceLevel,
      skills,
      created_at,
      updated_at,
    );
  }

  async delete(userId: string): Promise<void> {
    // CASCADE will remove candidate_skills
    await this.dataSource.query(`DELETE FROM candidate_profiles WHERE user_id = $1`, [
      userId,
    ]);
  }

  async hasSkill(userId: string, skillId: string): Promise<boolean> {
    const count = await this.skillRepository.count({
      where: { candidateId: userId, skillId },
    });
    return count > 0;
  }
}
