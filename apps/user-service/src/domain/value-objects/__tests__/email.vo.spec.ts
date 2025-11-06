import { Email } from '../email.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('Email Value Object', () => {
  describe('Creation - Valid Cases', () => {
    it('should create email with valid format', () => {
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

    it('should handle mixed case and whitespace', () => {
      const email = Email.create('  TeSt@ExAmPlE.CoM  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should accept email with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.value).toBe('user@mail.example.com');
    });

    it('should accept email with numbers', () => {
      const email = Email.create('user123@example456.com');
      expect(email.value).toBe('user123@example456.com');
    });

    it('should accept email with dots and hyphens', () => {
      const email = Email.create('user.name@example-domain.com');
      expect(email.value).toBe('user.name@example-domain.com');
    });

    it('should accept email with plus sign', () => {
      const email = Email.create('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });
  });

  describe('Creation - Invalid Cases', () => {
    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow(DomainException);
      expect(() => Email.create('')).toThrow('Email is required');
    });

    it('should throw error for email without @', () => {
      expect(() => Email.create('testexample.com')).toThrow(DomainException);
      expect(() => Email.create('testexample.com')).toThrow('Invalid email format');
    });

    it('should throw error for email without domain', () => {
      expect(() => Email.create('test@')).toThrow(DomainException);
      expect(() => Email.create('test@')).toThrow('Invalid email format');
    });

    it('should throw error for email without local part', () => {
      expect(() => Email.create('@example.com')).toThrow(DomainException);
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for email with spaces', () => {
      expect(() => Email.create('test user@example.com')).toThrow(DomainException);
      expect(() => Email.create('test user@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for email without TLD', () => {
      expect(() => Email.create('test@example')).toThrow(DomainException);
      expect(() => Email.create('test@example')).toThrow('Invalid email format');
    });

    it('should throw error for email with multiple @', () => {
      expect(() => Email.create('test@@example.com')).toThrow(DomainException);
    });

    it('should throw error for email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // > 255 chars
      expect(() => Email.create(longEmail)).toThrow(DomainException);
      expect(() => Email.create(longEmail)).toThrow('Email is too long');
    });
  });

  describe('Value Object Behavior', () => {
    it('should be equal when emails are the same', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should be equal regardless of original case', () => {
      const email1 = Email.create('TEST@EXAMPLE.COM');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal when emails are different', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to string correctly', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should have value getter', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });
  });
});
