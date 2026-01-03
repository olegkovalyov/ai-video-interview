import { ValueObject } from '../../shared/base/value-object';
import { InvalidScoreException } from '../exceptions/analysis.exceptions';

export type ScoreGrade = 'excellent' | 'good' | 'satisfactory' | 'below_average' | 'poor';

interface ScoreProps {
  value: number;
}

export class Score extends ValueObject<ScoreProps> {
  private constructor(props: ScoreProps) {
    super(props);
  }

  public static create(value: number): Score {
    if (value < 0 || value > 100) {
      throw new InvalidScoreException(value);
    }
    return new Score({ value: Math.round(value) });
  }

  public static zero(): Score {
    return new Score({ value: 0 });
  }

  get value(): number {
    return this.props.value;
  }

  get grade(): ScoreGrade {
    if (this.props.value >= 90) return 'excellent';
    if (this.props.value >= 75) return 'good';
    if (this.props.value >= 60) return 'satisfactory';
    if (this.props.value >= 40) return 'below_average';
    return 'poor';
  }

  get gradeLabel(): string {
    const labels: Record<ScoreGrade, string> = {
      excellent: 'Excellent',
      good: 'Good',
      satisfactory: 'Satisfactory',
      below_average: 'Below Average',
      poor: 'Poor',
    };
    return labels[this.grade];
  }
}
