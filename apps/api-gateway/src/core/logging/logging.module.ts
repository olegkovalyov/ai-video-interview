import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Logging Module
 * Provides structured logging with Winston + Loki transport
 * 
 * Global module - LoggerService available everywhere without imports
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggingModule {}
