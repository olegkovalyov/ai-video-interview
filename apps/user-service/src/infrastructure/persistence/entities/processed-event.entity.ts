import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Processed Event Entity
 * Tracks processed Kafka events for idempotency
 * Based on existing Kafka integration architecture
 */
@Entity('processed_events')
@Unique(['eventId', 'serviceName'])
export class ProcessedEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ name: 'service_name' })
  @Index()
  serviceName: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
