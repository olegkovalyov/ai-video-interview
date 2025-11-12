import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  ICompanyReadRepository,
  PaginatedResult,
  CompanyListFilters,
  CompanyWithUsers,
} from '../../../domain/repositories/company-read.repository.interface';
import { Company } from '../../../domain/aggregates/company.aggregate';
import { CompanyEntity } from '../entities/company.entity';
import { UserCompanyEntity } from '../entities/user-company.entity';
import { CompanyMapper } from '../mappers/company.mapper';
import { UserCompanyMapper } from '../mappers/user-company.mapper';

@Injectable()
export class TypeOrmCompanyReadRepository implements ICompanyReadRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repository: Repository<CompanyEntity>,
    @InjectRepository(UserCompanyEntity)
    private readonly userCompanyRepository: Repository<UserCompanyEntity>,
    private readonly mapper: CompanyMapper,
    private readonly userCompanyMapper: UserCompanyMapper,
  ) {}

  async findById(id: string): Promise<Company | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    const userCompanyEntities = await this.userCompanyRepository.find({
      where: { companyId: id },
    });

    const userCompanies = this.userCompanyMapper.toDomainList(userCompanyEntities);
    return this.mapper.toDomain(entity, userCompanies);
  }

  async findByIdWithUsers(id: string): Promise<CompanyWithUsers | null> {
    const company = await this.findById(id);
    if (!company) return null;

    return {
      ...company,
      usersCount: company.users.length,
    } as CompanyWithUsers;
  }

  async list(
    page: number,
    limit: number,
    filters?: CompanyListFilters,
  ): Promise<PaginatedResult<Company>> {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.search) {
      // Simple search - can be improved with OR conditions
      where.name = Like(`%${filters.search}%`);
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    const companies = await Promise.all(
      entities.map(async entity => {
        const userCompanyEntities = await this.userCompanyRepository.find({
          where: { companyId: entity.id },
        });
        const userCompanies = this.userCompanyMapper.toDomainList(userCompanyEntities);
        return this.mapper.toDomain(entity, userCompanies);
      }),
    );

    return {
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByUserId(userId: string): Promise<Company[]> {
    const userCompanyEntities = await this.userCompanyRepository.find({
      where: { userId },
      relations: ['company'],
    });

    const companies = await Promise.all(
      userCompanyEntities.map(async uc => {
        if (!uc.company) return null;

        const allUserCompanies = await this.userCompanyRepository.find({
          where: { companyId: uc.company.id },
        });

        const userCompanies = this.userCompanyMapper.toDomainList(allUserCompanies);
        return this.mapper.toDomain(uc.company, userCompanies);
      }),
    );

    return companies.filter((c): c is Company => c !== null);
  }

  async count(filters?: CompanyListFilters): Promise<number> {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.search) {
      where.name = Like(`%${filters.search}%`);
    }

    return this.repository.count({ where });
  }

  async hasUserAccess(companyId: string, userId: string): Promise<boolean> {
    const count = await this.userCompanyRepository.count({
      where: { companyId, userId },
    });
    return count > 0;
  }
}
