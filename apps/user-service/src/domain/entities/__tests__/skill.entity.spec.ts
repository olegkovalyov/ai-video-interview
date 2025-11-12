import { Skill } from '../skill.entity';
import { DomainException } from '../../exceptions/domain.exception';

describe('Skill Entity', () => {
  const validId = 'skill-123';
  const validName = 'React';
  const validSlug = 'react';
  const validCategoryId = 'category-456';
  const validDescription = 'Popular JavaScript library for building UIs';

  describe('Factory Method - create', () => {
    it('should create skill with all fields', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      expect(skill.id).toBe(validId);
      expect(skill.name).toBe(validName);
      expect(skill.slug).toBe(validSlug);
      expect(skill.categoryId).toBe(validCategoryId);
      expect(skill.description).toBe(validDescription);
      expect(skill.isActive).toBe(true); // Active by default
      expect(skill.createdAt).toBeInstanceOf(Date);
      expect(skill.updatedAt).toBeInstanceOf(Date);
    });

    it('should create without category (null)', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        null,
        validDescription,
      );

      expect(skill.categoryId).toBeNull();
    });

    it('should create without description (null)', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        null,
      );

      expect(skill.description).toBeNull();
    });

    it('should trim name and slug', () => {
      const skill = Skill.create(
        validId,
        '  React  ',
        '  react  ',
        validCategoryId,
        validDescription,
      );

      expect(skill.name).toBe('React');
      expect(skill.slug).toBe('react');
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Skill.create(validId, '', validSlug, validCategoryId, validDescription)
      ).toThrow(DomainException);
      expect(() =>
        Skill.create(validId, '   ', validSlug, validCategoryId, validDescription)
      ).toThrow('Skill name cannot be empty');
    });

    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(101);
      expect(() =>
        Skill.create(validId, longName, validSlug, validCategoryId, validDescription)
      ).toThrow('Skill name is too long (max 100 characters)');
    });

    it('should throw error for empty slug', () => {
      expect(() =>
        Skill.create(validId, validName, '', validCategoryId, validDescription)
      ).toThrow('Skill slug cannot be empty');
    });
  });

  describe('Business Logic - update', () => {
    it('should update all fields', () => {
      const skill = Skill.create(
        validId,
        'Old Name',
        validSlug,
        validCategoryId,
        'Old description',
      );

      skill.update(
        'New Name',
        'New description',
        'new-category-id',
      );

      expect(skill.name).toBe('New Name');
      expect(skill.description).toBe('New description');
      expect(skill.categoryId).toBe('new-category-id');
    });

    it('should trim fields when updating', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      skill.update(
        '  Updated Name  ',
        '  Updated description  ',
        validCategoryId,
      );

      expect(skill.name).toBe('Updated Name');
      expect(skill.description).toBe('Updated description');
    });

    it('should allow setting category to null', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      skill.update(validName, validDescription, null);
      expect(skill.categoryId).toBeNull();
    });

    it('should throw error for empty name', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      expect(() => skill.update('', validDescription, validCategoryId)).toThrow(
        'Skill name cannot be empty'
      );
    });

    it('should throw error for name exceeding max length', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      expect(() => skill.update('a'.repeat(101), validDescription, validCategoryId)).toThrow(
        'Skill name is too long (max 100 characters)'
      );
    });
  });

  describe('Business Logic - activate/deactivate', () => {
    it('should activate skill', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      // Deactivate first
      skill.deactivate();
      expect(skill.isActive).toBe(false);

      // Then activate
      skill.activate();
      expect(skill.isActive).toBe(true);
    });

    it('should not change state if already active', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      const oldUpdatedAt = skill.updatedAt;
      skill.activate(); // Already active
      expect(skill.updatedAt).toBe(oldUpdatedAt); // Should not update timestamp
    });

    it('should deactivate skill', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      skill.deactivate();
      expect(skill.isActive).toBe(false);
    });

    it('should not change state if already inactive', () => {
      const skill = Skill.create(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
      );

      skill.deactivate();
      const oldUpdatedAt = skill.updatedAt;
      
      skill.deactivate(); // Already inactive
      expect(skill.updatedAt).toBe(oldUpdatedAt);
    });
  });

  describe('Factory Method - reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const skill = Skill.reconstitute(
        validId,
        validName,
        validSlug,
        validCategoryId,
        validDescription,
        false, // inactive
        createdAt,
        updatedAt,
      );

      expect(skill.id).toBe(validId);
      expect(skill.name).toBe(validName);
      expect(skill.slug).toBe(validSlug);
      expect(skill.categoryId).toBe(validCategoryId);
      expect(skill.description).toBe(validDescription);
      expect(skill.isActive).toBe(false);
      expect(skill.createdAt).toBe(createdAt);
      expect(skill.updatedAt).toBe(updatedAt);
    });
  });
});
