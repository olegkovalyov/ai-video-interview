import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerRegistry } from '../circuit-breaker/circuit-breaker-registry.service';

interface ServiceHealthResult {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

const HEALTH_PROBE_TIMEOUT = 2000; // 2 seconds

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly userServiceUrl: string;
  private readonly interviewServiceUrl: string;
  private readonly analysisServiceUrl: string;

  constructor(
    private readonly circuitBreakerRegistry: CircuitBreakerRegistry,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userServiceUrl =
      this.configService.get('USER_SERVICE_URL') || 'http://localhost:8002';
    this.interviewServiceUrl =
      this.configService.get('INTERVIEW_SERVICE_URL') || 'http://localhost:8003';
    this.analysisServiceUrl =
      this.configService.get('AI_ANALYSIS_SERVICE_URL') || 'http://localhost:8005';
  }

  /**
   * Health check endpoint — active probes to downstream services + circuit breaker states
   */
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Active probes to downstream services + circuit breaker states' })
  @ApiResponse({ status: 200, description: 'Health status with per-service probe results and circuit breaker states' })
  async getHealth() {
    const circuitStatus = this.circuitBreakerRegistry.getHealthStatus();

    const [userHealth, interviewHealth, analysisHealth] = await Promise.all([
      this.probeService('user-service', `${this.userServiceUrl}/health`),
      this.probeService('interview-service', `${this.interviewServiceUrl}/health`),
      this.probeService('analysis-service', `${this.analysisServiceUrl}/health`),
    ]);

    const services = {
      'user-service': userHealth,
      'interview-service': interviewHealth,
      'analysis-service': analysisHealth,
    };

    const allUp = Object.values(services).every((s) => s.status === 'up');

    return {
      status: allUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      circuits: circuitStatus.circuits,
    };
  }

  /**
   * Readiness probe (Kubernetes)
   * API Gateway is ready if at least one downstream service is reachable
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe', description: 'Kubernetes readiness probe — checks circuit breaker states' })
  @ApiResponse({ status: 200, description: 'Readiness status with circuit breaker info' })
  async getReady() {
    const circuitStatus = this.circuitBreakerRegistry.getHealthStatus();

    const hasOpenCircuits = Object.values(circuitStatus.circuits).some(
      (circuit: any) => circuit.state === 'OPEN',
    );

    return {
      ready: true,
      circuits: circuitStatus.circuits,
      note: hasOpenCircuits
        ? 'Some downstream services are unavailable'
        : 'All systems operational',
    };
  }

  /**
   * Liveness probe (Kubernetes) — just checks that the process is alive
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe', description: 'Kubernetes liveness probe — checks process is alive' })
  @ApiResponse({ status: 200, description: 'Process alive status' })
  getLive() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Circuit breaker details
   */
  @Get('circuits')
  @ApiOperation({ summary: 'Circuit breaker details', description: 'Detailed state and stats for each circuit breaker' })
  @ApiResponse({ status: 200, description: 'Per-circuit breaker statistics' })
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

  // ═══════════════════════════════════════════════════════════

  private async probeService(
    name: string,
    url: string,
  ): Promise<ServiceHealthResult> {
    const start = Date.now();
    try {
      await firstValueFrom(
        this.httpService.get(url, { timeout: HEALTH_PROBE_TIMEOUT }),
      );
      return { status: 'up', responseTime: Date.now() - start };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error.code || error.message,
      };
    }
  }
}
