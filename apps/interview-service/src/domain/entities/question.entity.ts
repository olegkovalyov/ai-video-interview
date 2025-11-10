import { Entity } from '../base/base.entity';
import { QuestionType } from '../value-objects/question-type.vo';
import { QuestionOption } from '../value-objects/question-option.vo';

export interface QuestionProps {
  text: string;
  type: QuestionType;
  order: number;
  timeLimit: number; // seconds
  required: boolean;
  hints?: string;
  options?: QuestionOption[]; // For multiple_choice questions
  createdAt: Date;
}

export class Question extends Entity<QuestionProps> {
  private constructor(id: string, props: QuestionProps) {
    super(id, props);
    this.validate();
  }

  get text(): string {
    return this.props.text;
  }

  get type(): QuestionType {
    return this.props.type;
  }

  get order(): number {
    return this.props.order;
  }

  get timeLimit(): number {
    return this.props.timeLimit;
  }

  get required(): boolean {
    return this.props.required;
  }

  get hints(): string | undefined {
    return this.props.hints;
  }

  get options(): QuestionOption[] | undefined {
    return this.props.options;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private validate(): void {
    // Text validation
    if (!this.props.text || this.props.text.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }

    if (this.props.text.length < 10) {
      throw new Error('Question text must be at least 10 characters');
    }

    if (this.props.text.length > 500) {
      throw new Error('Question text cannot exceed 500 characters');
    }

    // Time limit validation
    if (this.props.timeLimit < 30) {
      throw new Error('Time limit must be at least 30 seconds');
    }

    if (this.props.timeLimit > 600) {
      throw new Error('Time limit cannot exceed 600 seconds (10 minutes)');
    }

    // Order validation
    if (this.props.order < 1) {
      throw new Error('Question order must be a positive integer');
    }

    // Hints validation
    if (this.props.hints && this.props.hints.length > 200) {
      throw new Error('Hints cannot exceed 200 characters');
    }

    // Multiple choice validation
    if (this.props.type.value === 'multiple_choice') {
      if (!this.props.options || this.props.options.length < 2) {
        throw new Error('Multiple choice questions must have at least 2 options');
      }

      if (this.props.options.length > 10) {
        throw new Error('Multiple choice questions cannot have more than 10 options');
      }

      const hasCorrectAnswer = this.props.options.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        throw new Error('Multiple choice questions must have at least one correct answer');
      }
    } else {
      // Video and text questions should not have options
      if (this.props.options && this.props.options.length > 0) {
        throw new Error('Only multiple choice questions can have options');
      }
    }
  }

  static create(id: string, props: Omit<QuestionProps, 'createdAt'>): Question {
    return new Question(id, {
      ...props,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: QuestionProps): Question {
    return new Question(id, props);
  }

  updateText(text: string): Question {
    return new Question(this.id, {
      ...this.props,
      text,
    });
  }

  updateOrder(order: number): Question {
    return new Question(this.id, {
      ...this.props,
      order,
    });
  }

  updateTimeLimit(timeLimit: number): Question {
    return new Question(this.id, {
      ...this.props,
      timeLimit,
    });
  }

  updateHints(hints?: string): Question {
    return new Question(this.id, {
      ...this.props,
      hints,
    });
  }

  toggleRequired(): Question {
    return new Question(this.id, {
      ...this.props,
      required: !this.props.required,
    });
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      type: this.type.toString(),
      order: this.order,
      timeLimit: this.timeLimit,
      required: this.required,
      hints: this.hints,
      options: this.options?.map((opt) => opt.toJSON()),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
