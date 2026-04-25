import {
  trace,
  context,
  propagation,
  Span,
  SpanStatusCode,
  type Attributes,
} from "@opentelemetry/api";

/**
 * Injects OpenTelemetry trace context into Kafka message headers
 * Follows W3C Trace Context specification
 */
export function injectTraceContext(
  headers: Record<string, any> = {},
): Record<string, Buffer> {
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
  return propagation.extract(context.active(), { traceparent });
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
        "messaging.system": "kafka",
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

/**
 * Resume a trace that was paused on persistence (outbox row, BullMQ job
 * payload, etc.) by re-establishing its parent {@link SpanContext} as the
 * active context, then opening a new child span around `fn`.
 *
 * Use case: when an HTTP request saves an outbox row at T0 and a worker
 * publishes it at T0 + 5s, the worker is a fresh execution. Calling this
 * helper inside the worker — passing the `traceId` and `spanId` saved
 * with the row — connects the worker's `outbox.publish` span as a child
 * of the original HTTP span. Jaeger will render the full chain end-to-end.
 *
 * Returns whatever `fn` returns. The new span is ended automatically;
 * exceptions are recorded on the span and re-thrown.
 *
 * If `traceId` or `parentSpanId` is missing/invalid we still execute `fn`
 * but inside a fresh trace (no parent). Worth a span anyway so the work
 * shows up in tracing instead of disappearing.
 */
export async function withRestoredTrace<T>(
  options: {
    tracerName: string;
    operationName: string;
    traceId?: string | null;
    parentSpanId?: string | null;
    attributes?: Attributes;
  },
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const restored =
    options.traceId && options.parentSpanId
      ? trace.setSpanContext(context.active(), {
          traceId: options.traceId,
          spanId: options.parentSpanId,
          traceFlags: 1,
          isRemote: true,
        })
      : context.active();

  return await context.with(restored, async () => {
    const span = trace
      .getTracer(options.tracerName)
      .startSpan(options.operationName, {
        attributes: options.attributes ?? {},
      });
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const err = error as Error;
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
