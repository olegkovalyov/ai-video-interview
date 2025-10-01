import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import DailyRotateFile = require('winston-daily-rotate-file');

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
    // Логи в папке сервиса: apps/user-service/logs/
    const logsDir = path.join(__dirname, '../../../logs');
    
    // Создаем директорию если не существует
    const fs = require('fs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Создаем archive директорию
    const archiveDir = path.join(logsDir, 'archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    const absolutePath = path.resolve(logsDir);
    console.log(`📝 Logger initialized. Log directory: ${absolutePath}`);
    
    // Формат для файлов - чистый JSON для Loki
    const fileFormat = winston.format.combine(
      winston.format.timestamp(), // ISO 8601 формат
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Формат для консоли - красивый вывод
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const { version, environment, ...cleanMeta } = meta;
        const metaStr = Object.keys(cleanMeta).length > 0 ? `\n${JSON.stringify(cleanMeta, null, 2)}` : '';
        return `[${level}] ${service} - ${message}${metaStr}`;
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      defaultMeta: {
        service: 'user-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console для разработки
        new winston.transports.Console({
          level: 'debug',
          format: consoleFormat
        }),
        // Daily rotating file для всех логов (для Promtail/Loki)
        new DailyRotateFile({
          filename: path.join(logsDir, 'user-service-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d', // Храним 14 дней
          level: 'debug',
          format: fileFormat,
        }),
        // Daily rotating file только для ошибок
        new DailyRotateFile({
          filename: path.join(logsDir, 'user-service-error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d', // Храним ошибки 30 дней
          level: 'error',
          format: fileFormat,
        }),
        // Monthly archive для долгосрочного хранения
        new DailyRotateFile({
          filename: path.join(logsDir, 'archive', 'user-service-%DATE%.log'),
          datePattern: 'YYYY-MM',
          zippedArchive: true,
          maxSize: '100m',
          maxFiles: '12m', // Храним 12 месяцев
          level: 'info',
          format: fileFormat,
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
