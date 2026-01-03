import { Entity } from '../../shared/base/entity';
import { Score } from '../value-objects/score.vo';
import { QuestionType } from '../value-objects/question-type.vo';
import { CriteriaScore, CriterionType } from '../value-objects/criteria-score.vo';

interface QuestionAnalysisProps {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  responseText: string;
  score: Score;
  feedback: string;
  criteriaScores: CriteriaScore[];
  isCorrect?: boolean;
  tokensUsed: number;
  createdAt: Date;
}

export interface CreateQuestionAnalysisParams {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  responseText: string;
  score: number;
  feedback: string;
  criteriaScores: Array<{
    criterion: CriterionType;
    score: number;
    weight: number;
  }>;
  isCorrect?: boolean;
  tokensUsed: number;
}

export class QuestionAnalysis extends Entity<QuestionAnalysisProps> {
  private constructor(props: QuestionAnalysisProps, id?: string) {
    super(props, id);
  }

  public static create(params: CreateQuestionAnalysisParams, id?: string): QuestionAnalysis {
    const criteriaScores = params.criteriaScores.map((cs) =>
      CriteriaScore.create(cs.criterion, cs.score, cs.weight),
    );

    return new QuestionAnalysis(
      {
        questionId: params.questionId,
        questionText: params.questionText,
        questionType: params.questionType,
        responseText: params.responseText,
        score: Score.create(params.score),
        feedback: params.feedback,
        criteriaScores,
        isCorrect: params.isCorrect,
        tokensUsed: params.tokensUsed,
        createdAt: new Date(),
      },
      id,
    );
  }

  public static reconstitute(
    props: {
      questionId: string;
      questionText: string;
      questionType: string;
      responseText: string;
      score: number;
      feedback: string;
      criteriaScores: Array<{
        criterion: string;
        score: number;
        weight: number;
      }>;
      isCorrect?: boolean;
      tokensUsed: number;
      createdAt: Date;
    },
    id: string,
  ): QuestionAnalysis {
    const criteriaScores = props.criteriaScores.map((cs) =>
      CriteriaScore.create(cs.criterion as CriterionType, cs.score, cs.weight),
    );

    return new QuestionAnalysis(
      {
        questionId: props.questionId,
        questionText: props.questionText,
        questionType: QuestionType.fromString(props.questionType),
        responseText: props.responseText,
        score: Score.create(props.score),
        feedback: props.feedback,
        criteriaScores,
        isCorrect: props.isCorrect,
        tokensUsed: props.tokensUsed,
        createdAt: props.createdAt,
      },
      id,
    );
  }

  get questionId(): string {
    return this.props.questionId;
  }

  get questionText(): string {
    return this.props.questionText;
  }

  get questionType(): QuestionType {
    return this.props.questionType;
  }

  get responseText(): string {
    return this.props.responseText;
  }

  get score(): Score {
    return this.props.score;
  }

  get feedback(): string {
    return this.props.feedback;
  }

  get criteriaScores(): CriteriaScore[] {
    return [...this.props.criteriaScores];
  }

  get isCorrect(): boolean | undefined {
    return this.props.isCorrect;
  }

  get tokensUsed(): number {
    return this.props.tokensUsed;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get weightedScore(): number {
    if (this.props.criteriaScores.length === 0) {
      return this.props.score.value;
    }

    const totalWeight = this.props.criteriaScores.reduce((sum, cs) => sum + cs.weight, 0);
    const weightedSum = this.props.criteriaScores.reduce((sum, cs) => sum + cs.weightedScore, 0);

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : this.props.score.value;
  }
}
