import { AggregateRoot } from '../../shared/base/aggregate-root';
import { AnalysisStatus } from '../value-objects/analysis-status.vo';
import { Score } from '../value-objects/score.vo';
import { Recommendation } from '../value-objects/recommendation.vo';
import { AnalysisMetadata } from '../value-objects/analysis-metadata.vo';
import { QuestionAnalysis, CreateQuestionAnalysisParams } from '../entities/question-analysis.entity';
import { AnalysisStartedEvent } from '../events/analysis-started.event';
import { AnalysisCompletedEvent } from '../events/analysis-completed.event';
import { AnalysisFailedEvent } from '../events/analysis-failed.event';
import { AnalysisAlreadyCompletedException, NoQuestionsAnalyzedException, InvalidStatusTransitionException } from '../exceptions/analysis.exceptions';

interface AnalysisResultProps {
  invitationId: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  companyName: string;
  status: AnalysisStatus;
  overallScore: Score | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendation: Recommendation | null;
  metadata: AnalysisMetadata;
  errorMessage: string | null;
  questionAnalyses: QuestionAnalysis[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface CreateAnalysisParams {
  invitationId: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  companyName: string;
}

export interface CompleteAnalysisParams {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  modelUsed: string;
  totalTokensUsed: number;
  processingTimeMs: number;
  language: string;
}

export class AnalysisResult extends AggregateRoot<AnalysisResultProps> {
  private constructor(props: AnalysisResultProps, id?: string) {
    super(props, id);
  }

  public static create(params: CreateAnalysisParams, id?: string): AnalysisResult {
    const now = new Date();
    const analysis = new AnalysisResult(
      {
        invitationId: params.invitationId,
        candidateId: params.candidateId,
        templateId: params.templateId,
        templateTitle: params.templateTitle,
        companyName: params.companyName,
        status: AnalysisStatus.pending(),
        overallScore: null,
        summary: null,
        strengths: [],
        weaknesses: [],
        recommendation: null,
        metadata: AnalysisMetadata.empty(),
        errorMessage: null,
        questionAnalyses: [],
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      },
      id,
    );

    return analysis;
  }

  public static reconstitute(
    props: {
      invitationId: string;
      candidateId: string;
      templateId: string;
      templateTitle: string;
      companyName: string;
      status: string;
      overallScore: number | null;
      summary: string | null;
      strengths: string[];
      weaknesses: string[];
      recommendation: string | null;
      metadata: {
        modelUsed: string;
        totalTokensUsed: number;
        processingTimeMs: number;
        questionsAnalyzed: number;
        language: string;
      };
      errorMessage: string | null;
      questionAnalyses: QuestionAnalysis[];
      createdAt: Date;
      updatedAt: Date;
      completedAt: Date | null;
    },
    id: string,
  ): AnalysisResult {
    return new AnalysisResult(
      {
        invitationId: props.invitationId,
        candidateId: props.candidateId,
        templateId: props.templateId,
        templateTitle: props.templateTitle,
        companyName: props.companyName,
        status: AnalysisStatus.fromString(props.status),
        overallScore: props.overallScore !== null ? Score.create(props.overallScore) : null,
        summary: props.summary,
        strengths: props.strengths,
        weaknesses: props.weaknesses,
        recommendation: props.recommendation ? Recommendation.fromString(props.recommendation) : null,
        metadata: AnalysisMetadata.create(
          props.metadata.modelUsed,
          props.metadata.totalTokensUsed,
          props.metadata.processingTimeMs,
          props.metadata.questionsAnalyzed,
          props.metadata.language,
        ),
        errorMessage: props.errorMessage,
        questionAnalyses: props.questionAnalyses,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        completedAt: props.completedAt,
      },
      id,
    );
  }

  public start(): void {
    this.props.status = this.props.status.transitionTo(AnalysisStatus.inProgress());
    this.props.updatedAt = new Date();

    this.addDomainEvent(new AnalysisStartedEvent(this.id, this.props.invitationId));
  }

  public addQuestionAnalysis(params: CreateQuestionAnalysisParams): QuestionAnalysis {
    if (this.props.status.isTerminal) {
      throw new AnalysisAlreadyCompletedException(this.id);
    }

    const questionAnalysis = QuestionAnalysis.create(params);
    this.props.questionAnalyses.push(questionAnalysis);
    this.props.updatedAt = new Date();

    return questionAnalysis;
  }

  public complete(params: CompleteAnalysisParams): void {
    if (!this.props.status.canTransitionTo(AnalysisStatus.completed())) {
      throw new InvalidStatusTransitionException(this.props.status.value, 'completed');
    }

    if (this.props.questionAnalyses.length === 0) {
      throw new NoQuestionsAnalyzedException(this.id);
    }

    const overallScore = this.calculateOverallScore();

    this.props.status = AnalysisStatus.completed();
    this.props.overallScore = overallScore;
    this.props.summary = params.summary;
    this.props.strengths = params.strengths;
    this.props.weaknesses = params.weaknesses;
    this.props.recommendation = Recommendation.fromString(params.recommendation);
    this.props.metadata = AnalysisMetadata.create(
      params.modelUsed,
      params.totalTokensUsed,
      params.processingTimeMs,
      this.props.questionAnalyses.length,
      params.language,
    );
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new AnalysisCompletedEvent(
        this.id,
        this.props.invitationId,
        overallScore.value,
        this.props.recommendation.value,
        this.props.questionAnalyses.length,
      ),
    );
  }

  public fail(errorMessage: string): void {
    this.props.status = this.props.status.transitionTo(AnalysisStatus.failed());
    this.props.errorMessage = errorMessage;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new AnalysisFailedEvent(this.id, this.props.invitationId, errorMessage));
  }

  private calculateOverallScore(): Score {
    if (this.props.questionAnalyses.length === 0) {
      return Score.zero();
    }

    const totalScore = this.props.questionAnalyses.reduce(
      (sum, qa) => sum + qa.weightedScore,
      0,
    );

    return Score.create(Math.round(totalScore / this.props.questionAnalyses.length));
  }

  get invitationId(): string {
    return this.props.invitationId;
  }

  get candidateId(): string {
    return this.props.candidateId;
  }

  get templateId(): string {
    return this.props.templateId;
  }

  get templateTitle(): string {
    return this.props.templateTitle;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get status(): AnalysisStatus {
    return this.props.status;
  }

  get overallScore(): Score | null {
    return this.props.overallScore;
  }

  get summary(): string | null {
    return this.props.summary;
  }

  get strengths(): string[] {
    return [...this.props.strengths];
  }

  get weaknesses(): string[] {
    return [...this.props.weaknesses];
  }

  get recommendation(): Recommendation | null {
    return this.props.recommendation;
  }

  get metadata(): AnalysisMetadata {
    return this.props.metadata;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  get questionAnalyses(): QuestionAnalysis[] {
    return [...this.props.questionAnalyses];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get questionsCount(): number {
    return this.props.questionAnalyses.length;
  }
}
