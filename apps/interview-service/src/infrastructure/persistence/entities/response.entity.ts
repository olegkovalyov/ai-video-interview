import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InvitationEntity } from './invitation.entity';

@Entity('responses')
@Index('idx_responses_invitation_id', ['invitationId'])
@Index('idx_responses_invitation_question', ['invitationId', 'questionId'], { unique: true })
export class ResponseEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'invitation_id', type: 'uuid' })
  invitationId: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'question_index', type: 'int' })
  questionIndex: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'response_type', type: 'varchar', length: 20 })
  responseType: string; // 'text' | 'code' | 'video'

  @Column({ name: 'text_answer', type: 'text', nullable: true })
  textAnswer: string | null;

  @Column({ name: 'code_answer', type: 'text', nullable: true })
  codeAnswer: string | null;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'int', default: 0 })
  duration: number; // seconds spent on this question

  @Column({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  @ManyToOne(() => InvitationEntity, (invitation) => invitation.responses)
  @JoinColumn({ name: 'invitation_id' })
  invitation: InvitationEntity;
}
