import type { CompanyReadModel } from '../../../domain/read-models/company.read-model';
import { CompanyResponseDto, CompanyListItemResponseDto } from '../dto/companies.response.dto';

/**
 * Mapper for converting Company Read Models to HTTP response DTOs
 * Used ONLY in controllers for API responses
 * Works with Read Models (plain objects) from query handlers
 */
export class CompanyResponseMapper {
  static toCompanyDto(company: CompanyReadModel): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      description: company.description,
      website: company.website,
      logoUrl: company.logoUrl,
      industry: company.industry,
      size: company.size,
      location: company.location,
      position: null, // Position field not in current ReadModel - future feature
      createdBy: company.createdBy,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  static toCompanyListDto(companies: CompanyReadModel[]): CompanyListItemResponseDto[] {
    return companies.map(company => ({
      id: company.id,
      name: company.name,
      industry: company.industry,
      size: company.size,
      location: company.location,
      isActive: company.isActive,
      createdAt: company.createdAt,
    }));
  }
}
