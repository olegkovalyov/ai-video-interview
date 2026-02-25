import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/logging/logger.service';

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
  recommendation: 'strongly_recommend' | 'recommend' | 'consider' | 'not_recommend' | null;
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
 * HTTP client for communication with AI Analysis Service
 */
@Injectable()
export class AnalysisServiceClient {
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.baseUrl =
      this.configService.get<string>('AI_ANALYSIS_SERVICE_URL') || 'http://localhost:8005';
    this.internalToken = this.configService.get<string>('INTERNAL_SERVICE_TOKEN') || '';
  }

  /**
   * GET /api/v1/analysis/:invitationId
   * Get full analysis result by invitation ID (includes questionAnalyses)
   */
  async getAnalysisByInvitation(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<AnalysisResultDto | null> {
    try {
      this.loggerService.info('AnalysisServiceClient: Getting analysis by invitation', {
        invitationId,
        userId,
      });

      const url = `${this.baseUrl}/api/v1/analysis/${invitationId}`;

      const response = await firstValueFrom(
        this.httpService.get<AnalysisResultDto>(url, {
          headers: {
            'x-internal-token': this.internalToken,
            'x-user-id': userId,
            'x-user-role': role,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      this.loggerService.error('AnalysisServiceClient: Failed to get analysis', error, {
        invitationId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  /**
   * GET /api/v1/analysis/status/:invitationId
   * Get analysis status for an invitation
   */
  async getAnalysisStatus(
    invitationId: string,
    userId: string,
    role: string,
  ): Promise<AnalysisStatusDto> {
    try {
      this.loggerService.info('AnalysisServiceClient: Getting analysis status', {
        invitationId,
        userId,
      });

      const response = await firstValueFrom(
        this.httpService.get<AnalysisStatusDto>(
          `${this.baseUrl}/api/v1/analysis/status/${invitationId}`,
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
      this.loggerService.error('AnalysisServiceClient: Failed to get analysis status', error, {
        invitationId,
        userId,
      });
      throw this.handleError(error);
    }
  }

  private handleError(error: any): HttpException {
    if (error.response) {
      const status = error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const data = error.response.data;

      let message = 'AI Analysis Service error';
      if (typeof data === 'string') {
        message = data;
      } else if (data?.message) {
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

    return new HttpException(
      {
        success: false,
        error: 'Failed to communicate with AI Analysis Service',
        details: error.message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
