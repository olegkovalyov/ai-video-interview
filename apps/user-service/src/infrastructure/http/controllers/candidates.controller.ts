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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

// Guards
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';

// Commands
import { AddCandidateSkillCommand } from '../../../application/commands/candidate/add-candidate-skill/add-candidate-skill.command';
import { UpdateCandidateSkillCommand } from '../../../application/commands/candidate/update-candidate-skill/update-candidate-skill.command';
import { RemoveCandidateSkillCommand } from '../../../application/commands/candidate/remove-candidate-skill/remove-candidate-skill.command';
import { UpdateCandidateExperienceLevelCommand } from '../../../application/commands/candidate/update-experience-level/update-experience-level.command';

// Queries
import { SearchCandidatesBySkillsQuery } from '../../../application/queries/candidate/search-candidates-by-skills.query';
import { GetCandidateProfileQuery } from '../../../application/queries/candidate/get-candidate-profile.query';
import { GetCandidateSkillsQuery } from '../../../application/queries/candidate/get-candidate-skills.query';

// DTOs
import {
  SearchCandidatesDto,
  AddCandidateSkillDto,
  UpdateCandidateSkillDto,
  UpdateExperienceLevelDto,
} from '../dto/candidates.dto';
import {
  CandidateSearchResultsResponseDto,
  CandidateProfileSuccessResponseDto,
  CandidateSkillsSuccessResponseDto,
} from '../dto/candidates.response.dto';

// Mappers
import { CandidateResponseMapper } from '../mappers/candidate.response.mapper';

// Error Schemas
import {
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  NotFoundErrorSchema,
} from '../schemas/error.schemas';

/**
 * Candidates Controller
 *
 * Candidate Profile & Skills Management API
 * Protected by InternalServiceGuard (x-internal-token)
 *
 * Endpoints:
 * - GET    /candidates/search                      - Search candidates by skills (HR)
 * - GET    /candidates/:userId/profile             - Get candidate profile
 * - GET    /candidates/:userId/skills              - Get candidate skills grouped by category
 * - POST   /candidates/:userId/skills              - Add skill to candidate
 * - PUT    /candidates/:userId/skills/:skillId     - Update candidate skill
 * - DELETE /candidates/:userId/skills/:skillId     - Remove skill from candidate
 */
