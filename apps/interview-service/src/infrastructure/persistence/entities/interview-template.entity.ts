import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';
import { QuestionEntity } from './question.entity';

@Entity('interview_templates')
@Index('idx_created_by', ['createdBy'])
@Index('idx_status', ['status'])
export class InterviewTemplateEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: 'varchar', length: 50 })
  status: string; // 'draft' | 'active' | 'archived'

  @Column({ type: 'jsonb' })
  settings: {
    totalTimeLimit: number;
    allowRetakes: boolean;
    showTimer: boolean;
    randomizeQuestions: boolean;
  };

  @OneToMany(() => QuestionEntity, (question) => question.template, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  questions: QuestionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
