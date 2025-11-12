import { INestApplication } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../../setup';
import { CreateSkillCommand } from '../../../../src/application/commands/admin/create-skill/create-skill.command';
import { DeactivateSkillCommand } from '../../../../src/application/commands/admin/deactivate-skill/deactivate-skill.command';
import { GetSkillQuery } from '../../../../src/application/queries/skills/get-skill/get-skill.query';

describe('GetSkillQuery Integration', () => {
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
    it('should get skill by ID with category info', async () => {
      // Arrange - Get a seeded skill (JavaScript)
      const skills = await dataSource.query(
        "SELECT id FROM skills WHERE slug = 'javascript'",
      );
      const skillId = skills[0].id;

      // Act
      const query = new GetSkillQuery(skillId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.skill).toBeDefined();
      expect(result.skill._id).toBe(skillId);
      expect(result.skill._name).toBe('JavaScript');
      expect(result.skill._slug).toBe('javascript');
      expect(result.skill._isActive).toBe(true);
      expect(result.category).toBeDefined();
      expect(result.category._name).toBe('Programming Languages');
    });

    it('should get skill without category', async () => {
      // Arrange - Create skill without category
      const createCommand = new CreateSkillCommand(
        'Standalone Skill Test',
        'standalone-skill-test',
        null,
        'A skill without category',
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act
      const query = new GetSkillQuery(skillId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.skill).toBeDefined();
      expect(result.skill._id).toBe(skillId);
      expect(result.skill._name).toBe('Standalone Skill Test');
      expect(result.skill._categoryId).toBeNull();
      expect(result.category).toBeNull();
    });

    it('should get inactive skill', async () => {
      // Arrange - Create and deactivate skill
      const createCommand = new CreateSkillCommand(
        'Inactive Skill Test',
        'inactive-skill-test',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);
      
      await commandBus.execute(new DeactivateSkillCommand(skillId, uuidv4()));

      // Act
      const query = new GetSkillQuery(skillId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.skill).toBeDefined();
      expect(result.skill._id).toBe(skillId);
      expect(result.skill._isActive).toBe(false);
    });

    it('should get skill with all metadata', async () => {
      // Arrange - Create skill with full data
      const categories = await dataSource.query(
        "SELECT id FROM skill_categories WHERE slug = 'programming-languages'",
      );
      const categoryId = categories[0].id;

      const createCommand = new CreateSkillCommand(
        'Full Metadata Skill',
        'full-metadata-skill-test',
        categoryId,
        'Complete skill description',
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act
      const query = new GetSkillQuery(skillId);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.skill._id).toBe(skillId);
      expect(result.skill._name).toBe('Full Metadata Skill');
      expect(result.skill._slug).toBe('full-metadata-skill-test');
      expect(result.skill._description).toBe('Complete skill description');
      expect(result.skill._categoryId).toBe(categoryId);
      expect(result.skill._isActive).toBe(true);
      expect(result.category).toBeDefined();
      expect(result.category._id).toBe(categoryId);
      expect(result.skill).toHaveProperty('_createdAt');
      expect(result.skill).toHaveProperty('_updatedAt');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when skill not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();

      // Act
      const query = new GetSkillQuery(nonExistentId);

      // Assert
      await expect(queryBus.execute(query)).rejects.toThrow('not found');
    });
  });
});
