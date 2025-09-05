import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable graceful shutdown
  app.enableShutdownHooks();
  
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  
  const port = process.env.API_GATEWAY_PORT || 8000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on http://localhost:${port}`);

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
