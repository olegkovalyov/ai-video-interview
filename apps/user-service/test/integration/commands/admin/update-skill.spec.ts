import type { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { setupTestApp, createTestDataSource, cleanDatabase } from '../../setup';
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
      const createCommand = new CreateSkillCommand({
        name: 'Original Name',
        slug: 'original-slug',
        categoryId: null,
        description: 'Original description',
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Update name
      const updateAdminId = uuidv4();
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'Updated Name',
        description: 'Original description',
        categoryId: null,
        adminId: updateAdminId,
      });
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
      const createCommand = new CreateSkillCommand({
        name: 'Test Skill',
        slug: 'test-slug',
        categoryId: null,
        description: 'Old description',
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      // Act
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'Test Skill',
        description: 'New description',
        categoryId: null,
        adminId,
      });
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
      const createCommand = new CreateSkillCommand({
        name: 'Test Skill',
        slug: 'test-skill',
        categoryId: null,
        description: null,
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Add category
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'Test Skill',
        description: null,
        categoryId,
        adminId,
      });
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
      const createCommand = new CreateSkillCommand({
        name: 'Test Skill',
        slug: 'test-skill',
        categoryId,
        description: 'Test description',
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Remove category
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'Test Skill',
        description: 'Test description',
        categoryId: null,
        adminId,
      });
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
      const createCommand = new CreateSkillCommand({
        name: 'Old Name',
        slug: 'old-slug',
        categoryId: null,
        description: 'Old description',
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Update everything
      const updateAdminId = uuidv4();
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'New Name',
        description: 'New description',
        categoryId,
        adminId: updateAdminId,
      });
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
      const createCommand = new CreateSkillCommand({
        name: 'Test Skill',
        slug: 'test-skill',
        categoryId: null,
        description: 'Some description',
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      // Act - Remove description
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'Test Skill',
        description: null,
        categoryId: null,
        adminId,
      });
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
      const updateCommand = new UpdateSkillCommand({
        skillId: nonExistentId,
        name: 'Updated Name',
        description: 'Updated description',
        categoryId: null,
        adminId,
      });

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });

    it('should throw error when category not found', async () => {
      // Arrange
      const adminId = uuidv4();
      const createCommand = new CreateSkillCommand({
        name: 'Test Skill',
        slug: 'test-skill',
        categoryId: null,
        description: null,
        adminId,
      });
      const { skillId } = await commandBus.execute(createCommand);

      const nonExistentCategoryId = uuidv4();
      const updateCommand = new UpdateSkillCommand({
        skillId,
        name: 'Test Skill',
        description: null,
        categoryId: nonExistentCategoryId,
        adminId,
      });

      // Act & Assert
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });

    it('should throw error when updating to duplicate name', async () => {
      // Arrange - Create two skills
      const adminId = uuidv4();
      const command1 = new CreateSkillCommand({
        name: 'Skill 1',
        slug: 'skill-1',
        categoryId: null,
        description: null,
        adminId,
      });
      await commandBus.execute(command1);

      const command2 = new CreateSkillCommand({
        name: 'Skill 2',
        slug: 'skill-2',
        categoryId: null,
        description: null,
        adminId,
      });
      const { skillId: skill2Id } = await commandBus.execute(command2);

      // Act - Try to update skill2 to have same name as skill1
      const updateCommand = new UpdateSkillCommand({
        skillId: skill2Id,
        name: 'Skill 1', // This name already exists
        description: 'Updated description',
        categoryId: null,
        adminId,
      });

      // Assert - Should fail due to unique constraint on name
      await expect(commandBus.execute(updateCommand)).rejects.toThrow();
    });
  });
});
