import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository, Role } from '../../../domain/repositories/role.repository.interface';
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
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserId(userId: string): Promise<Role[]> {
    // NOTE: New role system uses a single 'role' string field on user
    // This method returns empty array as users don't have multiple roles anymore
    // Kept for backwards compatibility with old code
    return [];
  }

  async assignToUser(userId: string, roleId: string, assignedBy: string): Promise<void> {
    // NOTE: Old role system method - not used in new system
    // Role assignment now done via User.selectRole() domain method
    throw new Error('assignToUser is deprecated. Use User.selectRole() instead.');
  }

  async removeFromUser(userId: string, roleId: string): Promise<void> {
    // NOTE: Roles are immutable in new system - cannot be removed
    throw new Error('removeFromUser is deprecated. Roles are immutable in new system.');
  }

  async userHasRole(userId: string, roleId: string): Promise<boolean> {
    // NOTE: Old role system method - not used in new system
    // Use user.role property directly instead
    return false;
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
