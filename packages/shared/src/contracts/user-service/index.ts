/**
 * User Service API Types
 * Feature-based organization with consolidated exports
 */

// ==================== RE-EXPORTS ====================
// Export all feature types
export * from './common.types';
export * from './health.types';
export * from './metrics.types';
export * from './users.types';
export * from './skills.types';
export * from './companies.types';
export * from './candidates.types';

// Import types for consolidation
import type { PaginationDto } from './common.types';
import type { HealthPaths, HealthOperations } from './health.types';
import type { MetricsPaths, MetricsOperations } from './metrics.types';
import type { 
  UserPaths, 
  UserOperations, 
  UserSchemas 
} from './users.types';
import type { 
  SkillPaths, 
  SkillOperations, 
  SkillSchemas 
} from './skills.types';
import type { 
  CompanyPaths, 
  CompanyOperations, 
  CompanySchemas 
} from './companies.types';
import type { 
  CandidatePaths, 
  CandidateOperations, 
  CandidateSchemas 
} from './candidates.types';

// ==================== CONSOLIDATED TYPES ====================

/**
 * All API paths consolidated from all features
 * Compatible with openapi-fetch and openapi-typescript
 */
export interface paths extends
  HealthPaths,
  MetricsPaths,
  UserPaths,
  SkillPaths,
  CompanyPaths,
  CandidatePaths {}

/**
 * All API operations consolidated from all features
 */
export interface operations extends
  HealthOperations,
  MetricsOperations,
  UserOperations,
  SkillOperations,
  CompanyOperations,
  CandidateOperations {}

/**
 * All schemas (DTOs) consolidated from all features
 * Compatible with OpenAPI components.schemas format
 */
export interface components {
  schemas: UserSchemas & 
    SkillSchemas & 
    CompanySchemas & 
    CandidateSchemas & {
      PaginationDto: PaginationDto;
    };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

/**
 * Webhooks (empty for this service)
 */
export type webhooks = Record<string, never>;

/**
 * $defs (empty for this service)
 */
export type $defs = Record<string, never>;
