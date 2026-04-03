import { ValueObject } from '../base/base.value-object';

export interface InterviewSettingsProps {
  totalTimeLimit: number; // minutes
  allowRetakes: boolean;
  showTimer: boolean;
  randomizeQuestions: boolean;
  language?: string; // 'en', 'ru', 'de', 'es' — defaults to 'en'
}

export class InterviewSettings extends ValueObject<InterviewSettingsProps> {
  private constructor(props: InterviewSettingsProps) {
    super(props);
    this.validate();
  }

  get totalTimeLimit(): number {
    return this.props.totalTimeLimit;
  }

  get allowRetakes(): boolean {
    return this.props.allowRetakes;
  }

  get showTimer(): boolean {
    return this.props.showTimer;
  }

  get randomizeQuestions(): boolean {
    return this.props.randomizeQuestions;
  }

  get language(): string {
    return this.props.language || 'en';
  }

  private validate(): void {
    if (this.props.totalTimeLimit <= 0) {
      throw new Error('Total time limit must be greater than 0');
    }

    if (this.props.totalTimeLimit > 480) {
      // Max 8 hours
      throw new Error('Total time limit cannot exceed 480 minutes (8 hours)');
    }
  }

  static create(props: InterviewSettingsProps): InterviewSettings {
    return new InterviewSettings(props);
  }

  static default(): InterviewSettings {
    return new InterviewSettings({
      totalTimeLimit: 60, // 1 hour default
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
      language: 'en',
    });
  }

  withTotalTimeLimit(minutes: number): InterviewSettings {
    return new InterviewSettings({
      ...this.props,
      totalTimeLimit: minutes,
    });
  }

  withAllowRetakes(allow: boolean): InterviewSettings {
    return new InterviewSettings({
      ...this.props,
      allowRetakes: allow,
    });
  }

  withShowTimer(show: boolean): InterviewSettings {
    return new InterviewSettings({
      ...this.props,
      showTimer: show,
    });
  }

  withRandomizeQuestions(randomize: boolean): InterviewSettings {
    return new InterviewSettings({
      ...this.props,
      randomizeQuestions: randomize,
    });
  }

  withLanguage(language: string): InterviewSettings {
    return new InterviewSettings({
      ...this.props,
      language,
    });
  }

  toJSON(): InterviewSettingsProps {
    return {
      totalTimeLimit: this.totalTimeLimit,
      allowRetakes: this.allowRetakes,
      showTimer: this.showTimer,
      randomizeQuestions: this.randomizeQuestions,
      language: this.language,
    };
  }
}
