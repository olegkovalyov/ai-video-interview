import { v4 as uuidv4 } from 'uuid';
import { SkillCategoryMapper } from '../skill-category.mapper';
import { SkillCategory } from '../../../../domain/entities/skill-category.entity';
import { SkillCategoryEntity } from '../../entities/skill-category.entity';

describe('SkillCategoryMapper', () => {
  let mapper: SkillCategoryMapper;

  beforeEach(() => {
    mapper = new SkillCategoryMapper();
  });

  const createCategoryEntity = (overrides: Partial<SkillCategoryEntity> = {}): SkillCategoryEntity => {
    const entity = new SkillCategoryEntity();
    entity.id = uuidv4();
    entity.name = 'Programming Languages';
    entity.slug = 'programming-languages';
    entity.description = 'Skills related to programming languages';
    entity.sortOrder = 1;
    entity.createdAt = new Date('2025-01-20T07:00:00Z');
    entity.updatedAt = new Date('2025-04-10T15:00:00Z');
    Object.assign(entity, overrides);
    return entity;
  };

  const createCategoryDomain = (overrides: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}): SkillCategory => {
    return SkillCategory.reconstitute(
      overrides.id ?? uuidv4(),
      overrides.name ?? 'Programming Languages',
      overrides.slug ?? 'programming-languages',
      overrides.description !== undefined ? overrides.description : 'Skills related to programming languages',
      overrides.sortOrder ?? 1,
      overrides.createdAt ?? new Date('2025-01-20T07:00:00Z'),
      overrides.updatedAt ?? new Date('2025-04-10T15:00:00Z'),
    );
  };

  describe('toEntity()', () => {
    it('should map SkillCategory to SkillCategoryEntity with all fields', () => {
      const id = uuidv4();
      const createdAt = new Date('2025-01-20T07:00:00Z');
      const updatedAt = new Date('2025-04-10T15:00:00Z');

      const category = createCategoryDomain({
        id,
        name: 'Frameworks',
        slug: 'frameworks',
        description: 'Web and backend frameworks',
        sortOrder: 3,
        createdAt,
        updatedAt,
      });

      const entity = mapper.toEntity(category);

      expect(entity).toBeInstanceOf(SkillCategoryEntity);
      expect(entity.id).toBe(id);
      expect(entity.name).toBe('Frameworks');
      expect(entity.slug).toBe('frameworks');
      expect(entity.description).toBe('Web and backend frameworks');
      expect(entity.sortOrder).toBe(3);
      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
    });

    it('should handle null description', () => {
      const category = createCategoryDomain({ description: null });

      const entity = mapper.toEntity(category);

      expect(entity.description).toBeNull();
    });

    it('should map sortOrder of zero', () => {
      const category = createCategoryDomain({ sortOrder: 0 });

      const entity = mapper.toEntity(category);

      expect(entity.sortOrder).toBe(0);
    });
  });

  describe('toDomain()', () => {
    it('should map SkillCategoryEntity to SkillCategory domain model', () => {
      const id = uuidv4();
      const entity = createCategoryEntity({ id });

      const category = mapper.toDomain(entity);

      expect(category.id).toBe(id);
      expect(category.name).toBe('Programming Languages');
      expect(category.slug).toBe('programming-languages');
      expect(category.description).toBe('Skills related to programming languages');
      expect(category.sortOrder).toBe(1);
      expect(category.createdAt).toEqual(new Date('2025-01-20T07:00:00Z'));
      expect(category.updatedAt).toEqual(new Date('2025-04-10T15:00:00Z'));
    });

    it('should handle null description in entity', () => {
      const entity = createCategoryEntity({ description: null });

      const category = mapper.toDomain(entity);

      expect(category.description).toBeNull();
    });

    it('should handle high sortOrder values', () => {
      const entity = createCategoryEntity({ sortOrder: 999 });

      const category = mapper.toDomain(entity);

      expect(category.sortOrder).toBe(999);
    });
  });

  describe('toDomainList()', () => {
    it('should map array of entities to domain models', () => {
      const entities = [
        createCategoryEntity({ name: 'Languages', slug: 'languages', sortOrder: 1 }),
        createCategoryEntity({ name: 'Frameworks', slug: 'frameworks', sortOrder: 2 }),
        createCategoryEntity({ name: 'Databases', slug: 'databases', sortOrder: 3 }),
      ];

      const categories = mapper.toDomainList(entities);

      expect(categories).toHaveLength(3);
      expect(categories[0].name).toBe('Languages');
      expect(categories[0].sortOrder).toBe(1);
      expect(categories[1].name).toBe('Frameworks');
      expect(categories[1].sortOrder).toBe(2);
      expect(categories[2].name).toBe('Databases');
      expect(categories[2].sortOrder).toBe(3);
    });

    it('should return empty array for empty input', () => {
      const categories = mapper.toDomainList([]);
      expect(categories).toHaveLength(0);
    });
  });

  describe('round-trip', () => {
    it('should preserve all values through toDomain(toEntity(category))', () => {
      const id = uuidv4();
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-03-01T00:00:00Z');

      const original = SkillCategory.reconstitute(
        id,
        'DevOps',
        'devops',
        'Infrastructure and deployment tools',
        5,
        createdAt,
        updatedAt,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.slug).toBe(original.slug);
      expect(restored.description).toBe(original.description);
      expect(restored.sortOrder).toBe(original.sortOrder);
      expect(restored.createdAt).toEqual(original.createdAt);
      expect(restored.updatedAt).toEqual(original.updatedAt);
    });

    it('should preserve null description through round-trip', () => {
      const original = createCategoryDomain({ description: null });

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.description).toBeNull();
    });
  });
});
