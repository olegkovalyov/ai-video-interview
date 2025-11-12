import { CompanySize } from '../company-size.vo';
import { DomainException } from '../../exceptions/domain.exception';

describe('CompanySize Value Object', () => {
  describe('Factory Methods', () => {
    it('should create small size', () => {
      const size = CompanySize.small();
      expect(size.value).toBe('1-10');
      expect(size.isSmall()).toBe(true);
    });

    it('should create medium size', () => {
      const size = CompanySize.medium();
      expect(size.value).toBe('11-50');
      expect(size.isMedium()).toBe(true);
    });

    it('should create large size', () => {
      const size = CompanySize.large();
      expect(size.value).toBe('51-200');
      expect(size.isLarge()).toBe(true);
    });

    it('should create enterprise size', () => {
      const size = CompanySize.enterprise();
      expect(size.value).toBe('200+');
      expect(size.isEnterprise()).toBe(true);
    });

    it('should create from valid string', () => {
      const size = CompanySize.fromString('51-200');
      expect(size.value).toBe('51-200');
    });

    it('should throw error for invalid size', () => {
      expect(() => CompanySize.fromString('invalid')).toThrow(DomainException);
      expect(() => CompanySize.fromString('invalid')).toThrow(
        'Invalid company size: invalid'
      );
    });
  });

  describe('Type Checks', () => {
    it('should identify small companies', () => {
      const size = CompanySize.small();
      expect(size.isSmall()).toBe(true);
      expect(size.isMedium()).toBe(false);
      expect(size.isLarge()).toBe(false);
      expect(size.isEnterprise()).toBe(false);
    });

    it('should identify medium companies', () => {
      const size = CompanySize.medium();
      expect(size.isSmall()).toBe(false);
      expect(size.isMedium()).toBe(true);
      expect(size.isLarge()).toBe(false);
      expect(size.isEnterprise()).toBe(false);
    });

    it('should identify large companies', () => {
      const size = CompanySize.large();
      expect(size.isSmall()).toBe(false);
      expect(size.isMedium()).toBe(false);
      expect(size.isLarge()).toBe(true);
      expect(size.isEnterprise()).toBe(false);
    });

    it('should identify enterprise companies', () => {
      const size = CompanySize.enterprise();
      expect(size.isSmall()).toBe(false);
      expect(size.isMedium()).toBe(false);
      expect(size.isLarge()).toBe(false);
      expect(size.isEnterprise()).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should check equality correctly', () => {
      const size1 = CompanySize.medium();
      const size2 = CompanySize.medium();
      const size3 = CompanySize.large();

      expect(size1.equals(size2)).toBe(true);
      expect(size1.equals(size3)).toBe(false);
    });
  });

  describe('toString & getDescription', () => {
    it('should return string representation', () => {
      expect(CompanySize.small().toString()).toBe('1-10');
      expect(CompanySize.enterprise().toString()).toBe('200+');
    });

    it('should return human-readable description', () => {
      expect(CompanySize.small().getDescription()).toBe('1-10 employees');
      expect(CompanySize.medium().getDescription()).toBe('11-50 employees');
      expect(CompanySize.large().getDescription()).toBe('51-200 employees');
      expect(CompanySize.enterprise().getDescription()).toBe('200+ employees');
    });
  });
});
