import { TemplateStatus, TemplateStatusEnum } from '../template-status.vo';

describe('TemplateStatus Value Object', () => {
  describe('Creation', () => {
    it('should create DRAFT status', () => {
      const status = TemplateStatus.draft();
      expect(status.value).toBe(TemplateStatusEnum.DRAFT);
    });

    it('should create ACTIVE status', () => {
      const status = TemplateStatus.active();
      expect(status.value).toBe(TemplateStatusEnum.ACTIVE);
    });

    it('should create ARCHIVED status', () => {
      const status = TemplateStatus.archived();
      expect(status.value).toBe(TemplateStatusEnum.ARCHIVED);
    });

    it('should create from valid string "draft"', () => {
      const status = TemplateStatus.create('draft');
      expect(status.value).toBe(TemplateStatusEnum.DRAFT);
    });

    it('should create from valid string "active"', () => {
      const status = TemplateStatus.create('active');
      expect(status.value).toBe(TemplateStatusEnum.ACTIVE);
    });

    it('should create from valid string "archived"', () => {
      const status = TemplateStatus.create('archived');
      expect(status.value).toBe(TemplateStatusEnum.ARCHIVED);
    });

    it('should throw error for invalid status', () => {
      expect(() => TemplateStatus.create('invalid')).toThrow(
        'Cannot create template in invalid (must be one of: draft, active, archived) state',
      );
    });
  });

  describe('Status Checking Methods', () => {
    it('should correctly identify draft status', () => {
      const status = TemplateStatus.draft();
      expect(status.isDraft()).toBe(true);
      expect(status.isActive()).toBe(false);
      expect(status.isArchived()).toBe(false);
    });

    it('should correctly identify active status', () => {
      const status = TemplateStatus.active();
      expect(status.isActive()).toBe(true);
      expect(status.isDraft()).toBe(false);
      expect(status.isArchived()).toBe(false);
    });

    it('should correctly identify archived status', () => {
      const status = TemplateStatus.archived();
      expect(status.isArchived()).toBe(true);
      expect(status.isDraft()).toBe(false);
      expect(status.isActive()).toBe(false);
    });
  });

  describe('Business Rules - canBeModified', () => {
    it('should allow modifications for DRAFT status', () => {
      const status = TemplateStatus.draft();
      expect(status.canBeModified()).toBe(true);
    });

    it('should allow modifications for ACTIVE status', () => {
      const status = TemplateStatus.active();
      expect(status.canBeModified()).toBe(true);
    });

    it('should NOT allow modifications for ARCHIVED status', () => {
      const status = TemplateStatus.archived();
      expect(status.canBeModified()).toBe(false);
    });
  });

  describe('Business Rules - canBePublished', () => {
    it('should allow publishing for DRAFT status', () => {
      const status = TemplateStatus.draft();
      expect(status.canBePublished()).toBe(true);
    });

    it('should NOT allow publishing for ACTIVE status', () => {
      const status = TemplateStatus.active();
      expect(status.canBePublished()).toBe(false);
    });

    it('should NOT allow publishing for ARCHIVED status', () => {
      const status = TemplateStatus.archived();
      expect(status.canBePublished()).toBe(false);
    });
  });

  describe('Value Object Equality', () => {
    it('should be equal when same status', () => {
      const status1 = TemplateStatus.draft();
      const status2 = TemplateStatus.draft();
      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal when different status', () => {
      const status1 = TemplateStatus.draft();
      const status2 = TemplateStatus.active();
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to string correctly', () => {
      expect(TemplateStatus.draft().toString()).toBe('draft');
      expect(TemplateStatus.active().toString()).toBe('active');
      expect(TemplateStatus.archived().toString()).toBe('archived');
    });
  });
});
