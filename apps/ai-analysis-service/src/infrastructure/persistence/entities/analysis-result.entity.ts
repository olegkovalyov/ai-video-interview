import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { QuestionAnalysisEntity } from './question-analysis.entity';

@Entity('analysis_results')
export class AnalysisResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'invitation_id' })
  @Index()
  invitationId: string;

  @Column({ type: 'varchar', length: 255, name: 'candidate_id' })
  @Index()
  candidateId: string;

  @Column({ type: 'varchar', length: 255, name: 'template_id' })
  templateId: string;

  @Column({ type: 'varchar', length: 500, name: 'template_title' })
  templateTitle: string;

  @Column({ type: 'varchar', length: 255, name: 'company_name' })
  companyName: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  })
  @Index()
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  @Column({ type: 'int', nullable: true, name: 'overall_score' })
  overallScore: number | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'jsonb', default: [] })
  strengths: string[];

  @Column({ type: 'jsonb', default: [] })
  weaknesses: string[];

  @Column({
    type: 'enum',
    enum: ['hire', 'consider', 'reject'],
    nullable: true,
  })
  recommendation: 'hire' | 'consider' | 'reject' | null;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'model_used' })
  modelUsed: string | null;

  @Column({ type: 'int', default: 0, name: 'total_tokens_used' })
  totalTokensUsed: number;

  @Column({ type: 'int', default: 0, name: 'processing_time_ms' })
  processingTimeMs: number;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @OneToMany(() => QuestionAnalysisEntity, (qa) => qa.analysisResult, {
    cascade: true,
    eager: true,
  })
  questionAnalyses: QuestionAnalysisEntity[];

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;
}
