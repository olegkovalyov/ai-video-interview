import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ICompanyRepository } from '../../../domain/repositories/company.repository.interface';
import type { ITransactionContext } from '../../../application/interfaces/transaction-context.interface';
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

  async save(company: Company, tx?: ITransactionContext): Promise<void> {
    const companyEntity = this.mapper.toEntity(company);
    const userCompanyEntities = company.users.map(uc =>
      this.userCompanyMapper.toEntity(uc),
    );

    if (tx) {
      const manager = tx as unknown as EntityManager;
      // All 3 steps in the same transaction
      await manager.save(CompanyEntity, companyEntity);
      await manager.delete(UserCompanyEntity, { companyId: company.id });
      if (userCompanyEntities.length > 0) {
        await manager.save(UserCompanyEntity, userCompanyEntities);
      }
    } else {
      // Legacy path: separate operations (backward compatibility)
      await this.repository.save(companyEntity);
      await this.userCompanyRepository.delete({ companyId: company.id });
      if (userCompanyEntities.length > 0) {
        await this.userCompanyRepository.save(userCompanyEntities);
      }
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

  async delete(id: string, tx?: ITransactionContext): Promise<void> {
    if (tx) {
      await (tx as unknown as EntityManager).delete(CompanyEntity, id);
    } else {
      await this.repository.delete(id);
    }
  }

  async isUserInCompany(companyId: string, userId: string): Promise<boolean> {
    const count = await this.userCompanyRepository.count({
      where: { companyId, userId },
    });
    return count > 0;
  }
}
