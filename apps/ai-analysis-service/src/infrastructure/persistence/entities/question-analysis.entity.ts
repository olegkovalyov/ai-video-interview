import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AnalysisResultEntity } from './analysis-result.entity';

@Entity('question_analyses')
export class QuestionAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'analysis_result_id' })
  @Index()
  analysisResultId: string;

  @ManyToOne(() => AnalysisResultEntity, (ar) => ar.questionAnalyses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysis_result_id' })
  analysisResult: AnalysisResultEntity;

  @Column({ type: 'varchar', length: 255, name: 'question_id' })
  questionId: string;

  @Column({ type: 'text', name: 'question_text' })
  questionText: string;

  @Column({
    type: 'enum',
    enum: ['text', 'multiple_choice', 'video', 'code'],
    name: 'question_type',
  })
  questionType: 'text' | 'multiple_choice' | 'video' | 'code';

  @Column({ type: 'text', name: 'response_text' })
  responseText: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text' })
  feedback: string;

  @Column({ type: 'jsonb', default: [], name: 'criteria_scores' })
  criteriaScores: Array<{
    criterion: string;
    score: number;
    weight: number;
  }>;

  @Column({ type: 'boolean', nullable: true, name: 'is_correct' })
  isCorrect: boolean | null;

  @Column({ type: 'int', default: 0, name: 'tokens_used' })
  tokensUsed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
