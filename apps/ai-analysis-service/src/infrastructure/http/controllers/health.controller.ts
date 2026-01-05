import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns service health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'ai-analysis-service' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'ai-analysis-service',
      timestamp: new Date().toISOString(),
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
  readiness() {
    return { status: 'ok' };
  }
}
