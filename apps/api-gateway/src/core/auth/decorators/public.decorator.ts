import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark endpoints as public (skip JWT authentication)
 * Used for bootstrap/setup endpoints that need to run without authentication
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
