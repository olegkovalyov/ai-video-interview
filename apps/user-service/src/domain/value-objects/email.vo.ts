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
  // Bounded quantifiers per RFC 5321 limits: local ≤ 64, domain ≤ 253,
  // TLD ≤ 63. Keeping the regex ReDoS-safe (no unbounded + on shared classes).
  private static readonly EMAIL_REGEX =
    /^[^\s@]{1,64}@[^\s@.]{1,253}\.[^\s@]{2,63}$/;
  private static readonly MAX_LENGTH = 255;

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Email {
    if (!email) {
      throw new DomainException('Email is required');
    }

    const normalized = email.toLowerCase().trim();

    // Length check before regex keeps the regex bounded and fast.
    if (normalized.length > Email.MAX_LENGTH) {
      throw new DomainException('Email is too long (max 255 characters)');
    }

    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new DomainException(`Invalid email format: ${email}`);
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
