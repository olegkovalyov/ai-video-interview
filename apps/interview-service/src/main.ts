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
  // Interview Service exposes simple paths:
  // - /templates (proxied by API Gateway)
  // - /invitations (proxied by API Gateway)
  // - /internal/* (service-to-service)
  // - /health (monitoring)

  // Domain exception filter (maps DomainException → HTTP status)
  // Resolved from DI container so it receives LoggerService injection
  const domainFilter = app.get(DomainExceptionFilter);
  app.useGlobalFilters(domainFilter);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Interview Service API')
    .setDescription('Interview management microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-internal-token', in: 'header' }, 'internal-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use('/api/docs-json', (req, res) => {
    res.json(document);
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 8003;

  logger.info('🚀 Interview Service starting up', {
    service: 'interview-service',
    action: 'startup',
    port,
    nodeEnv: process.env.NODE_ENV || 'development'
  });

  await app.listen(port);

  logger.info('✅ Interview Service successfully started', {
    service: 'interview-service',
    action: 'startup_complete',
    port,
    url: `http://localhost:${port}`,
    docsUrl: `http://localhost:${port}/api/docs`
  });

}

bootstrap().catch((error) => {
  // Logger may not be available if bootstrap fails before DI resolution
  // eslint-disable-next-line no-console
  console.error('Failed to start Interview Service:', error);
  process.exit(1);
});
