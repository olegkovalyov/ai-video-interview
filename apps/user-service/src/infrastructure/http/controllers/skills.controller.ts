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
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';

// Guards
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';

// Commands
import { CreateSkillCommand } from '../../../application/commands/admin/create-skill/create-skill.command';
import { UpdateSkillCommand } from '../../../application/commands/admin/update-skill/update-skill.command';
import { DeleteSkillCommand } from '../../../application/commands/admin/delete-skill/delete-skill.command';

// Queries
import { ListSkillsQuery } from '../../../application/queries/skills/list-skills/list-skills.query';
import { GetSkillQuery } from '../../../application/queries/skills/get-skill/get-skill.query';
import { ListSkillCategoriesQuery } from '../../../application/queries/skills/list-categories/list-categories.query';

// DTOs
import { CreateSkillDto, UpdateSkillDto, ListSkillsDto } from '../dto/skills.dto';

// Mappers
import { SkillResponseMapper } from '../mappers/skill.response.mapper';

/**
 * Skills Controller
 * 
 * Admin Skills Management API
 * Protected by InternalServiceGuard (x-internal-token)
 * 
 * Endpoints:
 * - POST   /skills                  - Create new skill
 * - GET    /skills                  - List skills with filters
 * - GET    /skills/categories       - List skill categories
 * - GET    /skills/:id              - Get skill by ID
 * - PUT    /skills/:id              - Update skill
 * - DELETE /skills/:id              - Delete skill
 */
@ApiTags('skills')
@Controller('skills')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class SkillsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================
  // Commands
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new skill' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 409, description: 'Skill already exists' })
  async createSkill(
    @Body() dto: CreateSkillDto,
  ) {
    try {
      const command = new CreateSkillCommand(
        dto.name,
        dto.slug,
        dto.categoryId || null,
        dto.description || null,
        dto.adminId || 'system', // adminId для логирования
      );

      const result = await this.commandBus.execute(command);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new ConflictException({
          success: false,
          error: error.message,
          code: 'SKILL_ALREADY_EXISTS',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update skill' })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async updateSkill(
    @Param('id') skillId: string,
    @Body() dto: UpdateSkillDto,
  ) {
    try {
      const command = new UpdateSkillCommand(
        skillId,
        dto.name || '',
        dto.description || null,
        dto.categoryId || null,
        dto.adminId || 'system',
      );

      const result = await this.commandBus.execute(command);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          error: error.message,
          code: 'SKILL_NOT_FOUND',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete skill' })
  @ApiResponse({ status: 204, description: 'Skill deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async deleteSkill(
    @Param('id') skillId: string,
    @Query('adminId') adminId?: string,
  ) {
    try {
      const command = new DeleteSkillCommand(skillId, adminId || 'system');
      await this.commandBus.execute(command);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          error: error.message,
          code: 'SKILL_NOT_FOUND',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  // ============================================
  // Queries
  // ============================================

  @Get()
  @ApiOperation({ summary: 'List skills with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by skill name' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by skill category ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Skills list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  async listSkills(
    @Query() query: ListSkillsDto,
  ) {
    const listSkillsQuery = new ListSkillsQuery(
      query.page || 1,
      query.limit || 20,
      query.categoryId,
      query.isActive,
      query.search,
    );

    const result = await this.queryBus.execute(listSkillsQuery);

    return {
      success: true,
      data: SkillResponseMapper.toSkillListDto(result.data),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all skill categories' })
  @ApiResponse({ status: 200, description: 'Categories list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  async listCategories() {
    const query = new ListSkillCategoriesQuery();
    const result = await this.queryBus.execute(query);

    return {
      success: true,
      data: SkillResponseMapper.toCategoryListDto(result),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by ID' })
  @ApiResponse({ status: 200, description: 'Skill retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async getSkill(@Param('id') skillId: string) {
    try {
      const query = new GetSkillQuery(skillId);
      const result = await this.queryBus.execute(query);

      return {
        success: true,
        data: SkillResponseMapper.toSkillWithCategoryDto(result),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          error: error.message,
          code: 'SKILL_NOT_FOUND',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }
}
