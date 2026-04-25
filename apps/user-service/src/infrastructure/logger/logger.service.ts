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
  private lokiErrorLogged = false;

  constructor() {
    const logsDir = LoggerService.ensureDailyLogDir();
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      defaultMeta: {
        service: 'user-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: this.createTransports(logsDir),
    });
  }

  /**
   * Resolve `apps/user-service/logs/YYYY-MM-DD/` and create it if missing.
   * Stdout is used here because the Winston logger is not constructed yet.
   */
  private static ensureDailyLogDir(): string {
    const baseLogsDir = path.join(__dirname, '../../../logs');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logsDir = path.join(baseLogsDir, today);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    process.stdout.write(
      `📝 Logger initialized. Log directory: ${path.resolve(logsDir)}\n`,
    );
    return logsDir;
  }

  /**
   * Build the Winston transport list. Console + Loki are conditional on env;
   * the two file transports always run as a durable fallback.
   */
  private createTransports(logsDir: string): winston.transport[] {
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );
    const transports: winston.transport[] = [];
    if (shouldEnableConsole()) {
      transports.push(LoggerService.createConsoleTransport());
    }
    const lokiHost = process.env.LOKI_HOST;
    if (lokiHost) {
      transports.push(this.createLokiTransport(lokiHost, fileFormat));
    }
    transports.push(...LoggerService.createFileTransports(logsDir, fileFormat));
    return transports;
  }

  private static createConsoleTransport(): winston.transport {
    return new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(prettyConsoleFormat),
    });
  }

  private static createFileTransports(
    logsDir: string,
    fileFormat: winston.Logform.Format,
  ): winston.transport[] {
    return [
      new winston.transports.File({
        filename: path.join(logsDir, 'user-service.log'),
        level: 'debug',
        format: fileFormat,
        maxsize: 100 * 1024 * 1024, // 100MB per day
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'user-service-error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 50 * 1024 * 1024,
      }),
    ];
  }

  private createLokiTransport(
    host: string,
    fileFormat: winston.Logform.Format,
  ): LokiTransport {
    return new LokiTransport({
      host,
      labels: {
        service: 'user-service',
        environment: process.env.NODE_ENV || 'development',
      },
      json: true,
      format: fileFormat,
      replaceTimestamp: true,
      level: 'debug',
      onConnectionError: (err: unknown) => {
        // Last-resort fallback: Loki failed and main logger may not be
        // usable yet. Write to stderr once to surface the problem without
        // spamming on every reconnect attempt.
        if (!this.lokiErrorLogged) {
          const message = err instanceof Error ? err.message : String(err);
          process.stderr.write(
            `Loki connection error (further errors suppressed): ${message}\n`,
          );
          this.lokiErrorLogged = true;
        }
      },
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

  /**
   * Overloaded error logger. Accepts both shapes:
   *   error(msg)
   *   error(msg, err: Error, ctx?)         — our app code
   *   error(msg, stackString, ctxString?)   — NestJS internal logger format
   */
  error(message: unknown, ...optionalParams: unknown[]) {
    if (optionalParams.length === 0) {
      this.logger.error(String(message), this.enrichWithCorrelationId());
      return;
    }
    const context = LoggerService.buildErrorContext(optionalParams);
    this.logger.error(String(message), this.enrichWithCorrelationId(context));
  }

  private static buildErrorContext(params: unknown[]): LogContext {
    const [first, second] = params;
    if (first instanceof Error) {
      return {
        ...LoggerService.toLogContext(second),
        error: { name: first.name, message: first.message, stack: first.stack },
      };
    }
    // NestJS format: (message, stack, context). `stack` is a multi-line string.
    const hasStack = typeof first === 'string' && first.includes('\n');
    const stack = hasStack ? first : undefined;
    const rawContext = hasStack ? second : first;
    return { ...LoggerService.toLogContext(rawContext), stack };
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
}
