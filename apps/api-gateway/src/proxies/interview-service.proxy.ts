import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy } from './base/base-service-proxy';
import { LoggerService } from '../logger/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { CircuitBreakerRegistry } from '../circuit-breaker';

// DTO types
export interface InterviewDTO {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  settings: InterviewSettingsDTO;
  candidatesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSettingsDTO {
  duration: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  recordVideo: boolean;
  recordAudio: boolean;
  allowRetakes: boolean;
  maxRetakes?: number;
}

export interface CreateInterviewDTO {
  userId: string;
  title: string;
  description?: string;
  settings: InterviewSettingsDTO;
}

export interface CandidateDTO {
  id: string;
  interviewId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'invited' | 'in_progress' | 'completed' | 'expired';
  invitedAt: string;
  completedAt?: string;
}

export interface InterviewStatsDTO {
  interviewId: string;
  totalCandidates: number;
  completedCandidates: number;
  inProgressCandidates: number;
  averageScore?: number;
  averageDuration?: number;
}

/**
 * Proxy для вызовов Interview Service
 * Инкапсулирует все HTTP операции с interview-service
 */
@Injectable()
export class InterviewServiceProxy extends BaseServiceProxy {
  protected readonly serviceName = 'interview-service';
  protected readonly baseUrl: string;

  // Interview Service circuit breaker configuration
  protected circuitBreakerOptions = {
    failureThreshold: 3,  // Быстрее открываем (более критично)
    successThreshold: 2,
    timeout: 10000,       // Более долгие операции
    resetTimeout: 60000,  // 1 минута
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
      this.configService.get<string>('INTERVIEW_SERVICE_URL') ||
      'http://localhost:3004';
    
    // Инициализируем Circuit Breaker
    this.initCircuitBreaker();
  }

  /**
   * Создаёт новое интервью
   */
  async createInterview(data: CreateInterviewDTO): Promise<InterviewDTO> {
    return this.post<InterviewDTO>('/api/v1/interviews', data, {
      timeout: 5000,
      retries: 1,
    });
  }

  /**
   * Получает интервью по ID
   */
  async getInterview(interviewId: string): Promise<InterviewDTO> {
    return this.get<InterviewDTO>(`/api/v1/interviews/${interviewId}`, {
      timeout: 3000,
    });
  }

  /**
   * Получает список интервью пользователя
   */
  async getUserInterviews(
    userId: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: string;
    },
  ): Promise<{ interviews: InterviewDTO[]; total: number }> {
    const query = new URLSearchParams({
      ...(params?.limit && { limit: String(params.limit) }),
      ...(params?.offset && { offset: String(params.offset) }),
      ...(params?.status && { status: params.status }),
    });

    return this.get<{ interviews: InterviewDTO[]; total: number }>(
      `/api/v1/users/${userId}/interviews?${query}`,
      {
        timeout: 5000,
      },
    );
  }

  /**
   * Обновляет интервью
   */
  async updateInterview(
    interviewId: string,
    updates: Partial<InterviewDTO>,
  ): Promise<InterviewDTO> {
    return this.put<InterviewDTO>(`/api/v1/interviews/${interviewId}`, updates, {
      timeout: 5000,
    });
  }

  /**
   * Удаляет интервью
   */
  async deleteInterview(interviewId: string): Promise<void> {
    return this.delete<void>(`/api/v1/interviews/${interviewId}`, {
      timeout: 5000,
    });
  }

  /**
   * Получает кандидатов интервью
   */
  async getCandidates(interviewId: string): Promise<CandidateDTO[]> {
    return this.get<CandidateDTO[]>(
      `/api/v1/interviews/${interviewId}/candidates`,
      {
        timeout: 5000,
      },
    );
  }

  /**
   * Добавляет кандидата в интервью
   */
  async addCandidate(
    interviewId: string,
    candidateData: {
      email: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<CandidateDTO> {
    return this.post<CandidateDTO>(
      `/api/v1/interviews/${interviewId}/candidates`,
      candidateData,
      {
        timeout: 3000,
      },
    );
  }

  /**
   * Получает статистику интервью
   */
  async getInterviewStats(interviewId: string): Promise<InterviewStatsDTO> {
    return this.get<InterviewStatsDTO>(
      `/api/v1/interviews/${interviewId}/stats`,
      {
        timeout: 5000,
      },
    );
  }

  /**
   * Получает статистику пользователя по интервью
   */
  async getUserInterviewStats(userId: string): Promise<{
    totalInterviews: number;
    activeInterviews: number;
    completedInterviews: number;
    totalCandidates: number;
  }> {
    return this.get<{
      totalInterviews: number;
      activeInterviews: number;
      completedInterviews: number;
      totalCandidates: number;
    }>(`/api/v1/users/${userId}/interviews/stats`, {
      timeout: 5000,
    });
  }

  /**
   * Публикует интервью (меняет статус на active)
   */
  async publishInterview(interviewId: string): Promise<InterviewDTO> {
    return this.post<InterviewDTO>(
      `/api/v1/interviews/${interviewId}/publish`,
      {},
      {
        timeout: 3000,
      },
    );
  }

  /**
   * Приостанавливает интервью
   */
  async pauseInterview(interviewId: string): Promise<InterviewDTO> {
    return this.post<InterviewDTO>(
      `/api/v1/interviews/${interviewId}/pause`,
      {},
      {
        timeout: 3000,
      },
    );
  }

  /**
   * Архивирует интервью
   */
  async archiveInterview(interviewId: string): Promise<InterviewDTO> {
    return this.post<InterviewDTO>(
      `/api/v1/interviews/${interviewId}/archive`,
      {},
      {
        timeout: 3000,
      },
    );
  }
}
