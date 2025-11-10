/**
 * Interview Service API Types
 * 
 * Clean type exports from generated OpenAPI types.
 * This file provides simple, direct imports without nested path access.
 * 
 * Generated from: http://localhost:8003/api/docs-json
 * 
 * Usage:
 *   import { CreateTemplateDto, TemplateResponseDto } from '@shared/types/interview-service.types';
 */

import type { components } from './interview-service.generated';

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * DTO for creating a new interview template
 */
export type CreateTemplateDto = components['schemas']['CreateTemplateDto'];

/**
 * DTO for updating an existing template
 */
export type UpdateTemplateDto = components['schemas']['UpdateTemplateDto'];

/**
 * DTO for adding a question to a template
 */
export type AddQuestionDto = components['schemas']['AddQuestionDto'];

/**
 * DTO for reordering questions in a template
 */
export type ReorderQuestionsDto = components['schemas']['ReorderQuestionsDto'];

/**
 * DTO for question option (multiple choice answer option)
 */
export type QuestionOptionDto = components['schemas']['QuestionOptionDto'];

/**
 * DTO for interview settings
 */
export type InterviewSettingsDto = components['schemas']['InterviewSettingsDto'];

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Full template response with all details
 */
export type TemplateResponseDto = components['schemas']['TemplateResponseDto'];

/**
 * Simplified template item for list views
 */
export type TemplateListItemDto = components['schemas']['TemplateListItemDto'];

/**
 * Paginated response for template lists
 */
export type PaginatedTemplatesResponseDto = components['schemas']['PaginatedTemplatesResponseDto'];

/**
 * Question response DTO
 */
export type QuestionResponseDto = components['schemas']['QuestionResponseDto'];

/**
 * Question option response DTO (for multiple choice questions)
 */
export type QuestionOptionResponseDto = components['schemas']['QuestionOptionResponseDto'];

/**
 * Interview settings response DTO
 */
export type InterviewSettingsResponseDto = components['schemas']['InterviewSettingsResponseDto'];

// ============================================================================
// Enums & Union Types
// ============================================================================

/**
 * Template status enum
 */
export type TemplateStatus = 'draft' | 'active' | 'archived';

/**
 * Question type enum
 */
export type QuestionType = 'video' | 'text' | 'multiple_choice';
