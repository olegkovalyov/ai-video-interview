import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
  extractPrimaryRole,
} from '../../../core/auth/decorators/current-user.decorator';
import { InterviewServiceClient, ListTemplatesQuery } from '../clients/interview-service.client';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateTemplateResponseDto,
  TemplateResponseDto,
  PaginatedTemplatesResponseDto,
  PublishTemplateResponseDto,
} from '../dto/template.dto';
import {
  AddQuestionDto,
  AddQuestionResponseDto,
  ReorderQuestionsDto,
  GetQuestionsResponseDto,
} from '../dto/question.dto';
import { ListTemplatesQueryDto } from '../dto/list-templates-query.dto';

/**
 * Templates Controller
 * Proxies interview template requests to Interview Service
 * 
 * All endpoints:
 * - Require JWT authentication (@UseGuards(JwtAuthGuard))
 * - Extract userId and role from JWT payload
 * - Forward requests to Interview Service with user context
 * - Interview Service handles RBAC and ownership checks
 */
@ApiTags('Templates')
@ApiBearerAuth()
@Controller('api/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly interviewService: InterviewServiceClient) {}

  /**
   * POST /api/templates
   * Create new interview template
   * 
   * curl -X POST http://localhost:8001/api/templates \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "title": "Senior Developer Interview",
   *     "description": "Comprehensive interview for senior backend developers",
   *     "settings": {
   *       "totalTimeLimit": 60,
   *       "allowRetakes": false,
   *       "showTimer": true,
   *       "randomizeQuestions": false
   *     }
   *   }'
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create interview template',
    description: 'Creates a new interview template (HR and Admin only). Template starts in draft status.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Template created successfully',
    type: CreateTemplateResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions (requires HR or Admin role)' })
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ id: string }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.createTemplate(dto, user.userId, role);
  }

  /**
   * GET /api/templates
   * List templates with pagination
   * 
   * curl http://localhost:8001/api/templates?status=active&page=1&limit=10 \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get()
  @ApiOperation({ 
    summary: 'List interview templates',
    description: 'Get paginated list of templates. HR sees only their templates, Admin sees all.'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'active', 'archived'], description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 1000)', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'List of templates',
    type: PaginatedTemplatesResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Query() query: ListTemplatesQueryDto,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const role = extractPrimaryRole(user!);
    const listQuery: ListTemplatesQuery = {
      status: query.status,
      page: query.page,
      limit: query.limit,
    };
    return this.interviewService.listTemplates(user!.userId, role, listQuery);
  }

  /**
   * GET /api/templates/:id
   * Get template by ID with all questions
   * 
   * curl http://localhost:8001/api/templates/<uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get template by ID',
    description: 'Retrieve a specific template with all questions. HR can only access their own templates.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template found',
    type: TemplateResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const role = extractPrimaryRole(user);
    return this.interviewService.getTemplate(id, user.userId, role);
  }

  /**
   * PUT /api/templates/:id
   * Update template metadata
   * 
   * curl -X PUT http://localhost:8001/api/templates/<uuid> \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "title": "Updated Title",
   *     "description": "Updated description"
   *   }'
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Update template',
    description: 'Update template title, description, or settings. Only the owner can update.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template updated',
    type: TemplateResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const role = extractPrimaryRole(user);
    return this.interviewService.updateTemplate(id, dto, user.userId, role);
  }

  /**
   * DELETE /api/templates/:id
   * Archive template (soft delete)
   * 
   * curl -X DELETE http://localhost:8001/api/templates/<uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete template',
    description: 'Soft delete (archive) an interview template. Only the owner can delete.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 204, 
    description: 'Template deleted (archived)'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData): Promise<void> {
    const role = extractPrimaryRole(user);
    await this.interviewService.deleteTemplate(id, user.userId, role);
  }

  /**
   * PUT /api/templates/:id/publish
   * Publish template (draft → active)
   * 
   * curl -X PUT http://localhost:8001/api/templates/<uuid>/publish \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Put(':id/publish')
  @ApiOperation({ 
    summary: 'Publish template',
    description: 'Change template status from draft to active. Only the owner can publish.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template published',
    type: PublishTemplateResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async publish(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const role = extractPrimaryRole(user);
    return this.interviewService.publishTemplate(id, user.userId, role);
  }

  // ════════════════════════════════════════════════════════════════
  // Questions Management
  // ════════════════════════════════════════════════════════════════

  /**
   * POST /api/templates/:id/questions
   * Add question to template
   * 
   * curl -X POST http://localhost:8001/api/templates/<uuid>/questions \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "text": "Describe your experience with microservices",
   *     "type": "video",
   *     "order": 1,
   *     "timeLimit": 180,
   *     "required": true,
   *     "hints": "Focus on real-world examples"
   *   }'
   */
  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add question to template',
    description: 'Add a new question to the interview template. Supports video, text, and multiple choice types.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 201, 
    description: 'Question added',
    type: AddQuestionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async addQuestion(
    @Param('id') templateId: string,
    @Body() dto: AddQuestionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ id: string }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.addQuestion(templateId, dto, user.userId, role);
  }

  /**
   * GET /api/templates/:id/questions
   * Get all questions for template
   * 
   * curl http://localhost:8001/api/templates/<uuid>/questions \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get(':id/questions')
  @ApiOperation({ 
    summary: 'Get template questions',
    description: 'Retrieve all questions for a template'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of questions',
    type: GetQuestionsResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getQuestions(@Param('id') templateId: string, @CurrentUser() user: CurrentUserData) {
    const role = extractPrimaryRole(user);
    return this.interviewService.getQuestions(templateId, user.userId, role);
  }

  /**
   * DELETE /api/templates/:id/questions/:questionId
   * Remove question from template
   * 
   * curl -X DELETE http://localhost:8001/api/templates/<uuid>/questions/<question-uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Delete(':id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove question from template',
    description: 'Delete a question from the interview template. Only the owner can remove questions.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiParam({ name: 'questionId', description: 'Question ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 204, 
    description: 'Question removed'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template or question not found' })
  async removeQuestion(
    @Param('id') templateId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    const role = extractPrimaryRole(user);
    await this.interviewService.removeQuestion(templateId, questionId, user.userId, role);
  }

  /**
   * PATCH /api/templates/:id/questions/reorder
   * Reorder questions in template
   * 
   * curl -X PATCH http://localhost:8001/api/templates/<uuid>/questions/reorder \
   *   -H "Authorization: Bearer <jwt>" \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "questionIds": ["q3-uuid", "q1-uuid", "q2-uuid"]
   *   }'
   */
  @Patch(':id/questions/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Reorder questions in template',
    description: 'Reorder all questions by providing question IDs in desired order. Must include all questions. Uses batch UPDATE for performance.'
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', format: 'uuid' })
  @ApiResponse({ 
    status: 204, 
    description: 'Questions reordered successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question IDs or count mismatch' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async reorderQuestions(
    @Param('id') templateId: string,
    @Body() dto: ReorderQuestionsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    const role = extractPrimaryRole(user);
    await this.interviewService.reorderQuestions(templateId, dto, user.userId, role);
  }
}
