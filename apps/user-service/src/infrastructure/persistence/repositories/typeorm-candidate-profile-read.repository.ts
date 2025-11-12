import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import {
  ICandidateProfileReadRepository,
  CandidateSearchFilters,
  CandidateSearchResult,
  PaginatedResult,
  CandidateProfileWithUser,
} from '../../../domain/repositories/candidate-profile-read.repository.interface';
import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { CandidateSkillEntity } from '../entities/candidate-skill.entity';
import { UserEntity } from '../entities/user.entity';
import { SkillEntity } from '../entities/skill.entity';
import { CandidateSkillMapper } from '../mappers/candidate-skill.mapper';
import { ExperienceLevel } from '../../../domain/value-objects/experience-level.vo';

@Injectable()
export class TypeOrmCandidateProfileReadRepository
  implements ICandidateProfileReadRepository
{
  constructor(
    @InjectRepository(CandidateSkillEntity)
    private readonly skillRepository: Repository<CandidateSkillEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SkillEntity)
    private readonly skillEntityRepository: Repository<SkillEntity>,
    private readonly skillMapper: CandidateSkillMapper,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string): Promise<CandidateProfile | null> {
    const profileData = await this.dataSource.query(
      `SELECT experience_level, created_at, updated_at 
       FROM candidate_profiles WHERE user_id = $1`,
      [userId],
    );

    if (profileData.length === 0) return null;

    const skillEntities = await this.skillRepository.find({
      where: { candidateId: userId },
    });

    const skills = this.skillMapper.toDomainList(skillEntities);
    const experienceLevel = profileData[0].experience_level
      ? ExperienceLevel.fromString(profileData[0].experience_level)
      : null;

    return CandidateProfile.reconstitute(
      userId,
      experienceLevel,
      skills,
      profileData[0].created_at,
      profileData[0].updated_at,
    );
  }

  async findByUserIdWithUser(userId: string): Promise<CandidateProfileWithUser | null> {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    return {
      profile,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatarUrl: user.avatarUrl || undefined,
    };
  }

  async searchBySkills(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CandidateSearchResult>> {
    // MVP: Simple search - candidates who have ALL specified skills
    if (!filters.skillIds || filters.skillIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    // Find candidates who have all required skills
    const results = await this.dataSource.query(
      `
      SELECT 
        cs.candidate_id,
        COUNT(DISTINCT cs.skill_id) as matched_count
      FROM candidate_skills cs
      WHERE cs.skill_id = ANY($1::uuid[])
      ${filters.minProficiency ? `AND cs.proficiency_level >= $2` : ''}
      ${filters.minYears ? `AND cs.years_of_experience >= $3` : ''}
      GROUP BY cs.candidate_id
      HAVING COUNT(DISTINCT cs.skill_id) = $4
      LIMIT $5 OFFSET $6
      `,
      [
        filters.skillIds,
        filters.minProficiency || null,
        filters.minYears || null,
        filters.skillIds.length,
        limit,
        (page - 1) * limit,
      ],
    );

    const candidateIds = results.map((r: any) => r.candidate_id);

    if (candidateIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    // Load candidate data
    const candidates = await this.userRepository.find({
      where: { id: In(candidateIds) },
    });

    const data: CandidateSearchResult[] = await Promise.all(
      candidates.map(async candidate => {
        const profile = await this.findByUserId(candidate.id);
        const matchedSkills = profile?.skills.filter(s =>
          filters.skillIds?.includes(s.skillId),
        ) || [];

        return {
          userId: candidate.id,
          fullName: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          experienceLevel: profile?.experienceLevel?.value || null,
          matchedSkills,
          matchScore: matchedSkills.reduce((score, s) => 
            score + (s.yearsOfExperience?.value || 0), 0),
        };
      }),
    );

    // Sort by match score
    data.sort((a, b) => b.matchScore - a.matchScore);

    return {
      data,
      total: candidateIds.length,
      page,
      limit,
      totalPages: Math.ceil(candidateIds.length / limit),
    };
  }

  async getCandidateSkillsGroupedByCategory(userId: string): Promise<{
    categoryId: string | null;
    categoryName: string | null;
    skills: any[];
  }[]> {
    const skillEntities = await this.skillRepository.find({
      where: { candidateId: userId },
      relations: ['skill', 'skill.category'],
      order: { createdAt: 'ASC' },
    });

    const grouped = new Map<string, any>();

    for (const entity of skillEntities) {
      const categoryId = entity.skill?.categoryId || null;
      const categoryName = entity.skill?.category?.name || null;
      const key = categoryId || 'uncategorized';

      if (!grouped.has(key)) {
        grouped.set(key, {
          categoryId,
          categoryName,
          skills: [],
        });
      }

      grouped.get(key)!.skills.push(this.skillMapper.toDomain(entity));
    }

    return Array.from(grouped.values());
  }

  async countBySkill(skillId: string): Promise<number> {
    return this.skillRepository.count({ where: { skillId } });
  }

  async getTopSkills(limit: number): Promise<{
    skillId: string;
    skillName: string;
    count: number;
  }[]> {
    const results = await this.dataSource.query(
      `
      SELECT 
        cs.skill_id,
        s.name as skill_name,
        COUNT(*) as count
      FROM candidate_skills cs
      JOIN skills s ON s.id = cs.skill_id
      GROUP BY cs.skill_id, s.name
      ORDER BY count DESC
      LIMIT $1
      `,
      [limit],
    );

    return results.map((r: any) => ({
      skillId: r.skill_id,
      skillName: r.skill_name,
      count: parseInt(r.count),
    }));
  }
}
