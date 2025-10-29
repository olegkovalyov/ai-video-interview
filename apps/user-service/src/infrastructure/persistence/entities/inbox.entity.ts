import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('inbox')
@Index('idx_inbox_status', ['status'])
@Index('idx_inbox_created_at', ['createdAt'])
@Index('idx_inbox_status_created', ['status', 'createdAt'])
export class InboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', unique: true })
  messageId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'processed' | 'failed';

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;
}
