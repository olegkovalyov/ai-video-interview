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
  ForbiddenException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  CreateTemplateDto,
  AddQuestionDto,
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
  PublishTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
} from '../../../application/commands';
import {
  GetTemplateQuery,
  ListTemplatesQuery,
  GetTemplateQuestionsQuery,
} from '../../../application/queries';

@Controller('api/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('hr', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: any,
  ): Promise<{ id: string }> {
    const settings = dto.settings
      ? InterviewSettings.create(dto.settings)
      : undefined;

    const command = new CreateTemplateCommand(
      dto.title,
      dto.description,
      user.userId,
      settings,
    );

    const templateId = await this.commandBus.execute(command);

    return { id: templateId };
  }

  @Get()
  @Roles('hr', 'admin')
  async list(
    @Query() query: ListTemplatesQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedTemplatesResponseDto> {
    const listQuery = new ListTemplatesQuery(
      user.userId,
      user.role,
      query.status,
      query.page || 1,
      query.limit || 10,
    );

    const result = await this.queryBus.execute(listQuery);

    return result;
  }

  @Get(':id')
  @Roles('hr', 'admin')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<TemplateResponseDto> {
    const query = new GetTemplateQuery(id, user.userId, user.role);
    const template = await this.queryBus.execute(query);

    return template;
  }

  @Post(':id/questions')
  @Roles('hr', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async addQuestion(
    @Param('id') templateId: string,
    @Body() dto: AddQuestionDto,
    @CurrentUser() user: any,
  ): Promise<{ id: string }> {
    // Check ownership first
    await this.checkOwnership(templateId, user);

    const command = new AddQuestionCommand(
      templateId,
      dto.text,
      dto.type,
      dto.order,
      dto.timeLimit,
      dto.required,
      dto.hints,
    );

    const questionId = await this.commandBus.execute(command);

    return { id: questionId };
  }

  @Delete(':id/questions/:questionId')
  @Roles('hr', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuestion(
    @Param('id') templateId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    // Check ownership first
    await this.checkOwnership(templateId, user);

    const command = new RemoveQuestionCommand(templateId, questionId);
    await this.commandBus.execute(command);
  }

  @Put(':id/publish')
  @Roles('hr', 'admin')
  async publish(
    @Param('id') templateId: string,
    @CurrentUser() user: any,
  ): Promise<{ status: string }> {
    // Check ownership first
    await this.checkOwnership(templateId, user);

    const command = new PublishTemplateCommand(templateId);
    await this.commandBus.execute(command);

    return { status: 'active' };
  }

  @Put(':id')
  @Roles('hr', 'admin')
  async update(
    @Param('id') templateId: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: any,
  ): Promise<TemplateResponseDto> {
    // Check ownership first
    await this.checkOwnership(templateId, user);

    const settings = dto.settings
      ? InterviewSettings.create(dto.settings)
      : undefined;

    const command = new UpdateTemplateCommand(
      templateId,
      dto.title,
      dto.description,
      settings,
    );

    await this.commandBus.execute(command);

    // Return updated template
    const query = new GetTemplateQuery(templateId, user.userId, user.role);
    const template = await this.queryBus.execute(query);

    return template;
  }

  @Delete(':id')
  @Roles('hr', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') templateId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    // Check ownership first
    await this.checkOwnership(templateId, user);

    const command = new DeleteTemplateCommand(templateId);
    await this.commandBus.execute(command);
  }

  @Get(':id/questions')
  @Roles('hr', 'admin')
  async getQuestions(
    @Param('id') templateId: string,
    @CurrentUser() user: any,
  ) {
    // Check ownership first
    await this.checkOwnership(templateId, user);

    const query = new GetTemplateQuestionsQuery(templateId);
    const questions = await this.queryBus.execute(query);

    return { questions };
  }

  private async checkOwnership(templateId: string, user: any): Promise<void> {
    // Admin can access everything
    if (user.role === 'admin') {
      return;
    }

    // HR can only access their own templates
    const query = new GetTemplateQuery(templateId, user.userId, user.role);

    try {
      await this.queryBus.execute(query);
    } catch (error) {
      // GetTemplateQuery will throw ForbiddenException if not owner
      throw error;
    }
  }
}
