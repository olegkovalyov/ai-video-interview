import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'node:fs';
import path from 'node:path';
import LokiTransport from 'winston-loki';
import { prettyConsoleFormat, shouldEnableConsole } from './console.formatter';
import { correlationStore } from '../http/interceptors/correlation-id.store';

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
  [key: string]: unknown;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
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
    // Bootstrap notice — written to stdout before the logger itself is constructed.
    process.stdout.write(
      `📝 Logger initialized. Log directory: ${absolutePath}\n`,
    );

    // Формат для файлов - чистый JSON для Loki/Grafana
    const fileFormat = winston.format.combine(
      winston.format.timestamp(), // ISO 8601 формат
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    // Формат для консоли - красивый вывод как в NestJS
    const consoleFormat = winston.format.combine(prettyConsoleFormat);

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      defaultMeta: {
        service: 'user-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console для разработки (отключен в production)
        ...(shouldEnableConsole()
          ? [
              new winston.transports.Console({
                level: 'debug', // Показываем все включая debug
                format: consoleFormat,
              }),
            ]
          : []),
        // Loki transport - прямая отправка в Loki (РЕАЛЬНОЕ ВРЕМЯ)
        // Включается только если LOKI_HOST задан в env
        ...(process.env.LOKI_HOST
          ? [
              new LokiTransport({
                host: process.env.LOKI_HOST,
                labels: {
                  service: 'user-service',
                  environment: process.env.NODE_ENV || 'development',
                },
                json: true,
                format: fileFormat,
                replaceTimestamp: true,
                level: 'debug',
                onConnectionError: (err: unknown) => {
                  // Last-resort fallback: Loki transport failed, main logger may not be usable yet.
                  // Write to stderr once to surface the problem without spamming.
                  const state = this as unknown as {
                    _lokiErrorLogged?: boolean;
                  };
                  if (!state._lokiErrorLogged) {
                    const message =
                      err instanceof Error ? err.message : String(err);
                    process.stderr.write(
                      `Loki connection error (further errors suppressed): ${message}\n`,
                    );
                    state._lokiErrorLogged = true;
                  }
                },
              }),
            ]
          : []),
        // Файл в папке по дате: logs/2025-10-02/user-service.log (fallback)
        new winston.transports.File({
          filename: path.join(logsDir, 'user-service.log'),
          level: 'debug',
          format: fileFormat,
          maxsize: 100 * 1024 * 1024, // 100MB per day
        }),
        // Отдельный файл для ошибок
        new winston.transports.File({
          filename: path.join(logsDir, 'user-service-error.log'),
          level: 'error',
          format: fileFormat,
          maxsize: 50 * 1024 * 1024, // 50MB
        }),
      ],
    });
  }

  /**
   * Enriches log context with correlationId from AsyncLocalStorage.
   * Automatically attached to every log entry within a request scope.
   */
  private enrichWithCorrelationId(
    context?: LogContext,
  ): LogContext | undefined {
    const store = correlationStore.getStore();
    if (!store?.correlationId) return context;
    return { correlationId: store.correlationId, ...context };
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, this.enrichWithCorrelationId(context));
  }

  // Перегруженный error для совместимости с NestJS и нашим кодом
  error(message: unknown, ...optionalParams: unknown[]) {
    if (optionalParams.length === 0) {
      this.logger.error(String(message), this.enrichWithCorrelationId());
      return;
    }

    const firstParam = optionalParams[0];
    const secondParam =
      optionalParams.length > 1 ? optionalParams[1] : undefined;

    // Проверяем если первый параметр - Error object
    if (firstParam instanceof Error) {
      this.logger.error(
        String(message),
        this.enrichWithCorrelationId({
          ...LoggerService.toLogContext(secondParam),
          error: {
            name: firstParam.name,
            message: firstParam.message,
            stack: firstParam.stack,
          },
        }),
      );
      return;
    }

    // Иначе считаем что это NestJS format (message, stack, context)
    const hasStack =
      typeof firstParam === 'string' && firstParam.includes('\n');
    const stack = hasStack ? firstParam : undefined;
    const contextIndex = hasStack ? 1 : 0;
    const rawContext =
      optionalParams.length > contextIndex
        ? optionalParams[contextIndex]
        : undefined;

    this.logger.error(
      String(message),
      this.enrichWithCorrelationId({
        ...LoggerService.toLogContext(rawContext),
        stack: stack,
      }),
    );
  }

  /**
   * NestJS passes the "context" argument as a string (the emitting class name)
   * or as a structured log context object. Narrow to a spreadable object shape.
   */
  private static toLogContext(value: unknown): LogContext {
    if (typeof value === 'string') return { context: value };
    if (value && typeof value === 'object') return value as LogContext;
    return {};
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.logger.warn(
      String(message),
      this.enrichWithCorrelationId(
        typeof context === 'string' ? { context } : (context as LogContext),
      ),
    );
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.logger.debug(
      String(message),
      this.enrichWithCorrelationId(
        typeof context === 'string' ? { context } : (context as LogContext),
      ),
    );
  }

  // Методы для совместимости с NestJS LoggerService interface
  log(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.info(
      String(message),
      typeof context === 'string' ? { context } : (context as LogContext),
    );
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.debug(
      String(message),
      typeof context === 'string' ? { context } : (context as LogContext),
    );
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.length > 0 ? optionalParams[0] : undefined;
    this.error(
      String(message),
      undefined,
      typeof context === 'string' ? { context } : (context as LogContext),
    );
  }

  debugObject(
    message: string,
    data: Record<string, unknown>,
    context?: LogContext,
  ) {
    this.logger.debug(message, {
      ...context,
      data: data,
    });
  }

  infoObject(
    message: string,
    data: Record<string, unknown>,
    context?: LogContext,
  ) {
    this.logger.info(message, {
      ...context,
      data: data,
    });
  }

  // Domain-specific logging methods

  commandLog(commandName: string, success: boolean, context?: LogContext) {
    const message = `Command: ${commandName} ${success ? 'success' : 'failed'}`;
    if (success) {
      this.info(message, {
        ...context,
        category: 'command',
        commandName,
        success,
      });
    } else {
      this.error(message, undefined, {
        ...context,
        category: 'command',
        commandName,
        success,
      });
    }
  }

  queryLog(queryName: string, duration: number, context?: LogContext) {
    this.debug(`Query: ${queryName} took ${duration}ms`, {
      ...context,
      category: 'query',
      queryName,
      duration,
    });
  }

  eventLog(eventName: string, context?: LogContext) {
    this.info(`Event: ${eventName}`, {
      ...context,
      category: 'event',
      eventName,
    });
  }

  kafkaLog(
    action: string,
    topic: string,
    success: boolean,
    context?: LogContext,
  ) {
    const message = `Kafka: ${action} to ${topic} ${success ? 'success' : 'failed'}`;
    const logData = { ...context, category: 'kafka', action, topic, success };

    if (success) {
      this.info(message, logData);
    } else {
      this.error(message, undefined, logData);
    }
  }

  httpLog(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ) {
    this.info(`HTTP: ${method} ${url} ${statusCode}`, {
      ...context,
      category: 'http',
      method,
      url,
      statusCode,
      duration,
    });
  }

  performanceLog(operation: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      category: 'performance',
      operation,
      duration,
    });
  }
}
