import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IRoleRepository,
  Role,
} from '../../../domain/repositories/role.repository.interface';
import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';

/**
 * TypeORM Role Repository Implementation
 */
@Injectable()
export class TypeOrmRoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<Role | null> {
    const entity = await this.roleRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const entity = await this.roleRepository.findOne({ where: { name } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Role[]> {
    const entities = await this.roleRepository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * @deprecated Users have a single `role` field in the new system; they don't have multiple roles.
   *   Read `User.role` directly instead. Kept only for interface compatibility during migration.
   */
  findByUserId(_userId: string): Promise<Role[]> {
    return Promise.resolve([]);
  }

  /**
   * @deprecated Role assignment is now done through the `User.selectRole()` domain method.
   *   This legacy method throws to prevent accidental use.
   */
  assignToUser(
    _userId: string,
    _roleId: string,
    _assignedBy: string,
  ): Promise<void> {
    return Promise.reject(
      new Error('assignToUser is deprecated. Use User.selectRole() instead.'),
    );
  }

  /**
   * @deprecated Roles are immutable once selected; they cannot be removed.
   */
  removeFromUser(_userId: string, _roleId: string): Promise<void> {
    return Promise.reject(
      new Error(
        'removeFromUser is deprecated. Roles are immutable in new system.',
      ),
    );
  }

  /**
   * @deprecated Use `user.role` property directly.
   */
  userHasRole(_userId: string, _roleId: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  private toDomain(entity: RoleEntity): Role {
    return {
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      permissions: entity.permissions,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
