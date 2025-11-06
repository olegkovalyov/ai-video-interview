import { UserRole } from '../user-role.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('UserRole Value Object', () => {
  describe('Creation - Factory Methods', () => {
    it('should create PENDING role', () => {
      const role = UserRole.pending();
      expect(role.value).toBe('pending');
      expect(role.isPending()).toBe(true);
      expect(role.isCandidate()).toBe(false);
      expect(role.isHR()).toBe(false);
      expect(role.isAdmin()).toBe(false);
    });

    it('should create CANDIDATE role', () => {
      const role = UserRole.candidate();
      expect(role.value).toBe('candidate');
      expect(role.isPending()).toBe(false);
      expect(role.isCandidate()).toBe(true);
      expect(role.isHR()).toBe(false);
      expect(role.isAdmin()).toBe(false);
    });

    it('should create HR role', () => {
      const role = UserRole.hr();
      expect(role.value).toBe('hr');
      expect(role.isPending()).toBe(false);
      expect(role.isCandidate()).toBe(false);
      expect(role.isHR()).toBe(true);
      expect(role.isAdmin()).toBe(false);
    });

    it('should create ADMIN role', () => {
      const role = UserRole.admin();
      expect(role.value).toBe('admin');
      expect(role.isPending()).toBe(false);
      expect(role.isCandidate()).toBe(false);
      expect(role.isHR()).toBe(false);
      expect(role.isAdmin()).toBe(true);
    });
  });

  describe('Creation - From String', () => {
    it('should create from valid string "pending"', () => {
      const role = UserRole.fromString('pending');
      expect(role.value).toBe('pending');
      expect(role.isPending()).toBe(true);
    });

    it('should create from valid string "candidate"', () => {
      const role = UserRole.fromString('candidate');
      expect(role.value).toBe('candidate');
      expect(role.isCandidate()).toBe(true);
    });

    it('should create from valid string "hr"', () => {
      const role = UserRole.fromString('hr');
      expect(role.value).toBe('hr');
      expect(role.isHR()).toBe(true);
    });

    it('should create from valid string "admin"', () => {
      const role = UserRole.fromString('admin');
      expect(role.value).toBe('admin');
      expect(role.isAdmin()).toBe(true);
    });

    it('should normalize role to lowercase', () => {
      const role = UserRole.fromString('CANDIDATE');
      expect(role.value).toBe('candidate');
      expect(role.isCandidate()).toBe(true);
    });

    it('should trim whitespace', () => {
      const role = UserRole.fromString('  hr  ');
      expect(role.value).toBe('hr');
      expect(role.isHR()).toBe(true);
    });

    it('should normalize and trim together', () => {
      const role = UserRole.fromString('  ADMIN  ');
      expect(role.value).toBe('admin');
      expect(role.isAdmin()).toBe(true);
    });

    it('should throw error for invalid role', () => {
      expect(() => UserRole.fromString('invalid')).toThrow(DomainException);
      expect(() => UserRole.fromString('invalid')).toThrow('Invalid user role');
    });

    it('should throw error for empty string', () => {
      expect(() => UserRole.fromString('')).toThrow(DomainException);
    });

    it('should throw error for unknown role', () => {
      expect(() => UserRole.fromString('superadmin')).toThrow(DomainException);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify pending role', () => {
      const role = UserRole.pending();
      expect(role.isPending()).toBe(true);
      expect(role.isCandidate()).toBe(false);
      expect(role.isHR()).toBe(false);
      expect(role.isAdmin()).toBe(false);
    });

    it('should correctly identify candidate role', () => {
      const role = UserRole.candidate();
      expect(role.isPending()).toBe(false);
      expect(role.isCandidate()).toBe(true);
      expect(role.isHR()).toBe(false);
      expect(role.isAdmin()).toBe(false);
    });

    it('should correctly identify HR role', () => {
      const role = UserRole.hr();
      expect(role.isPending()).toBe(false);
      expect(role.isCandidate()).toBe(false);
      expect(role.isHR()).toBe(true);
      expect(role.isAdmin()).toBe(false);
    });

    it('should correctly identify admin role', () => {
      const role = UserRole.admin();
      expect(role.isPending()).toBe(false);
      expect(role.isCandidate()).toBe(false);
      expect(role.isHR()).toBe(false);
      expect(role.isAdmin()).toBe(true);
    });
  });

  describe('Role Selection Status', () => {
    it('should return false for isSelected when role is pending', () => {
      const role = UserRole.pending();
      expect(role.isSelected()).toBe(false);
    });

    it('should return true for isSelected when role is candidate', () => {
      const role = UserRole.candidate();
      expect(role.isSelected()).toBe(true);
    });

    it('should return true for isSelected when role is hr', () => {
      const role = UserRole.hr();
      expect(role.isSelected()).toBe(true);
    });

    it('should return true for isSelected when role is admin', () => {
      const role = UserRole.admin();
      expect(role.isSelected()).toBe(true);
    });
  });

  describe('Display Names', () => {
    it('should return correct display name for pending', () => {
      const role = UserRole.pending();
      expect(role.getDisplayName()).toBe('Pending');
    });

    it('should return correct display name for candidate', () => {
      const role = UserRole.candidate();
      expect(role.getDisplayName()).toBe('Candidate');
    });

    it('should return correct display name for hr', () => {
      const role = UserRole.hr();
      expect(role.getDisplayName()).toBe('HR Manager');
    });

    it('should return correct display name for admin', () => {
      const role = UserRole.admin();
      expect(role.getDisplayName()).toBe('Administrator');
    });
  });

  describe('Value Object Behavior', () => {
    it('should be equal when same role', () => {
      const role1 = UserRole.candidate();
      const role2 = UserRole.candidate();
      expect(role1.equals(role2)).toBe(true);
    });

    it('should not be equal when different roles', () => {
      const role1 = UserRole.candidate();
      const role2 = UserRole.hr();
      expect(role1.equals(role2)).toBe(false);
    });

    it('should be equal when created via different methods', () => {
      const role1 = UserRole.candidate();
      const role2 = UserRole.fromString('candidate');
      expect(role1.equals(role2)).toBe(true);
    });

    it('should be equal after normalization', () => {
      const role1 = UserRole.candidate();
      const role2 = UserRole.fromString('CANDIDATE');
      expect(role1.equals(role2)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should convert to string correctly for pending', () => {
      const role = UserRole.pending();
      expect(role.toString()).toBe('pending');
    });

    it('should convert to string correctly for candidate', () => {
      const role = UserRole.candidate();
      expect(role.toString()).toBe('candidate');
    });

    it('should convert to string correctly for hr', () => {
      const role = UserRole.hr();
      expect(role.toString()).toBe('hr');
    });

    it('should convert to string correctly for admin', () => {
      const role = UserRole.admin();
      expect(role.toString()).toBe('admin');
    });

    it('should have value getter', () => {
      const role = UserRole.candidate();
      expect(role.value).toBe('candidate');
    });
  });

  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(UserRole.PENDING).toBe('pending');
      expect(UserRole.CANDIDATE).toBe('candidate');
      expect(UserRole.HR).toBe('hr');
      expect(UserRole.ADMIN).toBe('admin');
    });
  });
});
