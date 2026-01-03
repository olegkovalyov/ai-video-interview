import { ValueObject } from '../../shared/base/value-object';

export enum QuestionTypeEnum {
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
  VIDEO = 'video',
  CODE = 'code',
}

interface QuestionTypeProps {
  value: QuestionTypeEnum;
}

export class QuestionType extends ValueObject<QuestionTypeProps> {
  private constructor(props: QuestionTypeProps) {
    super(props);
  }

  public static text(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.TEXT });
  }

  public static multipleChoice(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.MULTIPLE_CHOICE });
  }

  public static video(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.VIDEO });
  }

  public static code(): QuestionType {
    return new QuestionType({ value: QuestionTypeEnum.CODE });
  }

  public static fromString(value: string): QuestionType {
    const type = Object.values(QuestionTypeEnum).find((t) => t === value);
    if (!type) {
      throw new Error(`Invalid question type: ${value}`);
    }
    return new QuestionType({ value: type });
  }

  get value(): QuestionTypeEnum {
    return this.props.value;
  }

  get isText(): boolean {
    return this.props.value === QuestionTypeEnum.TEXT;
  }

  get isMultipleChoice(): boolean {
    return this.props.value === QuestionTypeEnum.MULTIPLE_CHOICE;
  }

  get isVideo(): boolean {
    return this.props.value === QuestionTypeEnum.VIDEO;
  }

  get isCode(): boolean {
    return this.props.value === QuestionTypeEnum.CODE;
  }

  get requiresLLMAnalysis(): boolean {
    return this.isText || this.isCode;
  }
}
