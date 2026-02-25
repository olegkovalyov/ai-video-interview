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
  Headers,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InternalServiceGuard } from '../guards/internal-service.guard';
import {
  CreateTemplateDto,
  AddQuestionDto,
  ReorderQuestionsDto,
  UpdateTemplateDto,
  ListTemplatesQueryDto,
  TemplateResponseDto,
  PaginatedTemplatesResponseDto,
} from '../../../application/dto';
import { InterviewSettings } from '../../../domain/value-objects/interview-settings.vo';
import {
  CreateTemplateCommand,
  AddQuestionCommand,
  RemoveQuestionCommand,
  ReorderQuestionsCommand,
  PublishTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
} from '../../../application/commands';
import {
  GetTemplateQuery,
  ListTemplatesQuery,
  GetTemplateQuestionsQuery,
} from '../../../application/queries';

@ApiTags('Templates')
@ApiSecurity('internal-token')
@Controller('api/templates')
@UseGuards(InternalServiceGuard)
export class TemplatesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create interview template', description: 'Creates a new interview template (HR and Admin only)' })
  @ApiResponse({ status: 201, description: 'Template created successfully', schema: { properties: { id: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid internal token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() dto: CreateTemplateDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<{ id: string }> {
    const settings = dto.settings
      ? InterviewSettings.create(dto.settings)
      : undefined;

    const command = new CreateTemplateCommand(
      dto.title,
      dto.description,
      userId,
      settings,
    );

    const templateId = await this.commandBus.execute(command);

    return { id: templateId };
  }

  @Get()
  @ApiOperation({ summary: 'List interview templates', description: 'Get paginated list of templates. HR sees only their templates, Admin sees all.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'active', 'archived'], description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of templates', type: PaginatedTemplatesResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Query() query: ListTemplatesQueryDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<PaginatedTemplatesResponseDto> {
    const listQuery = new ListTemplatesQuery(
      userId,
      role,
      query.status,
      query.page || 1,
      query.limit || 10,
    );

    const result = await this.queryBus.execute(listQuery);

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID', description: 'Retrieve a specific template with all questions' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template found', type: TemplateResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getOne(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<TemplateResponseDto> {
    const query = new GetTemplateQuery(id, userId, role);
    const template = await this.queryBus.execute(query);

    return template;
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add question to template', description: 'Add a new question to the interview template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 201, description: 'Question added', schema: { properties: { id: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 409, description: 'Question with this order already exists' })
  @ApiResponse({ status: 422, description: 'Template is archived and cannot be modified' })
  async addQuestion(
    @Param('id') templateId: string,
    @Body() dto: AddQuestionDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<{ id: string }> {
    const command = new AddQuestionCommand(
      templateId,
      dto.text,
      dto.type,
      dto.order,
      dto.timeLimit,
      dto.required,
      dto.hints,
      dto.options,
      userId,
      role,
    );

    const questionId = await this.commandBus.execute(command);

    return { id: questionId };
  }

  @Delete(':id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove question from template', description: 'Delete a question from the interview template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiParam({ name: 'questionId', type: 'string', format: 'uuid', description: 'Question ID' })
  @ApiResponse({ status: 204, description: 'Question removed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template or question not found' })
  async removeQuestion(
    @Param('id') templateId: string,
    @Param('questionId') questionId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<void> {
    const command = new RemoveQuestionCommand(templateId, questionId, userId, role);
    await this.commandBus.execute(command);
  }

  @Patch(':id/questions/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reorder questions in template',
    description: 'Reorder all questions by providing question IDs in desired order. Uses batch UPDATE for performance.'
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 204, description: 'Questions reordered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question IDs or count mismatch' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async reorderQuestions(
    @Param('id') templateId: string,
    @Body() dto: ReorderQuestionsDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<void> {
    const command = new ReorderQuestionsCommand(templateId, dto.questionIds, userId, role);
    await this.commandBus.execute(command);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish template', description: 'Change template status from draft to active' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template published', schema: { properties: { status: { type: 'string', enum: ['active'] } } } })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 409, description: 'Template is already published' })
  async publish(
    @Param('id') templateId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<{ status: string }> {
    const command = new PublishTemplateCommand(templateId, userId, role);
    await this.commandBus.execute(command);

    return { status: 'active' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template', description: 'Update template title, description, or settings' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template updated', type: TemplateResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 422, description: 'Template is archived and cannot be modified' })
  async update(
    @Param('id') templateId: string,
    @Body() dto: UpdateTemplateDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<TemplateResponseDto> {
    const settings = dto.settings
      ? InterviewSettings.create(dto.settings)
      : undefined;

    const command = new UpdateTemplateCommand(
      templateId,
      dto.title,
      dto.description,
      settings,
      userId,
      role,
    );

    await this.commandBus.execute(command);

    // Return updated template
    const query = new GetTemplateQuery(templateId, userId, role);
    const template = await this.queryBus.execute(query);

    return template;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template', description: 'Soft delete (archive) an interview template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async delete(
    @Param('id') templateId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<void> {
    const command = new DeleteTemplateCommand(templateId, userId, role);
    await this.commandBus.execute(command);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get template questions', description: 'Retrieve all questions for a template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'List of questions', schema: { properties: { questions: { type: 'array' } } } })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getQuestions(
    @Param('id') templateId: string,
  ) {
    const query = new GetTemplateQuestionsQuery(templateId);
    const questions = await this.queryBus.execute(query);

    return { questions };
  }
}
