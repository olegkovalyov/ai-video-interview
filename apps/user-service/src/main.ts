import './infrastructure/tracing/tracing'; // Must be first — initializes OpenTelemetry before NestJS
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logger/logger.service';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Буферизуем логи до подключения logger
  });

  const logger = app.get(LoggerService);

  // Используем наш Winston Logger для ВСЕХ NestJS логов
  app.useLogger(logger);

  // No global prefix for microservice
  // Versioning should be handled at API Gateway level only
  // User Service exposes simple paths:
  // - /users (proxied by API Gateway)
  // - /internal/* (service-to-service)
  // - /health (monitoring)

  // Domain exception filter (maps domain exceptions to HTTP statuses)
  app.useGlobalFilters(new DomainExceptionFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User management microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-internal-token', in: 'header' }, 'internal-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use('/api/docs-json', (req, res) => {
    res.json(document);
  });

  // Graceful shutdown (from memory)
  app.enableShutdownHooks();

  const port = process.env.PORT || 8002;

  logger.info('🚀 User Service starting up', {
    service: 'user-service',
    action: 'startup',
    port,
    nodeEnv: process.env.NODE_ENV || 'development'
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

bootstrap().catch((error) => {
  // Logger not yet available at this point — fallback to stderr
  process.stderr.write(`Failed to start User Service: ${error}\n`);
  process.exit(1);
});
