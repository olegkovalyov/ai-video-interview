import { Skill } from '../entities/skill.entity';
import { SkillCategory } from '../entities/skill-category.entity';

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Skill list filters
 */
export interface SkillListFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

/**
 * Skill with category
 */
export interface SkillWithCategory {
  skill: Skill;
  category: SkillCategory | null;
}

/**
 * Skill Read Repository Interface (Query operations)
 * Optimized for read operations (CQRS read side)
 */
export interface ISkillReadRepository {
  /**
   * Find skill by ID
   */
  findById(id: string): Promise<Skill | null>;

  /**
   * Find skill by ID with category
   */
  findByIdWithCategory(id: string): Promise<SkillWithCategory | null>;

  /**
   * Find skill by slug
   */
  findBySlug(slug: string): Promise<Skill | null>;

  /**
   * List skills with pagination and filters
   */
  list(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<Skill>>;

  /**
   * List skills with categories
   */
  listWithCategories(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<SkillWithCategory>>;

  /**
   * List all skill categories
   */
  listCategories(): Promise<SkillCategory[]>;

  /**
   * Find skill category by ID
   */
  findCategoryById(id: string): Promise<SkillCategory | null>;

  /**
   * Count skills
   */
  count(filters?: SkillListFilters): Promise<number>;
}
