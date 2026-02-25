import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/guards/roles.decorator';
import { UserServiceClient } from '../clients/user-service.client';
import { LoggerService } from '../../../core/logging/logger.service';

/**
 * HR Controller
 * Endpoints for HR users to search candidates
 */
@ApiTags('HR')
@ApiBearerAuth()
@Controller('api/hr')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('hr', 'admin')
export class HRController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * GET /api/hr/candidates/search
   * Search candidates by skills (HR only)
   */
  @Get('candidates/search')
  @ApiOperation({
    summary: 'Search candidates by skills',
    description: 'Search for candidates based on skills, proficiency level, experience. HR and Admin only.',
  })
  @ApiQuery({ name: 'skillIds', required: false, type: [String], description: 'Array of skill IDs to search for' })
  @ApiQuery({ name: 'minProficiency', required: false, enum: ['beginner', 'intermediate', 'advanced', 'expert'], description: 'Minimum proficiency level' })
  @ApiQuery({ name: 'minYears', required: false, type: Number, description: 'Minimum years of experience' })
  @ApiQuery({ name: 'experienceLevel', required: false, enum: ['junior', 'mid', 'senior', 'lead'], description: 'Candidate experience level' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Search results with pagination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR or Admin role required' })
  async searchCandidates(
    @Req() req: Request & { user?: any },
    @Query('skillIds') skillIds?: string | string[],
    @Query('minProficiency') minProficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    @Query('minYears') minYears?: string,
    @Query('experienceLevel') experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.userId;

    this.loggerService.info('HR: Searching candidates', {
      userId,
      skillIds,
      minProficiency,
      minYears,
      experienceLevel,
    });

    try {
      // Normalize skillIds to array
      const skillIdsArray = skillIds
        ? (Array.isArray(skillIds) ? skillIds : [skillIds])
        : [];

      const result = await this.userServiceClient.searchCandidates({
        skillIds: skillIdsArray,
        minProficiency,
        minYears: minYears ? parseInt(minYears, 10) : undefined,
        experienceLevel,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      this.loggerService.info('HR: Candidates search completed', {
        userId,
        total: result.pagination.total,
      });

      return result;
    } catch (error) {
      this.loggerService.error('HR: Failed to search candidates', error);
      throw error;
    }
  }
}
