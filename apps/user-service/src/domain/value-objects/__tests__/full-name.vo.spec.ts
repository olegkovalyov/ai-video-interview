import { FullName } from '../full-name.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('FullName Value Object', () => {
  describe('Creation - Valid Cases', () => {
    it('should create full name with valid first and last names', () => {
      const fullName = FullName.create('John', 'Doe');
      expect(fullName.firstName).toBe('John');
      expect(fullName.lastName).toBe('Doe');
      expect(fullName.fullName).toBe('John Doe');
    });

    it('should trim whitespace from names', () => {
      const fullName = FullName.create('  John  ', '  Doe  ');
      expect(fullName.firstName).toBe('John');
      expect(fullName.lastName).toBe('Doe');
    });

    it('should accept names with special characters', () => {
      const fullName = FullName.create("O'Connor", "D'Angelo");
      expect(fullName.firstName).toBe("O'Connor");
      expect(fullName.lastName).toBe("D'Angelo");
    });

    it('should accept names with hyphens', () => {
      const fullName = FullName.create('Jean-Pierre', 'Smith-Jones');
      expect(fullName.firstName).toBe('Jean-Pierre');
      expect(fullName.lastName).toBe('Smith-Jones');
    });

    it('should accept names with accents', () => {
      const fullName = FullName.create('José', 'Müller');
      expect(fullName.firstName).toBe('José');
      expect(fullName.lastName).toBe('Müller');
    });

    it('should accept single character names', () => {
      const fullName = FullName.create('X', 'Y');
      expect(fullName.firstName).toBe('X');
      expect(fullName.lastName).toBe('Y');
    });

    it('should accept maximum length names (50 chars)', () => {
      const longName = 'a'.repeat(50);
      const fullName = FullName.create(longName, longName);
      expect(fullName.firstName).toBe(longName);
      expect(fullName.lastName).toBe(longName);
    });
  });

  describe('Creation - Invalid Cases', () => {
    it('should throw error for empty first name', () => {
      expect(() => FullName.create('', 'Doe')).toThrow(DomainException);
      expect(() => FullName.create('', 'Doe')).toThrow('First name and last name are required');
    });

    it('should throw error for empty last name', () => {
      expect(() => FullName.create('John', '')).toThrow(DomainException);
      expect(() => FullName.create('John', '')).toThrow('First name and last name are required');
    });

    it('should throw error when both names are empty', () => {
      expect(() => FullName.create('', '')).toThrow(DomainException);
    });

    it('should throw error for whitespace-only first name', () => {
      expect(() => FullName.create('   ', 'Doe')).toThrow(DomainException);
      expect(() => FullName.create('   ', 'Doe')).toThrow('Names cannot be empty');
    });

    it('should throw error for whitespace-only last name', () => {
      expect(() => FullName.create('John', '   ')).toThrow(DomainException);
      expect(() => FullName.create('John', '   ')).toThrow('Names cannot be empty');
    });

    it('should throw error for first name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() => FullName.create(longName, 'Doe')).toThrow(DomainException);
      expect(() => FullName.create(longName, 'Doe')).toThrow('First name is too long');
    });

    it('should throw error for last name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() => FullName.create('John', longName)).toThrow(DomainException);
      expect(() => FullName.create('John', longName)).toThrow('Last name is too long');
    });
  });

  describe('Value Object Behavior', () => {
    it('should be equal when names are the same', () => {
      const fullName1 = FullName.create('John', 'Doe');
      const fullName2 = FullName.create('John', 'Doe');
      expect(fullName1.equals(fullName2)).toBe(true);
    });

    it('should not be equal when first names differ', () => {
      const fullName1 = FullName.create('John', 'Doe');
      const fullName2 = FullName.create('Jane', 'Doe');
      expect(fullName1.equals(fullName2)).toBe(false);
    });

    it('should not be equal when last names differ', () => {
      const fullName1 = FullName.create('John', 'Doe');
      const fullName2 = FullName.create('John', 'Smith');
      expect(fullName1.equals(fullName2)).toBe(false);
    });

    it('should be equal after trimming whitespace', () => {
      const fullName1 = FullName.create('  John  ', '  Doe  ');
      const fullName2 = FullName.create('John', 'Doe');
      expect(fullName1.equals(fullName2)).toBe(true);
    });
  });

  describe('Getters', () => {
    it('should return first name via getter', () => {
      const fullName = FullName.create('John', 'Doe');
      expect(fullName.firstName).toBe('John');
    });

    it('should return last name via getter', () => {
      const fullName = FullName.create('John', 'Doe');
      expect(fullName.lastName).toBe('Doe');
    });

    it('should return full name via getter', () => {
      const fullName = FullName.create('John', 'Doe');
      expect(fullName.fullName).toBe('John Doe');
    });
  });

  describe('Serialization', () => {
    it('should convert to string correctly', () => {
      const fullName = FullName.create('John', 'Doe');
      expect(fullName.toString()).toBe('John Doe');
    });

    it('should format full name with single space', () => {
      const fullName = FullName.create('Jean-Pierre', 'De La Cruz');
      expect(fullName.toString()).toBe('Jean-Pierre De La Cruz');
    });
  });
});
