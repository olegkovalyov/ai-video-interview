import { Skill } from '../../../domain/entities/skill.entity';
import { SkillCategory } from '../../../domain/entities/skill-category.entity';
import { SkillWithCategory } from '../../../domain/repositories/skill-read.repository.interface';

/**
 * Mapper for converting domain entities to HTTP response DTOs
 * Used ONLY in controllers for API responses
 */
export class SkillResponseMapper {
  static toSkillDto(skill: Skill) {
    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      categoryId: skill.categoryId,
      description: skill.description,
      isActive: skill.isActive,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }

  static toSkillWithCategoryDto(result: SkillWithCategory) {
    return {
      id: result.skill.id,
      name: result.skill.name,
      slug: result.skill.slug,
      categoryId: result.skill.categoryId,
      description: result.skill.description,
      isActive: result.skill.isActive,
      createdAt: result.skill.createdAt,
      updatedAt: result.skill.updatedAt,
      category: result.category ? this.toCategoryDto(result.category) : null,
    };
  }

  static toCategoryDto(category: SkillCategory) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toSkillListDto(skills: Skill[]) {
    return skills.map(skill => this.toSkillDto(skill));
  }

  static toCategoryListDto(categories: SkillCategory[]) {
    return categories.map(category => this.toCategoryDto(category));
  }
}
