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
import { GetCandidateSkillsQuery } from '../../../../src/application/queries/candidate/get-candidate-skills.query';

describe('GetCandidateSkillsQuery Integration', () => {
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
    it('should list skills for candidate', async () => {
      // Arrange - Create candidate with skills
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

      // Create skills
      const skill1Command = new CreateSkillCommand('Node.js Test', 'nodejs-test', null, null);
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      const skill2Command = new CreateSkillCommand('React Test', 'react-test', null, null);
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      const skill3Command = new CreateSkillCommand('TypeScript Test', 'typescript-test', null, null);
      const { skillId: skill3Id } = await commandBus.execute(skill3Command);

      // Add skills
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

      await commandBus.execute(new AddCandidateSkillCommand(
        candidateId,
        skill3Id,
        'Type-safe development',
        'expert',
        7,
      ));

      // Act
      const query = new GetCandidateSkillsQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert - Returns grouped by category
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Get all skills from all categories
      const allSkills = result.flatMap(group => group.skills);
      expect(allSkills.length).toBe(3);
      
      // Verify skill structure
      const skill = allSkills[0];
      expect(skill).toHaveProperty('_skillId');
      expect(skill).toHaveProperty('_description');
      expect(skill).toHaveProperty('_proficiencyLevel');
      expect(skill).toHaveProperty('_yearsOfExperience');
    });

    it('should list skills with full metadata including skill info', async () => {
      // Arrange
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

      // Create skill with category
      const skillCommand = new CreateSkillCommand(
        'Vue.js Test',
        'vuejs-test',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(skillCommand);

      // Add skill with details
      await commandBus.execute(new AddCandidateSkillCommand(
        candidateId,
        skillId,
        'Building SPAs with Vue.js and Vuex',
        'advanced',
        4,
      ));

      // Act
      const query = new GetCandidateSkillsQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert
      const allSkills = result.flatMap(group => group.skills);
      expect(allSkills.length).toBe(1);
      const candidateSkill = allSkills[0];
      
      expect(candidateSkill._skillId).toBe(skillId);
      expect(candidateSkill._description).toBe('Building SPAs with Vue.js and Vuex');
      expect(candidateSkill._proficiencyLevel?._value).toBe('advanced');
      expect(candidateSkill._yearsOfExperience?._value).toBe(4);
    });

    it('should list skills with different proficiency levels', async () => {
      // Arrange
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

      // Create multiple skills with different proficiency
      const skill1Command = new CreateSkillCommand('Skill Expert Test', 'skill-expert-test', null, null);
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      const skill2Command = new CreateSkillCommand('Skill Beginner Test', 'skill-beginner-test', null, null);
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      const skill3Command = new CreateSkillCommand('Skill Advanced Test', 'skill-advanced-test', null, null);
      const { skillId: skill3Id } = await commandBus.execute(skill3Command);

      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill1Id, null, 'expert', 10));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill2Id, null, 'beginner', 1));
      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill3Id, null, 'advanced', 5));

      // Act
      const query = new GetCandidateSkillsQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert - Should return all 3 skills
      const allSkills = result.flatMap(group => group.skills);
      expect(allSkills.length).toBe(3);
      
      const proficiencies = allSkills.map(s => s._proficiencyLevel?._value);
      expect(proficiencies).toContain('beginner');
      expect(proficiencies).toContain('advanced');
      expect(proficiencies).toContain('expert');
    });

    it('should return empty array for candidate without skills', async () => {
      // Arrange - Candidate without skills
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
      const query = new GetCandidateSkillsQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should list multiple skills', async () => {
      // Arrange
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

      // Create and add skills with delay
      const skill1Command = new CreateSkillCommand('First Skill Test', 'first-skill-test', null, null);
      const { skillId: skill1Id } = await commandBus.execute(skill1Command);

      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill1Id, 'First', 'beginner', 1));

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));

      const skill2Command = new CreateSkillCommand('Second Skill Test', 'second-skill-test', null, null);
      const { skillId: skill2Id } = await commandBus.execute(skill2Command);

      await commandBus.execute(new AddCandidateSkillCommand(candidateId, skill2Id, 'Second', 'intermediate', 2));

      // Act
      const query = new GetCandidateSkillsQuery(candidateId, candidateId);
      const result = await queryBus.execute(query);

      // Assert - Should return 2 skills
      const allSkills = result.flatMap(group => group.skills);
      expect(allSkills.length).toBe(2);
    });
  });

  describe('Error Cases', () => {
    it('should return empty array when user not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const adminId = uuidv4();

      // Act
      const query = new GetCandidateSkillsQuery(nonExistentId, adminId, false, true);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when accessing other candidate skills without permission', async () => {
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

      // Add skill to candidate2
      const skillCommand = new CreateSkillCommand('Private Skill Test', 'private-skill-test', null, null);
      const { skillId } = await commandBus.execute(skillCommand);
      await commandBus.execute(new AddCandidateSkillCommand(candidate2Id, skillId, null, 'intermediate', 3));

      // Act - Candidate1 trying to view Candidate2 skills
      const query = new GetCandidateSkillsQuery(candidate2Id, candidate1Id);

      // Assert
      await expect(queryBus.execute(query)).rejects.toThrow('permission');
    });
  });
});
