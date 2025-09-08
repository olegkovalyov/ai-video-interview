import { Injectable } from '@nestjs/common';
import { trace, context, Span, SpanKind, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class TraceService {
  private tracer = trace.getTracer('api-gateway', process.env.npm_package_version || '1.0.0');

  /**
   * Создает новый span для операции
   */
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes,
    });
    return span;
  }

  /**
   * Создает HTTP span для внешних запросов
   */
  startHttpSpan(method: string, url: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(`HTTP ${method}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        ...attributes,
      },
    });
    return span;
  }

  /**
   * Выполняет функцию в контексте span'a
   */
  async withSpan<T>(
    spanName: string, 
    fn: (span: Span) => Promise<T> | T,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(spanName, attributes);
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return await fn(span);
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Добавляет событие к активному span'у
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.addEvent(name, attributes);
    }
  }

  /**
   * Добавляет атрибуты к активному span'у
   */
  setAttributes(attributes: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes(attributes);
    }
  }

  /**
   * Получает trace ID для логирования
   */
  getTraceId(): string {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().traceId;
    }
    return '';
  }

  /**
   * Получает span ID для логирования
   */
  getSpanId(): string {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().spanId;
    }
    return '';
  }

  /**
   * Создает child span для Kafka операций
   */
  startKafkaSpan(operation: string, topic: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(`kafka.${operation}`, {
      kind: operation === 'publish' ? SpanKind.PRODUCER : SpanKind.CONSUMER,
      attributes: {
        'messaging.system': 'kafka',
        'messaging.destination': topic,
        'messaging.operation': operation,
        ...attributes,
      },
    });
    return span;
  }

  /**
   * Создает database span
   */
  startDbSpan(operation: string, table?: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': operation,
        ...(table && { 'db.sql.table': table }),
        ...attributes,
      },
    });
    return span;
  }
}
