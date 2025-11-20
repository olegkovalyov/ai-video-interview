import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { LoggerService } from '../../../../core/logging/logger.service';
import { UserServiceClient } from '../../clients/user-service.client';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../../core/auth/decorators/current-user.decorator';
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillDto,
  SkillsListResponseDto,
  SkillCategoryDto,
  SkillDeleteResponseDto,
} from '../../dto';

/**
 * Admin Skills Controller
 * 
 * Управление скиллами (только Admin):
 * - CRUD операции над скиллами
 * - Получение категорий скиллов
 * - Активация/деактивация скиллов
 * 
 * Все методы требуют JWT auth и Admin роль
 */
@ApiTags('Admin - Skills')
@ApiBearerAuth()
@Controller('api/admin/skills')
@UseGuards(JwtAuthGuard)
export class AdminSkillsController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * POST /api/admin/skills
   * Create new skill
   * 
   * curl -X POST http://localhost:8001/api/admin/skills \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"name":"TypeScript","slug":"typescript","categoryId":"uuid","description":"Typed JS"}'
   */
  @Post()
  @ApiOperation({
    summary: 'Create new skill',
    description: 'Creates a new skill (Admin only). Skill must have unique name and slug.',
  })
  @ApiResponse({
    status: 201,
    description: 'Skill created successfully',
    type: SkillDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 409, description: 'Skill already exists' })
  async createSkill(
    @Body() dto: CreateSkillDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SkillDto> {
    this.loggerService.info('Admin: Creating new skill', {
      adminId: user.userId,
      skillName: dto.name,
      slug: dto.slug,
    });

    try {
      const skill = await this.userServiceClient.createSkill(dto, user.userId);

      this.loggerService.info('Admin: Skill created successfully', {
        adminId: user.userId,
        skillId: skill.id,
        skillName: skill.name,
      });

      return skill;
    } catch (error) {
      this.loggerService.error('Admin: Failed to create skill', error, {
        adminId: user.userId,
        skillName: dto.name,
      });
      throw error;
    }
  }

  /**
   * GET /api/admin/skills
   * List skills with pagination and filters
   * 
   * curl http://localhost:8001/api/admin/skills?page=1&limit=20&search=Type&categoryId=uuid \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get()
  @ApiOperation({
    summary: 'List skills with filters',
    description: 'Returns paginated list of skills with optional filters (Admin only).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by skill name',
    example: 'Type',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Skills list retrieved successfully',
    type: SkillsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async listSkills(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<SkillsListResponseDto> {
    this.loggerService.info('Admin: Listing skills', {
      page,
      limit,
      search,
      categoryId,
      isActive,
    });

    try {
      const result = await this.userServiceClient.listSkills({
        page,
        limit,
        search,
        categoryId,
        isActive,
      });

      this.loggerService.info('Admin: Skills list retrieved', {
        total: result.pagination.total,
        page: result.pagination.page,
        returned: result.data.length,
      });

      return result;
    } catch (error) {
      this.loggerService.error('Admin: Failed to list skills', error);
      throw error;
    }
  }

  /**
   * GET /api/admin/skills/:id
   * Get skill by ID
   * 
   * curl http://localhost:8001/api/admin/skills/<uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get skill by ID',
    description: 'Returns detailed skill information (Admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill found',
    type: SkillDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async getSkill(@Param('id') id: string): Promise<SkillDto> {
    this.loggerService.info('Admin: Getting skill', { skillId: id });

    try {
      const skill = await this.userServiceClient.getSkill(id);

      this.loggerService.info('Admin: Skill retrieved', {
        skillId: skill.id,
        skillName: skill.name,
      });

      return skill;
    } catch (error) {
      this.loggerService.error('Admin: Failed to get skill', error, { skillId: id });
      throw error;
    }
  }

  /**
   * PUT /api/admin/skills/:id
   * Update skill
   * 
   * curl -X PUT http://localhost:8001/api/admin/skills/<uuid> \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"name":"TypeScript Advanced","description":"Updated description"}'
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update skill',
    description: 'Updates skill name, description, or category (Admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async updateSkill(
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    this.loggerService.info('Admin: Updating skill', {
      adminId: user.userId,
      skillId: id,
      updates: dto,
    });

    try {
      const result = await this.userServiceClient.updateSkill(id, dto, user.userId);

      this.loggerService.info('Admin: Skill updated successfully', {
        adminId: user.userId,
        skillId: id,
        success: result?.success,
      });

      return { success: !!result?.success };
    } catch (error) {
      this.loggerService.error('Admin: Failed to update skill', error, {
        adminId: user.userId,
        skillId: id,
      });
      throw error;
    }
  }

  /**
   * POST /api/admin/skills/:id/toggle
   * Toggle skill active status
   * 
   * curl -X POST http://localhost:8001/api/admin/skills/<uuid>/toggle \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Post(':id/toggle')
  @ApiOperation({
    summary: 'Toggle skill active status',
    description: 'Activates or deactivates a skill (Admin only). Deactivated skills are hidden from candidates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill status toggled successfully',
    type: SkillDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async toggleSkillStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SkillDto> {
    this.loggerService.info('Admin: Toggling skill status', {
      adminId: user.userId,
      skillId: id,
    });

    try {
      const skill = await this.userServiceClient.toggleSkillStatus(id, user.userId);

      this.loggerService.info('Admin: Skill status toggled', {
        adminId: user.userId,
        skillId: skill.id,
        isActive: skill.isActive,
      });

      return skill;
    } catch (error) {
      this.loggerService.error('Admin: Failed to toggle skill status', error, {
        adminId: user.userId,
        skillId: id,
      });
      throw error;
    }
  }

  /**
   * DELETE /api/admin/skills/:id
   * Delete skill
   * 
   * curl -X DELETE http://localhost:8001/api/admin/skills/<uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete skill',
    description: 'Deletes a skill (Admin only). This is a hard delete and will fail if skill is used by candidates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill deleted successfully',
    type: SkillDeleteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Skill is in use by candidates' })
  async deleteSkill(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SkillDeleteResponseDto> {
    this.loggerService.info('Admin: Deleting skill', {
      adminId: user.userId,
      skillId: id,
    });

    try {
      const result = await this.userServiceClient.deleteSkill(id, user.userId);

      this.loggerService.info('Admin: Skill deleted successfully', {
        adminId: user.userId,
        skillId: id,
      });

      return result;
    } catch (error) {
      this.loggerService.error('Admin: Failed to delete skill', error, {
        adminId: user.userId,
        skillId: id,
      });
      throw error;
    }
  }

  /**
   * POST /api/admin/skills/:id/activate
   * Activate a deactivated skill
   * 
   * curl -X POST http://localhost:8001/api/admin/skills/<uuid>/activate \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate skill',
    description: 'Activates a deactivated skill, making it visible and available for candidates (Admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill activated successfully',
    type: SkillDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async activateSkill(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean; data: SkillDto }> {
    this.loggerService.info('Admin: Activating skill', {
      adminId: user.userId,
      skillId: id,
    });

    try {
      const result = await this.userServiceClient.activateSkill(id, user.userId);

      this.loggerService.info('Admin: Skill activated successfully', {
        adminId: user.userId,
        skillId: id,
      });

      return result;
    } catch (error) {
      this.loggerService.error('Admin: Failed to activate skill', error, {
        adminId: user.userId,
        skillId: id,
      });
      throw error;
    }
  }

  /**
   * POST /api/admin/skills/:id/deactivate
   * Deactivate an active skill
   * 
   * curl -X POST http://localhost:8001/api/admin/skills/<uuid>/deactivate \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate skill',
    description: 'Deactivates an active skill, hiding it from candidates. Existing candidate skills remain intact (Admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill deactivated successfully',
    type: SkillDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async deactivateSkill(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean; data: SkillDto }> {
    this.loggerService.info('Admin: Deactivating skill', {
      adminId: user.userId,
      skillId: id,
    });

    try {
      const result = await this.userServiceClient.deactivateSkill(id, user.userId);

      this.loggerService.info('Admin: Skill deactivated successfully', {
        adminId: user.userId,
        skillId: id,
      });

      return result;
    } catch (error) {
      this.loggerService.error('Admin: Failed to deactivate skill', error, {
        adminId: user.userId,
        skillId: id,
      });
      throw error;
    }
  }
}
