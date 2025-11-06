import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { OutboxEntity } from './entities/outbox.entity';
import { CandidateProfileEntity } from './entities/candidate-profile.entity';
import { HRProfileEntity } from './entities/hr-profile.entity';
import { UserMapper } from './mappers/user.mapper';
import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmUserReadRepository } from './repositories/typeorm-user-read.repository';
import { TypeOrmRoleRepository } from './repositories/typeorm-role.repository';
import { TypeOrmCandidateProfileRepository } from './repositories/typeorm-candidate-profile.repository';
import { TypeOrmHRProfileRepository } from './repositories/typeorm-hr-profile.repository';

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
        entities: [UserEntity, RoleEntity, OutboxEntity, CandidateProfileEntity, HRProfileEntity],
        synchronize: false, // Always use migrations
        logging: false, // Disable SQL logging (too verbose)
        ssl: configService.get('DATABASE_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, OutboxEntity, CandidateProfileEntity, HRProfileEntity]),
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
    {
      provide: 'ICandidateProfileRepository',
      useClass: TypeOrmCandidateProfileRepository,
    },
    {
      provide: 'IHRProfileRepository',
      useClass: TypeOrmHRProfileRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    'IUserRepository',
    'IUserReadRepository',
    'IRoleRepository',
    'ICandidateProfileRepository',
    'IHRProfileRepository',
    UserMapper,
  ],
})
export class DatabaseModule {}
