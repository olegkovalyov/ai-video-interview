import { trace, context, propagation, Span, SpanStatusCode } from '@opentelemetry/api';

/**
 * Injects OpenTelemetry trace context into Kafka message headers
 * Follows W3C Trace Context specification
 */
export function injectTraceContext(headers: Record<string, any> = {}): Record<string, Buffer> {
  const span = trace.getActiveSpan();
  
  if (!span) {
    return headers;
  }
  
  const spanContext = span.spanContext();
  
  // W3C Trace Context format: version-traceId-spanId-flags
  const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
  
  return {
    ...headers,
    traceparent: Buffer.from(traceparent),
  };
}

/**
 * Extracts OpenTelemetry trace context from Kafka message headers
 */
export function extractTraceContext(headers: Record<string, any> = {}): any {
  const traceparent = headers?.traceparent?.toString();
  
  if (!traceparent) {
    return context.active();
  }
  
  // Extract context using W3C propagator
  return propagation.extract(
    context.active(),
    { traceparent },
  );
}

/**
 * Creates a new span with extracted trace context from Kafka message
 * Use this in Kafka consumers to continue the trace
 */
export async function withKafkaTracing<T>(
  tracerName: string,
  operationName: string,
  headers: Record<string, any>,
  attributes: Record<string, any>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const extractedContext = extractTraceContext(headers);
  
  return await context.with(extractedContext, async () => {
    const span = trace.getTracer(tracerName).startSpan(operationName, {
      attributes: {
        'messaging.system': 'kafka',
        ...attributes,
      },
    });
    
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    } catch (error) {
      const err = error as Error;
      span.recordException(err);
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      span.end();
      throw error;
    }
  });
}

/**
 * Utility to log trace information
 */
export function getTraceInfo(): { traceId: string; spanId: string } | null {
  const span = trace.getActiveSpan();
  
  if (!span) {
    return null;
  }
  
  const ctx = span.spanContext();
  return {
    traceId: ctx.traceId,
    spanId: ctx.spanId,
  };
}
