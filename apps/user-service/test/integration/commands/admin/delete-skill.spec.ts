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
import { DeleteSkillCommand } from '../../../../src/application/commands/admin/delete-skill/delete-skill.command';

describe('DeleteSkillCommand Integration', () => {
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
    it('should delete existing skill', async () => {
      // Arrange - Create skill
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        'Test description',
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Verify skill exists
      const beforeDelete = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );
      expect(beforeDelete.length).toBe(1);

      // Act - Delete skill
      const adminId = uuidv4();
      const deleteCommand = new DeleteSkillCommand(skillId, adminId);
      await commandBus.execute(deleteCommand);

      // Assert - Skill removed
      const afterDelete = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );
      expect(afterDelete.length).toBe(0);
    });

    it('should delete skill with cascade to candidate_skills', async () => {
      // Arrange - Create skill and user
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);

      const userId = await seedUser(dataSource, {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      // Create candidate profile (required for candidate_skills FK)
      await dataSource.query(
        'INSERT INTO candidate_profiles (user_id, experience_level) VALUES ($1, $2)',
        [userId, null],
      );

      // Create candidate_skill association
      await dataSource.query(
        `INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level, years_of_experience, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, skillId, 'intermediate', 2, 'Test description'],
      );

      // Verify association exists
      const beforeDelete = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE skill_id = $1',
        [skillId],
      );
      expect(beforeDelete.length).toBe(1);

      // Act - Delete skill
      const adminId = uuidv4();
      const deleteCommand = new DeleteSkillCommand(skillId, adminId);
      await commandBus.execute(deleteCommand);

      // Assert - Skill removed
      const skillsAfterDelete = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );
      expect(skillsAfterDelete.length).toBe(0);

      // Assert - Candidate skills also removed (cascade)
      const candidateSkillsAfterDelete = await dataSource.query(
        'SELECT * FROM candidate_skills WHERE skill_id = $1',
        [skillId],
      );
      expect(candidateSkillsAfterDelete.length).toBe(0);
    });

    it('should delete skill from specific category', async () => {
      // Arrange - Get category and create skill in it
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['programming-languages'],
      );
      const categoryId = categories[0].id;

      const createCommand = new CreateSkillCommand(
        'Test Language',
        'test-language',
        categoryId,
        'A test programming language',
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Delete skill
      const adminId = uuidv4();
      const deleteCommand = new DeleteSkillCommand(skillId, adminId);
      await commandBus.execute(deleteCommand);

      // Assert - Skill removed
      const afterDelete = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );
      expect(afterDelete.length).toBe(0);
    });

    it('should delete multiple skills in sequence', async () => {
      // Arrange - Create 3 skills
      const command1 = new CreateSkillCommand('Skill 1', 'skill-1', null, null);
      const { skillId: id1 } = await commandBus.execute(command1);

      const command2 = new CreateSkillCommand('Skill 2', 'skill-2', null, null);
      const { skillId: id2 } = await commandBus.execute(command2);

      const command3 = new CreateSkillCommand('Skill 3', 'skill-3', null, null);
      const { skillId: id3 } = await commandBus.execute(command3);

      // Act - Delete all 3
      const adminId = uuidv4();
      await commandBus.execute(new DeleteSkillCommand(id1, adminId));
      await commandBus.execute(new DeleteSkillCommand(id2, adminId));
      await commandBus.execute(new DeleteSkillCommand(id3, adminId));

      // Assert - All removed
      const remaining = await dataSource.query(
        'SELECT * FROM skills WHERE id = ANY($1)',
        [[id1, id2, id3]],
      );
      expect(remaining.length).toBe(0);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when skill not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const adminId = uuidv4();
      const deleteCommand = new DeleteSkillCommand(nonExistentId, adminId);

      // Act & Assert
      await expect(commandBus.execute(deleteCommand)).rejects.toThrow();
    });

    it('should throw error when deleting already deleted skill', async () => {
      // Arrange - Create and delete skill
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);

      const adminId = uuidv4();
      const deleteCommand = new DeleteSkillCommand(skillId, adminId);
      await commandBus.execute(deleteCommand);

      // Act - Try to delete again
      const deleteAgainCommand = new DeleteSkillCommand(skillId, adminId);

      // Assert
      await expect(commandBus.execute(deleteAgainCommand)).rejects.toThrow();
    });
  });
});
