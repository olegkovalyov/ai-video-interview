import { Skill } from '../entities/skill.entity';

/**
 * Skill Repository Interface (Write operations)
 * Defines contract for persisting Skill entities
 */
export interface ISkillRepository {
  /**
   * Save skill (create or update)
   */
  save(skill: Skill): Promise<void>;

  /**
   * Find skill by ID
   */
  findById(id: string): Promise<Skill | null>;

  /**
   * Find skill by slug (unique)
   */
  findBySlug(slug: string): Promise<Skill | null>;

  /**
   * Delete skill (hard delete with CASCADE to candidate_skills)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if skill category exists
   */
  categoryExists(categoryId: string): Promise<boolean>;
}
