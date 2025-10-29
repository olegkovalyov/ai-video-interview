import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Health Controller
 * Service health checks
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const dbConnected = this.dataSource.isInitialized;

    return {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      database: dbConnected ? 'connected' : 'disconnected',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async readinessCheck() {
    // Check if database is ready
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async livenessCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
