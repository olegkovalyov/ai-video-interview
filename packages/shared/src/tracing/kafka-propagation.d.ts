import { Span } from '@opentelemetry/api';
export declare function injectTraceContext(headers?: Record<string, any>): Record<string, Buffer>;
export declare function extractTraceContext(headers?: Record<string, any>): any;
export declare function withKafkaTracing<T>(tracerName: string, operationName: string, headers: Record<string, any>, attributes: Record<string, any>, fn: (span: Span) => Promise<T>): Promise<T>;
export declare function getTraceInfo(): {
    traceId: string;
    spanId: string;
} | null;
