import { Injectable } from '@nestjs/common';
import { Skill } from '../../../domain/entities/skill.entity';
import { SkillEntity } from '../entities/skill.entity';

/**
 * Skill Mapper
 * Converts between Domain Model (Skill) and Persistence Model (SkillEntity)
 */
@Injectable()
export class SkillMapper {
  /**
   * Convert Domain Model to Entity
   */
  toEntity(skill: Skill): SkillEntity {
    const entity = new SkillEntity();

    entity.id = skill.id;
    entity.name = skill.name;
    entity.slug = skill.slug;
    entity.categoryId = skill.categoryId;
    entity.description = skill.description;
    entity.isActive = skill.isActive;
    entity.createdAt = skill.createdAt;
    entity.updatedAt = skill.updatedAt;

    return entity;
  }

  /**
   * Convert Entity to Domain Model
   */
  toDomain(entity: SkillEntity): Skill {
    return Skill.reconstitute({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      categoryId: entity.categoryId,
      description: entity.description,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert multiple entities to domain models
   */
  toDomainList(entities: SkillEntity[]): Skill[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
