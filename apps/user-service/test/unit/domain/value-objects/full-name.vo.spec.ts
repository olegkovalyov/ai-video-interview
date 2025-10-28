import { FullName } from '../../../../src/domain/value-objects/full-name.vo';
import { DomainException } from '../../../../src/domain/exceptions/domain.exception';

describe('FullName Value Object', () => {
  describe('create', () => {
    it('should create valid full name', () => {
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

    it('should throw on empty first name', () => {
      expect(() => FullName.create('', 'Doe')).toThrow(DomainException);
      expect(() => FullName.create('', 'Doe')).toThrow('required');
    });

    it('should throw on empty last name', () => {
      expect(() => FullName.create('John', '')).toThrow(DomainException);
      expect(() => FullName.create('John', '')).toThrow('required');
    });

    it('should throw on whitespace-only names', () => {
      expect(() => FullName.create('   ', 'Doe')).toThrow(DomainException);
      expect(() => FullName.create('John', '   ')).toThrow(DomainException);
    });

    it('should throw on first name too long', () => {
      const longName = 'a'.repeat(51);
      expect(() => FullName.create(longName, 'Doe')).toThrow(DomainException);
      expect(() => FullName.create(longName, 'Doe')).toThrow('too long');
    });

    it('should throw on last name too long', () => {
      const longName = 'a'.repeat(51);
      expect(() => FullName.create('John', longName)).toThrow(DomainException);
      expect(() => FullName.create('John', longName)).toThrow('too long');
    });

    it('should accept names at max length', () => {
      const maxName = 'a'.repeat(50);
      const fullName = FullName.create(maxName, maxName);
      
      expect(fullName.firstName).toBe(maxName);
      expect(fullName.lastName).toBe(maxName);
    });
  });

  describe('equals', () => {
    it('should be equal to another full name with same values', () => {
      const name1 = FullName.create('John', 'Doe');
      const name2 = FullName.create('John', 'Doe');

      expect(name1.equals(name2)).toBe(true);
    });

    it('should not be equal to different full name', () => {
      const name1 = FullName.create('John', 'Doe');
      const name2 = FullName.create('Jane', 'Doe');

      expect(name1.equals(name2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const name1 = FullName.create('John', 'Doe');
      const name2 = FullName.create('john', 'doe');

      expect(name1.equals(name2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return full name as string', () => {
      const fullName = FullName.create('John', 'Doe');
      expect(fullName.toString()).toBe('John Doe');
    });
  });
});
