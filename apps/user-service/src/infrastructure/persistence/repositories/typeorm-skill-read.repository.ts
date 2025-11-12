import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  ISkillReadRepository,
  PaginatedResult,
  SkillListFilters,
  SkillWithCategory,
} from '../../../domain/repositories/skill-read.repository.interface';
import { Skill } from '../../../domain/entities/skill.entity';
import { SkillCategory } from '../../../domain/entities/skill-category.entity';
import { SkillEntity } from '../entities/skill.entity';
import { SkillCategoryEntity } from '../entities/skill-category.entity';
import { SkillMapper } from '../mappers/skill.mapper';
import { SkillCategoryMapper } from '../mappers/skill-category.mapper';

@Injectable()
export class TypeOrmSkillReadRepository implements ISkillReadRepository {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly repository: Repository<SkillEntity>,
    @InjectRepository(SkillCategoryEntity)
    private readonly categoryRepository: Repository<SkillCategoryEntity>,
    private readonly mapper: SkillMapper,
    private readonly categoryMapper: SkillCategoryMapper,
  ) {}

  async findById(id: string): Promise<Skill | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByIdWithCategory(id: string): Promise<SkillWithCategory | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!entity) return null;

    return {
      skill: this.mapper.toDomain(entity),
      category: entity.category ? this.categoryMapper.toDomain(entity.category) : null,
    };
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async list(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<Skill>> {
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
      data: this.mapper.toDomainList(entities),
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
  ): Promise<PaginatedResult<SkillWithCategory>> {
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

    const data = entities.map(entity => ({
      skill: this.mapper.toDomain(entity),
      category: entity.category ? this.categoryMapper.toDomain(entity.category) : null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async listCategories(): Promise<SkillCategory[]> {
    const entities = await this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return this.categoryMapper.toDomainList(entities);
  }

  async findCategoryById(id: string): Promise<SkillCategory | null> {
    const entity = await this.categoryRepository.findOne({ where: { id } });
    return entity ? this.categoryMapper.toDomain(entity) : null;
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
}