@ApiTags('candidates')
@Controller('candidates')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class CandidatesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================
  // 🔍 SEARCH - для HR
  // ============================================

  @Get('search')
  @ApiOperation({
    summary: 'Search candidates by skills (HR)',
    description:
      'Search candidates with filters: skills, proficiency, experience level. Returns paginated results with match scores.',
  })
  @ApiQuery({
    name: 'skillIds',
    required: false,
    type: [String],
    description: 'Array of skill IDs to search for',
  })
  @ApiQuery({
    name: 'minProficiency',
    required: false,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    description: 'Minimum proficiency level',
  })
  @ApiQuery({
    name: 'minYears',
    required: false,
    type: Number,
    description: 'Minimum years of experience',
  })
  @ApiQuery({
    name: 'experienceLevel',
    required: false,
    enum: ['junior', 'mid', 'senior', 'lead'],
    description: 'Candidate experience level',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    type: CandidateSearchResultsResponseDto,
    description: 'Search results with pagination',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing internal token',
  })
  async searchCandidates(@Query() query: SearchCandidatesDto) {
    const result = await this.queryBus.execute(
      new SearchCandidatesBySkillsQuery({
        skillIds: query.skillIds ?? [],
        minProficiency: query.minProficiency,
        minYears: query.minYears ? Number(query.minYears) : undefined,
        experienceLevel: query.experienceLevel,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      }),
    );

    return {
      success: true,
      data: CandidateResponseMapper.toSearchResultsDto(result.data),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  // ============================================
  // Profile & Skills Queries
  // ============================================

  @Get(':userId/profile')
  @ApiOperation({
    summary: 'Get candidate profile',
    description:
      'Get candidate profile with user info. Access control: own profile, HR, or Admin.',
  })
  @ApiResponse({
    status: 200,
    type: CandidateProfileSuccessResponseDto,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing internal token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not authorized to view this profile',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getCandidateProfile(
    @Param('userId') userId: string,
    @Query('currentUserId') currentUserId?: string,
    @Query('isHR') isHR?: boolean,
    @Query('isAdmin') isAdmin?: boolean,
  ) {
    const result = await this.queryBus.execute(
      new GetCandidateProfileQuery(userId, currentUserId, isHR, isAdmin),
    );

    return {
      success: true,
      data: CandidateResponseMapper.toProfileDto(result),
    };
  }

  @Get(':userId/skills')
  @ApiOperation({
    summary: 'Get candidate skills grouped by category',
    description:
      'Returns all candidate skills organized by skill categories. Access control: own skills, HR, or Admin.',
  })
  @ApiResponse({
    status: 200,
    type: CandidateSkillsSuccessResponseDto,
    description: 'Skills retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing internal token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not authorized to view these skills',
  })
  async getCandidateSkills(
    @Param('userId') candidateId: string,
    @Query('currentUserId') currentUserId?: string,
    @Query('isHR') isHR?: boolean,
    @Query('isAdmin') isAdmin?: boolean,
  ) {
    const result = await this.queryBus.execute(
      new GetCandidateSkillsQuery(candidateId, currentUserId, isHR, isAdmin),
    );

    return {
      success: true,
      data: CandidateResponseMapper.toSkillsByCategoryDto(result),
    };
  }

  // ============================================
  // Skill Commands
  // ============================================

  @Post(':userId/skills')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add skill to candidate',
    description:
      'Add a new skill to candidate profile with proficiency level and years of experience.',
  })
  @ApiBody({ type: AddCandidateSkillDto })
  @ApiResponse({ status: 201, description: 'Skill added successfully' })
  @ApiResponse({
    status: 400,
    type: BadRequestErrorSchema,
    description: 'Invalid input data or skill already exists',
  })
  @ApiResponse({
    status: 401,
    type: UnauthorizedErrorSchema,
    description: 'Unauthorized - invalid or missing internal token',
  })
  @ApiResponse({
    status: 404,
    type: NotFoundErrorSchema,
    description: 'User or skill not found',
  })
  @ApiResponse({ status: 409, description: 'Skill already added to candidate' })
  async addCandidateSkill(
    @Param('userId') candidateId: string,
    @Body() dto: AddCandidateSkillDto,
  ) {
    const result = await this.commandBus.execute(
      new AddCandidateSkillCommand({
        candidateId,
        skillId: dto.skillId,
        description: dto.description ?? null,
        proficiencyLevel: dto.proficiencyLevel ?? 'beginner',
        yearsOfExperience: dto.yearsOfExperience ?? 0,
      }),
    );

    return {
      success: true,
      data: result,
    };
  }

  @Put(':userId/skills/:skillId')
  @ApiOperation({
    summary: 'Update candidate skill',
    description:
      'Update skill description, proficiency level, or years of experience.',
  })
  @ApiBody({ type: UpdateCandidateSkillDto })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  @ApiResponse({
    status: 400,
    type: BadRequestErrorSchema,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    type: UnauthorizedErrorSchema,
    description: 'Unauthorized - invalid or missing internal token',
  })
  @ApiResponse({
    status: 404,
    type: NotFoundErrorSchema,
    description: 'User or candidate skill not found',
  })
  async updateCandidateSkill(
    @Param('userId') candidateId: string,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateCandidateSkillDto,
  ) {
    if (
      !dto.description &&
      !dto.proficiencyLevel &&
      dto.yearsOfExperience === undefined
    ) {
      throw new BadRequestException({
        success: false,
        error: 'At least one field must be provided for update',
        code: 'NO_FIELDS_TO_UPDATE',
      });
    }

    await this.commandBus.execute(
      new UpdateCandidateSkillCommand({
        candidateId,
        skillId,
        description: dto.description ?? null,
        proficiencyLevel: dto.proficiencyLevel ?? 'beginner',
        yearsOfExperience: dto.yearsOfExperience ?? 0,
      }),
    );

    return {
      success: true,
      message: 'Skill updated successfully',
    };
  }

  @Delete(':userId/skills/:skillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove skill from candidate',
    description: 'Remove a skill from candidate profile.',
  })
  @ApiResponse({ status: 204, description: 'Skill removed successfully' })
  @ApiResponse({
    status: 401,
    type: UnauthorizedErrorSchema,
    description: 'Unauthorized - invalid or missing internal token',
  })
  @ApiResponse({
    status: 404,
    type: NotFoundErrorSchema,
    description: 'User or candidate skill not found',
  })
  async removeCandidateSkill(
    @Param('userId') candidateId: string,
    @Param('skillId') skillId: string,
  ) {
    await this.commandBus.execute(
      new RemoveCandidateSkillCommand(candidateId, skillId),
    );
  }

  @Put(':userId/experience-level')
  @ApiOperation({
    summary: 'Update candidate experience level',
    description:
      'Updates the overall experience level of a candidate (junior, mid, senior, lead).',
  })
  @ApiBody({ type: UpdateExperienceLevelDto })
  @ApiResponse({
    status: 200,
    type: CandidateProfileSuccessResponseDto,
    description: 'Experience level updated successfully',
  })
  @ApiResponse({
    status: 400,
    type: BadRequestErrorSchema,
    description: 'Invalid experience level',
  })
  @ApiResponse({
    status: 401,
    type: UnauthorizedErrorSchema,
    description: 'Unauthorized - invalid or missing internal token',
  })
  @ApiResponse({
    status: 404,
    type: NotFoundErrorSchema,
    description: 'Candidate profile not found',
  })
  async updateExperienceLevel(
    @Param('userId') userId: string,
    @Body() dto: UpdateExperienceLevelDto,
  ) {
    await this.commandBus.execute(
      new UpdateCandidateExperienceLevelCommand(userId, dto.experienceLevel),
    );

    // Pass userId as currentUserId to bypass permission check.
    const result = await this.queryBus.execute(
      new GetCandidateProfileQuery(userId, userId),
    );

    return {
      success: true,
      data: CandidateResponseMapper.toProfileDto(result),
    };
  }
}
