import { ValueObject } from '../../shared/base/value-object';
import { Score } from './score.vo';

export enum CriterionType {
  RELEVANCE = 'relevance',
  COMPLETENESS = 'completeness',
  CLARITY = 'clarity',
  DEPTH = 'depth',
}

interface CriteriaScoreProps {
  criterion: CriterionType;
  score: Score;
  weight: number;
}

export class CriteriaScore extends ValueObject<CriteriaScoreProps> {
  private constructor(props: CriteriaScoreProps) {
    super(props);
  }

  public static create(
    criterion: CriterionType,
    scoreValue: number,
    weight: number,
  ): CriteriaScore {
    if (weight < 0 || weight > 1) {
      throw new Error(`Invalid weight: ${weight}. Must be between 0 and 1.`);
    }
    return new CriteriaScore({
      criterion,
      score: Score.create(scoreValue),
      weight,
    });
  }

  get criterion(): CriterionType {
    return this.props.criterion;
  }

  get score(): Score {
    return this.props.score;
  }

  get weight(): number {
    return this.props.weight;
  }

  get weightedScore(): number {
    return this.props.score.value * this.props.weight;
  }

  get criterionLabel(): string {
    const labels: Record<CriterionType, string> = {
      [CriterionType.RELEVANCE]: 'Relevance',
      [CriterionType.COMPLETENESS]: 'Completeness',
      [CriterionType.CLARITY]: 'Clarity',
      [CriterionType.DEPTH]: 'Depth',
    };
    return labels[this.criterion];
  }
}
