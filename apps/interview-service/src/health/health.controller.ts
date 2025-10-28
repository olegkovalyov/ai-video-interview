import { Controller, Get } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Controller('health')
export class HealthController {
  constructor(private readonly logger: LoggerService) {}

  @Get()
  getHealth() {
    this.logger.debug('Health check', { category: 'health' });
    return {
      status: 'ok',
      service: 'interview-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  getLiveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  getReadiness() {
    return { status: 'ready' };
  }
}
