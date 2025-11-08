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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
  extractPrimaryRole,
} from '../../../core/auth/decorators/current-user.decorator';
import { InterviewServiceClient } from '../clients/interview-service.client';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  AddQuestionDto,
  ReorderQuestionsDto,
  ListTemplatesQuery,
} from '../clients/interview-service.client';

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
  async list(
    @Query('status') status?: 'draft' | 'active' | 'archived',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const role = extractPrimaryRole(user!);
    const query: ListTemplatesQuery = {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return this.interviewService.listTemplates(user!.userId, role, query);
  }

  /**
   * GET /api/templates/:id
   * Get template by ID with all questions
   * 
   * curl http://localhost:8001/api/templates/<uuid> \
   *   -H "Authorization: Bearer <jwt>"
   */
  @Get(':id')
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
  async reorderQuestions(
    @Param('id') templateId: string,
    @Body() dto: ReorderQuestionsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    const role = extractPrimaryRole(user);
    await this.interviewService.reorderQuestions(templateId, dto, user.userId, role);
  }
}
