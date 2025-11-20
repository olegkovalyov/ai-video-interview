import { Company } from '../company.aggregate';
import { CompanySize } from '../../value-objects/company-size.vo';
import { DomainException } from '../../exceptions/domain.exception';
import { CompanyCreatedEvent } from '../../events/company-created.event';
import { CompanyUpdatedEvent } from '../../events/company-updated.event';
import { CompanyDeactivatedEvent } from '../../events/company-deactivated.event';

describe('Company Aggregate', () => {
  const validId = 'company-123';
  const validName = 'TechCorp Inc.';
  const validDescription = 'Leading tech company';
  const validWebsite = 'https://techcorp.com';
  const validLogoUrl = 'https://techcorp.com/logo.png';
  const validIndustry = 'Technology';
  const validSize = CompanySize.medium();
  const validLocation = 'San Francisco, CA';
  const validCreatedBy = 'user-456';
  const validUserCompanyId = 'uc-789';
  const validPosition = 'HR Manager';

  describe('Factory Method - create', () => {
    it('should create company with all fields', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(company.id).toBe(validId);
      expect(company.name).toBe(validName);
      expect(company.description).toBe(validDescription);
      expect(company.website).toBe(validWebsite);
      expect(company.logoUrl).toBe(validLogoUrl);
      expect(company.industry).toBe(validIndustry);
      expect(company.size).toBe(validSize);
      expect(company.location).toBe(validLocation);
      expect(company.isActive).toBe(true); // Active by default
      expect(company.createdBy).toBe(validCreatedBy);
      expect(company.users).toHaveLength(1); // Creator added automatically
      expect(company.createdAt).toBeInstanceOf(Date);
      expect(company.updatedAt).toBeInstanceOf(Date);
    });

    it('should automatically add creator as first user with isPrimary=true', () => {
      const company = Company.create(
        validId,
        validName,
        null,
        null,
        null,
        null,
        null,
        null,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(company.users).toHaveLength(1);
      expect(company.users[0].userId).toBe(validCreatedBy);
      expect(company.users[0].isPrimary).toBe(true);
      expect(company.users[0].position).toBe(validPosition);
    });

    it('should create with minimal fields (nulls)', () => {
      const company = Company.create(
        validId,
        validName,
        null,
        null,
        null,
        null,
        null,
        null,
        validCreatedBy,
        validUserCompanyId,
        null, // No position
      );

      expect(company.description).toBeNull();
      expect(company.website).toBeNull();
      expect(company.logoUrl).toBeNull();
      expect(company.industry).toBeNull();
      expect(company.size).toBeNull();
      expect(company.location).toBeNull();
      expect(company.users[0].position).toBeNull();
    });

    it('should trim all string fields', () => {
      const company = Company.create(
        validId,
        '  TechCorp  ',
        '  Description  ',
        '  https://site.com  ',
        '  logo.png  ',
        '  Tech  ',
        validSize,
        '  SF  ',
        validCreatedBy,
        validUserCompanyId,
        '  Manager  ',
      );

      expect(company.name).toBe('TechCorp');
      expect(company.description).toBe('Description');
      expect(company.website).toBe('https://site.com');
      expect(company.logoUrl).toBe('logo.png');
      expect(company.industry).toBe('Tech');
      expect(company.location).toBe('SF');
    });

    it('should publish CompanyCreatedEvent', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      const events = company.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CompanyCreatedEvent);
      
      const event = events[0] as CompanyCreatedEvent;
      expect(event.companyId).toBe(validId);
      expect(event.name).toBe(validName);
      expect(event.createdBy).toBe(validCreatedBy);
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Company.create(
          validId,
          '',
          validDescription,
          validWebsite,
          validLogoUrl,
          validIndustry,
          validSize,
          validLocation,
          validCreatedBy,
          validUserCompanyId,
          validPosition,
        )
      ).toThrow('Company name cannot be empty');
    });

    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(256);
      expect(() =>
        Company.create(
          validId,
          longName,
          validDescription,
          validWebsite,
          validLogoUrl,
          validIndustry,
          validSize,
          validLocation,
          validCreatedBy,
          validUserCompanyId,
          validPosition,
        )
      ).toThrow('Company name is too long (max 255 characters)');
    });

    it('should throw error for empty creator ID', () => {
      expect(() =>
        Company.create(
          validId,
          validName,
          validDescription,
          validWebsite,
          validLogoUrl,
          validIndustry,
          validSize,
          validLocation,
          '',
          validUserCompanyId,
          validPosition,
        )
      ).toThrow('Creator ID cannot be empty');
    });
  });

  describe('Business Logic - Update', () => {
    it('should update all fields', () => {
      const company = Company.create(
        validId,
        'Old Name',
        'Old Description',
        'https://old.com',
        'old-logo.png',
        'Old Industry',
        CompanySize.small(),
        'Old Location',
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.clearEvents();

      company.update(
        'New Name',
        'New Description',
        'https://new.com',
        'new-logo.png',
        'New Industry',
        CompanySize.enterprise(),
        'New Location',
      );

      expect(company.name).toBe('New Name');
      expect(company.description).toBe('New Description');
      expect(company.website).toBe('https://new.com');
      expect(company.logoUrl).toBe('new-logo.png');
      expect(company.industry).toBe('New Industry');
      expect(company.size?.value).toBe('200+');
      expect(company.location).toBe('New Location');
    });

    it('should publish CompanyUpdatedEvent with changes', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.clearEvents();

      company.update(
        'Updated Name',
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
      );

      const events = company.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CompanyUpdatedEvent);
      
      const event = events[0] as CompanyUpdatedEvent;
      expect(event.changes).toHaveProperty('name', 'Updated Name');
    });

    it('should not publish event if no changes', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.clearEvents();

      // Update with same values
      company.update(
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
      );

      const events = company.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw error for empty name', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(() =>
        company.update('', validDescription, validWebsite, validLogoUrl, validIndustry, validSize, validLocation)
      ).toThrow('Company name cannot be empty');
    });
  });

  describe('Business Logic - Add/Remove Users', () => {
    it('should add user to company', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      const newUserId = 'user-new';
      company.addUser('uc-new', newUserId, 'Recruiter', false);

      expect(company.users).toHaveLength(2);
      expect(company.users[1].userId).toBe(newUserId);
      expect(company.users[1].position).toBe('Recruiter');
      expect(company.users[1].isPrimary).toBe(false);
    });

    it('should throw error when adding duplicate user', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(() =>
        company.addUser('uc-duplicate', validCreatedBy, 'Another Position', false)
      ).toThrow('User already associated with this company');
    });

    it('should remove user from company', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      const newUserId = 'user-new';
      company.addUser('uc-new', newUserId, 'Recruiter', false);

      expect(company.users).toHaveLength(2);

      company.removeUser(newUserId);

      expect(company.users).toHaveLength(1);
      expect(company.users[0].userId).toBe(validCreatedBy);
    });

    it('should throw error when removing creator', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(() => company.removeUser(validCreatedBy)).toThrow(
        'Cannot remove company creator'
      );
    });

    it('should throw error when removing non-existent user', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(() => company.removeUser('non-existent')).toThrow('User not found in company');
    });
  });

  describe('Business Logic - Update User Position', () => {
    it('should update user position', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        'Old Position',
      );

      company.updateUserPosition(validCreatedBy, 'New Position');

      expect(company.users[0].position).toBe('New Position');
    });

    it('should throw error for non-existent user', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(() => company.updateUserPosition('non-existent', 'Position')).toThrow(
        'User not found in company'
      );
    });
  });

  describe('Business Logic - Set Primary Company', () => {
    it('should set user primary company', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.setUserPrimary(validCreatedBy);

      expect(company.users[0].isPrimary).toBe(true);
    });

    it('should throw error for non-existent user', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      expect(() => company.setUserPrimary('non-existent')).toThrow('User not found in company');
    });
  });

  describe('Business Logic - Activate/Deactivate', () => {
    it('should deactivate company', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.clearEvents();

      company.deactivate();

      expect(company.isActive).toBe(false);

      const events = company.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CompanyDeactivatedEvent);
    });

    it('should activate company', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.deactivate();
      company.activate();

      expect(company.isActive).toBe(true);
    });

    it('should not change state if already inactive', () => {
      const company = Company.create(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        validCreatedBy,
        validUserCompanyId,
        validPosition,
      );

      company.deactivate();
      const oldUpdatedAt = company.updatedAt;

      company.deactivate(); // Already inactive
      expect(company.updatedAt).toBe(oldUpdatedAt);
    });
  });

  describe('Factory Method - reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const company = Company.reconstitute(
        validId,
        validName,
        validDescription,
        validWebsite,
        validLogoUrl,
        validIndustry,
        validSize,
        validLocation,
        false, // inactive
        validCreatedBy,
        [],
        createdAt,
        updatedAt,
      );

      expect(company.id).toBe(validId);
      expect(company.name).toBe(validName);
      expect(company.isActive).toBe(false);
      expect(company.createdBy).toBe(validCreatedBy);
      expect(company.users).toEqual([]);
      expect(company.createdAt).toBe(createdAt);
      expect(company.updatedAt).toBe(updatedAt);
    });
  });
});
