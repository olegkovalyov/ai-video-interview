import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// eslint-disable-next-line sonarjs/deprecation -- TODO(#otel-migration): migrate to OTLPTraceExporter (http://localhost:4318/v1/traces) after the observability stack is upgraded to accept OTLP on the Jaeger collector.
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const serviceName = 'user-service';

// eslint-disable-next-line sonarjs/deprecation -- see tracing.ts import TODO
const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

const sdk = new NodeSDK({
  serviceName,
  traceExporter: jaegerExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
    }),
  ],
});

sdk.start();

export { sdk };
