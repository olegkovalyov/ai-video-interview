import { INestApplication } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../../setup';
import { CreateSkillCommand } from '../../../../src/application/commands/admin/create-skill/create-skill.command';
import { AddCandidateSkillCommand } from '../../../../src/application/commands/candidate/add-candidate-skill/add-candidate-skill.command';
import { GetCandidateProfileQuery } from '../../../../src/application/queries/candidate/get-candidate-profile.query';

describe('GetCandidateProfileQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
    commandBus = app.get(CommandBus);
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
    it('should get candidate profile by user ID', async () => {
      // Arrange - Create candidate
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, 'mid'],
      );

      // Act
      const query = new GetCandidateProfileQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(candidateId);
      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('candidate@test.com');
      expect(result.experienceLevel).toBe('mid');
      expect(result.isProfileComplete).toBe(false);
    });

    it('should get profile with skills', async () => {
      // Arrange - Create candidate with skills
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, 'senior'],
      );

      // Create skills
      const adminId = uuidv4();
      const skill1Command = new CreateSkillCommand('Node.js Test', 'nodejs-test', null, null, adminId);
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      const skill2Command = new CreateSkillCommand('React Test', 'react-test', null, null, adminId);
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      // Add skills to candidate
      await commandBus.execute(new AddCandidateSkillCommand(
        candidateId,
        skill1Id,
        'Backend development',
        'advanced',
        5,
      ));

      await commandBus.execute(new AddCandidateSkillCommand(
        candidateId,
        skill2Id,
        'Frontend development',
        'intermediate',
        3,
      ));

      // Act
      const query = new GetCandidateProfileQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.userId).toBe(candidateId);
      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('candidate@test.com');
      expect(result.experienceLevel).toBe('senior');
      // Note: Skills are fetched separately via getCandidateSkillsGroupedByCategory query
    });

    it('should get profile with user info', async () => {
      // Arrange
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, 'senior'],
      );

      // Act
      const query = new GetCandidateProfileQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert - Verify profile with user info
      expect(result.userId).toBe(candidateId);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('candidate@test.com');
      expect(result.experienceLevel).toBe('senior');
    });

    it('should get profile without skills', async () => {
      // Arrange - Candidate without skills
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, 'junior'],
      );

      // Act
      const query = new GetCandidateProfileQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.userId).toBe(candidateId);
      expect(result.experienceLevel).toBe('junior');
      // Note: Skills are managed separately
    });

    it('should get profile with minimal data', async () => {
      // Arrange - Profile with only required fields
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id) VALUES ($1)',
        [candidateId],
      );

      // Act
      const query = new GetCandidateProfileQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert - Optional fields should be null or undefined
      expect(result.userId).toBe(candidateId);
      expect(result.experienceLevel).toBeNull();
      expect(result.isProfileComplete).toBe(false);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const adminId = uuidv4();

      // Act - Admin trying to view non-existent profile
      const query = new GetCandidateProfileQuery(nonExistentId, adminId, false, true);

      // Assert
      await expect(queryBus.execute(query)).rejects.toThrow('not found');
    });

    it('should throw error when user is not a candidate', async () => {
      // Arrange - Create HR user (not candidate)
      const hrId = await seedUser(dataSource, {
        email: 'hr@test.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });

      await dataSource.query(
        'INSERT INTO hr_profiles (user_id) VALUES ($1)',
        [hrId],
      );

      // Act - Admin trying to view HR profile as candidate
      const adminId = uuidv4();
      const query = new GetCandidateProfileQuery(hrId, adminId, false, true);

      // Assert
      await expect(queryBus.execute(query)).rejects.toThrow();
    });

    it('should throw error when accessing other candidate profile without permission', async () => {
      // Arrange - Two candidates
      const candidate1Id = await seedUser(dataSource, {
        email: 'candidate1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });

      const candidate2Id = await seedUser(dataSource, {
        email: 'candidate2@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id) VALUES ($1), ($2)',
        [candidate1Id, candidate2Id],
      );

      // Act - Candidate1 trying to view Candidate2 profile
      const query = new GetCandidateProfileQuery(candidate2Id, candidate1Id);

      // Assert
      await expect(queryBus.execute(query)).rejects.toThrow('permission');
    });
  });
});
