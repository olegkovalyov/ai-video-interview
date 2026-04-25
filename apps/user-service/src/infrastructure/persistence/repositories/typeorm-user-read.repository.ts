import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
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

  async findByIdWithProfile(
    id: string,
  ): Promise<UserWithProfileReadModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    if (!entity) return null;

    const baseModel = this.toReadModel(entity);
    return { ...baseModel };
  }

  async findByExternalAuthId(
    externalAuthId: string,
  ): Promise<UserReadModel | null> {
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
    const queryBuilder = this.applyUserFilters(
      this.repository.createQueryBuilder('user'),
      filters,
    )
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((entity) => this.toReadModel(entity)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private applyUserFilters(
    query: SelectQueryBuilder<UserEntity>,
    filters?: UserListFilters,
  ): SelectQueryBuilder<UserEntity> {
    if (filters?.search) {
      query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }
    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }
    return query;
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
    return this.applyUserFilters(
      this.repository.createQueryBuilder('user'),
      filters,
    ).getCount();
  }

  async countByStatus(): Promise<Record<string, number>> {
    interface StatusCountRow {
      status: string;
      count: string;
    }

    const result = await this.repository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany<StatusCountRow>();

    return result.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number.parseInt(row.count, 10);
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
