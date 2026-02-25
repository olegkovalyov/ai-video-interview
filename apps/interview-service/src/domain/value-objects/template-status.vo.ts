import { ValueObject } from '../base/base.value-object';
import { InvalidTemplateStateException } from '../exceptions/interview-template.exceptions';

export enum TemplateStatusEnum {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export interface TemplateStatusProps {
  value: TemplateStatusEnum;
}

export class TemplateStatus extends ValueObject<TemplateStatusProps> {
  private constructor(props: TemplateStatusProps) {
    super(props);
  }

  get value(): TemplateStatusEnum {
    return this.props.value;
  }

  static create(value: string): TemplateStatus {
    if (!Object.values(TemplateStatusEnum).includes(value as TemplateStatusEnum)) {
      throw new InvalidTemplateStateException(
        'create',
        `${value} (must be one of: ${Object.values(TemplateStatusEnum).join(', ')})`,
      );
    }

    return new TemplateStatus({ value: value as TemplateStatusEnum });
  }

  static draft(): TemplateStatus {
    return new TemplateStatus({ value: TemplateStatusEnum.DRAFT });
  }

  static active(): TemplateStatus {
    return new TemplateStatus({ value: TemplateStatusEnum.ACTIVE });
  }

  static archived(): TemplateStatus {
    return new TemplateStatus({ value: TemplateStatusEnum.ARCHIVED });
  }

  isDraft(): boolean {
    return this.value === TemplateStatusEnum.DRAFT;
  }

  isActive(): boolean {
    return this.value === TemplateStatusEnum.ACTIVE;
  }

  isArchived(): boolean {
    return this.value === TemplateStatusEnum.ARCHIVED;
  }

  canBeModified(): boolean {
    return !this.isArchived();
  }

  canBePublished(): boolean {
    return this.isDraft();
  }

  toString(): string {
    return this.value;
  }
}
