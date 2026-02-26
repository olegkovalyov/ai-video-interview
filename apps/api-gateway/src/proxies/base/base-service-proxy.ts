import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoggerService } from '../../core/logging/logger.service';
import { MetricsService } from '../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../core/circuit-breaker/circuit-breaker-registry.service';
import { CircuitBreaker, CircuitBreakerOptions } from '../../core/circuit-breaker/circuit-breaker';
import { correlationStore } from '../../core/middleware/correlation-id.store';

export interface ProxyRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  bypassCircuitBreaker?: boolean; // Для критичных операций
}

/**
 * Base class для всех Service Proxies
 * Инкапсулирует общую логику HTTP вызовов, error handling, metrics, circuit breaker
 */
@Injectable()
export abstract class BaseServiceProxy {
  protected abstract readonly serviceName: string;
  protected abstract readonly baseUrl: string;
  
  // Circuit Breaker configuration (можно переопределить в наследниках)
  protected circuitBreakerOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 60000, // 1 minute
  };

  private circuitBreaker: CircuitBreaker;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly loggerService: LoggerService,
    protected readonly metricsService: MetricsService,
    protected readonly circuitBreakerRegistry: CircuitBreakerRegistry,
  ) {
    // Инициализация circuit breaker произойдёт в onModuleInit наследника
  }

  /**
   * Инициализирует Circuit Breaker (вызывается из конструктора наследника)
   */
  protected initCircuitBreaker(): void {
    this.circuitBreaker = this.circuitBreakerRegistry.getOrCreate(
      this.serviceName,
      this.circuitBreakerOptions,
    );
  }

  /**
   * Выполняет GET запрос
   */
  protected async get<T>(
    path: string,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    return this.executeRequest<T>('GET', path, undefined, options);
  }

  /**
   * Выполняет POST запрос
   */
  protected async post<T>(
    path: string,
    data?: any,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    return this.executeRequest<T>('POST', path, data, options);
  }

  /**
   * Выполняет PUT запрос
   */
  protected async put<T>(
    path: string,
    data?: any,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    return this.executeRequest<T>('PUT', path, data, options);
  }

  /**
   * Выполняет DELETE запрос
   */
  protected async delete<T>(
    path: string,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    return this.executeRequest<T>('DELETE', path, undefined, options);
  }

  /**
   * Выполняет PATCH запрос
   */
  protected async patch<T>(
    path: string,
    data?: any,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    return this.executeRequest<T>('PATCH', path, data, options);
  }

  /**
   * Основной метод для выполнения HTTP запросов
   */
  private async executeRequest<T>(
    method: string,
    path: string,
    data?: any,
    options?: ProxyRequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const startTime = Date.now();

    // Если bypassCircuitBreaker, выполняем напрямую
    if (options?.bypassCircuitBreaker) {
      return this.executeRequestDirect(method, url, data, options, startTime);
    }

    // Выполняем через Circuit Breaker
    try {
      return await this.circuitBreaker.execute(() =>
        this.executeRequestDirect(method, url, data, options, startTime)
      );
    } catch (error) {
      // Circuit Breaker ошибки прокидываем как есть
      throw error;
    }
  }

  /**
   * Непосредственное выполнение HTTP запроса
   */
  private async executeRequestDirect<T>(
    method: string,
    url: string,
    data: any,
    options: ProxyRequestOptions | undefined,
    startTime: number,
  ): Promise<T> {
    try {
      const axiosConfig = this.buildAxiosConfig(method, data, options);

      this.loggerService.debug(`Proxy request: ${method} ${url}`, {
        service: this.serviceName,
        method,
        path: url,
        hasData: !!data,
      });

      const response = await this.executeWithRetry<T>(
        url,
        axiosConfig,
        options?.retries || 0,
      );

      const duration = Date.now() - startTime;

      this.metricsService.recordServiceCall(
        this.serviceName,
        method,
        'success',
        duration,
      );

      this.loggerService.debug(`Proxy response: ${method} ${url}`, {
        service: this.serviceName,
        method,
        path: url,
        duration,
        statusCode: response.status,
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.metricsService.recordServiceCall(
        this.serviceName,
        method,
        'error',
        duration,
      );

      this.loggerService.error(`Proxy error: ${method} ${url}`, error, {
        service: this.serviceName,
        method,
        path: url,
        duration,
        errorMessage: error.message,
        statusCode: error.response?.status,
      });

      throw this.handleError(error);
    }
  }

  /**
   * Выполняет запрос с retry логикой
   */
  private async executeWithRetry<T>(
    url: string,
    config: AxiosRequestConfig,
    retries: number,
  ): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await firstValueFrom(
          this.httpService.request<T>({
            ...config,
            url,
          }),
        );
      } catch (error) {
        lastError = error;

        // Не retry на 4xx ошибках (клиентские ошибки)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        if (attempt < retries) {
          const delay = this.calculateRetryDelay(attempt);
          this.loggerService.warn(
            `Retry attempt ${attempt + 1}/${retries} for ${url}`,
            {
              service: this.serviceName,
              attempt: attempt + 1,
              delay,
            },
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Вычисляет задержку для retry (exponential backoff)
   */
  private calculateRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Строит полный URL
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  /**
   * Возвращает дефолтные headers для всех запросов.
   * Наследники могут переопределить для добавления service-specific headers
   * (e.g., x-internal-token).
   */
  protected getDefaultHeaders(): Record<string, string> {
    const store = correlationStore.getStore();
    return {
      'Content-Type': 'application/json',
      'x-internal-request': 'true',
      ...(store?.correlationId && {
        'x-correlation-id': store.correlationId,
      }),
    };
  }

  /**
   * Строит Axios конфигурацию
   */
  private buildAxiosConfig(
    method: string,
    data?: any,
    options?: ProxyRequestOptions,
  ): AxiosRequestConfig {
    return {
      method,
      data,
      timeout: options?.timeout || this.circuitBreakerOptions.timeout || 5000,
      headers: {
        ...this.getDefaultHeaders(),
        ...options?.headers,
      },
      ...(options?.params && { params: options.params }),
    };
  }

  /**
   * Обрабатывает ошибки
   */
  private handleError(error: any): Error {
    if (error.response) {
      // HTTP error — извлекаем сообщение из response data
      const data = error.response.data;
      let message: string;
      if (typeof data === 'string') {
        message = data;
      } else if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      } else if (data?.error && typeof data.error === 'string') {
        message = data.error;
      } else {
        message = error.message;
      }

      return new ServiceProxyError(
        this.serviceName,
        error.response.status,
        message,
        error.response.data,
      );
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      return new ServiceProxyError(
        this.serviceName,
        0,
        `Service timeout: ${this.serviceName} did not respond in time`,
      );
    } else if (error.request) {
      // Network error (ECONNREFUSED, etc.)
      return new ServiceProxyError(
        this.serviceName,
        0,
        `Network error: ${this.serviceName} unavailable`,
      );
    } else {
      // Unknown error
      return new ServiceProxyError(
        this.serviceName,
        0,
        error.message || 'Unknown error',
      );
    }
  }
}

/**
 * Custom error для Service Proxy
 */
export class ServiceProxyError extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: any,
  ) {
    super(`[${serviceName}] ${message}`);
    this.name = 'ServiceProxyError';
  }
}
