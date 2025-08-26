import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Init signing keys for JWKS/JWT
  const auth = app.get(AuthService);
  await auth.initKeys();

  // Kafka microservice
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'user-service',
        brokers,
      },
      consumer: {
        groupId: 'user-service-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.USER_SERVICE_PORT || 8001;
  await app.listen(port);
  console.log(`👤 User Service running on http://localhost:${port}`);
}
bootstrap();
