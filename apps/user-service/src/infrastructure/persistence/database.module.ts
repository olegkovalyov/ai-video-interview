import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { InboxEntity } from './entities/inbox.entity';
import { OutboxEntity } from './entities/outbox.entity';
import { UserMapper } from './mappers/user.mapper';
import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmUserReadRepository } from './repositories/typeorm-user-read.repository';
import { TypeOrmRoleRepository } from './repositories/typeorm-role.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
        username: configService.get('DATABASE_USER', 'user_service'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'user_service_db'),
        entities: [UserEntity, RoleEntity, InboxEntity, OutboxEntity],
        synchronize: false, // Always use migrations
        logging: false, // Disable SQL logging (too verbose)
        ssl: configService.get('DATABASE_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, InboxEntity, OutboxEntity]),
  ],
  providers: [
    UserMapper,
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
    {
      provide: 'IUserReadRepository',
      useClass: TypeOrmUserReadRepository,
    },
    {
      provide: 'IRoleRepository',
      useClass: TypeOrmRoleRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    'IUserRepository',
    'IUserReadRepository',
    'IRoleRepository',
    UserMapper,
  ],
})
export class DatabaseModule {}
