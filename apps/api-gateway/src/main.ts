// ВАЖНО: tracing должен инициализироваться ПЕРВЫМ
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './tracing/tracing'; // Must be first import for OpenTelemetry
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const logger = app.get(LoggerService);
  
  // Отключаем встроенный NestJS Logger - используем только Winston
  // app.useLogger(false); // Полностью отключить NestJS логи
  
  const corsOptions: CorsOptions = {
    origin: process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000',
    credentials: true,
  };
  app.enableCors(corsOptions);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  logger.info('🚀 API Gateway starting up', {
    service: 'api-gateway',
    action: 'startup',
    port: 3002,
    corsOrigin: process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development'
  });

  await app.listen(3002);
  
  logger.info('✅ API Gateway successfully started', {
    service: 'api-gateway',
    action: 'startup_complete',
    port: 3002,
    url: 'http://localhost:3002',
    features: ['authentication', 'tracing', 'metrics', 'kafka_events']
  });

  console.log('🚀 API Gateway is running on http://localhost:3002');

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
