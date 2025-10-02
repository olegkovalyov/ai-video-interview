import { Injectable } from '@nestjs/common';
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
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const fs = require('fs');
    
    // Логи в папке сервиса: apps/api-gateway/logs/
    // __dirname в compiled = apps/api-gateway/dist/logger
    // ../../logs = apps/api-gateway/logs (2 уровня вверх из dist/logger)
    const baseLogsDir = path.join(__dirname, '../../logs');
    
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
        new LokiTransport({
          host: 'http://localhost:3100',
          labels: { service: 'api-gateway', environment: process.env.NODE_ENV || 'development' },
          json: true,
          format: fileFormat,
          replaceTimestamp: true,
          onConnectionError: (err) => console.error('Loki connection error:', err)
        }),
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

  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logger.error(message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
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
