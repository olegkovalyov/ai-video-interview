import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileLoggerService implements NestLoggerService {
  private readonly serviceName: string;
  private readonly logDir: string;
  private readonly logFile: string;

  constructor() {
    // Определяем имя сервиса из package.json или переменной окружения
    this.serviceName = process.env.SERVICE_NAME || this.getServiceNameFromPackage() || 'unknown-service';
    
    // Логи в папке текущего сервиса
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `${this.serviceName}.log`);
    
    // Создаем папку logs если не существует
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getServiceNameFromPackage(): string | undefined {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.name;
    } catch {
      return undefined;
    }
  }

  private writeToFile(level: string, message: any, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      context: context || 'Application',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(trace && { trace }),
      traceId: this.getTraceId(),
      spanId: this.getSpanId()
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Асинхронная запись в файл
    fs.appendFile(this.logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });

    // Дублируем в console для разработки (с цветами)
    if (process.env.NODE_ENV === 'development') {
      const levelColors = {
        ERROR: '\x1b[31m[ERROR]\x1b[0m',
        WARN: '\x1b[33m[WARN] \x1b[0m',
        INFO: '\x1b[32m[INFO] \x1b[0m',
        DEBUG: '\x1b[34m[DEBUG]\x1b[0m',
        VERBOSE: '\x1b[35m[VERBOSE]\x1b[0m',
        FATAL: '\x1b[41m[FATAL]\x1b[0m',
      };
      
      const coloredLevel = levelColors[level.toUpperCase()] || `[${level.toUpperCase()}]`;
      const contextColored = context ? `\x1b[36m${context}\x1b[0m` : 'App';
      const consoleMsg = `${coloredLevel} ${contextColored} - ${logEntry.message}`;
      console.log(consoleMsg);
    }
  }

  private getTraceId(): string | undefined {
    // Интеграция с OpenTelemetry для trace ID
    try {
      const trace = require('@opentelemetry/api').trace;
      const span = trace.getActiveSpan();
      return span?.spanContext()?.traceId;
    } catch {
      return undefined;
    }
  }

  private getSpanId(): string | undefined {
    // Интеграция с OpenTelemetry для span ID
    try {
      const trace = require('@opentelemetry/api').trace;
      const span = trace.getActiveSpan();
      return span?.spanContext()?.spanId;
    } catch {
      return undefined;
    }
  }

  log(message: any, context?: string) {
    this.writeToFile('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.writeToFile('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.writeToFile('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.writeToFile('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.writeToFile('verbose', message, context);
  }

  fatal(message: any, context?: string) {
    this.writeToFile('fatal', message, context);
  }
}
