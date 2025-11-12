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
import { ListSkillsQuery } from '../../../../src/application/queries/skills/list-skills/list-skills.query';

describe('ListSkillsQuery Integration', () => {
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
    it('should list all skills including seeded ones', async () => {
      // Act - Query all skills
      const query = new ListSkillsQuery(1, 100, undefined, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert - Should have seeded skills (52 skills from migration)
      expect(result.data.length).toBeGreaterThan(50);
      expect(result.total).toBeGreaterThan(50);
      
      // Verify structure
      const skill = result.data[0];
      expect(skill).toHaveProperty('_id');
      expect(skill).toHaveProperty('_name');
      expect(skill).toHaveProperty('_slug');
      expect(skill).toHaveProperty('_isActive');
      expect(skill).toHaveProperty('category');
      expect(skill).toHaveProperty('categoryName');
    });

    it('should filter skills by category', async () => {
      // Arrange - Get programming-languages category
      const categories = await dataSource.query(
        "SELECT id FROM skill_categories WHERE slug = 'programming-languages'",
      );
      const categoryId = categories[0].id;

      // Act - Query skills in this category
      const query = new ListSkillsQuery(1, 100, categoryId, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert - All skills should be from this category
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((skill: any) => {
        expect(skill._categoryId).toBe(categoryId);
      });
    });

    it('should filter by active status', async () => {
      // Arrange - Create and deactivate a skill
      const createCommand = new CreateSkillCommand(
        'Test Inactive Skill',
        'test-inactive-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);
      
      await commandBus.execute(new DeactivateSkillCommand(skillId, uuidv4()));

      // Act - Query only active skills
      const activeQuery = new ListSkillsQuery(1, 100, undefined, true, undefined);
      const activeResult = await queryBus.execute(activeQuery);

      // Assert - Should not contain inactive skill
      const hasInactive = activeResult.data.some((s: any) => s._id === skillId);
      expect(hasInactive).toBe(false);

      // Act - Query only inactive skills
      const inactiveQuery = new ListSkillsQuery(1, 100, undefined, false, undefined);
      const inactiveResult = await queryBus.execute(inactiveQuery);

      // Assert - Should contain our inactive skill
      const foundInactive = inactiveResult.data.find((s: any) => s._id === skillId);
      expect(foundInactive).toBeDefined();
      expect(foundInactive._isActive).toBe(false);
    });

    it('should search skills by name', async () => {
      // Arrange - Create skills with specific names
      await commandBus.execute(new CreateSkillCommand('TypeScript Pro', 'typescript-pro', null, null));
      await commandBus.execute(new CreateSkillCommand('JavaScript Advanced', 'javascript-advanced', null, null));
      await commandBus.execute(new CreateSkillCommand('Python Expert', 'python-expert', null, null));

      // Act - Search for "Script"
      const query = new ListSkillsQuery(1, 100, undefined, undefined, 'Script');
      const result = await queryBus.execute(query);

      // Assert - Should find TypeScript and JavaScript
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      const names = result.data.map((s: any) => s._name);
      expect(names.some((n: string) => n.includes('TypeScript'))).toBe(true);
      expect(names.some((n: string) => n.includes('JavaScript'))).toBe(true);
    });

    it('should paginate results', async () => {
      // Act - Get first page (limit 5)
      const page1Query = new ListSkillsQuery(1, 5, undefined, undefined, undefined);
      const page1 = await queryBus.execute(page1Query);

      // Assert page 1
      expect(page1.data.length).toBe(5);
      expect(page1.total).toBeGreaterThan(5);

      // Act - Get second page (page 2, limit 5)
      const page2Query = new ListSkillsQuery(2, 5, undefined, undefined, undefined);
      const page2 = await queryBus.execute(page2Query);

      // Assert page 2
      expect(page2.data.length).toBe(5);
      expect(page2.total).toBe(page1.total); // Same total

      // Assert pages are different
      const page1Ids = page1.data.map((s: any) => s._id);
      const page2Ids = page2.data.map((s: any) => s._id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection.length).toBe(0); // No overlap
    });

    it('should combine multiple filters', async () => {
      // Arrange - Get programming-languages category
      const categories = await dataSource.query(
        "SELECT id FROM skill_categories WHERE slug = 'programming-languages'",
      );
      const categoryId = categories[0].id;

      // Act - Category + Active + Search
      const query = new ListSkillsQuery(1, 100, categoryId, true, 'Java');
      const result = await queryBus.execute(query);

      // Assert - All results match all filters
      result.data.forEach((skill: any) => {
        expect(skill._categoryId).toBe(categoryId);
        expect(skill._isActive).toBe(true);
        expect(skill._name.toLowerCase()).toContain('java');
      });
    });

    it('should return empty array when no skills match', async () => {
      // Act - Search for non-existent skill
      const query = new ListSkillsQuery(1, 100, undefined, undefined, 'NonExistentSkillXYZ123');
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return skills with category information', async () => {
      // Act
      const query = new ListSkillsQuery(1, 10, undefined, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert - Skills should have category info
      const skillWithCategory = result.data.find((s: any) => s._categoryId !== null);
      expect(skillWithCategory).toBeDefined();
      expect(skillWithCategory).toHaveProperty('_categoryId');
      expect(skillWithCategory).toHaveProperty('categoryName');
      expect(skillWithCategory.categoryName).toBeTruthy();
    });

    it('should handle large offset gracefully', async () => {
      // Act - Offset beyond total
      const query = new ListSkillsQuery(1000, 10, undefined, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert - Empty result but valid response
      expect(result.data).toEqual([]);
      expect(result.total).toBeGreaterThan(0); // Total still reflects actual count
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined filters as "no filter"', async () => {
      // Act - All filters undefined
      const query = new ListSkillsQuery(1, 100, undefined, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert - Returns all skills
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent category', async () => {
      // Act
      const nonExistentCategoryId = uuidv4();
      const query = new ListSkillsQuery(1, 100, nonExistentCategoryId, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle zero limit', async () => {
      // Act
      const query = new ListSkillsQuery(1, 0, undefined, undefined, undefined);
      const result = await queryBus.execute(query);

      // Assert - No skills but total is correct
      expect(result.data).toEqual([]);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should be case-insensitive for search', async () => {
      // Arrange
      await commandBus.execute(new CreateSkillCommand('CamelCase Skill', 'camelcase-skill', null, null));

      // Act - Search lowercase
      const lowerQuery = new ListSkillsQuery(1, 100, undefined, undefined, 'camelcase');
      const lowerResult = await queryBus.execute(lowerQuery);

      // Act - Search uppercase
      const upperQuery = new ListSkillsQuery(1, 100, undefined, undefined, 'CAMELCASE');
      const upperResult = await queryBus.execute(upperQuery);

      // Assert - Both find the skill
      expect(lowerResult.data.length).toBeGreaterThan(0);
      expect(upperResult.data.length).toBeGreaterThan(0);
      expect(lowerResult.total).toBe(upperResult.total);
    });
  });
});
