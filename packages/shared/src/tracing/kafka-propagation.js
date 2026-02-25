"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectTraceContext = injectTraceContext;
exports.extractTraceContext = extractTraceContext;
exports.withKafkaTracing = withKafkaTracing;
exports.getTraceInfo = getTraceInfo;
const api_1 = require("@opentelemetry/api");
function injectTraceContext(headers = {}) {
    const span = api_1.trace.getActiveSpan();
    if (!span) {
        return headers;
    }
    const spanContext = span.spanContext();
    const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
    return {
        ...headers,
        traceparent: Buffer.from(traceparent),
    };
}
function extractTraceContext(headers = {}) {
    const traceparent = headers?.traceparent?.toString();
    if (!traceparent) {
        return api_1.context.active();
    }
    return api_1.propagation.extract(api_1.context.active(), { traceparent });
}
async function withKafkaTracing(tracerName, operationName, headers, attributes, fn) {
    const extractedContext = extractTraceContext(headers);
    return await api_1.context.with(extractedContext, async () => {
        const span = api_1.trace.getTracer(tracerName).startSpan(operationName, {
            attributes: {
                'messaging.system': 'kafka',
                ...attributes,
            },
        });
        try {
            const result = await fn(span);
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            span.end();
            return result;
        }
        catch (error) {
            const err = error;
            span.recordException(err);
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: err.message,
            });
            span.end();
            throw error;
        }
    });
}
function getTraceInfo() {
    const span = api_1.trace.getActiveSpan();
    if (!span) {
        return null;
    }
    const ctx = span.spanContext();
    return {
        traceId: ctx.traceId,
        spanId: ctx.spanId,
    };
}
//# sourceMappingURL=kafka-propagation.js.map