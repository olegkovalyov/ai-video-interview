import { UserStatus } from '../../../../src/domain/value-objects/user-status.vo';
import { DomainException } from '../../../../src/shared/exceptions/domain.exception';

describe('UserStatus Value Object', () => {
  describe('factory methods', () => {
    it('should create active status', () => {
      const status = UserStatus.active();
      
      expect(status.value).toBe('active');
      expect(status.isActive()).toBe(true);
      expect(status.isSuspended()).toBe(false);
      expect(status.isDeleted()).toBe(false);
    });

    it('should create suspended status', () => {
      const status = UserStatus.suspended();
      
      expect(status.value).toBe('suspended');
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(true);
      expect(status.isDeleted()).toBe(false);
    });

    it('should create deleted status', () => {
      const status = UserStatus.deleted();
      
      expect(status.value).toBe('deleted');
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isDeleted()).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create status from valid string', () => {
      expect(UserStatus.fromString('active').isActive()).toBe(true);
      expect(UserStatus.fromString('suspended').isSuspended()).toBe(true);
      expect(UserStatus.fromString('deleted').isDeleted()).toBe(true);
    });

    it('should throw on invalid status string', () => {
      expect(() => UserStatus.fromString('invalid')).toThrow(DomainException);
      expect(() => UserStatus.fromString('invalid')).toThrow('Invalid user status');
    });

    it('should throw on empty string', () => {
      expect(() => UserStatus.fromString('')).toThrow(DomainException);
    });
  });

  describe('equals', () => {
    it('should be equal to another status with same value', () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.active();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal to different status', () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.suspended();

      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return status value as string', () => {
      expect(UserStatus.active().toString()).toBe('active');
      expect(UserStatus.suspended().toString()).toBe('suspended');
      expect(UserStatus.deleted().toString()).toBe('deleted');
    });
  });
});
