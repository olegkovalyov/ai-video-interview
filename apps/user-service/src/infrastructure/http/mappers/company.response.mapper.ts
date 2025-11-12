import { Company } from '../../../domain/aggregates/company.aggregate';

/**
 * Mapper for converting Company domain entities to HTTP response DTOs
 * Used ONLY in controllers for API responses
 */
export class CompanyResponseMapper {
  static toCompanyDto(company: Company) {
    return {
      id: company.id,
      name: company.name,
      description: company.description,
      website: company.website,
      logoUrl: company.logoUrl,
      industry: company.industry,
      size: company.size ? company.size.toString() : null,
      location: company.location,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  static toCompanyListDto(companies: Company[]) {
    return companies.map(company => this.toCompanyDto(company));
  }
}
