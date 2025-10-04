import { LoggerService } from '../logger/logger.service';

export enum CircuitState {
  CLOSED = 'CLOSED',       // Нормальная работа
  OPEN = 'OPEN',           // Сервис недоступен
  HALF_OPEN = 'HALF_OPEN', // Проверка восстановления
}

export interface CircuitBreakerOptions {
  failureThreshold: number;  // Сколько ошибок для открытия
  successThreshold: number;  // Сколько успехов для закрытия
  timeout: number;           // Timeout для запросов (ms)
  resetTimeout: number;      // Через сколько пробовать восстановиться (ms)
  rollingWindow?: number;    // Окно для подсчёта ошибок (ms)
  name?: string;             // Имя circuit для логов
}

export class CircuitBreakerError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly state: CircuitState,
  ) {
    super(`Circuit breaker '${circuitName}' is ${state}`);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker implementation
 * 
 * Защищает от cascading failures при недоступности downstream сервисов.
 * 
 * Состояния:
 * - CLOSED: нормальная работа, все запросы проходят
 * - OPEN: сервис недоступен, запросы instantly fail
 * - HALF_OPEN: проверка восстановления, пропускаем limited requests
 */
export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly failures: number[] = []; // Timestamps неудачных запросов

  private readonly options: Required<CircuitBreakerOptions>;

  constructor(
    options: CircuitBreakerOptions,
    private readonly logger?: LoggerService,
  ) {
    this.options = {
      rollingWindow: 10000, // 10 seconds default
      name: 'unnamed-circuit',
      ...options,
    };

    this.log('info', 'Circuit breaker initialized', {
      state: this.state,
      options: this.options,
    });
  }

  /**
   * Выполняет функцию через Circuit Breaker
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    // Проверяем можем ли выполнять запрос
    this.checkState();

    try {
      // Выполняем с timeout
      const result = await this.executeWithTimeout(fn);

      // Регистрируем успех
      this.onSuccess();

      return result;
    } catch (error) {
      // Регистрируем ошибку
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Проверяет текущее состояние и решает пропускать ли запрос
   */
  private checkState(): void {
    const now = Date.now();

    switch (this.state) {
      case CircuitState.CLOSED:
        // Очищаем старые failures из rolling window
        this.cleanupFailures(now);
        break;

      case CircuitState.OPEN:
        // Проверяем можно ли перейти в HALF_OPEN
        if (now >= this.nextAttempt) {
          this.transitionTo(CircuitState.HALF_OPEN);
        } else {
          throw new CircuitBreakerError(this.options.name, this.state);
        }
        break;

      case CircuitState.HALF_OPEN:
        // В HALF_OPEN состоянии пропускаем запросы
        break;
    }
  }

  /**
   * Выполняет функцию с timeout
   */
  private executeWithTimeout(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Circuit breaker timeout (${this.options.timeout}ms)`)),
          this.options.timeout,
        ),
      ),
    ]);
  }

  /**
   * Обрабатывает успешное выполнение
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      this.log('debug', 'Success in HALF_OPEN', {
        successCount: this.successCount,
        threshold: this.options.successThreshold,
      });

      // Достаточно успехов для закрытия Circuit
      if (this.successCount >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.successCount = 0;
      }
    }
  }

  /**
   * Обрабатывает неудачное выполнение
   */
  private onFailure(error: any): void {
    const now = Date.now();
    this.failures.push(now);
    this.failureCount++;

    this.log('warn', 'Request failed', {
      error: error.message,
      failureCount: this.failureCount,
      threshold: this.options.failureThreshold,
      state: this.state,
    });

    // Очищаем старые failures
    this.cleanupFailures(now);

    // Подсчитываем failures в rolling window
    const recentFailures = this.failures.length;

    if (this.state === CircuitState.HALF_OPEN) {
      // В HALF_OPEN любая ошибка открывает Circuit
      this.transitionTo(CircuitState.OPEN);
      this.successCount = 0;
    } else if (this.state === CircuitState.CLOSED) {
      // Проверяем threshold
      if (recentFailures >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Переход в новое состояние
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.log('error', 'Circuit breaker OPENED', {
        failureCount: this.failureCount,
        nextAttempt: new Date(this.nextAttempt).toISOString(),
      });
    } else if (newState === CircuitState.HALF_OPEN) {
      this.log('warn', 'Circuit breaker HALF_OPEN (testing recovery)', {
        previousState: oldState,
      });
    } else if (newState === CircuitState.CLOSED) {
      this.failures.length = 0; // Очищаем все failures
      this.failureCount = 0;
      this.log('info', 'Circuit breaker CLOSED (recovered)', {
        previousState: oldState,
      });
    }
  }

  /**
   * Удаляет failures старше rolling window
   */
  private cleanupFailures(now: number): void {
    const cutoff = now - this.options.rollingWindow;
    while (this.failures.length > 0 && this.failures[0] < cutoff) {
      this.failures.shift();
    }
  }

  /**
   * Получить текущее состояние
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      recentFailures: this.failures.length,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
    };
  }

  /**
   * Принудительно сбросить Circuit (для тестов)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.failures.length = 0;
    this.nextAttempt = Date.now();
    this.log('info', 'Circuit breaker manually reset');
  }

  /**
   * Логирование
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any): void {
    if (!this.logger) return;

    const logData = {
      circuit: this.options.name,
      state: this.state,
      ...meta,
    };

    switch (level) {
      case 'info':
        this.logger.info(message, logData);
        break;
      case 'warn':
        this.logger.warn(message, logData);
        break;
      case 'error':
        this.logger.error(message, new Error(message), logData);
        break;
      case 'debug':
        this.logger.debug(message, logData);
        break;
    }
  }
}
