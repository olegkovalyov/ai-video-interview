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
import { UpdateCandidateSkillCommand } from '../../../../src/application/commands/candidate/update-candidate-skill/update-candidate-skill.command';

describe('UpdateCandidateSkillCommand Integration', () => {
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
    it('should update skill description', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Preact', 'preact-update-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Old description',
        'intermediate',
        3,
      );
      await commandBus.execute(addCommand);

      // Act - Update description
      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        'New description',
        'intermediate',
        3,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2',
        [candidateId, skillId],
      );

      expect(skills.length).toBe(1);
      expect(skills[0].description).toBe('New description');
    });

    it('should update proficiency level', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Aurelia', 'aurelia-update-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Frontend framework',
        'beginner',
        1,
      );
      await commandBus.execute(addCommand);

      // Act - Update proficiency from beginner to advanced
      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        'Frontend framework',
        'advanced',
        1,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT proficiency_level FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );

      expect(skills[0].proficiency_level).toBe('advanced');
    });

    it('should update years of experience', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Backbone', 'backbone-update-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Framework',
        'intermediate',
        2,
      );
      await commandBus.execute(addCommand);

      // Act - Update years from 2 to 5
      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        'Framework',
        'intermediate',
        5,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT years_of_experience FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );

      expect(skills[0].years_of_experience).toBe(5);
    });

    it('should update all fields at once', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Bun', 'bun-update-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Old description',
        'beginner',
        1,
      );
      await commandBus.execute(addCommand);

      // Act - Update everything
      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        'New comprehensive description',
        'expert',
        10,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );

      expect(skills[0].description).toBe('New comprehensive description');
      expect(skills[0].proficiency_level).toBe('expert');
      expect(skills[0].years_of_experience).toBe(10);
    });

    it('should set description to null', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Zig', 'zig-update-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Some description',
        'intermediate',
        3,
      );
      await commandBus.execute(addCommand);

      // Act - Remove description
      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        null,
        'intermediate',
        3,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT description FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );

      expect(skills[0].description).toBeNull();
    });

    it('should set proficiency and years to null', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Nim', 'nim-update-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const addCommand = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Description',
        'advanced',
        5,
      );
      await commandBus.execute(addCommand);

      // Act - Set proficiency and years to null
      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        'Description',
        null,
        null,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );

      expect(skills[0].proficiency_level).toBeNull();
      expect(skills[0].years_of_experience).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should throw error when candidate not found', async () => {
      // Arrange
      const nonExistentCandidateId = uuidv4();
      const skillId = uuidv4();

      const updateCommand = new UpdateCandidateSkillCommand(
        nonExistentCandidateId,
        skillId,
        'Description',
        'intermediate',
        3,
      );

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
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
      const createSkillCommand = new CreateSkillCommand('Skill', 'skill-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const updateCommand = new UpdateCandidateSkillCommand(
        candidateId,
        skillId,
        'Description',
        'intermediate',
        3,
      );

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });
  });
});
