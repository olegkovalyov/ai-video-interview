import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

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
    // Логи в папке сервиса: apps/api-gateway/logs/
    // __dirname в compiled = apps/api-gateway/dist/logger
    // ../../logs = apps/api-gateway/logs (2 уровня вверх из dist/logger)
    const logsDir = path.join(__dirname, '../../logs');
    
    // Создаем директорию если не существует
    const fs = require('fs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const absolutePath = path.resolve(logsDir);
    console.log(`📝 Logger initialized. Log directory: ${absolutePath}`);
    
    // Формат для файлов - чистый JSON для Loki
    const fileFormat = winston.format.combine(
      winston.format.timestamp(), // ISO 8601 формат по умолчанию
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Формат для консоли - красивый вывод с объектами
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        // Удаляем служебные поля из meta
        const { version, environment, ...cleanMeta } = meta;
        const metaStr = Object.keys(cleanMeta).length > 0 ? `\n${JSON.stringify(cleanMeta, null, 2)}` : '';
        return `[${level}] ${service} - ${message}${metaStr}`;
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug', // DEBUG по умолчанию для dev
      defaultMeta: {
        service: 'api-gateway',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console для разработки - ВСЕ логи с уровня debug и выше
        new winston.transports.Console({
          level: 'debug', // Показываем все включая debug
          format: consoleFormat
        }),
        // Файл для всех логов (для Promtail/Loki) - ВСЕ логи
        new winston.transports.File({
          filename: path.join(logsDir, 'api-gateway.log'),
          level: 'debug', // Пишем все включая debug
          format: fileFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        // Файл только для ошибок
        new winston.transports.File({
          filename: path.join(logsDir, 'api-gateway-error.log'),
          format: fileFormat,
          level: 'error',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5
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
