import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/logging/logger.service';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponseDto,
  TemplateListItemDto,
  PaginatedTemplatesResponseDto,
} from '../dto/template.dto';
import type {
  AddQuestionDto,
  ReorderQuestionsDto,
  QuestionResponseDto,
} from '../dto/question.dto';
import type { InterviewSettingsDto } from '../dto/settings.dto';

// ════════════════════════════════════════════════════════════════
// Re-export types for convenience
// ════════════════════════════════════════════════════════════════

export type {
  CreateTemplateDto,
  UpdateTemplateDto,
  AddQuestionDto,
  ReorderQuestionsDto,
  TemplateResponseDto,
  TemplateListItemDto,
  PaginatedTemplatesResponseDto,
  QuestionResponseDto,
  InterviewSettingsDto,
};

export interface ListTemplatesQuery {
  status?: 'draft' | 'active' | 'archived';
  page?: number;
  limit?: number;
}

/**
 * Interview Service Client
 * HTTP client for communication with Interview Service
 * All methods use internal service token for authentication
 */
@Injectable()
export class InterviewServiceClient {
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.baseUrl =
      this.configService.get<string>('INTERVIEW_SERVICE_URL') || 'http://localhost:3004';
    this.internalToken = this.configService.get<string>('INTERNAL_SERVICE_TOKEN') || '';
  }

  // ════════════════════════════════════════════════════════════════
  // Templates API
  // ════════════════════════════════════════════════════════════════

  /**
   * POST /api/templates
   * Create a new interview template
   */
  async createTemplate(
    dto: CreateTemplateDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    try {
      this.loggerService.info('InterviewServiceClient: Creating template', {
        userId,
        title: dto.title,
      });

      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(`${this.baseUrl}/api/templates`, dto, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to create template', error, {
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/templates
   * List templates with pagination
   */
  async listTemplates(
    userId: string,
    role: string,
    query?: ListTemplatesQuery,
  ): Promise<PaginatedTemplatesResponseDto> {
    try {
      this.loggerService.info('InterviewServiceClient: Listing templates', {
        userId,
        query,
      });

      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const url = `${this.baseUrl}/api/templates${params.toString() ? `?${params}` : ''}`;

      const response = await firstValueFrom(
        this.httpService.get<PaginatedTemplatesResponseDto>(url, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to list templates', error, {
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/templates/:id
   * Get template by ID with all questions
   */
  async getTemplate(
    templateId: string,
    userId: string,
    role: string,
  ): Promise<TemplateResponseDto> {
    try {
      this.loggerService.info('InterviewServiceClient: Getting template', {
        templateId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.get<TemplateResponseDto>(
          `${this.baseUrl}/api/templates/${templateId}`,
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to get template', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * PUT /api/templates/:id
   * Update template metadata
   */
  async updateTemplate(
    templateId: string,
    dto: UpdateTemplateDto,
    userId: string,
    role: string,
  ): Promise<TemplateResponseDto> {
    try {
      this.loggerService.info('InterviewServiceClient: Updating template', {
        templateId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.put<TemplateResponseDto>(
          `${this.baseUrl}/api/templates/${templateId}`,
          dto,
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to update template', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * DELETE /api/templates/:id
   * Archive template (soft delete)
   */
  async deleteTemplate(templateId: string, userId: string, role: string): Promise<void> {
    try {
      this.loggerService.info('InterviewServiceClient: Deleting template', {
        templateId,
        userId,
      });

      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/api/templates/${templateId}`, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to delete template', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * PUT /api/templates/:id/publish
   * Publish template (draft → active)
   */
  async publishTemplate(
    templateId: string,
    userId: string,
    role: string,
  ): Promise<{ status: string }> {
    try {
      this.loggerService.info('InterviewServiceClient: Publishing template', {
        templateId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.put<{ status: string }>(
          `${this.baseUrl}/api/templates/${templateId}/publish`,
          {},
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to publish template', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Questions API
  // ════════════════════════════════════════════════════════════════

  /**
   * POST /api/templates/:id/questions
   * Add question to template
   */
  async addQuestion(
    templateId: string,
    dto: AddQuestionDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    try {
      this.loggerService.info('InterviewServiceClient: Adding question to template', {
        templateId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(
          `${this.baseUrl}/api/templates/${templateId}/questions`,
          dto,
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to add question', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/templates/:id/questions
   * Get all questions for template
   */
  async getQuestions(
    templateId: string,
    userId: string,
    role: string,
  ): Promise<{ questions: QuestionResponseDto[] }> {
    try {
      this.loggerService.info('InterviewServiceClient: Getting template questions', {
        templateId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.get<{ questions: QuestionResponseDto[] }>(
          `${this.baseUrl}/api/templates/${templateId}/questions`,
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to get questions', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * DELETE /api/templates/:id/questions/:questionId
   * Remove question from template
   */
  async removeQuestion(
    templateId: string,
    questionId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    try {
      this.loggerService.info('InterviewServiceClient: Removing question from template', {
        templateId,
        questionId,
        userId,
      });

      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/api/templates/${templateId}/questions/${questionId}`,
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to remove question', error, {
        templateId,
        questionId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * PATCH /api/templates/:id/questions/reorder
   * Reorder questions in template
   */
  async reorderQuestions(
    templateId: string,
    dto: ReorderQuestionsDto,
    userId: string,
    role: string,
  ): Promise<void> {
    try {
      this.loggerService.info('InterviewServiceClient: Reordering questions in template', {
        templateId,
        userId,
        questionCount: dto.questionIds.length,
      });

      await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/api/templates/${templateId}/questions/reorder`,
          dto,
          {
            headers: {
              'x-internal-token': this.internalToken,
              'x-user-id': userId,
              'x-user-role': role,
            },
          },
        ),
      );
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to reorder questions', error, {
        templateId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Error Handling
  // ════════════════════════════════════════════════════════════════

  private handleError(error: any): HttpException {
    if (error.response) {
      // Interview Service returned an error response
      const status = error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response.data?.message || 'Interview Service error';

      return new HttpException(
        {
          success: false,
          error: message,
          details: error.response.data?.details || error.response.data,
        },
        status,
      );
    }

    // Network or other error
    return new HttpException(
      {
        success: false,
        error: 'Failed to communicate with Interview Service',
        details: error.message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
