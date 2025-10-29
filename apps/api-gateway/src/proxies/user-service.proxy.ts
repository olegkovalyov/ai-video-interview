import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy } from './base/base-service-proxy';
import { LoggerService } from '../logger/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { CircuitBreakerRegistry } from '../circuit-breaker';

// DTO types
export interface UserDTO {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDTO {
  userId: string;
  bio?: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
}

export interface QuotaReservationDTO {
  reservationId: string;
  userId: string;
  resourceType: string;
  expiresAt: string;
}

export interface UserStatsDTO {
  userId: string;
  interviewsCount: number;
  storageUsedMB: number;
  quotaRemaining: {
    interviews: number;
    storageMB: number;
  };
}

/**
 * Proxy для вызовов User Service
 * Инкапсулирует все HTTP операции с user-service
 */
@Injectable()
export class UserServiceProxy extends BaseServiceProxy {
  protected readonly serviceName = 'user-service';
  protected readonly baseUrl: string;

  // User Service circuit breaker configuration
  protected circuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 3000,        // Быстрые операции
    resetTimeout: 30000,  // 30 секунд
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
      this.configService.get<string>('USER_SERVICE_URL') ||
      'http://localhost:8002';
    
    // Инициализируем Circuit Breaker
    this.initCircuitBreaker();
  }

  /**
   * Получает профиль текущего пользователя
   * ПРОСТО ПРОКСИРУЕТ /users/me с JWT токеном
   */
  async getCurrentUserProfile(authHeader?: string): Promise<UserDTO> {
    return this.get<UserDTO>(`/api/v1/users/me`, {
      timeout: 3000,
      headers: authHeader ? {
        'Authorization': authHeader,
      } : {},
    });
  }

  /**
   * Обновляет профиль текущего пользователя
   * ПРОСТО ПРОКСИРУЕТ /users/me с JWT токеном
   */
  async updateCurrentUserProfile(authHeader?: string, updates?: any): Promise<UserDTO> {
    return this.put<UserDTO>(`/api/v1/users/me`, updates, {
      timeout: 5000,
      headers: authHeader ? {
        'Authorization': authHeader,
      } : {},
    });
  }

  /**
   * Резервирует квоту для интервью
   */
  async reserveInterviewQuota(userId: string): Promise<QuotaReservationDTO> {
    return this.post<QuotaReservationDTO>(
      `/api/v1/users/${userId}/quota/reserve`,
      {
        resourceType: 'interview',
      },
      {
        timeout: 3000,
        retries: 2, // Retry для критичных операций
      },
    );
  }

  /**
   * Освобождает зарезервированную квоту
   */
  async releaseQuota(userId: string, reservationId: string): Promise<void> {
    return this.delete<void>(
      `/api/v1/users/${userId}/quota/reservations/${reservationId}`,
      {
        timeout: 3000,
      },
    );
  }

  /**
   * Получает статистику пользователя
   */
  async getUserStats(userId: string): Promise<UserStatsDTO> {
    return this.get<UserStatsDTO>(`/api/v1/users/${userId}/stats`, {
      timeout: 5000,
    });
  }

  /**
   * Проверяет существование пользователя по email
   */
  async checkUserExists(email: string): Promise<{ exists: boolean }> {
    return this.get<{ exists: boolean }>(`/api/v1/users/check?email=${email}`, {
      timeout: 2000,
    });
  }

  /**
   * Получает список пользователей (admin)
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ users: UserDTO[]; total: number; page: number }> {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 20),
      ...(params.search && { search: params.search }),
    });

    return this.get<{ users: UserDTO[]; total: number; page: number }>(
      `/api/v1/users?${query}`,
      {
        timeout: 5000,
      },
    );
  }
}
