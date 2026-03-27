import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy, ServiceProxyError } from '../../../proxies/base/base-service-proxy';
import { LoggerService } from '../../../core/logging/logger.service';
import { MetricsService } from '../../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../../core/circuit-breaker/circuit-breaker-registry.service';

export interface AnalysisResultDto {
  id: string;
  invitationId: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  companyName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  overallScore: number | null;
  summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendation: 'hire' | 'consider' | 'reject' | null;
  language: string;
  modelUsed: string;
  totalTokensUsed: number;
  processingTimeMs: number;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questionAnalyses?: QuestionAnalysisDto[];
}

export interface QuestionAnalysisDto {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  responseText: string;
  score: number;
  feedback: string;
  criteriaScores: Record<string, any>[];
  isCorrect: boolean | null;
}

export interface AnalysisStatusDto {
  found: boolean;
  id?: string;
  invitationId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_found';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * AI Analysis Service Client
 * HTTP client for communication with AI Analysis Service.
 * Extends BaseServiceProxy for circuit breaker, retry, metrics, and error handling.
 *
 * Circuit breaker configured with longer timeout (30s) to accommodate LLM processing.
 */
@Injectable()
export class AnalysisServiceClient extends BaseServiceProxy {
  protected readonly serviceName = 'analysis-service';
  protected readonly baseUrl: string;
  private readonly internalToken: string;

  protected circuitBreakerOptions = {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,   // 30s — LLM processing takes time
    resetTimeout: 120000, // 2 min — give Groq API time to recover
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
      this.configService.get<string>('AI_ANALYSIS_SERVICE_URL') || 'http://localhost:8005';
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
   * GET /api/v1/analysis/:invitationId
   * Get full analysis result by invitation ID (includes questionAnalyses).
   * Returns null if analysis not found (404).
   */
  async getAnalysisByInvitation(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<AnalysisResultDto | null> {
    try {
      return await this.get<AnalysisResultDto>(
        `/api/v1/analysis/${invitationId}`,
        {
          headers: { 'x-user-id': userId, 'x-user-role': role },
        },
      );
    } catch (error) {
      if (error instanceof ServiceProxyError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/analysis/status/:invitationId
   * Get analysis status for an invitation.
   */
  async getAnalysisStatus(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<AnalysisStatusDto> {
    return this.get<AnalysisStatusDto>(
      `/api/v1/analysis/status/${invitationId}`,
      {
        headers: { 'x-user-id': userId, 'x-user-role': role },
      },
    );
  }
}
