import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Error Response Schema
 */
export class ErrorResponseSchema {
  @ApiProperty({ example: false, description: 'Indicates the request failed' })
  success: boolean;

  @ApiProperty({ example: 'Error message', description: 'Human-readable error message' })
  error: string;

  @ApiProperty({ example: 'ERROR_CODE', description: 'Machine-readable error code' })
  code: string;

  @ApiProperty({ example: 'Additional error details', required: false })
  details?: string;
}

/**
 * 400 Bad Request Error Schema
 */
export class BadRequestErrorSchema {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Invalid request data' })
  error: string;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ example: 'firstName must be at least 2 characters long', required: false })
  details?: string;
}

/**
 * 401 Unauthorized Error Schema
 */
export class UnauthorizedErrorSchema {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Unauthorized - invalid or missing internal token' })
  error: string;

  @ApiProperty({ example: 'UNAUTHORIZED' })
  code: string;
}

/**
 * 403 Forbidden Error Schema
 */
export class ForbiddenErrorSchema {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Access denied - insufficient permissions' })
  error: string;

  @ApiProperty({ example: 'FORBIDDEN' })
  code: string;
}

/**
 * 404 Not Found Error Schema
 */
export class NotFoundErrorSchema {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Resource not found' })
  error: string;

  @ApiProperty({ example: 'USER_NOT_FOUND' })
  code: string;
}

/**
 * 409 Conflict Error Schema
 */
export class ConflictErrorSchema {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Resource already exists' })
  error: string;

  @ApiProperty({ example: 'USER_ALREADY_EXISTS' })
  code: string;

  @ApiProperty({ example: 'User with email user@example.com already exists', required: false })
  details?: string;
}

/**
 * 500 Internal Server Error Schema
 */
export class InternalServerErrorSchema {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Internal server error' })
  error: string;

  @ApiProperty({ example: 'INTERNAL_ERROR' })
  code: string;

  @ApiProperty({ example: 'Database connection failed', required: false })
  details?: string;
}

/**
 * Validation Error Schema (from class-validator)
 */
export class ValidationErrorSchema {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: ['email must be an email', 'firstName should not be empty'],
    description: 'Array of validation error messages',
  })
  message: string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
