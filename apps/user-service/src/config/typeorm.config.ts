import { DataSource } from 'typeorm';
import { UserEntity } from '../infrastructure/persistence/entities/user.entity';
import { RoleEntity } from '../infrastructure/persistence/entities/role.entity';
import { InboxEntity } from '../infrastructure/persistence/entities/inbox.entity';
import { OutboxEntity } from '../infrastructure/persistence/entities/outbox.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ai_video_interview_user',
  entities: [UserEntity, RoleEntity, InboxEntity, OutboxEntity],
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
