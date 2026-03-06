import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import DailyRotateFile = require('winston-daily-rotate-file');
import { prettyConsoleFormat, shouldEnableConsole } from './console.formatter';
import LokiTransport = require('winston-loki');
import { correlationStore } from '../middleware/correlation-id.store';

export interface LogContext {
  userId?: string;
  traceId?: string;
  correlationId?: string;
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
    
    // Логи в папке сервиса: apps/api-gateway/logs/
    // __dirname в compiled = apps/api-gateway/dist/core/logging
    // ../../../logs = apps/api-gateway/logs (3 уровня вверх из dist/core/logging)
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
      winston.format.timestamp(), // ISO 8601 формат по умолчанию
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Формат для консоли - красивый вывод как в NestJS
    const consoleFormat = winston.format.combine(
      prettyConsoleFormat
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug', // DEBUG по умолчанию для dev
      defaultMeta: {
        service: 'api-gateway',
        version: process.env.npm_package_version || '1.0.0',
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
            labels: { service: 'api-gateway', environment: process.env.NODE_ENV || 'development' },
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
        // Файл в папке по дате: logs/2025-10-02/api-gateway.log (fallback)
        new winston.transports.File({
          filename: path.join(logsDir, 'api-gateway.log'),
          level: 'debug',
          format: fileFormat,
          maxsize: 100 * 1024 * 1024, // 100MB per day
        }),
        // Отдельный файл для ошибок
        new winston.transports.File({
          filename: path.join(logsDir, 'api-gateway-error.log'),
          level: 'error',
          format: fileFormat,
          maxsize: 50 * 1024 * 1024, // 50MB
        })
      ]
    });
  }

  /**
   * Enriches log context with correlationId from AsyncLocalStorage.
   * Automatically attached to every log entry within a request scope.
   */
  private enrichWithCorrelationId(context?: LogContext): LogContext | undefined {
    const store = correlationStore.getStore();
    if (!store?.correlationId) return context;
    return { correlationId: store.correlationId, ...context };
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, this.enrichWithCorrelationId(context));
  }

  // Перегруженный error для совместимости с NestJS и нашим кодом
  error(message: any, ...optionalParams: any[]) {
    // Поддерживаем разные форматы:
    // 1. error(message, stack, context) - NestJS format
    // 2. error(message, Error, context) - наш старый format
    // 3. error(message, context) - упрощенный format

    if (optionalParams.length === 0) {
      // Только message
      this.logger.error(String(message), this.enrichWithCorrelationId());
      return;
    }

    const firstParam = optionalParams[0];
    const secondParam = optionalParams.length > 1 ? optionalParams[1] : undefined;

    // Проверяем если первый параметр - Error object или похож на Error
    if (firstParam && typeof firstParam === 'object' && (firstParam instanceof Error || firstParam.stack || firstParam.message)) {
      this.logger.error(String(message), this.enrichWithCorrelationId({
        ...(typeof secondParam === 'string' ? { context: secondParam } : secondParam),
        error: {
          name: firstParam.name || 'Error',
          message: firstParam.message || String(firstParam),
          stack: firstParam.stack || 'No stack trace'
        }
      }));
      return;
    }

    // Иначе считаем что это NestJS format (message, stack, context)
    const hasStack = typeof firstParam === 'string' && firstParam.includes('\n');
    const stack = hasStack ? firstParam : undefined;
    const contextIndex = hasStack ? 1 : 0;
    const context = optionalParams.length > contextIndex ? optionalParams[contextIndex] : undefined;

    this.logger.error(String(message), this.enrichWithCorrelationId({
      ...(typeof context === 'string' ? { context } : context),
      stack: stack
    }));
  }

  warn(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.logger.warn(String(message), this.enrichWithCorrelationId(typeof context === 'string' ? { context } : context));
  }

  debug(message: any, ...optionalParams: any[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.logger.debug(String(message), this.enrichWithCorrelationId(typeof context === 'string' ? { context } : context));
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

  /**
   * Логирует структурированные данные (объекты) с правильной сериализацией
   * Используй этот метод вместо console.log для debug информации
   */
  debugObject(message: string, data: Record<string, any>, context?: LogContext) {
    this.logger.debug(message, {
      ...context,
      data: data // Winston автоматически сериализует в JSON
    });
  }

  /**
   * Логирует структурированные данные на info уровне
   */
  infoObject(message: string, data: Record<string, any>, context?: LogContext) {
    this.logger.info(message, {
      ...context,
      data: data
    });
  }

  /**
   * Метод для логирования ошибок с Error объектом (для обратной совместимости)
   */
  errorWithException(message: string, error?: Error, context?: LogContext) {
    this.logger.error(message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  // Специальные методы для различных типов логов

  authLog(action: string, context: LogContext) {
    this.info(`Auth: ${action}`, {
      ...context,
      category: 'authentication',
      action
    });
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

  businessLog(event: string, context: LogContext) {
    this.info(`Business: ${event}`, {
      ...context,
      category: 'business',
      event
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
