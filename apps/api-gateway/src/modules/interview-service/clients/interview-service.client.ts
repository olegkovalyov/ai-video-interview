import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy, ServiceProxyError } from '../../../proxies/base/base-service-proxy';
import { LoggerService } from '../../../core/logging/logger.service';
import { MetricsService } from '../../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../../core/circuit-breaker/circuit-breaker-registry.service';
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
 * HTTP client for communication with Interview Service.
 * Extends BaseServiceProxy for circuit breaker, retry, metrics, and error handling.
 */
@Injectable()
export class InterviewServiceClient extends BaseServiceProxy {
  protected readonly serviceName = 'interview-service';
  protected readonly baseUrl: string;
  private readonly internalToken: string;

  protected circuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 10000, // 10s — invitation operations can be slower
    resetTimeout: 60000,
  };

  constructor(
    httpService: HttpService,
    loggerService: LoggerService,
    metricsService: MetricsService,
    circuitBreakerRegistry: CircuitBreakerRegistry,
    private readonly configService: ConfigService,
  ) {
    super(httpService, loggerService, metricsService, circuitBreakerRegistry);

    this.baseUrl =
      this.configService.get<string>('INTERVIEW_SERVICE_URL') || 'http://localhost:8003';
    this.internalToken = this.configService.get<string>('INTERNAL_SERVICE_TOKEN') || '';

    this.initCircuitBreaker();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'x-internal-token': this.internalToken,
    };
  }

  /**
   * Возвращает headers с user context для авторизации на стороне Interview Service
   */
  private userHeaders(userId: string, role: string): Record<string, string> {
    return {
      'x-user-id': userId,
      'x-user-role': role,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // Templates API
  // ════════════════════════════════════════════════════════════════

  /** POST /api/templates — Create a new interview template */
  async createTemplate(
    dto: CreateTemplateDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/templates', dto, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** GET /api/templates — List templates with pagination */
  async listTemplates(
    userId: string,
    role: string,
    query?: ListTemplatesQuery,
  ): Promise<PaginatedTemplatesResponseDto> {
    const params: Record<string, any> = {};
    if (query?.status) params.status = query.status;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;

    return this.get<PaginatedTemplatesResponseDto>('/api/templates', {
      headers: this.userHeaders(userId, role),
      params,
    });
  }

  /** GET /api/templates/:id — Get template by ID with all questions */
  async getTemplate(
    templateId: string,
    userId: string,
    role: string,
  ): Promise<TemplateResponseDto> {
    return this.get<TemplateResponseDto>(`/api/templates/${templateId}`, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** PUT /api/templates/:id — Update template metadata */
  async updateTemplate(
    templateId: string,
    dto: UpdateTemplateDto,
    userId: string,
    role: string,
  ): Promise<TemplateResponseDto> {
    return this.put<TemplateResponseDto>(`/api/templates/${templateId}`, dto, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** DELETE /api/templates/:id — Archive template (soft delete) */
  async deleteTemplate(templateId: string, userId: string, role: string): Promise<void> {
    await this.delete<void>(`/api/templates/${templateId}`, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** PUT /api/templates/:id/publish — Publish template (draft → active) */
  async publishTemplate(
    templateId: string,
    userId: string,
    role: string,
  ): Promise<{ status: string }> {
    return this.put<{ status: string }>(`/api/templates/${templateId}/publish`, {}, {
      headers: this.userHeaders(userId, role),
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Questions API
  // ════════════════════════════════════════════════════════════════

  /** POST /api/templates/:id/questions — Add question to template */
  async addQuestion(
    templateId: string,
    dto: AddQuestionDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/api/templates/${templateId}/questions`, dto, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** GET /api/templates/:id/questions — Get all questions for template */
  async getQuestions(
    templateId: string,
    userId: string,
    role: string,
  ): Promise<{ questions: QuestionResponseDto[] }> {
    return this.get<{ questions: QuestionResponseDto[] }>(
      `/api/templates/${templateId}/questions`,
      { headers: this.userHeaders(userId, role) },
    );
  }

  /** DELETE /api/templates/:id/questions/:questionId — Remove question from template */
  async removeQuestion(
    templateId: string,
    questionId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.delete<void>(`/api/templates/${templateId}/questions/${questionId}`, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** PATCH /api/templates/:id/questions/reorder — Reorder questions in template */
  async reorderQuestions(
    templateId: string,
    dto: ReorderQuestionsDto,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.patch<void>(`/api/templates/${templateId}/questions/reorder`, dto, {
      headers: this.userHeaders(userId, role),
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Invitations API
  // ════════════════════════════════════════════════════════════════

  /** POST /api/invitations — Create a new invitation */
  async createInvitation(
    dto: CreateInvitationDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>('/api/invitations', dto, {
      headers: this.userHeaders(userId, role),
    });
  }

  /** GET /api/invitations/:id — Get invitation by ID */
  async getInvitation(
    invitationId: string,
    userId: string,
    role: string,
    includeTemplate?: boolean,
  ): Promise<InvitationResponseDto | InvitationWithTemplateDto> {
    const params: Record<string, any> = {};
    if (includeTemplate) params.includeTemplate = 'true';

    return this.get<InvitationResponseDto | InvitationWithTemplateDto>(
      `/api/invitations/${invitationId}`,
      { headers: this.userHeaders(userId, role), params },
    );
  }

  /** GET /api/invitations/candidate — List invitations for current candidate */
  async listCandidateInvitations(
    userId: string,
    role: string,
    query?: ListInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    const params: Record<string, any> = {};
    if (query?.status) params.status = query.status;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;

    return this.get<PaginatedInvitationsResponseDto>('/api/invitations/candidate', {
      headers: this.userHeaders(userId, role),
      params,
    });
  }

  /** GET /api/invitations/hr — List invitations created by current HR */
  async listHRInvitations(
    userId: string,
    role: string,
    query?: ListInvitationsQuery,
  ): Promise<PaginatedInvitationsResponseDto> {
    const params: Record<string, any> = {};
    if (query?.status) params.status = query.status;
    if (query?.templateId) params.templateId = query.templateId;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;

    return this.get<PaginatedInvitationsResponseDto>('/api/invitations/hr', {
      headers: this.userHeaders(userId, role),
      params,
    });
  }

  /** POST /api/invitations/:id/start — Start interview */
  async startInvitation(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `/api/invitations/${invitationId}/start`,
      {},
      { headers: this.userHeaders(userId, role) },
    );
  }

  /** POST /api/invitations/:id/responses — Submit response to a question */
  async submitResponse(
    invitationId: string,
    dto: SubmitResponseDto,
    userId: string,
    role: string,
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>(
      `/api/invitations/${invitationId}/responses`,
      dto,
      { headers: this.userHeaders(userId, role) },
    );
  }

  /** POST /api/invitations/:id/complete — Complete interview */
  async completeInvitation(
    invitationId: string,
    dto: CompleteInvitationDto,
    userId: string,
    role: string,
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `/api/invitations/${invitationId}/complete`,
      dto,
      { headers: this.userHeaders(userId, role) },
    );
  }

  /** POST /api/invitations/:id/heartbeat — Update activity timestamp */
  async heartbeat(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `/api/invitations/${invitationId}/heartbeat`,
      {},
      { headers: this.userHeaders(userId, role) },
    );
  }
}
