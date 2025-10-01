import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
  username: configService.get('DATABASE_USER', 'user_service'),
  password: configService.get('DATABASE_PASSWORD', 'password'),
  database: configService.get('DATABASE_NAME', 'user_service_db'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],
  synchronize: false, // Always false in production
  logging: configService.get('NODE_ENV') === 'development',
});
