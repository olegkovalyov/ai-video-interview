import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

/**
 * TypeORM User Repository Implementation
 * Implements IUserRepository interface from domain layer
 */
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async save(user: User): Promise<void> {
    const entity = this.mapper.toEntity(user);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ 
      where: { id },
      relations: ['roles'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByExternalAuthId(externalAuthId: string): Promise<User | null> {
    const entity = await this.repository.findOne({ 
      where: { externalAuthId },
      relations: ['roles'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ 
      where: { email },
      relations: ['roles'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    // Hard delete - CASCADE will delete related records (roles, etc.)
    await this.repository.delete(id);
  }
}
