import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logger/logger.service';

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

  console.log(`🚀 Interview Service running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}, shutting down Interview Service gracefully...`);
    try {
      await app.close();
      console.log('✅ Interview Service closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Interview Service:', error);
  process.exit(1);
});
