import { ValueObject } from '../../shared/base/base.value-object';
import { DomainException } from '../../shared/exceptions/domain.exception';

export type UserStatusValue = 'active' | 'suspended' | 'deleted';

interface UserStatusProps {
  value: UserStatusValue;
}

/**
 * UserStatus Value Object
 * Type-safe user status with validation
 */
export class UserStatus extends ValueObject<UserStatusProps> {
  private constructor(props: UserStatusProps) {
    super(props);
  }

  public static active(): UserStatus {
    return new UserStatus({ value: 'active' });
  }

  public static suspended(): UserStatus {
    return new UserStatus({ value: 'suspended' });
  }

  public static deleted(): UserStatus {
    return new UserStatus({ value: 'deleted' });
  }

  public static fromString(value: string): UserStatus {
    if (!['active', 'suspended', 'deleted'].includes(value)) {
      throw new DomainException(`Invalid user status: ${value}`);
    }
    return new UserStatus({ value: value as UserStatusValue });
  }

  public isActive(): boolean {
    return this.props.value === 'active';
  }

  public isSuspended(): boolean {
    return this.props.value === 'suspended';
  }

  public isDeleted(): boolean {
    return this.props.value === 'deleted';
  }

  public get value(): UserStatusValue {
    return this.props.value;
  }

  public toString(): string {
    return this.value;
  }
}
