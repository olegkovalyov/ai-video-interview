import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { ITransactionContext } from '../../../application/interfaces/transaction-context.interface';
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

  async save(user: User, tx?: ITransactionContext): Promise<void> {
    const entity = this.mapper.toEntity(user);
    if (tx) {
      await (tx as unknown as EntityManager).save(UserEntity, entity);
    } else {
      await this.repository.save(entity);
    }
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByExternalAuthId(externalAuthId: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { externalAuthId },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async delete(id: string, tx?: ITransactionContext): Promise<void> {
    if (tx) {
      await (tx as unknown as EntityManager).delete(UserEntity, id);
    } else {
      await this.repository.delete(id);
    }
  }
}
