import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { InterviewTemplateEntity } from './interview-template.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(
    () => InterviewTemplateEntity,
    (template) => template.questions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'template_id' })
  template: InterviewTemplateEntity;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'video' | 'text' | 'multiple_choice'

  @Column({ name: 'order_number', type: 'int' })
  order: number;

  @Column({ name: 'time_limit', type: 'int' })
  timeLimit: number;

  @Column({ type: 'boolean', default: true })
  required: boolean;

  @Column({ type: 'text', nullable: true })
  hints: string | null;

  @Column({ type: 'jsonb', nullable: true })
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
