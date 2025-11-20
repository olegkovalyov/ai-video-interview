import { 
  SkillReadModel, 
  SkillCategoryReadModel, 
  SkillWithCategoryReadModel 
} from '../read-models/skill.read-model';

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
 * Skill Read Repository Interface (Query operations)
 * Returns Read Models (plain objects) for CQRS read side
 * NO domain entities - optimized for query performance
 */
export interface ISkillReadRepository {
  /**
   * Find skill by ID
   * Returns Read Model (plain object)
   */
  findById(id: string): Promise<SkillReadModel | null>;

  /**
   * Find skill by ID with category
   * Returns Read Model with denormalized category data
   */
  findByIdWithCategory(id: string): Promise<SkillWithCategoryReadModel | null>;

  /**
   * Find skill by slug
   * Returns Read Model (plain object)
   */
  findBySlug(slug: string): Promise<SkillReadModel | null>;

  /**
   * List skills with pagination and filters
   * Returns Read Models (plain objects)
   */
  list(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<SkillReadModel>>;

  /**
   * List skills with categories
   * Returns Read Models with denormalized category data
   */
  listWithCategories(
    page: number,
    limit: number,
    filters?: SkillListFilters,
  ): Promise<PaginatedResult<SkillWithCategoryReadModel>>;

  /**
   * List all skill categories
   * Returns Read Models (plain objects)
   */
  listCategories(): Promise<SkillCategoryReadModel[]>;

  /**
   * Find skill category by ID
   * Returns Read Model (plain object)
   */
  findCategoryById(id: string): Promise<SkillCategoryReadModel | null>;

  /**
   * Count skills
   */
  count(filters?: SkillListFilters): Promise<number>;
}
