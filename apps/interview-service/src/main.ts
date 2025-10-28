import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Буферизуем логи до инициализации custom logger
  });

  // Подключаем наш Winston logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.INTERVIEW_SERVICE_PORT || 8003;
  await app.listen(port);

  logger.info(`🎤 Interview Service running on http://localhost:${port}`, {
    category: 'startup',
    port: port,
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`Received ${signal}, shutting down Interview Service gracefully...`, {
      category: 'shutdown',
      signal,
    });
    try {
      await app.close();
      logger.info('Interview Service closed successfully', { category: 'shutdown' });
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error as Error, { category: 'shutdown' });
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
