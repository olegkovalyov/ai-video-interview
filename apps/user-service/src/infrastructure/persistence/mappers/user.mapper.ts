import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { FullName } from '../../../domain/value-objects/full-name.vo';
import { UserStatus } from '../../../domain/value-objects/user-status.vo';

/**
 * User Mapper
 * Converts between Domain Model (User) and Persistence Model (UserEntity)
 * This is a critical part of maintaining clean architecture
 */
@Injectable()
export class UserMapper {
  /**
   * Convert Domain Model to Entity
   */
  toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    
    entity.id = user.id;
    entity.keycloakId = user.keycloakId;
    entity.email = user.email.value;
    entity.firstName = user.fullName.firstName;
    entity.lastName = user.fullName.lastName;
    entity.status = user.status.value;
    entity.emailVerified = user.emailVerified;
    entity.avatarUrl = user.avatarUrl || null;
    entity.bio = user.bio || null;
    entity.phone = user.phone || null;
    entity.timezone = user.timezone;
    entity.language = user.language;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    
    return entity;
  }

  /**
   * Convert Entity to Domain Model
   */
  toDomain(entity: UserEntity): User {
    const email = Email.create(entity.email);
    const fullName = FullName.create(entity.firstName, entity.lastName);
    const status = UserStatus.fromString(entity.status);

    return User.reconstitute(
      entity.id,
      entity.keycloakId,
      email,
      fullName,
      status,
      entity.avatarUrl || undefined,
      entity.bio || undefined,
      entity.phone || undefined,
      entity.timezone,
      entity.language,
      entity.emailVerified,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert multiple entities to domain models
   */
  toDomainList(entities: UserEntity[]): User[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
