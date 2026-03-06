import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import DailyRotateFile = require('winston-daily-rotate-file');
import { prettyConsoleFormat, shouldEnableConsole } from './console.formatter';
import LokiTransport = require('winston-loki');

export interface LogContext {
  userId?: string;
  traceId?: string;
  sessionId?: string;
  action?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const fs = require('fs');
    
    // Логи в папке сервиса: apps/user-service/logs/
    const baseLogsDir = path.join(__dirname, '../../../logs');
    
    // Папка по дате: logs/2025-10-02/
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logsDir = path.join(baseLogsDir, today);
    
    // Создаем директорию с датой
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const absolutePath = path.resolve(logsDir);
    console.log(`📝 Logger initialized. Log directory: ${absolutePath}`);
    
    // Формат для файлов - чистый JSON для Loki/Grafana
    const fileFormat = winston.format.combine(
      winston.format.timestamp(), // ISO 8601 формат
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Формат для консоли - красивый вывод как в NestJS
    const consoleFormat = winston.format.combine(
      prettyConsoleFormat
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      defaultMeta: {
        service: 'interview-service',
        version: process.env.npm_package_version || '0.0.1',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console для разработки (отключен в production)
        ...(shouldEnableConsole() ? [
          new winston.transports.Console({
            level: 'debug', // Показываем все включая debug
            format: consoleFormat
          })
        ] : []),
        // Loki transport - прямая отправка в Loki (РЕАЛЬНОЕ ВРЕМЯ)
        // Включается только если LOKI_HOST задан в env
        ...(process.env.LOKI_HOST ? [
          new LokiTransport({
            host: process.env.LOKI_HOST,
            labels: { service: 'interview-service', environment: process.env.NODE_ENV || 'development' },
            json: true,
            format: fileFormat,
            replaceTimestamp: true,
            level: 'debug',
            onConnectionError: (err: unknown) => {
              if (!(this as any)._lokiErrorLogged) {
                console.error('Loki connection error (further errors suppressed):', err instanceof Error ? err.message : err);
                (this as any)._lokiErrorLogged = true;
              }
            }
          })
        ] : []),
        // Файл в папке по дате: logs/2025-10-02/interview-service.log (fallback)
        new winston.transports.File({
          filename: path.join(logsDir, 'interview-service.log'),
          level: 'debug',
          format: fileFormat,
          maxsize: 100 * 1024 * 1024, // 100MB per day
        }),
        // Отдельный файл для ошибок
        new winston.transports.File({
          filename: path.join(logsDir, 'interview-service-error.log'),
          level: 'error',
          format: fileFormat,
          maxsize: 50 * 1024 * 1024, // 50MB
        })
      ]
    });
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  // Перегруженный error для совместимости с NestJS и нашим кодом
  error(message: any, ...optionalParams: any[]) {
    if (optionalParams.length === 0) {
      this.logger.error(String(message));
      return;
    }
    
    const firstParam = optionalParams[0];
    const secondParam = optionalParams.length > 1 ? optionalParams[1] : undefined;
    
    // Проверяем если первый параметр - Error object
    if (firstParam instanceof Error) {
      this.logger.error(String(message), {
        ...(typeof secondParam === 'string' ? { context: secondParam } : secondParam),
        error: {
          name: firstParam.name,
          message: firstParam.message,
          stack: firstParam.stack
        }
      });
      return;
    }
    
    // Иначе считаем что это NestJS format (message, stack, context)
    const hasStack = typeof firstParam === 'string' && firstParam.includes('\n');
    const stack = hasStack ? firstParam : undefined;
    const contextIndex = hasStack ? 1 : 0;
    const context = optionalParams.length > contextIndex ? optionalParams[contextIndex] : undefined;
    
    this.logger.error(String(message), {
      ...(typeof context === 'string' ? { context } : context),
      stack: stack
    });
  }

  warn(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.logger.warn(String(message), typeof context === 'string' ? { context } : context);
  }

  debug(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.logger.debug(String(message), typeof context === 'string' ? { context } : context);
  }

  // Методы для совместимости с NestJS LoggerService interface
  log(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.info(String(message), typeof context === 'string' ? { context } : context);
  }

  verbose(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.debug(String(message), typeof context === 'string' ? { context } : context);
  }

  fatal(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.error(String(message), undefined, typeof context === 'string' ? { context } : context);
  }

  debugObject(message: string, data: Record<string, any>, context?: LogContext) {
    this.logger.debug(message, {
      ...context,
      data: data
    });
  }

  infoObject(message: string, data: Record<string, any>, context?: LogContext) {
    this.logger.info(message, {
      ...context,
      data: data
    });
  }

  // Domain-specific logging methods

  commandLog(commandName: string, success: boolean, context?: LogContext) {
    const message = `Command: ${commandName} ${success ? 'success' : 'failed'}`;
    if (success) {
      this.info(message, { ...context, category: 'command', commandName, success });
    } else {
      this.error(message, undefined, { ...context, category: 'command', commandName, success });
    }
  }

  queryLog(queryName: string, duration: number, context?: LogContext) {
    this.debug(`Query: ${queryName} took ${duration}ms`, {
      ...context,
      category: 'query',
      queryName,
      duration
    });
  }

  eventLog(eventName: string, context?: LogContext) {
    this.info(`Event: ${eventName}`, {
      ...context,
      category: 'event',
      eventName
    });
  }

  kafkaLog(action: string, topic: string, success: boolean, context?: LogContext) {
    const message = `Kafka: ${action} to ${topic} ${success ? 'success' : 'failed'}`;
    const logData = { ...context, category: 'kafka', action, topic, success };
    
    if (success) {
      this.info(message, logData);
    } else {
      this.error(message, undefined, logData);
    }
  }

  httpLog(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    this.info(`HTTP: ${method} ${url} ${statusCode}`, {
      ...context,
      category: 'http',
      method,
      url,
      statusCode,
      duration
    });
  }

  performanceLog(operation: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      category: 'performance',
      operation,
      duration
    });
  }
}
