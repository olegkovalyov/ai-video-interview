import { Injectable } from '@nestjs/common';
import { SkillCategory } from '../../../domain/entities/skill-category.entity';
import { SkillCategoryEntity } from '../entities/skill-category.entity';

/**
 * SkillCategory Mapper
 * Converts between Domain Model (SkillCategory) and Persistence Model (SkillCategoryEntity)
 */
@Injectable()
export class SkillCategoryMapper {
  /**
   * Convert Domain Model to Entity
   */
  toEntity(category: SkillCategory): SkillCategoryEntity {
    const entity = new SkillCategoryEntity();
    
    entity.id = category.id;
    entity.name = category.name;
    entity.slug = category.slug;
    entity.description = category.description;
    entity.sortOrder = category.sortOrder;
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;
    
    return entity;
  }

  /**
   * Convert Entity to Domain Model
   */
  toDomain(entity: SkillCategoryEntity): SkillCategory {
    return SkillCategory.reconstitute(
      entity.id,
      entity.name,
      entity.slug,
      entity.description,
      entity.sortOrder,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert multiple entities to domain models
   */
  toDomainList(entities: SkillCategoryEntity[]): SkillCategory[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
