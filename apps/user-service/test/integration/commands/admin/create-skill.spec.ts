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

      const command = new CreateSkillCommand(
        'Elixir',
        'elixir',
        categoryId,
        'Elixir is a functional programming language',
      );

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
      expect(skills[0].description).toBe('Elixir is a functional programming language');
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

      const command = new CreateSkillCommand(
        'Phoenix',
        'phoenix',
        categoryId,
        null,
      );

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
      const command = new CreateSkillCommand(
        'Custom Skill',
        'custom-skill',
        null,
        'A skill without category',
      );

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
      const command = new CreateSkillCommand(
        'Ember.js',
        'emberjs',
        null,
        null,
      );

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
      const command = new CreateSkillCommand(
        'JavaScript ES6',
        'javascript', // This slug already exists in seed data
        null,
        null,
      );

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow(
        'Skill with slug "javascript" already exists'
      );
    });

    it('should throw error when category does not exist', async () => {
      // Arrange
      const nonExistentCategoryId = uuidv4();
      const command = new CreateSkillCommand(
        'Elixir Test',
        'elixir-test',
        nonExistentCategoryId,
        null,
      );

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

      const command1 = new CreateSkillCommand('Haskell', 'haskell', categoryId, null);
      const command2 = new CreateSkillCommand('Scala', 'scala', categoryId, null);
      const command3 = new CreateSkillCommand('F#', 'fsharp', categoryId, null);

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
