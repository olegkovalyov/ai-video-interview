import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);

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

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('AI Analysis Service API')
    .setDescription('AI-powered interview analysis microservice. Provides endpoints for retrieving analysis results and sandbox testing.')
    .setVersion('1.0')
    .addTag('Analysis', 'Interview analysis results endpoints')
    .addTag('Health', 'Service health and readiness checks')
    .addTag('Sandbox', 'Development and testing endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT || 8005;

  await app.listen(port);

  logger.log(`🚀 AI Analysis Service running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
  logger.log(`🧪 Sandbox mode - use POST /sandbox/analyze to test`);

  const gracefulShutdown = async (signal: string) => {
    logger.log(`⚠️ Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      logger.log('✅ AI Analysis Service closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start AI Analysis Service:', error);
  process.exit(1);
});
