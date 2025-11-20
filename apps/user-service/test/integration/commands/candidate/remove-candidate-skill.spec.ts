import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
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
import { RemoveCandidateSkillCommand } from '../../../../src/application/commands/candidate/remove-candidate-skill/remove-candidate-skill.command';

describe('RemoveCandidateSkillCommand Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
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
    it('should remove skill from candidate profile', async () => {
      // Arrange - Create candidate, skill, and add skill
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      const createSkillCommand = new CreateSkillCommand('GraphQL', 'graphql-remove-test', null, null, uuidv4());
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'API query language',
        'intermediate',
        2,
      );
      await commandBus.execute(addCommand);

      // Verify skill exists
      const beforeRemove = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2',
        [candidateId, skillId],
      );
      expect(beforeRemove.length).toBe(1);

      // Act - Remove skill
      const removeCommand = new RemoveCandidateSkillCommand(candidateId, skillId);
      await commandBus.execute(removeCommand);

      // Assert - Skill removed
      const afterRemove = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2',
        [candidateId, skillId],
      );
      expect(afterRemove.length).toBe(0);
    });

    it('should remove multiple skills from same candidate', async () => {
      // Arrange - Create candidate and multiple skills
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      // Create 3 skills (unique names to avoid conflict with seed data)
      const skill1Command = new CreateSkillCommand('Redis Test Cache', 'redis-remove-test', null, null, uuidv4());
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      const skill2Command = new CreateSkillCommand('RabbitMQ Test Queue', 'rabbitmq-remove-test', null, null, uuidv4());
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      const skill3Command = new CreateSkillCommand('Kafka Test Stream', 'kafka-remove-test', null, null, uuidv4());
      const { skillId: skill3Id } = await commandBus.execute(skill3Command);

      // Add all 3 skills
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill1Id, 'Caching', 'intermediate', 2));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill2Id, 'Message queue', 'beginner', 1));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill3Id, 'Streaming', 'advanced', 3));

      // Verify all 3 exist
      const beforeRemove = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );
      expect(beforeRemove.length).toBe(3);

      // Act - Remove 2 skills
      await commandBus.execute(new RemoveCandidateSkillCommand(candidateId, skill1Id));
      await commandBus.execute(new RemoveCandidateSkillCommand(candidateId, skill3Id));

      // Assert - Only skill2 remains
      const afterRemove = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );
      expect(afterRemove.length).toBe(1);
      expect(afterRemove[0].skill_id).toBe(skill2Id);
    });

    it('should remove all skills from profile', async () => {
      // Arrange
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      // Create and add 2 skills
      const skill1Command = new CreateSkillCommand('Skill 1', 'skill-1-remove', null, null, uuidv4());
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      const skill2Command = new CreateSkillCommand('Skill 2', 'skill-2-remove', null, null, uuidv4());
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill1Id, null, 'beginner', 0));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill2Id, null, 'beginner', 0));

      // Act - Remove all skills
      await commandBus.execute(new RemoveCandidateSkillCommand(candidateId, skill1Id));
      await commandBus.execute(new RemoveCandidateSkillCommand(candidateId, skill2Id));

      // Assert - No skills remain
      const afterRemove = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );
      expect(afterRemove.length).toBe(0);
    });

    it('should remove skill with all metadata', async () => {
      // Arrange
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      const createSkillCommand = new CreateSkillCommand('Full Skill', 'full-skill-remove', null, null, uuidv4());
      const { skillId } = await commandBus.execute(createSkillCommand);

      // Add skill with full metadata
      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Detailed description with lots of metadata',
        'expert',
        10,
      );
      await commandBus.execute(addCommand);

      // Act - Remove
      const removeCommand = new RemoveCandidateSkillCommand(candidateId, skillId);
      await commandBus.execute(removeCommand);

      // Assert - Completely removed
      const afterRemove = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );
      expect(afterRemove.length).toBe(0);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when candidate not found', async () => {
      // Arrange
      const nonExistentCandidateId = uuidv4();
      const skillId = uuidv4();

      const removeCommand = new RemoveCandidateSkillCommand(nonExistentCandidateId, skillId);

      // Act & Assert
      await expect(commandBus.execute(removeCommand)).rejects.toThrow();
    });

    it('should throw error when skill not in profile', async () => {
      // Arrange - Create candidate but don't add skill
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      // Create skill but don't add to profile
      const createSkillCommand = new CreateSkillCommand('Unassigned Skill', 'unassigned-skill', null, null, uuidv4());
      const { skillId } = await commandBus.execute(createSkillCommand);

      const removeCommand = new RemoveCandidateSkillCommand(candidateId, skillId);

      // Act & Assert
      await expect(commandBus.execute(removeCommand)).rejects.toThrow();
    });

    it('should throw error when removing already removed skill', async () => {
      // Arrange - Add and remove skill
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      const createSkillCommand = new CreateSkillCommand('Temp Skill', 'temp-skill', null, null, uuidv4());
      const { skillId } = await commandBus.execute(createSkillCommand);

      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skillId, null, 'beginner', 0));
      await commandBus.execute(new RemoveCandidateSkillCommand(candidateId, skillId));

      // Act - Try to remove again
      const removeAgainCommand = new RemoveCandidateSkillCommand(candidateId, skillId);

      // Assert
      await expect(commandBus.execute(removeAgainCommand)).rejects.toThrow();
    });
  });
});
