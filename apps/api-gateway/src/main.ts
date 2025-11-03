// ВАЖНО: tracing должен инициализироваться ПЕРВЫМ
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './tracing/tracing'; // Must be first import for OpenTelemetry
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { LoggerService } from './core/logging/logger.service';

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
    features: ['authentication', 'tracing', 'metrics', 'kafka_events']
  });

  console.log(`🚀 API Gateway is running on http://localhost:${port}`);

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
