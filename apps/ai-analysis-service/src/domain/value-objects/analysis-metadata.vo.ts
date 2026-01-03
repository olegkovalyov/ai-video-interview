import { ValueObject } from '../../shared/base/value-object';

interface AnalysisMetadataProps {
  modelUsed: string;
  totalTokensUsed: number;
  processingTimeMs: number;
  questionsAnalyzed: number;
  language: string;
}

export class AnalysisMetadata extends ValueObject<AnalysisMetadataProps> {
  private constructor(props: AnalysisMetadataProps) {
    super(props);
  }

  public static create(
    modelUsed: string,
    totalTokensUsed: number,
    processingTimeMs: number,
    questionsAnalyzed: number,
    language: string = 'en',
  ): AnalysisMetadata {
    return new AnalysisMetadata({
      modelUsed,
      totalTokensUsed,
      processingTimeMs,
      questionsAnalyzed,
      language,
    });
  }

  public static empty(): AnalysisMetadata {
    return new AnalysisMetadata({
      modelUsed: '',
      totalTokensUsed: 0,
      processingTimeMs: 0,
      questionsAnalyzed: 0,
      language: 'en',
    });
  }

  get modelUsed(): string {
    return this.props.modelUsed;
  }

  get totalTokensUsed(): number {
    return this.props.totalTokensUsed;
  }

  get processingTimeMs(): number {
    return this.props.processingTimeMs;
  }

  get processingTimeSeconds(): number {
    return Math.round(this.props.processingTimeMs / 1000);
  }

  get questionsAnalyzed(): number {
    return this.props.questionsAnalyzed;
  }

  get language(): string {
    return this.props.language;
  }

  get averageTokensPerQuestion(): number {
    if (this.props.questionsAnalyzed === 0) return 0;
    return Math.round(this.props.totalTokensUsed / this.props.questionsAnalyzed);
  }
}
