import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { CircuitBreaker, CircuitBreakerOptions, CircuitState } from './circuit-breaker';

/**
 * Централизованное управление Circuit Breakers
 * 
 * Создаёт и управляет Circuit Breakers для разных сервисов,
 * собирает метрики, предоставляет health check информацию
 */
@Injectable()
export class CircuitBreakerRegistry {
  private readonly circuits = new Map<string, CircuitBreaker>();

  constructor(
    private readonly loggerService: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    // Запускаем периодический сбор метрик
    this.startMetricsCollection();
  }

  /**
   * Получить или создать Circuit Breaker для сервиса
   */
  getOrCreate(name: string, options: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuits.has(name)) {
      const circuit = new CircuitBreaker(
        { ...options, name },
        this.loggerService,
      );
      this.circuits.set(name, circuit);

      this.loggerService.info(`Circuit breaker '${name}' created`, {
        options,
      });
    }

    return this.circuits.get(name)!;
  }

  /**
   * Получить существующий Circuit Breaker
   */
  get(name: string): CircuitBreaker | undefined {
    return this.circuits.get(name);
  }

  /**
   * Получить все Circuit Breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.circuits;
  }

  /**
   * Получить статус всех circuits для health check
   */
  getHealthStatus(): {
    healthy: boolean;
    circuits: Record<string, any>;
  } {
    const circuits: Record<string, any> = {};
    let allHealthy = true;

    for (const [name, circuit] of this.circuits.entries()) {
      const stats = circuit.getStats();
      circuits[name] = stats;

      // Circuit считается unhealthy если OPEN
      if (stats.state === CircuitState.OPEN) {
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      circuits,
    };
  }

  /**
   * Сбросить все circuits (для тестов)
   */
  resetAll(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }
    this.loggerService.warn('All circuit breakers have been reset');
  }

  /**
   * Периодически собираем метрики для Prometheus
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      for (const [name, circuit] of this.circuits.entries()) {
        const stats = circuit.getStats();

        // Обновляем метрику состояния
        this.metricsService.setCircuitBreakerState(name, stats.state);

        // Обновляем метрику количества failures
        this.metricsService.setCircuitBreakerFailures(name, stats.recentFailures);
      }
    }, 5000); // Каждые 5 секунд
  }
}
