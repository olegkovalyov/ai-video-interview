import { Email } from '../../../../src/domain/value-objects/email.vo';
import { DomainException } from '../../../../src/shared/exceptions/domain.exception';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw on empty email', () => {
      expect(() => Email.create('')).toThrow(DomainException);
      expect(() => Email.create('')).toThrow('Email is required');
    });

    it('should throw on invalid format', () => {
      expect(() => Email.create('invalid-email')).toThrow(DomainException);
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
    });

    it('should throw on email without @', () => {
      expect(() => Email.create('testexample.com')).toThrow(DomainException);
    });

    it('should throw on email without domain', () => {
      expect(() => Email.create('test@')).toThrow(DomainException);
    });

    it('should throw on email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => Email.create(longEmail)).toThrow(DomainException);
      expect(() => Email.create(longEmail)).toThrow('too long');
    });
  });

  describe('equals', () => {
    it('should be equal to another email with same value', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should be equal regardless of case', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal to different email', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const email = Email.create('test@example.com');

      expect(email.equals(null as any)).toBe(false);
      expect(email.equals(undefined as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email value as string', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});
