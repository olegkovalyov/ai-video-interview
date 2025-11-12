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

describe('AddCandidateSkillCommand Integration', () => {
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
    it('should add skill to candidate profile', async () => {
      // Arrange - Create candidate and skill
      const candidateId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'John',
        lastName: 'Candidate',
        role: 'candidate',
      });

      // Create candidate profile
      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [candidateId, null],
      );

      // Create skill
      const createSkillCommand = new CreateSkillCommand(
        'Elixir Lang',
        'elixir-lang-test',
        null,
        'Programming language',
      );
      const { skillId } = await commandBus.execute(createSkillCommand);

      // Act - Add skill
      const command = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Used in multiple projects',
        'intermediate',
        3,
      );
      await commandBus.execute(command);

      // Assert
      const candidateSkills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2',
        [candidateId, skillId],
      );

      expect(candidateSkills.length).toBe(1);
      expect(candidateSkills[0].candidate_id).toBe(candidateId);
      expect(candidateSkills[0].skill_id).toBe(skillId);
      expect(candidateSkills[0].proficiency_level).toBe('intermediate');
      expect(candidateSkills[0].years_of_experience).toBe(3);
      expect(candidateSkills[0].description).toBe('Used in multiple projects');
    });

    it('should add skill with all proficiency levels', async () => {
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

      const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
      const skillIds: string[] = [];

      // Create skills for each level
      for (let i = 0; i < levels.length; i++) {
        const createSkillCommand = new CreateSkillCommand(
          `Skill ${levels[i]}`,
          `skill-${levels[i]}`,
          null,
          null,
        );
        const { skillId } = await commandBus.execute(createSkillCommand);
        skillIds.push(skillId);
      }

      // Act - Add skills with different levels
      for (let i = 0; i < levels.length; i++) {
        const command = new AddCandidateSkillCommand(
          candidateId,
          skillIds[i],
          null,
          levels[i],
          i + 1,
        );
        await commandBus.execute(command);
      }

      // Assert
      const candidateSkills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1 ORDER BY years_of_experience',
        [candidateId],
      );

      expect(candidateSkills.length).toBe(4);
      candidateSkills.forEach((cs: any, index: number) => {
        expect(cs.proficiency_level).toBe(levels[index]);
        expect(cs.years_of_experience).toBe(index + 1);
      });
    });

    it('should add skill with minimal data', async () => {
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

      const createSkillCommand = new CreateSkillCommand(
        'Clojure',
        'clojure-test',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createSkillCommand);

      // Act - Add skill with nulls
      const command = new AddCandidateSkillCommand(
        candidateId,
        skillId,
        null,
        null,
        null,
      );
      await commandBus.execute(command);

      // Assert
      const candidateSkills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1',
        [candidateId],
      );

      expect(candidateSkills.length).toBe(1);
      expect(candidateSkills[0].proficiency_level).toBeNull();
      expect(candidateSkills[0].years_of_experience).toBeNull();
      expect(candidateSkills[0].description).toBeNull();
    });

    it('should add multiple skills to same candidate', async () => {
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

      // Create 3 skills
      const skill1Command = new CreateSkillCommand('Svelte Kit', 'svelte-kit-test', null, null);
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      const skill2Command = new CreateSkillCommand('Deno', 'deno-test', null, null);
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      const skill3Command = new CreateSkillCommand('CockroachDB', 'cockroachdb-test', null, null);
      const { skillId: skill3Id } = await commandBus.execute(skill3Command);

      // Act - Add all 3 skills
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill1Id, 'Frontend', 'advanced', 5));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill2Id, 'Backend', 'intermediate', 3));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill3Id, 'Database', 'intermediate', 2));

      // Assert
      const candidateSkills = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE candidate_id = $1 ORDER BY years_of_experience DESC',
        [candidateId],
      );

      expect(candidateSkills.length).toBe(3);
      expect(candidateSkills[0].years_of_experience).toBe(5);
      expect(candidateSkills[1].years_of_experience).toBe(3);
      expect(candidateSkills[2].years_of_experience).toBe(2);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when candidate not found', async () => {
      // Arrange
      const nonExistentCandidateId = uuidv4();
      
      const createSkillCommand = new CreateSkillCommand('Test Skill', 'test-skill', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      const command = new AddCandidateSkillCommand(
        nonExistentCandidateId,
        skillId,
        null,
        'intermediate',
        2,
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error when skill not found', async () => {
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

      const nonExistentSkillId = uuidv4();
      const command = new AddCandidateSkillCommand(
        candidateId,
        nonExistentSkillId,
        null,
        'intermediate',
        2,
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error when skill already added', async () => {
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

      const createSkillCommand = new CreateSkillCommand('Erlang', 'erlang-test', null, null);
      const { skillId } = await commandBus.execute(createSkillCommand);

      // Add skill first time
      const command1 = new AddCandidateSkillCommand(candidateId, skillId, null, 'beginner', 1);
      await commandBus.execute(command1);

      // Act - Try to add same skill again
      const command2 = new AddCandidateSkillCommand(candidateId, skillId, null, 'intermediate', 2);

      // Assert
      await expect(commandBus.execute(command2)).rejects.toThrow();
    });
  });
});
