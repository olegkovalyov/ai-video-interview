import './infrastructure/tracing/tracing'; // Must be first — initializes OpenTelemetry before NestJS
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logger/logger.service';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';
import { OptimisticLockFilter } from './infrastructure/http/filters/optimistic-lock.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  configureGlobalMiddleware(app);
  configureSwagger(app);
  app.enableShutdownHooks();

  const port = process.env.PORT || 8002;
  logger.info('🚀 User Service starting up', {
    service: 'user-service',
    action: 'startup',
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
  });

  await app.listen(port);

  logger.info('User Service successfully started', {
    service: 'user-service',
    action: 'startup_complete',
    port,
    url: `http://localhost:${port}`,
    docsUrl: `http://localhost:${port}/api/docs`,
  });
}

/**
 * Wire up global filters, the validation pipe, and CORS.
 * No global prefix is set — versioning happens at the API Gateway level;
 * this microservice exposes simple paths (/users, /internal/*, /health).
 */
function configureGlobalMiddleware(app: INestApplication): void {
  app.useGlobalFilters(new OptimisticLockFilter(), new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  });
}

/** Mount Swagger UI at /api/docs and expose the raw OpenAPI JSON. */
function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User management microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'x-internal-token', in: 'header' },
      'internal-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app.use('/api/docs-json', (_req: Request, res: Response) => {
    res.json(document);
  });
}

bootstrap().catch((error) => {
  // Logger not yet available at this point — fallback to stderr.
  process.stderr.write(`Failed to start User Service: ${String(error)}\n`);
  // eslint-disable-next-line unicorn/no-process-exit -- service bootstrap is the CLI entry point; exiting with a non-zero code is the correct signal for orchestrators (Docker, K8s) to restart.
  process.exit(1);
});
