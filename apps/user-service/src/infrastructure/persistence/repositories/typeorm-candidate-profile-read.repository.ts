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
import type { 
  CandidateProfileReadModel,
  CandidateSkillReadModel,
  SkillsByCategoryReadModel,
} from '../../../domain/read-models/candidate-profile.read-model';
import { CandidateProfile } from '../../../domain/aggregates/candidate-profile.aggregate';
import { CandidateSkillEntity } from '../entities/candidate-skill.entity';
import { UserEntity } from '../entities/user.entity';
import { SkillEntity } from '../entities/skill.entity';
import { CandidateSkillMapper } from '../mappers/candidate-skill.mapper';
import { ExperienceLevel } from '../../../domain/value-objects/experience-level.vo';

// Proficiency levels in order for comparison
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

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

  async findByUserId(userId: string): Promise<CandidateProfileReadModel | null> {
    const profileData = await this.dataSource.query(
      `SELECT 
        user_id, 
        experience_level, 
        is_profile_complete,
        created_at, 
        updated_at
       FROM candidate_profiles WHERE user_id = $1`,
      [userId],
    );

    if (profileData.length === 0) return null;

    const row = profileData[0];
    
    // Return ReadModel with ONLY real database columns
    return {
      userId: row.user_id,
      experienceLevel: row.experience_level,
      isProfileComplete: row.is_profile_complete,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByUserIdWithUser(userId: string): Promise<CandidateProfileWithUser | null> {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    // Flatten profile and user data
    return {
      ...profile,
      fullName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      language: user.language,
    } as CandidateProfileWithUser;
  }

  async searchBySkills(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CandidateSearchResult>> {
    const hasSkillIds = filters.skillIds && filters.skillIds.length > 0;

    let candidateIds: string[];
    let total: number;

    if (hasSkillIds) {
      // MODE 1: Search by specific skills (original logic)
      const result = await this.searchBySpecificSkills(filters, page, limit);
      candidateIds = result.candidateIds;
      total = result.total;
    } else {
      // MODE 2: Search all candidates with filters
      const result = await this.searchAllCandidates(filters, page, limit);
      candidateIds = result.candidateIds;
      total = result.total;
    }

    if (candidateIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    // Load candidate data
    const data = await this.loadCandidateData(candidateIds);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * MODE 1: Search candidates who have ALL specified skills
   */
  private async searchBySpecificSkills(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<{ candidateIds: string[]; total: number }> {
    const params: any[] = [filters.skillIds];
    const conditions: string[] = ['cs.skill_id = ANY($1::uuid[])'];
    let paramIndex = 2;

    // minProficiency: "not less than" using CASE
    if (filters.minProficiency) {
      const minLevel = PROFICIENCY_LEVELS.indexOf(filters.minProficiency);
      if (minLevel >= 0) {
        conditions.push(`
          CASE cs.proficiency_level
            WHEN 'beginner' THEN 0
            WHEN 'intermediate' THEN 1
            WHEN 'advanced' THEN 2
            WHEN 'expert' THEN 3
            ELSE 0
          END >= $${paramIndex}
        `);
        params.push(minLevel);
        paramIndex++;
      }
    }

    if (filters.minYears !== undefined && filters.minYears !== null) {
      conditions.push(`cs.years_of_experience >= $${paramIndex}`);
      params.push(filters.minYears);
      paramIndex++;
    }

    // experienceLevel: exact match
    if (filters.experienceLevel) {
      conditions.push(`
        cs.candidate_id IN (
          SELECT user_id FROM candidate_profiles 
          WHERE experience_level = $${paramIndex}
        )
      `);
      params.push(filters.experienceLevel);
      paramIndex++;
    }

    const skillCountParam = paramIndex++;
    const limitParam = paramIndex++;
    const offsetParam = paramIndex++;

    params.push(filters.skillIds!.length);
    params.push(limit);
    params.push((page - 1) * limit);

    // Get matching candidates
    const results = await this.dataSource.query(
      `
      SELECT cs.candidate_id
      FROM candidate_skills cs
      WHERE ${conditions.join(' AND ')}
      GROUP BY cs.candidate_id
      HAVING COUNT(DISTINCT cs.skill_id) = $${skillCountParam}
      LIMIT $${limitParam} OFFSET $${offsetParam}
      `,
      params,
    );

    // Count total
    const countParams = params.slice(0, -2); // Remove limit/offset
    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total FROM (
        SELECT cs.candidate_id
        FROM candidate_skills cs
        WHERE ${conditions.join(' AND ')}
        GROUP BY cs.candidate_id
        HAVING COUNT(DISTINCT cs.skill_id) = $${skillCountParam}
      ) sub
      `,
      countParams,
    );

    return {
      candidateIds: results.map((r: { candidate_id: string; skill_id?: string; skill_name?: string; count?: string }) => r.candidate_id),
      total: parseInt(countResult[0]?.total || '0', 10),
    };
  }

  /**
   * MODE 2: Search all candidates with optional filters (no skillIds required)
   */
  private async searchAllCandidates(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<{ candidateIds: string[]; total: number }> {
    const params: any[] = [];
    const conditions: string[] = ["u.role = 'candidate'"];
    let paramIndex = 1;

    // experienceLevel: exact match
    if (filters.experienceLevel) {
      conditions.push(`cp.experience_level = $${paramIndex}`);
      params.push(filters.experienceLevel);
      paramIndex++;
    }

    // minYears: has at least 1 skill with >= N years
    if (filters.minYears !== undefined && filters.minYears !== null) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM candidate_skills cs 
          WHERE cs.candidate_id = u.id 
            AND cs.years_of_experience >= $${paramIndex}
        )
      `);
      params.push(filters.minYears);
      paramIndex++;
    }

    // minProficiency: has at least 1 skill with level >= specified
    if (filters.minProficiency) {
      const minLevel = PROFICIENCY_LEVELS.indexOf(filters.minProficiency);
      if (minLevel >= 0) {
        conditions.push(`
          EXISTS (
            SELECT 1 FROM candidate_skills cs 
            WHERE cs.candidate_id = u.id 
              AND CASE cs.proficiency_level
                    WHEN 'beginner' THEN 0
                    WHEN 'intermediate' THEN 1
                    WHEN 'advanced' THEN 2
                    WHEN 'expert' THEN 3
                    ELSE 0
                  END >= $${paramIndex}
          )
        `);
        params.push(minLevel);
        paramIndex++;
      }
    }

    const limitParam = paramIndex++;
    const offsetParam = paramIndex++;
    params.push(limit);
    params.push((page - 1) * limit);

    // Get candidates
    const results = await this.dataSource.query(
      `
      SELECT u.id as candidate_id, u.created_at
      FROM users u
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY u.id, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
      `,
      params,
    );

    // Count total
    const countParams = params.slice(0, -2); // Remove limit/offset
    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      `,
      countParams,
    );

    return {
      candidateIds: results.map((r: { candidate_id: string; skill_id?: string; skill_name?: string; count?: string }) => r.candidate_id),
      total: parseInt(countResult[0]?.total || '0', 10),
    };
  }

  /**
   * Load full candidate data by IDs
   */
  private async loadCandidateData(candidateIds: string[]): Promise<CandidateSearchResult[]> {
    const candidates = await this.userRepository.find({
      where: { id: In(candidateIds) },
    });

    const data = await Promise.all(
      candidates.map(async candidate => {
        const profile = await this.findByUserId(candidate.id);
        
        // Get ALL skills of the candidate
        const skillEntities = await this.skillRepository.find({
          where: { candidateId: candidate.id },
          relations: ['skill'],
        });

        const matchedSkills = skillEntities.map(s => ({
          skillId: s.skillId,
          skillName: s.skill?.name || '',
          proficiencyLevel: s.proficiencyLevel || 'intermediate',
          yearsOfExperience: s.yearsOfExperience || null,
        }));

        return {
          userId: candidate.id,
          fullName: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          avatarUrl: candidate.avatarUrl,
          experienceLevel: profile?.experienceLevel || null,
          matchScore: skillEntities.reduce((score, s) => 
            score + (s.yearsOfExperience || 0), 0),
          matchedSkills: matchedSkills,
        };
      }),
    );

    // Sort by match score
    data.sort((a, b) => b.matchScore - a.matchScore);

    return data;
  }

  async getCandidateSkillsGroupedByCategory(userId: string): Promise<SkillsByCategoryReadModel[]> {
    const skillEntities = await this.skillRepository.find({
      where: { candidateId: userId },
      relations: ['skill', 'skill.category'],
      order: { createdAt: 'ASC' },
    });

    const grouped = new Map<string, SkillsByCategoryReadModel>();

    for (const entity of skillEntities) {
      const categoryId = entity.skill?.categoryId || null;
      const categoryName = entity.skill?.category?.name || null;
      const categorySlug = entity.skill?.category?.slug || null;
      const key = categoryId || 'uncategorized';

      if (!grouped.has(key)) {
        grouped.set(key, {
          categoryId,
          categoryName,
          categorySlug,
          skills: [],
        });
      }

      // Build CandidateSkillReadModel directly from entity
      const skillReadModel: CandidateSkillReadModel = {
        id: entity.id,
        userId: entity.candidateId,
        skillId: entity.skillId,
        skillName: entity.skill?.name || '',
        skillSlug: entity.skill?.slug || '',
        categoryId,
        categoryName,
        description: entity.description,
        proficiencyLevel: entity.proficiencyLevel,
        yearsOfExperience: entity.yearsOfExperience,
        lastUsedAt: null, // Not in current schema
        endorsementsCount: 0, // Not in current schema
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };

      grouped.get(key)!.skills.push(skillReadModel);
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

    return results.map((r: { candidate_id: string; skill_id?: string; skill_name?: string; count?: string }) => ({
      skillId: r.skill_id,
      skillName: r.skill_name,
      count: parseInt(r.count),
    }));
  }
}
