import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IUserReadRepository,
  PaginatedResult,
  UserListFilters,
} from '../../../domain/repositories/user-read.repository.interface';
import type {
  UserReadModel,
  UserWithProfileReadModel,
  UserSummaryReadModel,
} from '../../../domain/read-models/user.read-model';
import { UserEntity } from '../entities/user.entity';

/**
 * TypeORM User Read Repository Implementation
 * Returns Read Models (plain objects) - no domain entities
 * Maps TypeORM entities directly to Read Models
 */
@Injectable()
export class TypeOrmUserReadRepository implements IUserReadRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserReadModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? this.toReadModel(entity) : null;
  }

  async findByIdWithProfile(id: string): Promise<UserWithProfileReadModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    if (!entity) return null;

    const baseModel = this.toReadModel(entity);
    return { ...baseModel };
  }

  async findByExternalAuthId(externalAuthId: string): Promise<UserReadModel | null> {
    const entity = await this.repository.findOne({
      where: { externalAuthId },
    });
    return entity ? this.toReadModel(entity) : null;
  }

  async findByEmail(email: string): Promise<UserReadModel | null> {
    const entity = await this.repository.findOne({
      where: { email },
    });
    return entity ? this.toReadModel(entity) : null;
  }

  async list(
    page: number,
    limit: number,
    filters?: UserListFilters,
  ): Promise<PaginatedResult<UserReadModel>> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    // Apply filters
    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [entities, total] = await queryBuilder.getManyAndCount();

    const users = entities.map(entity => this.toReadModel(entity));
    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getSummary(id: string): Promise<UserSummaryReadModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'avatarUrl'],
    });

    if (!entity) return null;

    return {
      id: entity.id,
      fullName: `${entity.firstName} ${entity.lastName}`,
      email: entity.email,
      role: entity.role,
      avatarUrl: entity.avatarUrl,
    };
  }

  async count(filters?: UserListFilters): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    return queryBuilder.getCount();
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.repository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany();

    return result.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
  }

  // ==========================================================================
  // PRIVATE MAPPING METHODS
  // ==========================================================================

  /**
   * Map TypeORM UserEntity to UserReadModel
   * Direct mapping - no domain logic
   */
  private toReadModel(entity: UserEntity): UserReadModel {
    return {
      id: entity.id,
      externalAuthId: entity.externalAuthId,
      email: entity.email,
      fullName: `${entity.firstName} ${entity.lastName}`,
      firstName: entity.firstName,
      lastName: entity.lastName,
      status: entity.status,
      role: entity.role,
      avatarUrl: entity.avatarUrl,
      bio: entity.bio,
      phone: entity.phone,
      timezone: entity.timezone,
      language: entity.language,
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastLoginAt: entity.lastLoginAt,
    };
  }
}
