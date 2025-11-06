import { UserStatus } from '../user-status.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('UserStatus Value Object', () => {
  describe('Creation - Factory Methods', () => {
    it('should create ACTIVE status', () => {
      const status = UserStatus.active();
      expect(status.value).toBe('active');
      expect(status.isActive()).toBe(true);
      expect(status.isSuspended()).toBe(false);
      expect(status.isDeleted()).toBe(false);
    });

    it('should create SUSPENDED status', () => {
      const status = UserStatus.suspended();
      expect(status.value).toBe('suspended');
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(true);
      expect(status.isDeleted()).toBe(false);
    });

    it('should create DELETED status', () => {
      const status = UserStatus.deleted();
      expect(status.value).toBe('deleted');
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isDeleted()).toBe(true);
    });
  });

  describe('Creation - From String', () => {
    it('should create from valid string "active"', () => {
      const status = UserStatus.fromString('active');
      expect(status.value).toBe('active');
      expect(status.isActive()).toBe(true);
    });

    it('should create from valid string "suspended"', () => {
      const status = UserStatus.fromString('suspended');
      expect(status.value).toBe('suspended');
      expect(status.isSuspended()).toBe(true);
    });

    it('should create from valid string "deleted"', () => {
      const status = UserStatus.fromString('deleted');
      expect(status.value).toBe('deleted');
      expect(status.isDeleted()).toBe(true);
    });

    it('should throw error for invalid status', () => {
      expect(() => UserStatus.fromString('invalid')).toThrow(DomainException);
      expect(() => UserStatus.fromString('invalid')).toThrow('Invalid user status: invalid');
    });

    it('should throw error for empty string', () => {
      expect(() => UserStatus.fromString('')).toThrow(DomainException);
    });

    it('should throw error for uppercase status', () => {
      expect(() => UserStatus.fromString('ACTIVE')).toThrow(DomainException);
    });

    it('should throw error for mixed case status', () => {
      expect(() => UserStatus.fromString('Active')).toThrow(DomainException);
    });
  });

  describe('Status Checking Methods', () => {
    it('should correctly identify active status', () => {
      const status = UserStatus.active();
      expect(status.isActive()).toBe(true);
      expect(status.isSuspended()).toBe(false);
      expect(status.isDeleted()).toBe(false);
    });

    it('should correctly identify suspended status', () => {
      const status = UserStatus.suspended();
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(true);
      expect(status.isDeleted()).toBe(false);
    });

    it('should correctly identify deleted status', () => {
      const status = UserStatus.deleted();
      expect(status.isActive()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isDeleted()).toBe(true);
    });
  });

  describe('Value Object Behavior', () => {
    it('should be equal when same status', () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal when different status', () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.suspended();
      expect(status1.equals(status2)).toBe(false);
    });

    it('should be equal when created via different methods', () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.fromString('active');
      expect(status1.equals(status2)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should convert to string correctly for active', () => {
      const status = UserStatus.active();
      expect(status.toString()).toBe('active');
    });

    it('should convert to string correctly for suspended', () => {
      const status = UserStatus.suspended();
      expect(status.toString()).toBe('suspended');
    });

    it('should convert to string correctly for deleted', () => {
      const status = UserStatus.deleted();
      expect(status.toString()).toBe('deleted');
    });

    it('should have value getter', () => {
      const status = UserStatus.active();
      expect(status.value).toBe('active');
    });
  });

  describe('Type Safety', () => {
    it('should only allow valid status values', () => {
      const status = UserStatus.active();
      const value: 'active' | 'suspended' | 'deleted' = status.value;
      expect(['active', 'suspended', 'deleted']).toContain(value);
    });
  });
});
