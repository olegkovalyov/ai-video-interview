import { ValueObject } from '../base/base.value-object';

export enum QuestionTypeEnum {
  VIDEO = 'video',
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
}

export interface QuestionTypeProps {
  value: QuestionTypeEnum;
}

export class QuestionType extends ValueObject<QuestionTypeProps> {
  private constructor(props: QuestionTypeProps) {
    super(props);
  }

  get value(): QuestionTypeEnum {
    return this.props.value;
  }

  static create(value: string): QuestionType {
    if (!Object.values(QuestionTypeEnum).includes(value as QuestionTypeEnum)) {
      throw new Error(
        `Invalid question type: ${value}. Must be one of: ${Object.values(QuestionTypeEnum).join(', ')}`,
      );
    }

    return new QuestionType({ value: value as QuestionTypeEnum });
  }

  static video(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.VIDEO });
  }

  static text(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.TEXT });
  }

  static multipleChoice(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.MULTIPLE_CHOICE });
  }

  isVideo(): boolean {
    return this.value === QuestionTypeEnum.VIDEO;
  }

  isText(): boolean {
    return this.value === QuestionTypeEnum.TEXT;
  }

  isMultipleChoice(): boolean {
    return this.value === QuestionTypeEnum.MULTIPLE_CHOICE;
  }

  toString(): string {
    return this.value;
  }
}
