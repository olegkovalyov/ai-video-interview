import { ValueObject } from '../base/base.value-object';

export interface QuestionOptionProps {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * QuestionOption Value Object
 * Represents a single answer option for multiple choice questions
 * 
 * Business Rules:
 * - Option text must be 1-200 characters
 * - Must have unique ID
 * - isCorrect flag indicates correct answer(s)
 */
export class QuestionOption extends ValueObject<QuestionOptionProps> {
  private constructor(props: QuestionOptionProps) {
    super(props);
    this.validate();
  }

  get id(): string {
    return this.props.id;
  }

  get text(): string {
    return this.props.text;
  }

  get isCorrect(): boolean {
    return this.props.isCorrect;
  }

  private validate(): void {
    const props = this.props;
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Question option ID cannot be empty');
    }

    if (!props.text || props.text.trim().length === 0) {
      throw new Error('Question option text cannot be empty');
    }

    if (props.text.length < 1) {
      throw new Error('Question option text must be at least 1 character');
    }

    if (props.text.length > 200) {
      throw new Error('Question option text cannot exceed 200 characters');
    }
  }

  static create(props: QuestionOptionProps): QuestionOption {
    return new QuestionOption(props);
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      isCorrect: this.isCorrect,
    };
  }
}
