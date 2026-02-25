import { ValueObject } from '../../shared/base/value-object';
import { InvalidRecommendationException } from '../exceptions/analysis.exceptions';

export enum RecommendationEnum {
  HIRE = 'hire',
  CONSIDER = 'consider',
  REJECT = 'reject',
}

interface RecommendationProps {
  value: RecommendationEnum;
}

export class Recommendation extends ValueObject<RecommendationProps> {
  private constructor(props: RecommendationProps) {
    super(props);
  }

  public static hire(): Recommendation {
    return new Recommendation({ value: RecommendationEnum.HIRE });
  }

  public static consider(): Recommendation {
    return new Recommendation({ value: RecommendationEnum.CONSIDER });
  }

  public static reject(): Recommendation {
    return new Recommendation({ value: RecommendationEnum.REJECT });
  }

  public static fromString(value: string): Recommendation {
    const rec = Object.values(RecommendationEnum).find((r) => r === value);
    if (!rec) {
      throw new InvalidRecommendationException(value);
    }
    return new Recommendation({ value: rec });
  }

  public static fromScore(score: number): Recommendation {
    if (score >= 75) return Recommendation.hire();
    if (score >= 50) return Recommendation.consider();
    return Recommendation.reject();
  }

  get value(): RecommendationEnum {
    return this.props.value;
  }

  get isHire(): boolean {
    return this.props.value === RecommendationEnum.HIRE;
  }

  get isConsider(): boolean {
    return this.props.value === RecommendationEnum.CONSIDER;
  }

  get isReject(): boolean {
    return this.props.value === RecommendationEnum.REJECT;
  }

  get label(): string {
    const labels: Record<RecommendationEnum, string> = {
      [RecommendationEnum.HIRE]: 'Recommend to Hire',
      [RecommendationEnum.CONSIDER]: 'Consider for Further Review',
      [RecommendationEnum.REJECT]: 'Not Recommended',
    };
    return labels[this.value];
  }
}
