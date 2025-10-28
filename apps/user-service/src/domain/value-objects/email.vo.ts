import { ValueObject } from '../base/base.value-object';
import { DomainException } from '../exceptions/domain.exception';

interface EmailProps {
  value: string;
}

/**
 * Email Value Object
 * Ensures email is always valid
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Email {
    if (!email) {
      throw new DomainException('Email is required');
    }

    const normalized = email.toLowerCase().trim();

    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new DomainException(`Invalid email format: ${email}`);
    }

    if (normalized.length > 255) {
      throw new DomainException('Email is too long (max 255 characters)');
    }

    return new Email({ value: normalized });
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.value;
  }
}
