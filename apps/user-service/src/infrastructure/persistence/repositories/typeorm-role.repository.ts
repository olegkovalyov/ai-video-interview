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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user || !user.roles) {
      return [];
    }

    return user.roles.map(entity => this.toDomain(entity));
  }

  async assignToUser(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if already assigned
    const hasRole = user.roles?.some(r => r.id === roleId);
    if (hasRole) {
      return; // Already assigned
    }

    // Assign role
    if (!user.roles) {
      user.roles = [];
    }
    user.roles.push(role);

    await this.userRepository.save(user);
  }

  async removeFromUser(userId: string, roleId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user || !user.roles) {
      return;
    }

    // Remove role
    user.roles = user.roles.filter(r => r.id !== roleId);
    await this.userRepository.save(user);
  }

  async userHasRole(userId: string, roleId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user || !user.roles) {
      return false;
    }

    return user.roles.some(r => r.id === roleId);
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
