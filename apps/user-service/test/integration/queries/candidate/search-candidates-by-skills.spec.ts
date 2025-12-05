import { INestApplication } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../../setup';
import { SearchCandidatesBySkillsQuery } from '../../../../src/application/queries/candidate/search-candidates-by-skills.query';

describe('SearchCandidatesBySkillsQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;
  let skillId1: string;
  let skillId2: string;
  let candidateId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
  });

  beforeEach(async () => {
    // Create test skills with unique slugs
    skillId1 = uuidv4();
    skillId2 = uuidv4();
    const uniqueSuffix = uuidv4().slice(0, 8);

    await dataSource.query(
      `INSERT INTO skills (id, name, slug, is_active) VALUES ($1, $2, $3, $4)`,
      [skillId1, `TypeScript-${uniqueSuffix}`, `typescript-${uniqueSuffix}`, true],
    );
    await dataSource.query(
      `INSERT INTO skills (id, name, slug, is_active) VALUES ($1, $2, $3, $4)`,
      [skillId2, `React-${uniqueSuffix}`, `react-${uniqueSuffix}`, true],
    );

    // Create candidate with profile
    candidateId = await seedUser(dataSource, {
      email: 'candidate@test.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'candidate',
    });

    await dataSource.query(
      'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
      [candidateId, 'mid'],
    );

    // Add skills to candidate
    await dataSource.query(
      `INSERT INTO candidate_skills (id, candidate_id, skill_id, proficiency_level, years_of_experience)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), candidateId, skillId1, 'advanced', 3],
    );
    await dataSource.query(
      `INSERT INTO candidate_skills (id, candidate_id, skill_id, proficiency_level, years_of_experience)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), candidateId, skillId2, 'intermediate', 2],
    );
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Success Cases', () => {
    it('should search candidates by single skill', async () => {
      // Act
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        undefined,
        undefined,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].userId).toBe(candidateId);
      expect(result.total).toBe(1);
    });

    it('should search candidates by multiple skills', async () => {
      // Act
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1, skillId2],
        undefined,
        undefined,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].userId).toBe(candidateId);
    });

    it('should filter by minimum proficiency (not less than)', async () => {
      // Candidate has TypeScript at 'advanced' level
      // Act - search for intermediate or higher (should find)
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        'intermediate', // advanced >= intermediate ✓
        undefined,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
    });

    it('should exclude candidates below minimum proficiency', async () => {
      // Candidate has React at 'intermediate' level
      // Act - search for expert level (should NOT find)
      const query = new SearchCandidatesBySkillsQuery(
        [skillId2],
        'expert', // intermediate < expert ✗
        undefined,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert - no results because intermediate < expert
      expect(result.data).toHaveLength(0);
    });

    it('should filter by experienceLevel (exact match)', async () => {
      // Candidate profile has experience_level = 'mid'
      // Act - search for 'mid' experience level
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        undefined,
        undefined,
        'mid',
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].experienceLevel).toBe('mid');
    });

    it('should return empty when experienceLevel does not match', async () => {
      // Candidate profile has experience_level = 'mid'
      // Act - search for 'senior' experience level
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        undefined,
        undefined,
        'senior',
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert - no results because mid != senior
      expect(result.data).toHaveLength(0);
    });

    it('should filter by minimum years of experience', async () => {
      // Act - search for 2+ years (should find candidate)
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        undefined,
        2,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
    });

    it('should return empty when no candidates match criteria', async () => {
      // Act - search for 10+ years (no one has that)
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        undefined,
        10,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return empty when skillIds is empty', async () => {
      // Act
      const query = new SearchCandidatesBySkillsQuery(
        [],
        undefined,
        undefined,
        undefined,
        1,
        20,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toHaveLength(0);
    });

    it('should support pagination', async () => {
      // Act
      const query = new SearchCandidatesBySkillsQuery(
        [skillId1],
        undefined,
        undefined,
        undefined,
        1,
        10,
      );
      const result = await queryBus.execute(query);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
