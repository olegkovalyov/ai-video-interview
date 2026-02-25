import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, type FindOptionsWhere } from 'typeorm';
import {
  ICompanyReadRepository,
  PaginatedResult,
  CompanyListFilters,
} from '../../../domain/repositories/company-read.repository.interface';
import type {
  CompanyReadModel,
  CompanyWithUsersReadModel,
  CompanyDetailReadModel,
} from '../../../domain/read-models/company.read-model';
import { CompanyEntity } from '../entities/company.entity';
import { UserCompanyEntity } from '../entities/user-company.entity';
import { UserEntity } from '../entities/user.entity';

/**
 * Company Read Repository Implementation
 * Returns Read Models (plain objects) - no domain entities
 * Maps TypeORM entities directly to Read Models
 */
@Injectable()
export class TypeOrmCompanyReadRepository implements ICompanyReadRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repository: Repository<CompanyEntity>,
    @InjectRepository(UserCompanyEntity)
    private readonly userCompanyRepository: Repository<UserCompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<CompanyReadModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toReadModel(entity) : null;
  }

  async findByIdWithUsers(id: string): Promise<CompanyWithUsersReadModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    const usersCount = await this.userCompanyRepository.count({
      where: { companyId: id },
    });

    return {
      ...this.toReadModel(entity),
      usersCount,
    };
  }

  async findByIdWithDetails(id: string): Promise<CompanyDetailReadModel | null> {
    const entity = await this.repository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.creator', 'creator')
      .where('company.id = :id', { id })
      .getOne();

    if (!entity) return null;

    const usersCount = await this.userCompanyRepository.count({
      where: { companyId: id },
    });

    const creator = entity.createdBy
      ? await this.userRepository.findOne({ where: { id: entity.createdBy } })
      : null;

    return {
      ...this.toReadModel(entity),
      usersCount,
      creatorName: creator ? `${creator.firstName} ${creator.lastName}` : null,
      creatorEmail: creator?.email || null,
    };
  }

  async list(
    page: number,
    limit: number,
    filters?: CompanyListFilters,
  ): Promise<PaginatedResult<CompanyReadModel>> {
    const where: FindOptionsWhere<CompanyEntity> = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.search) {
      where.name = ILike(`%${filters.search}%`);
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    const companies = entities.map(entity => this.toReadModel(entity));

    return {
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByUserId(userId: string): Promise<CompanyReadModel[]> {
    const userCompanyEntities = await this.userCompanyRepository.find({
      where: { userId },
      relations: ['company'],
    });

    return userCompanyEntities
      .filter(uc => uc.company)
      .map(uc => this.toReadModel(uc.company!));
  }

  async count(filters?: CompanyListFilters): Promise<number> {
    const where: FindOptionsWhere<CompanyEntity> = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.search) {
      where.name = ILike(`%${filters.search}%`);
    }

    return this.repository.count({ where });
  }

  async hasUserAccess(companyId: string, userId: string): Promise<boolean> {
    const count = await this.userCompanyRepository.count({
      where: { companyId, userId },
    });
    return count > 0;
  }

  // ==========================================================================
  // PRIVATE MAPPING METHODS
  // ==========================================================================

  /**
   * Map TypeORM CompanyEntity to CompanyReadModel
   * Direct mapping - no domain logic
   */
  private toReadModel(entity: CompanyEntity): CompanyReadModel {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      website: entity.website,
      logoUrl: entity.logoUrl,
      industry: entity.industry,
      size: entity.size,
      location: entity.location,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
