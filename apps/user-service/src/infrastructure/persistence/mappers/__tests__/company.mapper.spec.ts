import { v4 as uuidv4 } from 'uuid';
import { CompanyMapper } from '../company.mapper';
import { UserCompanyMapper } from '../user-company.mapper';
import { Company } from '../../../../domain/aggregates/company.aggregate';
import { CompanyEntity } from '../../entities/company.entity';
import { CompanySize } from '../../../../domain/value-objects/company-size.vo';

describe('CompanyMapper', () => {
  let mapper: CompanyMapper;

  beforeEach(() => {
    mapper = new CompanyMapper(new UserCompanyMapper());
  });

  const createCompanyEntity = (overrides: Partial<CompanyEntity> = {}): CompanyEntity => {
    const entity = new CompanyEntity();
    entity.id = uuidv4();
    entity.name = 'Acme Corp';
    entity.description = 'A leading technology company';
    entity.website = 'https://acme.com';
    entity.logoUrl = 'https://cdn.example.com/acme-logo.png';
    entity.industry = 'Technology';
    entity.size = '51-200';
    entity.location = 'San Francisco, CA';
    entity.isActive = true;
    entity.createdBy = uuidv4();
    entity.createdAt = new Date('2025-03-01T09:00:00Z');
    entity.updatedAt = new Date('2025-06-15T16:00:00Z');
    Object.assign(entity, overrides);
    return entity;
  };

  const createCompanyDomain = (overrides: {
    id?: string;
    name?: string;
    description?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    industry?: string | null;
    size?: CompanySize | null;
    location?: string | null;
    isActive?: boolean;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}): Company => {
    return Company.reconstitute(
      overrides.id ?? uuidv4(),
      overrides.name ?? 'Acme Corp',
      'description' in overrides ? overrides.description! : 'A leading technology company',
      'website' in overrides ? overrides.website! : 'https://acme.com',
      'logoUrl' in overrides ? overrides.logoUrl! : 'https://cdn.example.com/acme-logo.png',
      'industry' in overrides ? overrides.industry! : 'Technology',
      'size' in overrides ? overrides.size! : CompanySize.large(),
      'location' in overrides ? overrides.location! : 'San Francisco, CA',
      overrides.isActive ?? true,
      overrides.createdBy ?? uuidv4(),
      [], // userCompanies
      overrides.createdAt ?? new Date('2025-03-01T09:00:00Z'),
      overrides.updatedAt ?? new Date('2025-06-15T16:00:00Z'),
    );
  };

  describe('toEntity()', () => {
    it('should map Company aggregate to CompanyEntity with all fields', () => {
      const id = uuidv4();
      const createdBy = uuidv4();
      const createdAt = new Date('2025-03-01T09:00:00Z');
      const updatedAt = new Date('2025-06-15T16:00:00Z');

      const company = createCompanyDomain({
        id,
        name: 'TechCo',
        description: 'Tech company',
        website: 'https://techco.io',
        logoUrl: 'https://cdn.example.com/techco.png',
        industry: 'Software',
        size: CompanySize.medium(),
        location: 'New York, NY',
        isActive: true,
        createdBy,
        createdAt,
        updatedAt,
      });

      const entity = mapper.toEntity(company);

      expect(entity).toBeInstanceOf(CompanyEntity);
      expect(entity.id).toBe(id);
      expect(entity.name).toBe('TechCo');
      expect(entity.description).toBe('Tech company');
      expect(entity.website).toBe('https://techco.io');
      expect(entity.logoUrl).toBe('https://cdn.example.com/techco.png');
      expect(entity.industry).toBe('Software');
      expect(entity.size).toBe('11-50');
      expect(entity.location).toBe('New York, NY');
      expect(entity.isActive).toBe(true);
      expect(entity.createdBy).toBe(createdBy);
      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
    });

    it('should map null size to null in entity', () => {
      const company = createCompanyDomain({ size: null });

      const entity = mapper.toEntity(company);

      expect(entity.size).toBeNull();
    });

    it('should map null optional fields correctly', () => {
      const company = createCompanyDomain({
        description: null,
        website: null,
        logoUrl: null,
        industry: null,
        location: null,
      });

      const entity = mapper.toEntity(company);

      expect(entity.description).toBeNull();
      expect(entity.website).toBeNull();
      expect(entity.logoUrl).toBeNull();
      expect(entity.industry).toBeNull();
      expect(entity.location).toBeNull();
    });

    it('should map all CompanySize values correctly', () => {
      const sizes: Array<{ size: CompanySize; expected: string }> = [
        { size: CompanySize.small(), expected: '1-10' },
        { size: CompanySize.medium(), expected: '11-50' },
        { size: CompanySize.large(), expected: '51-200' },
        { size: CompanySize.enterprise(), expected: '200+' },
      ];

      for (const { size, expected } of sizes) {
        const company = createCompanyDomain({ size });
        const entity = mapper.toEntity(company);
        expect(entity.size).toBe(expected);
      }
    });
  });

  describe('toDomain()', () => {
    it('should map CompanyEntity to Company aggregate', () => {
      const id = uuidv4();
      const createdBy = uuidv4();
      const entity = createCompanyEntity({ id, createdBy });

      const company = mapper.toDomain(entity);

      expect(company.id).toBe(id);
      expect(company.name).toBe('Acme Corp');
      expect(company.description).toBe('A leading technology company');
      expect(company.website).toBe('https://acme.com');
      expect(company.logoUrl).toBe('https://cdn.example.com/acme-logo.png');
      expect(company.industry).toBe('Technology');
      expect(company.size).not.toBeNull();
      expect(company.size!.value).toBe('51-200');
      expect(company.location).toBe('San Francisco, CA');
      expect(company.isActive).toBe(true);
      expect(company.createdBy).toBe(createdBy);
      expect(company.createdAt).toEqual(new Date('2025-03-01T09:00:00Z'));
      expect(company.updatedAt).toEqual(new Date('2025-06-15T16:00:00Z'));
    });

    it('should handle null size in entity', () => {
      const entity = createCompanyEntity({ size: null });

      const company = mapper.toDomain(entity);

      expect(company.size).toBeNull();
    });

    it('should handle null optional fields in entity', () => {
      const entity = createCompanyEntity({
        description: null,
        website: null,
        logoUrl: null,
        industry: null,
        location: null,
        size: null,
      });

      const company = mapper.toDomain(entity);

      expect(company.description).toBeNull();
      expect(company.website).toBeNull();
      expect(company.logoUrl).toBeNull();
      expect(company.industry).toBeNull();
      expect(company.size).toBeNull();
      expect(company.location).toBeNull();
    });

    it('should map all CompanySize entity values to domain value objects', () => {
      const entitySizes: Array<{ entitySize: CompanyEntity['size']; check: (s: CompanySize) => boolean }> = [
        { entitySize: '1-10', check: (s) => s.isSmall() },
        { entitySize: '11-50', check: (s) => s.isMedium() },
        { entitySize: '51-200', check: (s) => s.isLarge() },
        { entitySize: '200+', check: (s) => s.isEnterprise() },
      ];

      for (const { entitySize, check } of entitySizes) {
        const entity = createCompanyEntity({ size: entitySize });
        const company = mapper.toDomain(entity);
        expect(company.size).not.toBeNull();
        expect(check(company.size!)).toBe(true);
      }
    });

    it('should reconstitute with empty users array by default', () => {
      const entity = createCompanyEntity();

      const company = mapper.toDomain(entity);

      expect(company.users).toEqual([]);
    });
  });

  describe('toDomainList()', () => {
    it('should map array of entities to domain models', () => {
      const entities = [
        createCompanyEntity({ name: 'Company A' }),
        createCompanyEntity({ name: 'Company B' }),
        createCompanyEntity({ name: 'Company C' }),
      ];

      const companies = mapper.toDomainList(entities);

      expect(companies).toHaveLength(3);
      expect(companies[0].name).toBe('Company A');
      expect(companies[1].name).toBe('Company B');
      expect(companies[2].name).toBe('Company C');
    });

    it('should return empty array for empty input', () => {
      const companies = mapper.toDomainList([]);
      expect(companies).toHaveLength(0);
    });
  });

  describe('round-trip', () => {
    it('should preserve all values through toDomain(toEntity(company))', () => {
      const id = uuidv4();
      const createdBy = uuidv4();
      const createdAt = new Date('2025-02-01T00:00:00Z');
      const updatedAt = new Date('2025-05-01T12:00:00Z');

      const original = Company.reconstitute(
        id,
        'Round Trip Corp',
        'A round trip test company',
        'https://roundtrip.com',
        'https://cdn.example.com/rt.png',
        'Finance',
        CompanySize.enterprise(),
        'London, UK',
        true,
        createdBy,
        [],
        createdAt,
        updatedAt,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.description).toBe(original.description);
      expect(restored.website).toBe(original.website);
      expect(restored.logoUrl).toBe(original.logoUrl);
      expect(restored.industry).toBe(original.industry);
      expect(restored.size!.value).toBe(original.size!.value);
      expect(restored.location).toBe(original.location);
      expect(restored.isActive).toBe(original.isActive);
      expect(restored.createdBy).toBe(original.createdBy);
      expect(restored.createdAt).toEqual(original.createdAt);
      expect(restored.updatedAt).toEqual(original.updatedAt);
    });

    it('should preserve null size through round-trip', () => {
      const original = createCompanyDomain({ size: null });

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.size).toBeNull();
    });
  });
});
