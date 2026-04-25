import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { OutboxStatus } from '../../constants';
import { OUTBOX_STATUS } from '../../constants';

@Entity('outbox')
@Index('idx_outbox_status', ['status'])
@Index('idx_outbox_created_at', ['createdAt'])
@Index('idx_outbox_status_created', ['status', 'createdAt'])
@Index('idx_outbox_event_type', ['eventType'])
@Index('idx_outbox_correlation_id', ['correlationId'])
@Index('idx_outbox_trace_id', ['traceId'])
@Index('idx_outbox_user_id', ['userId'])
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

  // Observability columns — captured at saveEvent() time so the publisher
  // can restore the originating request's trace + correlation context
  // before publishing to Kafka. This makes "POST /users → outbox row →
  // Kafka publish (5s later) → consumer span" appear as one continuous
  // trace in Jaeger and one correlationId thread in Loki.
  @Column({ name: 'trace_id', type: 'varchar', length: 32, nullable: true })
  traceId: string | null;

  @Column({
    name: 'parent_span_id',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  parentSpanId: string | null;

  @Column({ name: 'correlation_id', type: 'varchar', nullable: true })
  correlationId: string | null;

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;
}
