import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.INTERVIEW_SERVICE_PORT || 8002;
  await app.listen(port);
  console.log(`🎤 Interview Service running on http://localhost:${port}`);
}
bootstrap();
