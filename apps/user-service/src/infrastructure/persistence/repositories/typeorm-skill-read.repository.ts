import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  ISkillReadRepository,
  PaginatedResult,
  SkillListFilters,
} from '../../../domain/repositories/skill-read.repository.interface';
import {
  SkillReadModel,
  SkillCategoryReadModel,
  SkillWithCategoryReadModel,
} from '../../../domain/read-models/skill.read-model';
import { SkillEntity } from '../entities/skill.entity';
import { SkillCategoryEntity } from '../entities/skill-category.entity';

/**
 * TypeORM Skill Read Repository
 * Returns Read Models (plain objects) for CQRS read side
 * NO domain entities - direct mapping from TypeORM entities to Read Models
 */
@Injectable()
export class TypeOrmSkillReadRepository implements ISkillReadRepository {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly repository: Repository<SkillEntity>,
    @InjectRepository(SkillCategoryEntity)
    private readonly categoryRepository: Repository<SkillCategoryEntity>,
  ) {}

  async findById(id: string): Promise<SkillReadModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toReadModel(entity) : null;
  }

  async findByIdWithCategory(id: string): Promise<SkillWithCategoryReadModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!entity) return null;

    return this.toReadModelWithCategory(entity);
  }

  async findBySlug(slug: string): Promise<SkillReadModel | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.toReadModel(entity) : null;
  }

  async list(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<SkillReadModel>> {
    const where: any = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: entities.map(entity => this.toReadModel(entity)),
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async listWithCategories(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<SkillWithCategoryReadModel>> {
    // Handle zero limit edge case
    if (limit === 0) {
      let countQuery = this.repository.createQueryBuilder('skill');
      
      if (filters?.categoryId) {
        countQuery = countQuery.andWhere('skill.categoryId = :categoryId', { categoryId: filters.categoryId });
      }
      if (filters?.isActive !== undefined) {
        countQuery = countQuery.andWhere('skill.isActive = :isActive', { isActive: filters.isActive });
      }
      if (filters?.search) {
        countQuery = countQuery.andWhere('skill.name ILIKE :search', { search: `%${filters.search}%` });
      }
      
      const total = await countQuery.getCount();
      
      return {
        data: [],
        total,
        page,
        limit: 0,
        totalPages: 0,
      };
    }
    
    let query = this.repository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.category', 'category');

    // Apply filters
    if (filters?.categoryId) {
      query = query.andWhere('skill.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters?.isActive !== undefined) {
      query = query.andWhere('skill.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      query = query.andWhere('skill.name ILIKE :search', { search: `%${filters.search}%` });
    }

    // Apply pagination and ordering
    query = query
      .orderBy('skill.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, total] = await query.getManyAndCount();

    const data = entities.map(entity => this.toReadModelWithCategory(entity));

    return {
      data,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async listCategories(): Promise<SkillCategoryReadModel[]> {
    const entities = await this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return entities.map(entity => this.toCategoryReadModel(entity));
  }

  async findCategoryById(id: string): Promise<SkillCategoryReadModel | null> {
    const entity = await this.categoryRepository.findOne({ where: { id } });
    return entity ? this.toCategoryReadModel(entity) : null;
  }

  async count(filters?: SkillListFilters): Promise<number> {
    const where: any = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = Like(`%${filters.search}%`);
    }

    return this.repository.count({ where });
  }

  // ==========================================================================
  // PRIVATE MAPPERS: TypeORM Entity → Read Model
  // ==========================================================================

  /**
   * Map SkillEntity to SkillReadModel (plain object)
   */
  private toReadModel(entity: SkillEntity): SkillReadModel {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      categoryId: entity.categoryId,
      description: entity.description,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map SkillEntity with CategoryEntity to SkillWithCategoryReadModel
   * Denormalizes category data for easier consumption
   */
  private toReadModelWithCategory(entity: SkillEntity): SkillWithCategoryReadModel {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      categoryId: entity.categoryId,
      categoryName: entity.category?.name || null,
      description: entity.description,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      category: entity.category ? this.toCategoryReadModel(entity.category) : null,
    };
  }

  /**
   * Map SkillCategoryEntity to SkillCategoryReadModel (plain object)
   */
  private toCategoryReadModel(entity: SkillCategoryEntity): SkillCategoryReadModel {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
