import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { LoggerService } from '../../../core/logging/logger.service';
import { UserServiceClient } from '../clients/user-service.client';
import { SkillCategoryDto } from '../dto';

/**
 * Skills Controller
 * 
 * Общие эндпоинты для скиллов:
 * - Получение категорий скиллов
 * 
 * Требуется JWT auth (доступно всем авторизованным пользователям)
 */
@ApiTags('Skills')
@ApiBearerAuth()
@Controller('api/skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * GET /api/skills/categories
   * Get all skill categories
   * 
   * curl http://localhost:8001/api/skills/categories \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get('categories')
  @ApiOperation({
    summary: 'Get skill categories',
    description: 'Returns list of all skill categories with skills count. Available to all authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [SkillCategoryDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  async getCategories(): Promise<SkillCategoryDto[]> {
    this.loggerService.info('Getting skill categories');

    try {
      const categories = await this.userServiceClient.listSkillCategories();

      this.loggerService.info('Categories retrieved', {
        count: categories.length,
      });

      return categories;
    } catch (error) {
      this.loggerService.error('Failed to get categories', error);
      throw error;
    }
  }
}
