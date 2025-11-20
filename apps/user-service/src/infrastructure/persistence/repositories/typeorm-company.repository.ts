import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyRepository } from '../../../domain/repositories/company.repository.interface';
import { Company } from '../../../domain/aggregates/company.aggregate';
import { CompanyEntity } from '../entities/company.entity';
import { UserCompanyEntity } from '../entities/user-company.entity';
import { CompanyMapper } from '../mappers/company.mapper';
import { UserCompanyMapper } from '../mappers/user-company.mapper';

@Injectable()
export class TypeOrmCompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repository: Repository<CompanyEntity>,
    @InjectRepository(UserCompanyEntity)
    private readonly userCompanyRepository: Repository<UserCompanyEntity>,
    private readonly mapper: CompanyMapper,
    private readonly userCompanyMapper: UserCompanyMapper,
  ) {}

  async save(company: Company): Promise<void> {
    // Save company entity
    const companyEntity = this.mapper.toEntity(company);
    await this.repository.save(companyEntity);

    // Remove existing user_companies for this company
    await this.userCompanyRepository.delete({ companyId: company.id });

    // Save user_companies
    if (company.users.length > 0) {
      const userCompanyEntities = company.users.map(uc =>
        this.userCompanyMapper.toEntity(uc),
      );
      await this.userCompanyRepository.save(userCompanyEntities);
    }
  }

  async findById(id: string): Promise<Company | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    // Load user_companies
    const userCompanyEntities = await this.userCompanyRepository.find({
      where: { companyId: id },
    });

    const userCompanies = this.userCompanyMapper.toDomainList(userCompanyEntities);

    return this.mapper.toDomain(entity, userCompanies);
  }

  async delete(id: string): Promise<void> {
    // Hard delete - CASCADE will remove user_companies
    await this.repository.delete(id);
  }

  async isUserInCompany(companyId: string, userId: string): Promise<boolean> {
    const count = await this.userCompanyRepository.count({
      where: { companyId, userId },
    });
    return count > 0;
  }
}
