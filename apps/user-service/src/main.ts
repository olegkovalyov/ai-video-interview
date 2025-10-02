import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestJS встроенный логгер (для системных логов Nest)
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'], // Только важные уровни, без debug
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

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
    .setTitle('User Service API')
    .setDescription('User management microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-internal-token', in: 'header' }, 'internal-token')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown (from memory)
  app.enableShutdownHooks();

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  // Startup логи через console (минимум)
  console.log(`🚀 User Service running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);

  // Graceful shutdown handlers (from memory - no port blocking)
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}, shutting down User Service gracefully...`);
    try {
      await app.close();
      console.log('✅ User Service closed successfully');
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
  console.error('❌ Failed to start User Service:', error);
  process.exit(1);
});
