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
import type {
  CreateInvitationDto,
  SubmitResponseDto,
  CompleteInvitationDto,
  InvitationResponseDto,
  InvitationWithTemplateDto,
  PaginatedInvitationsResponseDto,
} from '../dto/invitation.dto';

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
  // Invitation types
  CreateInvitationDto,
  SubmitResponseDto,
  CompleteInvitationDto,
  InvitationResponseDto,
  InvitationWithTemplateDto,
  PaginatedInvitationsResponseDto,
};

export interface ListTemplatesQuery {
  status?: 'draft' | 'active' | 'archived';
  page?: number;
  limit?: number;
}

export interface ListInvitationsQuery {
  status?: 'pending' | 'in_progress' | 'completed' | 'expired';
  templateId?: string;
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
      this.configService.get<string>('INTERVIEW_SERVICE_URL') || 'http://localhost:8003';
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
  // Invitations API
  // ════════════════════════════════════════════════════════════════

  /**
   * POST /api/invitations
   * Create a new invitation
   */
  async createInvitation(
    dto: CreateInvitationDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    try {
      this.loggerService.info('InterviewServiceClient: Creating invitation', {
        userId,
        templateId: dto.templateId,
        candidateId: dto.candidateId,
      });

      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(`${this.baseUrl}/api/invitations`, dto, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to create invitation', error, {
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/invitations/:id
   * Get invitation by ID
   */
  async getInvitation(
    invitationId: string,
    userId: string,
    role: string,
    includeTemplate?: boolean,
  ): Promise<InvitationResponseDto | InvitationWithTemplateDto> {
    try {
      this.loggerService.info('InterviewServiceClient: Getting invitation', {
        invitationId,
        userId,
        includeTemplate,
      });

      const params = new URLSearchParams();
      if (includeTemplate) params.append('includeTemplate', 'true');

      const url = `${this.baseUrl}/api/invitations/${invitationId}${params.toString() ? `?${params}` : ''}`;

      const response = await firstValueFrom(
        this.httpService.get<InvitationResponseDto | InvitationWithTemplateDto>(url, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to get invitation', error, {
        invitationId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/invitations/candidate
   * List invitations for current candidate
   */
  async listCandidateInvitations(
    userId: string,
    role: string,
    query?: ListInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    try {
      this.loggerService.info('InterviewServiceClient: Listing candidate invitations', {
        userId,
        query,
      });

      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const url = `${this.baseUrl}/api/invitations/candidate${params.toString() ? `?${params}` : ''}`;

      const response = await firstValueFrom(
        this.httpService.get<PaginatedInvitationsResponseDto>(url, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to list candidate invitations', error, {
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/invitations/hr
   * List invitations created by current HR
   */
  async listHRInvitations(
    userId: string,
    role: string,
    query?: ListInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    try {
      this.loggerService.info('InterviewServiceClient: Listing HR invitations', {
        userId,
        query,
      });

      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.templateId) params.append('templateId', query.templateId);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const url = `${this.baseUrl}/api/invitations/hr${params.toString() ? `?${params}` : ''}`;

      const response = await firstValueFrom(
        this.httpService.get<PaginatedInvitationsResponseDto>(url, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.loggerService.error('InterviewServiceClient: Failed to list HR invitations', error, {
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * POST /api/invitations/:id/start
   * Start interview
   */
  async startInvitation(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<{ success: boolean }> {
    try {
      this.loggerService.info('InterviewServiceClient: Starting invitation', {
        invitationId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean }>(
          `${this.baseUrl}/api/invitations/${invitationId}/start`,
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
      this.loggerService.error('InterviewServiceClient: Failed to start invitation', error, {
        invitationId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * POST /api/invitations/:id/responses
   * Submit response to a question
   */
  async submitResponse(
    invitationId: string,
    dto: SubmitResponseDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    try {
      this.loggerService.info('InterviewServiceClient: Submitting response', {
        invitationId,
        userId,
        questionId: dto.questionId,
      });

      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(
          `${this.baseUrl}/api/invitations/${invitationId}/responses`,
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
      this.loggerService.error('InterviewServiceClient: Failed to submit response', error, {
        invitationId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * POST /api/invitations/:id/complete
   * Complete interview
   */
  async completeInvitation(
    invitationId: string,
    dto: CompleteInvitationDto,
    userId: string,
    role: string,
  ): Promise<{ success: boolean }> {
    try {
      this.loggerService.info('InterviewServiceClient: Completing invitation', {
        invitationId,
        userId,
        reason: dto.reason,
      });

      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean }>(
          `${this.baseUrl}/api/invitations/${invitationId}/complete`,
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
      this.loggerService.error('InterviewServiceClient: Failed to complete invitation', error, {
        invitationId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * POST /api/invitations/:id/heartbeat
   * Update activity timestamp
   */
  async heartbeat(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ success: boolean }>(
          `${this.baseUrl}/api/invitations/${invitationId}/heartbeat`,
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
      this.loggerService.error('InterviewServiceClient: Failed to send heartbeat', error, {
        invitationId,
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
      const data = error.response.data;

      // Extract message safely - handle string, object, or array
      let message = 'Interview Service error';
      if (typeof data === 'string') {
        message = data;
      } else if (data?.message) {
        // NestJS validation errors return array of messages
        message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      } else if (data?.error && typeof data.error === 'string') {
        message = data.error;
      }

      return new HttpException(
        {
          success: false,
          error: message,
          statusCode: status,
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
