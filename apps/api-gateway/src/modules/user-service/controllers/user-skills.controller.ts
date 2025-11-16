import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { LoggerService } from '../../../core/logging/logger.service';
import { UserServiceClient } from '../clients/user-service.client';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import {
  AddCandidateSkillDto,
  UpdateCandidateSkillDto,
  CandidateSkillsByCategoryDto,
  SkillDeleteResponseDto,
} from '../dto';

/**
 * User Skills Controller
 * 
 * Управление своими скиллами (Candidate):
 * - Просмотр своих скиллов
 * - Добавление скиллов в профиль
 * - Обновление уровня владения
 * - Удаление скиллов
 * 
 * Все методы требуют JWT auth
 */
@ApiTags('Users - Skills')
@ApiBearerAuth()
@Controller('api/me/skills')
@UseGuards(JwtAuthGuard)
export class UserSkillsController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * GET /api/me/skills
   * Get my skills grouped by category
   * 
   * curl http://localhost:8001/api/me/skills \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get()
  @ApiOperation({
    summary: 'Get my skills',
    description: 'Returns current user skills grouped by category with proficiency levels and experience.',
  })
  @ApiResponse({
    status: 200,
    description: 'Skills retrieved successfully',
    type: [CandidateSkillsByCategoryDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  async getMySkills(
    @CurrentUser() user: CurrentUserData,
  ): Promise<CandidateSkillsByCategoryDto[]> {
    this.loggerService.info('User: Getting my skills', {
      userId: user.userId,
    });

    try {
      const skills = await this.userServiceClient.getCandidateSkills(user.userId);

      this.loggerService.info('User: Skills retrieved', {
        userId: user.userId,
        categoriesCount: skills.length,
        totalSkills: skills.reduce((sum, cat) => sum + cat.skills.length, 0),
      });

      return skills;
    } catch (error) {
      this.loggerService.error('User: Failed to get skills', error, {
        userId: user.userId,
      });
      throw error;
    }
  }

  /**
   * POST /api/me/skills
   * Add skill to my profile
   * 
   * curl -X POST http://localhost:8001/api/me/skills \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"skillId":"uuid","proficiencyLevel":"intermediate","yearsOfExperience":2,"description":"Used in production"}'
   */
  @Post()
  @ApiOperation({
    summary: 'Add skill to profile',
    description: 'Adds a new skill to current user profile with proficiency level and experience.',
  })
  @ApiResponse({
    status: 201,
    description: 'Skill added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 409, description: 'Skill already added to profile' })
  async addSkill(
    @Body() dto: AddCandidateSkillDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean; message: string }> {
    this.loggerService.info('User: Adding skill to profile', {
      userId: user.userId,
      skillId: dto.skillId,
      proficiencyLevel: dto.proficiencyLevel,
    });

    try {
      const result = await this.userServiceClient.addCandidateSkill(
        user.userId,
        dto,
      );

      this.loggerService.info('User: Skill added successfully', {
        userId: user.userId,
        skillId: dto.skillId,
      });

      return result;
    } catch (error) {
      this.loggerService.error('User: Failed to add skill', error, {
        userId: user.userId,
        skillId: dto.skillId,
      });
      throw error;
    }
  }

  /**
   * PUT /api/me/skills/:skillId
   * Update my skill proficiency
   * 
   * curl -X PUT http://localhost:8001/api/me/skills/<uuid> \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"proficiencyLevel":"expert","yearsOfExperience":5,"description":"Updated experience"}'
   */
  @Put(':skillId')
  @ApiOperation({
    summary: 'Update my skill',
    description: 'Updates skill proficiency level, years of experience, or description.',
  })
  @ApiParam({
    name: 'skillId',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Skill not found in profile' })
  async updateSkill(
    @Param('skillId') skillId: string,
    @Body() dto: UpdateCandidateSkillDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean; message: string }> {
    this.loggerService.info('User: Updating skill', {
      userId: user.userId,
      skillId,
      updates: dto,
    });

    try {
      const result = await this.userServiceClient.updateCandidateSkill(
        user.userId,
        skillId,
        dto,
      );

      this.loggerService.info('User: Skill updated successfully', {
        userId: user.userId,
        skillId,
      });

      return result;
    } catch (error) {
      this.loggerService.error('User: Failed to update skill', error, {
        userId: user.userId,
        skillId,
      });
      throw error;
    }
  }

  /**
   * DELETE /api/me/skills/:skillId
   * Remove skill from my profile
   * 
   * curl -X DELETE http://localhost:8001/api/me/skills/<uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Delete(':skillId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove skill from profile',
    description: 'Removes a skill from current user profile.',
  })
  @ApiParam({
    name: 'skillId',
    description: 'Skill ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill removed successfully',
    type: SkillDeleteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Skill not found in profile' })
  async removeSkill(
    @Param('skillId') skillId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SkillDeleteResponseDto> {
    this.loggerService.info('User: Removing skill from profile', {
      userId: user.userId,
      skillId,
    });

    try {
      const result = await this.userServiceClient.removeCandidateSkill(
        user.userId,
        skillId,
      );

      this.loggerService.info('User: Skill removed successfully', {
        userId: user.userId,
        skillId,
      });

      return result;
    } catch (error) {
      this.loggerService.error('User: Failed to remove skill', error, {
        userId: user.userId,
        skillId,
      });
      throw error;
    }
  }
}
