// ВАЖНО: tracing должен инициализироваться ПЕРВЫМ
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './core/tracing/tracing'; // Must be first import for OpenTelemetry
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { LoggerService } from './core/logging/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Буферизуем логи до подключения logger
  });

  const logger = app.get(LoggerService);

  // Используем наш Winston Logger для ВСЕХ NestJS логов
  app.useLogger(logger);

  const corsOptions: CorsOptions = {
    origin: process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000',
    credentials: true,
  };
  app.enableCors(corsOptions);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('AI Video Interview - API Gateway')
    .setDescription(`API Gateway for AI Video Interview Platform. 
    
**Services:**
- User Service (port 8002) - User management
- Interview Service (port 8003) - Templates & Invitations
- AI Analysis Service (port 8005) - Interview analysis`)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token from /auth/login',
      in: 'header',
    })
    .addTag('Users', 'Current user profile operations')
    .addTag('Admin - Users', 'Admin user management operations')
    .addTag('Admin - User Actions', 'Admin user action operations (suspend/activate)')
    .addTag('Admin - Roles', 'Admin role management operations')
    .addTag('Templates', 'Interview templates management (HR & Admin)')
    .addTag('Invitations', 'Interview invitations (HR creates, Candidate completes)')
    .addTag('Analysis', 'AI-powered interview analysis results (HR & Admin)')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Gateway Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true, // Save JWT token in browser
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none', // Collapse all by default
      filter: true, // Enable search filter
    },
  });

  app.use('/api/docs-json', (req, res) => {
    res.json(document);
  });

  logger.info('📚 Swagger documentation enabled at /api/docs');

  const port = process.env.PORT || 8001;

  logger.info('🚀 API Gateway starting up', {
    service: 'api-gateway',
    action: 'startup',
    port,
    corsOrigin: process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development'
  });

  await app.listen(port);

  logger.info('✅ API Gateway successfully started', {
    service: 'api-gateway',
    action: 'startup_complete',
    port,
    url: `http://localhost:${port}`,
    features: ['authentication', 'tracing', 'metrics', 'kafka_events', 'swagger_docs']
  });

  console.log(`🚀 API Gateway is running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}, shutting down API Gateway gracefully...`);
    try {
      await app.close();
      console.log('✅ API Gateway closed successfully');
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
  console.error('❌ Failed to start API Gateway:', error);
  process.exit(1);
});
