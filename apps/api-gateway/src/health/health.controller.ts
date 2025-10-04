import { Controller, Get } from '@nestjs/common';
import { CircuitBreakerRegistry } from '../circuit-breaker';

@Controller('health')
export class HealthController {
  constructor(
    private readonly circuitBreakerRegistry: CircuitBreakerRegistry,
  ) {}

  /**
   * Health check endpoint
   * Возвращает общий статус и состояние Circuit Breakers
   */
  @Get()
  getHealth() {
    const circuitStatus = this.circuitBreakerRegistry.getHealthStatus();

    return {
      status: circuitStatus.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      circuits: circuitStatus.circuits,
    };
  }

  /**
   * Readiness probe (для Kubernetes)
   * Проверяет готовность приложения к обработке запросов
   */
  @Get('ready')
  getReady() {
    const circuitStatus = this.circuitBreakerRegistry.getHealthStatus();

    // Ready если хотя бы один сервис доступен
    const hasOpenCircuits = Object.values(circuitStatus.circuits).some(
      (circuit: any) => circuit.state === 'OPEN',
    );

    return {
      ready: true, // API Gateway всегда ready, даже если downstream services недоступны
      circuits: circuitStatus.circuits,
      note: hasOpenCircuits
        ? 'Some downstream services are unavailable'
        : 'All systems operational',
    };
  }

  /**
   * Liveness probe (для Kubernetes)
   * Проверяет что процесс жив
   */
  @Get('live')
  getLive() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Детальная информация о Circuit Breakers
   */
  @Get('circuits')
  getCircuits() {
    const circuits = this.circuitBreakerRegistry.getAll();
    const status: Record<string, any> = {};

    for (const [name, circuit] of circuits.entries()) {
      status[name] = circuit.getStats();
    }

    return {
      timestamp: new Date().toISOString(),
      circuits: status,
    };
  }
}
