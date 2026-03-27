import { CompanyResponseMapper } from '../company.response.mapper';
import type { CompanyReadModel } from '../../../../domain/read-models/company.read-model';

describe('CompanyResponseMapper', () => {
  const now = new Date('2026-01-15T12:00:00Z');

  const mockCompany: CompanyReadModel = {
    id: 'company-1',
    name: 'TechCorp Inc.',
    description: 'Leading software company',
    website: 'https://techcorp.com',
    logoUrl: 'https://cdn.example.com/logo.png',
    industry: 'Software Development',
    size: '51-200',
    location: 'San Francisco, CA',
    isActive: true,
    createdBy: 'user-hr-1',
    createdAt: now,
    updatedAt: now,
  };

  describe('toCompanyDto', () => {
    it('should map all fields from CompanyReadModel to CompanyResponseDto', () => {
      const result = CompanyResponseMapper.toCompanyDto(mockCompany);

      expect(result).toEqual({
        id: 'company-1',
        name: 'TechCorp Inc.',
        description: 'Leading software company',
        website: 'https://techcorp.com',
        logoUrl: 'https://cdn.example.com/logo.png',
        industry: 'Software Development',
        size: '51-200',
        location: 'San Francisco, CA',
        position: null,
        createdBy: 'user-hr-1',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    it('should handle nullable fields', () => {
      const minimal: CompanyReadModel = {
        ...mockCompany,
        description: null,
        website: null,
        logoUrl: null,
        industry: null,
        size: null,
        location: null,
      };

      const result = CompanyResponseMapper.toCompanyDto(minimal);

      expect(result.description).toBeNull();
      expect(result.website).toBeNull();
      expect(result.logoUrl).toBeNull();
      expect(result.industry).toBeNull();
      expect(result.size).toBeNull();
      expect(result.location).toBeNull();
      expect(result.position).toBeNull();
    });

    it('should always set position to null', () => {
      const result = CompanyResponseMapper.toCompanyDto(mockCompany);
      expect(result.position).toBeNull();
    });
  });

  describe('toCompanyListDto', () => {
    it('should map array of companies to list DTOs with subset of fields', () => {
      const companies: CompanyReadModel[] = [
        mockCompany,
        { ...mockCompany, id: 'company-2', name: 'StartupXYZ' },
      ];

      const result = CompanyResponseMapper.toCompanyListDto(companies);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'company-1',
        name: 'TechCorp Inc.',
        industry: 'Software Development',
        size: '51-200',
        location: 'San Francisco, CA',
        isActive: true,
        createdAt: now,
      });
      expect(result[1].id).toBe('company-2');
      expect(result[1].name).toBe('StartupXYZ');
    });

    it('should not include description, website, logoUrl, createdBy, updatedAt in list items', () => {
      const result = CompanyResponseMapper.toCompanyListDto([mockCompany]);

      const keys = Object.keys(result[0]);
      expect(keys).not.toContain('description');
      expect(keys).not.toContain('website');
      expect(keys).not.toContain('logoUrl');
      expect(keys).not.toContain('createdBy');
      expect(keys).not.toContain('updatedAt');
    });

    it('should return empty array for empty input', () => {
      const result = CompanyResponseMapper.toCompanyListDto([]);
      expect(result).toEqual([]);
    });
  });
});
