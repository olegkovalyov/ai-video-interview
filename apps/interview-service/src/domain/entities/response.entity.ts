import { Entity } from '../base/base.entity';
import { ResponseType } from '../value-objects/response-type.vo';

export interface ResponseProps {
  invitationId: string;
  questionId: string;
  questionIndex: number;
  questionText: string;
  responseType: ResponseType;
  textAnswer?: string;
  codeAnswer?: string;
  videoUrl?: string;
  duration: number; // seconds spent on this question
  submittedAt: Date;
}

export class Response extends Entity<ResponseProps> {
  private constructor(id: string, props: ResponseProps) {
    super(id, props);
    this.validate();
  }

  get invitationId(): string {
    return this.props.invitationId;
  }

  get questionId(): string {
    return this.props.questionId;
  }

  get questionIndex(): number {
    return this.props.questionIndex;
  }

  get questionText(): string {
    return this.props.questionText;
  }

  get responseType(): ResponseType {
    return this.props.responseType;
  }

  get textAnswer(): string | undefined {
    return this.props.textAnswer;
  }

  get codeAnswer(): string | undefined {
    return this.props.codeAnswer;
  }

  get videoUrl(): string | undefined {
    return this.props.videoUrl;
  }

  get duration(): number {
    return this.props.duration;
  }

  get submittedAt(): Date {
    return this.props.submittedAt;
  }

  private validate(): void {
    // Question text validation
    if (!this.props.questionText || this.props.questionText.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }

    // Question index validation
    if (this.props.questionIndex < 0) {
      throw new Error('Question index must be non-negative');
    }

    // Duration validation
    if (this.props.duration < 0) {
      throw new Error('Duration cannot be negative');
    }

    // Answer validation based on type
    if (this.props.responseType.isText()) {
      if (!this.props.textAnswer || this.props.textAnswer.trim().length === 0) {
        throw new Error('Text answer is required for text response type');
      }
      if (this.props.textAnswer.length > 10000) {
        throw new Error('Text answer cannot exceed 10000 characters');
      }
    }

    if (this.props.responseType.isCode()) {
      if (!this.props.codeAnswer || this.props.codeAnswer.trim().length === 0) {
        throw new Error('Code answer is required for code response type');
      }
      if (this.props.codeAnswer.length > 50000) {
        throw new Error('Code answer cannot exceed 50000 characters');
      }
    }

    if (this.props.responseType.isVideo()) {
      // Video URL is optional for now (coming soon)
      if (this.props.videoUrl && this.props.videoUrl.length > 2000) {
        throw new Error('Video URL cannot exceed 2000 characters');
      }
    }
  }

  static create(
    id: string,
    props: Omit<ResponseProps, 'submittedAt'>,
  ): Response {
    return new Response(id, {
      ...props,
      submittedAt: new Date(),
    });
  }

  static reconstitute(id: string, props: ResponseProps): Response {
    return new Response(id, props);
  }

  /**
   * Get the answer content based on response type
   */
  getAnswer(): string | undefined {
    if (this.responseType.isText()) {
      return this.textAnswer;
    }
    if (this.responseType.isCode()) {
      return this.codeAnswer;
    }
    if (this.responseType.isVideo()) {
      return this.videoUrl;
    }
    return undefined;
  }

  /**
   * Check if response has content
   */
  hasContent(): boolean {
    return !!this.getAnswer();
  }

  toJSON() {
    return {
      id: this.id,
      invitationId: this.invitationId,
      questionId: this.questionId,
      questionIndex: this.questionIndex,
      questionText: this.questionText,
      responseType: this.responseType.toString(),
      textAnswer: this.textAnswer,
      codeAnswer: this.codeAnswer,
      videoUrl: this.videoUrl,
      duration: this.duration,
      submittedAt: this.submittedAt.toISOString(),
    };
  }
}
