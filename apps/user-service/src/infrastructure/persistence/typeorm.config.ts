import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { OutboxEntity } from './entities/outbox.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ai_video_interview_user',
  entities: [UserEntity, RoleEntity, OutboxEntity],
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
