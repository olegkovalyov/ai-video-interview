import { Injectable } from '@nestjs/common';
import { Company } from '../../../domain/aggregates/company.aggregate';
import { CompanyEntity } from '../entities/company.entity';
import { CompanySize } from '../../../domain/value-objects/company-size.vo';
import { UserCompanyMapper } from './user-company.mapper';
import { UserCompany } from '../../../domain/entities/user-company.entity';

@Injectable()
export class CompanyMapper {
  constructor(private readonly userCompanyMapper: UserCompanyMapper) {}

  toEntity(company: Company): CompanyEntity {
    const entity = new CompanyEntity();
    
    entity.id = company.id;
    entity.name = company.name;
    entity.description = company.description;
    entity.website = company.website;
    entity.logoUrl = company.logoUrl;
    entity.industry = company.industry;
    entity.size = company.size?.value as any || null;
    entity.location = company.location;
    entity.isActive = company.isActive;
    entity.createdBy = company.createdBy;
    entity.createdAt = company.createdAt;
    entity.updatedAt = company.updatedAt;
    
    return entity;
  }

  toDomain(entity: CompanyEntity, userCompanies: UserCompany[] = []): Company {
    let companySize: CompanySize | null = null;
    if (entity.size) {
      companySize = CompanySize.fromString(entity.size);
    }

    return Company.reconstitute(
      entity.id,
      entity.name,
      entity.description,
      entity.website,
      entity.logoUrl,
      entity.industry,
      companySize,
      entity.location,
      entity.isActive,
      entity.createdBy,
      userCompanies,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toDomainList(entities: CompanyEntity[]): Company[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
