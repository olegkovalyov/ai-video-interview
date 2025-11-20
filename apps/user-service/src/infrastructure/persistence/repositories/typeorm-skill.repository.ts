import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISkillRepository } from '../../../domain/repositories/skill.repository.interface';
import { Skill } from '../../../domain/entities/skill.entity';
import { SkillEntity } from '../entities/skill.entity';
import { SkillCategoryEntity } from '../entities/skill-category.entity';
import { SkillMapper } from '../mappers/skill.mapper';

/**
 * TypeORM Skill Repository Implementation (Write)
 */
@Injectable()
export class TypeOrmSkillRepository implements ISkillRepository {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly repository: Repository<SkillEntity>,
    @InjectRepository(SkillCategoryEntity)
    private readonly categoryRepository: Repository<SkillCategoryEntity>,
    private readonly mapper: SkillMapper,
  ) {}

  async save(skill: Skill): Promise<void> {
    const entity = this.mapper.toEntity(skill);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<Skill | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    // Hard delete - CASCADE will remove candidate_skills
    await this.repository.delete(id);
  }

  async categoryExists(categoryId: string): Promise<boolean> {
    const count = await this.categoryRepository.count({ where: { id: categoryId } });
    return count > 0;
  }
}
