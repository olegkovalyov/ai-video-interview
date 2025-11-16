import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../../setup';
import { CreateSkillCommand } from '../../../../src/application/commands/admin/create-skill/create-skill.command';
import { UpdateSkillCommand } from '../../../../src/application/commands/admin/update-skill/update-skill.command';

describe('UpdateSkillCommand Integration', () => {
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
    it('should update skill name', async () => {
      // Arrange - Create skill
      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Original Name',
        'original-slug',
        null,
        'Original description',
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Update name
      const updateAdminId = uuidv4();
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'Updated Name',
        'Original description',
        null,
        updateAdminId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Updated Name');
      expect(skills[0].slug).toBe('original-slug'); // Slug doesn't change
    });

    it('should update skill description', async () => {
      // Arrange
      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-slug',
        null,
        'Old description',
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act
      const updateAdminId = uuidv4();
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'Test Skill',
        'New description',
        null,
        adminId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );

      expect(skills[0].description).toBe('New description');
    });

    it('should update skill category', async () => {
      // Arrange
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['programming-languages'],
      );
      const categoryId = categories[0].id;

      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Add category
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'Test Skill',
        null,
        categoryId,
        adminId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );

      expect(skills[0].category_id).toBe(categoryId);
    });

    it('should remove category (set to null)', async () => {
      // Arrange
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['programming-languages'],
      );
      const categoryId = categories[0].id;

      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        categoryId,
        'Test description',
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Remove category
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'Test Skill',
        'Test description',
        null,
        adminId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );

      expect(skills[0].category_id).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['databases'],
      );
      const categoryId = categories[0].id;

      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Old Name',
        'old-slug',
        null,
        'Old description',
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Update everything
      const updateAdminId = uuidv4();
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'New Name',
        'New description',
        categoryId,
        updateAdminId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );

      expect(skills[0].name).toBe('New Name');
      expect(skills[0].slug).toBe('old-slug'); // Slug never changes
      expect(skills[0].category_id).toBe(categoryId);
      expect(skills[0].description).toBe('New description');
    });

    it('should set description to null', async () => {
      // Arrange
      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        'Some description',
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Remove description
      const updateAdminId = uuidv4();
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'Test Skill',
        null,
        null,
        adminId,
      );
      await commandBus.execute(updateCommand);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [skillId],
      );

      expect(skills[0].description).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should throw error when skill not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const adminId = uuidv4();
      const updateCommand = new UpdateSkillCommand(
        nonExistentId,
        'Updated Name',
        'Updated description',
        null,
        adminId,
      );

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });

    it('should throw error when category not found', async () => {
      // Arrange
      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
        adminId,
      );
      const { skillId } = await commandBus.execute(createCommand);

      const nonExistentCategoryId = uuidv4();
      const updateCommand = new UpdateSkillCommand(
        skillId,
        'Test Skill',
        null,
        nonExistentCategoryId,
        adminId,
      );

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });

    it('should throw error when updating to duplicate name', async () => {
      // Arrange - Create two skills
      const adminId = uuidv4();
      const command1 = new CreateSkillCommand('Skill 1', 'skill-1', null, null, adminId);
      await commandBus.execute(command1);

      const command2 = new CreateSkillCommand('Skill 2', 'skill-2', null, null, adminId);
      const { skillId: skill2Id } = await commandBus.execute(command2);

      // Act - Try to update skill2 to have same name as skill1
      const updateCommand = new UpdateSkillCommand(
        skill2Id,
        'Skill 1', // This name already exists
        'Updated description',
        null,
        adminId,
      );

      // Assert - Should fail due to unique constraint on name
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });
  });
});
