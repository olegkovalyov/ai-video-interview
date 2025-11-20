import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { OutboxEntity } from './entities/outbox.entity';
import { SkillCategoryEntity } from './entities/skill-category.entity';
import { SkillEntity } from './entities/skill.entity';
import { CompanyEntity } from './entities/company.entity';
import { UserCompanyEntity } from './entities/user-company.entity';
import { CandidateSkillEntity } from './entities/candidate-skill.entity';
import { UserMapper } from './mappers/user.mapper';
import { SkillMapper } from './mappers/skill.mapper';
import { SkillCategoryMapper } from './mappers/skill-category.mapper';
import { CandidateSkillMapper } from './mappers/candidate-skill.mapper';
import { CompanyMapper } from './mappers/company.mapper';
import { UserCompanyMapper } from './mappers/user-company.mapper';
import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmUserReadRepository } from './repositories/typeorm-user-read.repository';
import { TypeOrmRoleRepository } from './repositories/typeorm-role.repository';
import { TypeOrmCandidateProfileRepository } from './repositories/typeorm-candidate-profile.repository';
import { TypeOrmCandidateProfileReadRepository } from './repositories/typeorm-candidate-profile-read.repository';
import { TypeOrmSkillRepository } from './repositories/typeorm-skill.repository';
import { TypeOrmSkillReadRepository } from './repositories/typeorm-skill-read.repository';
import { TypeOrmCompanyRepository } from './repositories/typeorm-company.repository';
import { TypeOrmCompanyReadRepository } from './repositories/typeorm-company-read.repository';

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
        entities: [
          UserEntity,
          RoleEntity,
          OutboxEntity,
          SkillCategoryEntity,
          SkillEntity,
          CompanyEntity,
          UserCompanyEntity,
          CandidateSkillEntity,
        ],
        synchronize: false, // Always use migrations
        logging: false, // Disable SQL logging (too verbose)
        ssl: configService.get('DATABASE_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      OutboxEntity,
      SkillCategoryEntity,
      SkillEntity,
      CompanyEntity,
      UserCompanyEntity,
      CandidateSkillEntity,
    ]),
  ],
  providers: [
    // Mappers
    UserMapper,
    SkillMapper,
    SkillCategoryMapper,
    CandidateSkillMapper,
    UserCompanyMapper,
    CompanyMapper,
    
    // User Repositories
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
    
    // Skill Repositories
    {
      provide: 'ISkillRepository',
      useClass: TypeOrmSkillRepository,
    },
    {
      provide: 'ISkillReadRepository',
      useClass: TypeOrmSkillReadRepository,
    },
    
    // Company Repositories
    {
      provide: 'ICompanyRepository',
      useClass: TypeOrmCompanyRepository,
    },
    {
      provide: 'ICompanyReadRepository',
      useClass: TypeOrmCompanyReadRepository,
    },
    
    // Candidate Profile Repositories
    {
      provide: 'ICandidateProfileRepository',
      useClass: TypeOrmCandidateProfileRepository,
    },
    {
      provide: 'ICandidateProfileReadRepository',
      useClass: TypeOrmCandidateProfileReadRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    // Mappers
    UserMapper,
    SkillMapper,
    SkillCategoryMapper,
    CandidateSkillMapper,
    CompanyMapper,
    UserCompanyMapper,
    // Repositories
    'IUserRepository',
    'IUserReadRepository',
    'IRoleRepository',
    'ISkillRepository',
    'ISkillReadRepository',
    'ICompanyRepository',
    'ICompanyReadRepository',
    'ICandidateProfileRepository',
    'ICandidateProfileReadRepository',
  ],
})
export class DatabaseModule {}
