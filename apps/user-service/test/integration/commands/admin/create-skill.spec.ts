import type { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { setupTestApp, createTestDataSource, cleanDatabase } from '../../setup';
import { CreateSkillCommand } from '../../../../src/application/commands/admin/create-skill/create-skill.command';

describe('CreateSkillCommand Integration', () => {
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
    it('should create skill with valid data', async () => {
      // Arrange
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['programming-languages'],
      );
      const categoryId = categories[0].id;

      const adminId = uuidv4();
      const command = new CreateSkillCommand({
        name: 'Elixir',
        slug: 'elixir',
        categoryId,
        description: 'Elixir is a functional programming language',
        adminId,
      });

      // Act
      const result = await commandBus.execute(command);

      // Assert - Command result
      expect(result.skillId).toBeDefined();
      expect(typeof result.skillId).toBe('string');

      // Assert - Database
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE slug = $1',
        ['elixir'],
      );

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Elixir');
      expect(skills[0].slug).toBe('elixir');
      expect(skills[0].category_id).toBe(categoryId);
      expect(skills[0].description).toBe(
        'Elixir is a functional programming language',
      );
      expect(skills[0].is_active).toBe(true);
      expect(skills[0].created_at).toBeDefined();
      expect(skills[0].updated_at).toBeDefined();
    });

    it('should create skill without description', async () => {
      // Arrange
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['backend-frameworks'],
      );
      const categoryId = categories[0].id;

      const adminId = uuidv4();
      const command = new CreateSkillCommand({
        name: 'Phoenix',
        slug: 'phoenix',
        categoryId,
        description: null,
        adminId,
      });

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [result.skillId],
      );

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Phoenix');
      expect(skills[0].description).toBeNull();
      expect(skills[0].is_active).toBe(true);
    });

    it('should create skill without category', async () => {
      // Arrange
      const adminId = uuidv4();
      const command = new CreateSkillCommand({
        name: 'Custom Skill',
        slug: 'custom-skill',
        categoryId: null,
        description: 'A skill without category',
        adminId,
      });

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const skills = await dataSource.query(
        'SELECT * FROM skills WHERE id = $1',
        [result.skillId],
      );

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Custom Skill');
      expect(skills[0].category_id).toBeNull();
    });

    it('should create skill with is_active = true by default', async () => {
      // Arrange
      const adminId = uuidv4();
      const command = new CreateSkillCommand({
        name: 'Ember.js',
        slug: 'emberjs',
        categoryId: null,
        description: null,
        adminId,
      });

      // Act
      const result = await commandBus.execute(command);

      // Assert
      const skills = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [result.skillId],
      );

      expect(skills[0].is_active).toBe(true);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when slug already exists', async () => {
      // Arrange - Use seeded skill slug (JavaScript already exists in seed data)
      const adminId = uuidv4();
      const command = new CreateSkillCommand({
        name: 'JavaScript ES6',
        slug: 'javascript', // This slug already exists in seed data
        categoryId: null,
        description: null,
        adminId,
      });

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        'Skill with slug "javascript" already exists',
      );
    });

    it('should throw error when category does not exist', async () => {
      // Arrange
      const nonExistentCategoryId = uuidv4();
      const adminId = uuidv4();
      const command = new CreateSkillCommand({
        name: 'Elixir Test',
        slug: 'elixir-test',
        categoryId: nonExistentCategoryId,
        description: null,
        adminId,
      });

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });

  describe('Multiple Skills', () => {
    it('should create multiple skills in sequence', async () => {
      // Arrange
      const categories = await dataSource.query(
        'SELECT id FROM skill_categories WHERE slug = $1',
        ['programming-languages'],
      );
      const categoryId = categories[0].id;

      const adminId = uuidv4();
      const command1 = new CreateSkillCommand({
        name: 'Haskell',
        slug: 'haskell',
        categoryId,
        description: null,
        adminId,
      });
      const command2 = new CreateSkillCommand({
        name: 'Scala',
        slug: 'scala',
        categoryId,
        description: null,
        adminId,
      });
      const command3 = new CreateSkillCommand({
        name: 'F#',
        slug: 'fsharp',
        categoryId,
        description: null,
        adminId,
      });

      // Act
      await commandBus.execute(command1);
      await commandBus.execute(command2);
      await commandBus.execute(command3);

      // Assert
      const ourSkills = await dataSource.query(
        'SELECT * FROM skills WHERE slug = ANY($1) ORDER BY name',
        [['fsharp', 'haskell', 'scala']],
      );

      expect(ourSkills.length).toBe(3);
      expect(ourSkills[0].name).toBe('F#');
      expect(ourSkills[1].name).toBe('Haskell');
      expect(ourSkills[2].name).toBe('Scala');
    });
  });
});
