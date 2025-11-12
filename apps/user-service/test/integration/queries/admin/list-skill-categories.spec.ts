import { INestApplication } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../../setup';
import { ListSkillCategoriesQuery } from '../../../../src/application/queries/skills/list-categories/list-categories.query';

describe('ListSkillCategoriesQuery Integration', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
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
    it('should list all skill categories', async () => {
      // Act
      const query = new ListSkillCategoriesQuery();
      const result = await queryBus.execute(query);

      // Assert - Should have 8 seeded categories
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(8);
    });

    it('should return categories sorted by sort_order', async () => {
      // Act
      const query = new ListSkillCategoriesQuery();
      const result = await queryBus.execute(query);

      // Assert - Categories should be sorted by sort_order
      expect(result[0]._name).toBe('Programming Languages');
      expect(result[0]._sortOrder).toBe(1);
      
      expect(result[1]._name).toBe('Frontend Frameworks');
      expect(result[1]._sortOrder).toBe(2);
      
      expect(result[2]._name).toBe('Backend Frameworks');
      expect(result[2]._sortOrder).toBe(3);
      
      expect(result[3]._name).toBe('Databases');
      expect(result[3]._sortOrder).toBe(4);
      
      expect(result[4]._name).toBe('DevOps & Cloud');
      expect(result[4]._sortOrder).toBe(5);
      
      expect(result[5]._name).toBe('Mobile Development');
      expect(result[5]._sortOrder).toBe(6);
      
      expect(result[6]._name).toBe('Testing & QA');
      expect(result[6]._sortOrder).toBe(7);
      
      expect(result[7]._name).toBe('Tools & IDEs');
      expect(result[7]._sortOrder).toBe(8);
    });

    it('should return categories with all metadata', async () => {
      // Act
      const query = new ListSkillCategoriesQuery();
      const result = await queryBus.execute(query);

      // Assert - Check first category structure
      const category = result[0];
      expect(category).toHaveProperty('_id');
      expect(category).toHaveProperty('_name');
      expect(category).toHaveProperty('_slug');
      expect(category).toHaveProperty('_description');
      expect(category).toHaveProperty('_sortOrder');
      expect(category).toHaveProperty('_createdAt');
      
      // Verify data
      expect(category._name).toBe('Programming Languages');
      expect(category._slug).toBe('programming-languages');
      expect(category._description).toBe('Core programming languages');
    });

    it('should return categories with correct slugs', async () => {
      // Act
      const query = new ListSkillCategoriesQuery();
      const result = await queryBus.execute(query);

      // Assert - Verify all slugs
      const slugs = result.map((c: any) => c._slug);
      expect(slugs).toEqual([
        'programming-languages',
        'frontend-frameworks',
        'backend-frameworks',
        'databases',
        'devops-cloud',
        'mobile-development',
        'testing-qa',
        'tools-ides',
      ]);
    });

    it('should return empty array if no categories exist', async () => {
      // Arrange - Delete all categories (edge case, shouldn't happen in production)
      await dataSource.query('DELETE FROM skill_categories');

      // Act
      const query = new ListSkillCategoriesQuery();
      const result = await queryBus.execute(query);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
