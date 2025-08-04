import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.USER_SERVICE_PORT || 8001;
  await app.listen(port);
  console.log(`👤 User Service running on http://localhost:${port}`);
}
bootstrap();
