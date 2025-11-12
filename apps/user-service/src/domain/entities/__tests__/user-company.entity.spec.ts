import { UserCompany } from '../user-company.entity';
import { DomainException } from '../../exceptions/domain.exception';

describe('UserCompany Entity', () => {
  const validId = 'uc-123';
  const validUserId = 'user-456';
  const validCompanyId = 'company-789';
  const validPosition = 'Senior Recruiter';

  describe('Factory Method - create', () => {
    it('should create user-company association', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        true,
      );

      expect(uc.id).toBe(validId);
      expect(uc.userId).toBe(validUserId);
      expect(uc.companyId).toBe(validCompanyId);
      expect(uc.position).toBe(validPosition);
      expect(uc.isPrimary).toBe(true);
      expect(uc.joinedAt).toBeInstanceOf(Date);
    });

    it('should create without position (null)', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        null,
        false,
      );

      expect(uc.position).toBeNull();
      expect(uc.isPrimary).toBe(false);
    });

    it('should trim position', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        '  Tech Recruiter  ',
        false,
      );

      expect(uc.position).toBe('Tech Recruiter');
    });

    it('should throw error for empty user ID', () => {
      expect(() =>
        UserCompany.create(validId, '', validCompanyId, validPosition, false)
      ).toThrow(DomainException);
      expect(() =>
        UserCompany.create(validId, '', validCompanyId, validPosition, false)
      ).toThrow('User ID cannot be empty');
    });

    it('should throw error for empty company ID', () => {
      expect(() =>
        UserCompany.create(validId, validUserId, '', validPosition, false)
      ).toThrow(DomainException);
      expect(() =>
        UserCompany.create(validId, validUserId, '', validPosition, false)
      ).toThrow('Company ID cannot be empty');
    });

    it('should throw error for position exceeding max length', () => {
      const longPosition = 'a'.repeat(101);
      expect(() =>
        UserCompany.create(validId, validUserId, validCompanyId, longPosition, false)
      ).toThrow('Position is too long (max 100 characters)');
    });
  });

  describe('Business Logic - updatePosition', () => {
    it('should update position', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        'Junior Recruiter',
        false,
      );

      uc.updatePosition('Senior Recruiter');
      expect(uc.position).toBe('Senior Recruiter');
    });

    it('should trim position when updating', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        false,
      );

      uc.updatePosition('  Lead HR  ');
      expect(uc.position).toBe('Lead HR');
    });

    it('should throw error for empty position', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        false,
      );

      expect(() => uc.updatePosition('')).toThrow('Position cannot be empty');
      expect(() => uc.updatePosition('   ')).toThrow('Position cannot be empty');
    });

    it('should throw error for position exceeding max length', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        false,
      );

      expect(() => uc.updatePosition('a'.repeat(101))).toThrow(
        'Position is too long (max 100 characters)'
      );
    });
  });

  describe('Business Logic - Primary Flag', () => {
    it('should set as primary', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        false,
      );

      expect(uc.isPrimary).toBe(false);
      
      uc.setAsPrimary();
      expect(uc.isPrimary).toBe(true);
    });

    it('should unset as primary', () => {
      const uc = UserCompany.create(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        true,
      );

      expect(uc.isPrimary).toBe(true);
      
      uc.unsetAsPrimary();
      expect(uc.isPrimary).toBe(false);
    });
  });

  describe('Factory Method - reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const joinedAt = new Date('2024-01-01');

      const uc = UserCompany.reconstitute(
        validId,
        validUserId,
        validCompanyId,
        validPosition,
        true,
        joinedAt,
      );

      expect(uc.id).toBe(validId);
      expect(uc.userId).toBe(validUserId);
      expect(uc.companyId).toBe(validCompanyId);
      expect(uc.position).toBe(validPosition);
      expect(uc.isPrimary).toBe(true);
      expect(uc.joinedAt).toBe(joinedAt);
    });
  });
});
