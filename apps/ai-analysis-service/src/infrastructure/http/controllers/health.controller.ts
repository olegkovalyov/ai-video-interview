import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns service health status with dependency checks' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is degraded' })
  async check() {
    const dbHealthy = await this.checkDatabase();
    const status = dbHealthy ? 'ok' : 'degraded';

    if (!dbHealthy) {
      throw new ServiceUnavailableException({
        status,
        service: 'ai-analysis-service',
        timestamp: new Date().toISOString(),
        dependencies: { database: dbHealthy ? 'up' : 'down' },
      });
    }

    return {
      status,
      service: 'ai-analysis-service',
      timestamp: new Date().toISOString(),
      dependencies: { database: 'up' },
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe', description: 'Kubernetes liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe', description: 'Kubernetes readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    const dbHealthy = await this.checkDatabase();
    if (!dbHealthy) {
      throw new ServiceUnavailableException({ status: 'not_ready', reason: 'database unavailable' });
    }
    return { status: 'ok' };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.warn('Database health check failed', error instanceof Error ? error.message : error);
      return false;
    }
  }
}
