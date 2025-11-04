import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  IUserReadRepository,
  PaginatedResult,
  UserListFilters,
} from '../../../domain/repositories/user-read.repository.interface';
import { User } from '../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

/**
 * TypeORM User Read Repository Implementation
 * Optimized for read operations (CQRS read side)
 */
@Injectable()
export class TypeOrmUserReadRepository implements IUserReadRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByExternalAuthId(externalAuthId: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { externalAuthId },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async list(
    page: number,
    limit: number,
    filters?: UserListFilters,
  ): Promise<PaginatedResult<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role');

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
      queryBuilder.andWhere('role.name = :roleName', { roleName: filters.role });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [entities, total] = await queryBuilder.getManyAndCount();

    const users = this.mapper.toDomainList(entities);
    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages,
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
}
