import { v4 as uuidv4 } from 'uuid';
import { SkillMapper } from '../skill.mapper';
import { Skill } from '../../../../domain/entities/skill.entity';
import { SkillEntity } from '../../entities/skill.entity';

describe('SkillMapper', () => {
  let mapper: SkillMapper;

  beforeEach(() => {
    mapper = new SkillMapper();
  });

  const createSkillEntity = (overrides: Partial<SkillEntity> = {}): SkillEntity => {
    const entity = new SkillEntity();
    entity.id = uuidv4();
    entity.name = 'TypeScript';
    entity.slug = 'typescript';
    entity.categoryId = uuidv4();
    entity.description = 'A typed superset of JavaScript';
    entity.isActive = true;
    entity.createdAt = new Date('2025-02-10T08:00:00Z');
    entity.updatedAt = new Date('2025-05-20T11:00:00Z');
    Object.assign(entity, overrides);
    return entity;
  };

  const createSkillDomain = (overrides: {
    id?: string;
    name?: string;
    slug?: string;
    categoryId?: string | null;
    description?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}): Skill => {
    return Skill.reconstitute(
      overrides.id ?? uuidv4(),
      overrides.name ?? 'TypeScript',
      overrides.slug ?? 'typescript',
      overrides.categoryId !== undefined ? overrides.categoryId : uuidv4(),
      overrides.description !== undefined ? overrides.description : 'A typed superset of JavaScript',
      overrides.isActive ?? true,
      overrides.createdAt ?? new Date('2025-02-10T08:00:00Z'),
      overrides.updatedAt ?? new Date('2025-05-20T11:00:00Z'),
    );
  };

  describe('toEntity()', () => {
    it('should map Skill to SkillEntity with all fields', () => {
      const id = uuidv4();
      const categoryId = uuidv4();
      const createdAt = new Date('2025-02-10T08:00:00Z');
      const updatedAt = new Date('2025-05-20T11:00:00Z');

      const skill = createSkillDomain({
        id,
        name: 'React',
        slug: 'react',
        categoryId,
        description: 'A JavaScript library for building UIs',
        isActive: true,
        createdAt,
        updatedAt,
      });

      const entity = mapper.toEntity(skill);

      expect(entity).toBeInstanceOf(SkillEntity);
      expect(entity.id).toBe(id);
      expect(entity.name).toBe('React');
      expect(entity.slug).toBe('react');
      expect(entity.categoryId).toBe(categoryId);
      expect(entity.description).toBe('A JavaScript library for building UIs');
      expect(entity.isActive).toBe(true);
      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
    });

    it('should handle null categoryId', () => {
      const skill = createSkillDomain({ categoryId: null });

      const entity = mapper.toEntity(skill);

      expect(entity.categoryId).toBeNull();
    });

    it('should handle null description', () => {
      const skill = createSkillDomain({ description: null });

      const entity = mapper.toEntity(skill);

      expect(entity.description).toBeNull();
    });

    it('should map inactive skill correctly', () => {
      const skill = createSkillDomain({ isActive: false });

      const entity = mapper.toEntity(skill);

      expect(entity.isActive).toBe(false);
    });
  });

  describe('toDomain()', () => {
    it('should map SkillEntity to Skill domain model', () => {
      const id = uuidv4();
      const categoryId = uuidv4();
      const entity = createSkillEntity({ id, categoryId });

      const skill = mapper.toDomain(entity);

      expect(skill.id).toBe(id);
      expect(skill.name).toBe('TypeScript');
      expect(skill.slug).toBe('typescript');
      expect(skill.categoryId).toBe(categoryId);
      expect(skill.description).toBe('A typed superset of JavaScript');
      expect(skill.isActive).toBe(true);
      expect(skill.createdAt).toEqual(new Date('2025-02-10T08:00:00Z'));
      expect(skill.updatedAt).toEqual(new Date('2025-05-20T11:00:00Z'));
    });

    it('should handle null categoryId in entity', () => {
      const entity = createSkillEntity({ categoryId: null });

      const skill = mapper.toDomain(entity);

      expect(skill.categoryId).toBeNull();
    });

    it('should handle null description in entity', () => {
      const entity = createSkillEntity({ description: null });

      const skill = mapper.toDomain(entity);

      expect(skill.description).toBeNull();
    });

    it('should handle both null categoryId and description', () => {
      const entity = createSkillEntity({ categoryId: null, description: null });

      const skill = mapper.toDomain(entity);

      expect(skill.categoryId).toBeNull();
      expect(skill.description).toBeNull();
    });
  });

  describe('toDomainList()', () => {
    it('should map array of entities to domain models', () => {
      const entities = [
        createSkillEntity({ name: 'TypeScript', slug: 'typescript' }),
        createSkillEntity({ name: 'JavaScript', slug: 'javascript' }),
        createSkillEntity({ name: 'Python', slug: 'python' }),
      ];

      const skills = mapper.toDomainList(entities);

      expect(skills).toHaveLength(3);
      expect(skills[0].name).toBe('TypeScript');
      expect(skills[1].name).toBe('JavaScript');
      expect(skills[2].name).toBe('Python');
    });

    it('should return empty array for empty input', () => {
      const skills = mapper.toDomainList([]);
      expect(skills).toHaveLength(0);
    });
  });

  describe('round-trip', () => {
    it('should preserve all values through toDomain(toEntity(skill))', () => {
      const id = uuidv4();
      const categoryId = uuidv4();
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-04-01T00:00:00Z');

      const original = Skill.reconstitute(
        id,
        'NestJS',
        'nestjs',
        categoryId,
        'A progressive Node.js framework',
        true,
        createdAt,
        updatedAt,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.slug).toBe(original.slug);
      expect(restored.categoryId).toBe(original.categoryId);
      expect(restored.description).toBe(original.description);
      expect(restored.isActive).toBe(original.isActive);
      expect(restored.createdAt).toEqual(original.createdAt);
      expect(restored.updatedAt).toEqual(original.updatedAt);
    });

    it('should preserve null values through round-trip', () => {
      const original = createSkillDomain({
        categoryId: null,
        description: null,
      });

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.categoryId).toBeNull();
      expect(restored.description).toBeNull();
    });
  });
});
