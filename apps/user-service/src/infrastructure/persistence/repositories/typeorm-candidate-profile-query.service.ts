import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import {
  ICandidateProfileQueryService,
  CandidateSearchFilters,
  CandidateSearchResult,
  PaginatedResult,
  CandidateProfileWithUser,
} from '../../../domain/repositories/candidate-profile-query-service.interface';
import type {
  CandidateProfileReadModel,
  CandidateSkillReadModel,
  SkillsByCategoryReadModel,
} from '../../../domain/read-models/candidate-profile.read-model';
import { CandidateSkillEntity } from '../entities/candidate-skill.entity';
import { UserEntity } from '../entities/user.entity';
import { SkillEntity } from '../entities/skill.entity';
import { CandidateSkillMapper } from '../mappers/candidate-skill.mapper';

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

interface CandidateProfileRow {
  user_id: string;
  experience_level: string | null;
  is_profile_complete: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CandidateIdRow {
  candidate_id: string;
}

interface CountRow {
  total: string;
}

interface TopSkillRow {
  skill_id: string;
  skill_name: string;
  count: string;
}

interface SqlClauses {
  conditions: string[];
  params: unknown[];
  paramIndex: number;
}

interface SpecificSkillsBindings {
  skillCountParam: number;
  limitParam: number;
  offsetParam: number;
}

interface AllCandidatesBindings {
  limitParam: number;
  offsetParam: number;
}

@Injectable()
export class TypeOrmCandidateProfileQueryService
  implements ICandidateProfileQueryService
{
  // CQRS read-side service: legitimately composes multiple TypeORM repos and
  // a mapper to produce denormalized projections. Not subject to the
  // SRP-by-method-count rule that targets write-side aggregate gateways.
  // eslint-disable-next-line max-params
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

  async findByUserId(
    userId: string,
  ): Promise<CandidateProfileReadModel | null> {
    const profileData = await this.dataSource.query<CandidateProfileRow[]>(
      `SELECT
        user_id,
        experience_level,
        is_profile_complete,
        created_at,
        updated_at
       FROM candidate_profiles WHERE user_id = $1`,
      [userId],
    );

    const row = profileData[0];
    if (!row) return null;

    return {
      userId: row.user_id,
      experienceLevel: row.experience_level,
      isProfileComplete: row.is_profile_complete,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByUserIdWithUser(
    userId: string,
  ): Promise<CandidateProfileWithUser | null> {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

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
    const { candidateIds, total } = hasSkillIds
      ? await this.searchBySpecificSkills(filters, page, limit)
      : await this.searchAllCandidates(filters, page, limit);

    if (candidateIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

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
   * MODE 1: Search candidates who have ALL specified skills.
   */
  private async searchBySpecificSkills(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<{ candidateIds: string[]; total: number }> {
    const clauses: SqlClauses = {
      conditions: ['cs.skill_id = ANY($1::uuid[])'],
      params: [filters.skillIds],
      paramIndex: 2,
    };
    this.appendSpecificSkillFilters(clauses, filters);
    const bindings = this.bindSpecificSkillsPagination(
      clauses,
      filters.skillIds?.length ?? 0,
      page,
      limit,
    );
    const whereSql = clauses.conditions.join(' AND ');
    const candidateIds = await this.fetchSpecificSkillCandidateIds(
      whereSql,
      bindings,
      clauses.params,
    );
    const total = await this.countSpecificSkillCandidates(
      whereSql,
      bindings.skillCountParam,
      clauses.params.slice(0, -2),
    );
    return { candidateIds, total };
  }

  private bindSpecificSkillsPagination(
    clauses: SqlClauses,
    skillCount: number,
    page: number,
    limit: number,
  ): SpecificSkillsBindings {
    const skillCountParam = clauses.paramIndex++;
    const limitParam = clauses.paramIndex++;
    const offsetParam = clauses.paramIndex++;
    clauses.params.push(skillCount, limit, (page - 1) * limit);
    return { skillCountParam, limitParam, offsetParam };
  }

  private appendSpecificSkillFilters(
    clauses: SqlClauses,
    filters: CandidateSearchFilters,
  ): void {
    if (filters.minProficiency) {
      this.appendProficiencyClause(
        clauses,
        filters.minProficiency,
        TypeOrmCandidateProfileQueryService.SQL_CASE_PROFICIENCY,
      );
    }
    if (filters.minYears != null) {
      clauses.conditions.push(
        `cs.years_of_experience >= $${clauses.paramIndex++}`,
      );
      clauses.params.push(filters.minYears);
    }
    if (filters.experienceLevel) {
      clauses.conditions.push(
        `cs.candidate_id IN (SELECT user_id FROM candidate_profiles WHERE experience_level = $${clauses.paramIndex++})`,
      );
      clauses.params.push(filters.experienceLevel);
    }
  }

  private async fetchSpecificSkillCandidateIds(
    whereSql: string,
    bindings: SpecificSkillsBindings,
    params: unknown[],
  ): Promise<string[]> {
    const rows = await this.dataSource.query<CandidateIdRow[]>(
      `
      SELECT cs.candidate_id
      FROM candidate_skills cs
      WHERE ${whereSql}
      GROUP BY cs.candidate_id
      HAVING COUNT(DISTINCT cs.skill_id) = $${bindings.skillCountParam}
      LIMIT $${bindings.limitParam} OFFSET $${bindings.offsetParam}
      `,
      params,
    );
    return rows.map((r) => r.candidate_id);
  }

  private async countSpecificSkillCandidates(
    whereSql: string,
    skillCountParam: number,
    params: unknown[],
  ): Promise<number> {
    const result = await this.dataSource.query<CountRow[]>(
      `
      SELECT COUNT(*) as total FROM (
        SELECT cs.candidate_id
        FROM candidate_skills cs
        WHERE ${whereSql}
        GROUP BY cs.candidate_id
        HAVING COUNT(DISTINCT cs.skill_id) = $${skillCountParam}
      ) sub
      `,
      params,
    );
    return Number.parseInt(result[0]?.total ?? '0', 10);
  }

  /**
   * MODE 2: Search all candidates with optional filters (no skillIds required).
   */
  private async searchAllCandidates(
    filters: CandidateSearchFilters,
    page: number,
    limit: number,
  ): Promise<{ candidateIds: string[]; total: number }> {
    const clauses: SqlClauses = {
      conditions: ["u.role = 'candidate'"],
      params: [],
      paramIndex: 1,
    };
    this.appendAllCandidatesFilters(clauses, filters);
    const bindings = this.bindAllCandidatesPagination(clauses, page, limit);
    const whereSql = clauses.conditions.join(' AND ');
    const candidateIds = await this.fetchAllCandidateIds(
      whereSql,
      bindings,
      clauses.params,
    );
    const total = await this.countAllCandidates(
      whereSql,
      clauses.params.slice(0, -2),
    );
    return { candidateIds, total };
  }

  private bindAllCandidatesPagination(
    clauses: SqlClauses,
    page: number,
    limit: number,
  ): AllCandidatesBindings {
    const limitParam = clauses.paramIndex++;
    const offsetParam = clauses.paramIndex++;
    clauses.params.push(limit, (page - 1) * limit);
    return { limitParam, offsetParam };
  }

  private appendAllCandidatesFilters(
    clauses: SqlClauses,
    filters: CandidateSearchFilters,
  ): void {
    if (filters.experienceLevel) {
      clauses.conditions.push(`cp.experience_level = $${clauses.paramIndex++}`);
      clauses.params.push(filters.experienceLevel);
    }
    if (filters.minYears != null) {
      clauses.conditions.push(
        `EXISTS (SELECT 1 FROM candidate_skills cs WHERE cs.candidate_id = u.id AND cs.years_of_experience >= $${clauses.paramIndex++})`,
      );
      clauses.params.push(filters.minYears);
    }
    if (filters.minProficiency) {
      this.appendProficiencyClause(
        clauses,
        filters.minProficiency,
        TypeOrmCandidateProfileQueryService.SQL_EXISTS_PROFICIENCY,
      );
    }
  }

  private async fetchAllCandidateIds(
    whereSql: string,
    bindings: AllCandidatesBindings,
    params: unknown[],
  ): Promise<string[]> {
    const rows = await this.dataSource.query<CandidateIdRow[]>(
      `
      SELECT u.id as candidate_id, u.created_at
      FROM users u
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE ${whereSql}
      GROUP BY u.id, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${bindings.limitParam} OFFSET $${bindings.offsetParam}
      `,
      params,
    );
    return rows.map((r) => r.candidate_id);
  }

  private async countAllCandidates(
    whereSql: string,
    params: unknown[],
  ): Promise<number> {
    const result = await this.dataSource.query<CountRow[]>(
      `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE ${whereSql}
      `,
      params,
    );
    return Number.parseInt(result[0]?.total ?? '0', 10);
  }

  private appendProficiencyClause(
    clauses: SqlClauses,
    minProficiency: string,
    template: (paramIndex: number) => string,
  ): void {
    const minLevel = PROFICIENCY_LEVELS.indexOf(minProficiency);
    if (minLevel === -1) return;
    clauses.conditions.push(template(clauses.paramIndex++));
    clauses.params.push(minLevel);
  }

  private static readonly SQL_CASE_PROFICIENCY = (paramIndex: number): string =>
    `
      CASE cs.proficiency_level
        WHEN 'beginner' THEN 0
        WHEN 'intermediate' THEN 1
        WHEN 'advanced' THEN 2
        WHEN 'expert' THEN 3
        ELSE 0
      END >= $${paramIndex}
    `;

  private static readonly SQL_EXISTS_PROFICIENCY = (
    paramIndex: number,
  ): string =>
    `
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
    `;

  /**
   * Load full candidate data by IDs.
   */
  private async loadCandidateData(
    candidateIds: string[],
  ): Promise<CandidateSearchResult[]> {
    const candidates = await this.userRepository.find({
      where: { id: In(candidateIds) },
    });
    const data = await Promise.all(
      candidates.map((candidate) => this.toSearchResult(candidate)),
    );
    data.sort((a, b) => b.matchScore - a.matchScore);
    return data;
  }

  private async toSearchResult(
    candidate: UserEntity,
  ): Promise<CandidateSearchResult> {
    const profile = await this.findByUserId(candidate.id);
    const skillEntities = await this.skillRepository.find({
      where: { candidateId: candidate.id },
      relations: ['skill'],
    });
    return {
      userId: candidate.id,
      fullName: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      avatarUrl: candidate.avatarUrl,
      experienceLevel: profile?.experienceLevel || null,
      matchScore: skillEntities.reduce(
        (score, s) => score + (s.yearsOfExperience || 0),
        0,
      ),
      matchedSkills: skillEntities.map((s) => ({
        skillId: s.skillId,
        skillName: s.skill?.name || '',
        proficiencyLevel: s.proficiencyLevel || 'intermediate',
        yearsOfExperience: s.yearsOfExperience || null,
      })),
    };
  }

  async getCandidateSkillsGroupedByCategory(
    userId: string,
  ): Promise<SkillsByCategoryReadModel[]> {
    const skillEntities = await this.skillRepository.find({
      where: { candidateId: userId },
      relations: ['skill', 'skill.category'],
      order: { createdAt: 'ASC' },
    });

    const grouped = new Map<string, SkillsByCategoryReadModel>();
    for (const entity of skillEntities) {
      const group = TypeOrmCandidateProfileQueryService.resolveCategoryGroup(
        grouped,
        entity,
      );
      group.skills.push(
        TypeOrmCandidateProfileQueryService.toCandidateSkillReadModel(
          entity,
          group,
        ),
      );
    }
    return [...grouped.values()];
  }

  private static resolveCategoryGroup(
    grouped: Map<string, SkillsByCategoryReadModel>,
    entity: CandidateSkillEntity,
  ): SkillsByCategoryReadModel {
    const category =
      TypeOrmCandidateProfileQueryService.extractCategory(entity);
    const key = category.categoryId ?? 'uncategorized';
    const existing = grouped.get(key);
    if (existing) return existing;
    const fresh: SkillsByCategoryReadModel = { ...category, skills: [] };
    grouped.set(key, fresh);
    return fresh;
  }

  private static extractCategory(entity: CandidateSkillEntity): {
    categoryId: string | null;
    categoryName: string | null;
    categorySlug: string | null;
  } {
    const cat = entity.skill?.category;
    return {
      categoryId: entity.skill?.categoryId ?? null,
      categoryName: cat?.name ?? null,
      categorySlug: cat?.slug ?? null,
    };
  }

  private static toCandidateSkillReadModel(
    entity: CandidateSkillEntity,
    group: SkillsByCategoryReadModel,
  ): CandidateSkillReadModel {
    return {
      id: entity.id,
      userId: entity.candidateId,
      skillId: entity.skillId,
      skillName: entity.skill?.name || '',
      skillSlug: entity.skill?.slug || '',
      categoryId: group.categoryId,
      categoryName: group.categoryName,
      description: entity.description,
      proficiencyLevel: entity.proficiencyLevel,
      yearsOfExperience: entity.yearsOfExperience,
      lastUsedAt: null,
      endorsementsCount: 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async countBySkill(skillId: string): Promise<number> {
    return this.skillRepository.count({ where: { skillId } });
  }

  async getTopSkills(limit: number): Promise<
    {
      skillId: string;
      skillName: string;
      count: number;
    }[]
  > {
    const results = await this.dataSource.query<TopSkillRow[]>(
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

    return results.map((r) => ({
      skillId: r.skill_id,
      skillName: r.skill_name,
      count: Number.parseInt(r.count ?? '0', 10),
    }));
  }
}
