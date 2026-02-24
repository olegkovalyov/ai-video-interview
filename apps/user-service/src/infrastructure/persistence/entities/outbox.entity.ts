import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import type { OutboxStatus } from '../../constants';
import { OUTBOX_STATUS } from '../../constants';

@Entity('outbox')
@Index('idx_outbox_status', ['status'])
@Index('idx_outbox_created_at', ['createdAt'])
@Index('idx_outbox_status_created', ['status', 'createdAt'])
@Index('idx_outbox_event_type', ['eventType'])
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', unique: true })
  eventId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'aggregate_id' })
  aggregateId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', default: OUTBOX_STATUS.PENDING })
  status: OutboxStatus;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;
}
