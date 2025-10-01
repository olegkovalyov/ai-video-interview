import { ValueObject } from '../../shared/base/base.value-object';
import { DomainException } from '../../shared/exceptions/domain.exception';

interface FullNameProps {
  firstName: string;
  lastName: string;
}

/**
 * FullName Value Object
 * Encapsulates first and last name with validation
 */
export class FullName extends ValueObject<FullNameProps> {
  private static readonly MAX_NAME_LENGTH = 50;
  private static readonly MIN_NAME_LENGTH = 1;

  private constructor(props: FullNameProps) {
    super(props);
  }

  public static create(firstName: string, lastName: string): FullName {
    if (!firstName || !lastName) {
      throw new DomainException('First name and last name are required');
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (trimmedFirstName.length < this.MIN_NAME_LENGTH || trimmedLastName.length < this.MIN_NAME_LENGTH) {
      throw new DomainException('Names cannot be empty');
    }

    if (trimmedFirstName.length > this.MAX_NAME_LENGTH) {
      throw new DomainException(`First name is too long (max ${this.MAX_NAME_LENGTH} characters)`);
    }

    if (trimmedLastName.length > this.MAX_NAME_LENGTH) {
      throw new DomainException(`Last name is too long (max ${this.MAX_NAME_LENGTH} characters)`);
    }

    return new FullName({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
    });
  }

  public get firstName(): string {
    return this.props.firstName;
  }

  public get lastName(): string {
    return this.props.lastName;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public toString(): string {
    return this.fullName;
  }
}
