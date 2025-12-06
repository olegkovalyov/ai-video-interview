import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ResponseEntity } from './response.entity';
import { InterviewTemplateEntity } from './interview-template.entity';

@Entity('invitations')
@Index('idx_invitations_candidate_id', ['candidateId'])
@Index('idx_invitations_invited_by', ['invitedBy'])
@Index('idx_invitations_template_id', ['templateId'])
@Index('idx_invitations_status', ['status'])
@Index('idx_invitations_candidate_template', ['candidateId', 'templateId'], { unique: true })
export class InvitationEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'invited_by', type: 'uuid' })
  invitedBy: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending' | 'in_progress' | 'completed' | 'expired'

  @Column({ name: 'allow_pause', type: 'boolean', default: true })
  allowPause: boolean;

  @Column({ name: 'show_timer', type: 'boolean', default: true })
  showTimer: boolean;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt: Date | null;

  @Column({ name: 'completed_reason', type: 'varchar', length: 20, nullable: true })
  completedReason: string | null; // 'manual' | 'auto_timeout' | 'expired'

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @ManyToOne(() => InterviewTemplateEntity)
  @JoinColumn({ name: 'template_id' })
  template: InterviewTemplateEntity;

  @OneToMany(() => ResponseEntity, (response) => response.invitation, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  responses: ResponseEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
