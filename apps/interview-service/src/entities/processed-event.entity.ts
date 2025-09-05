import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity('processed_events')
@Unique('unique_event_per_service', ['eventId', 'serviceName'])
@Index('idx_processed_events_event_id', ['eventId'])
@Index('idx_processed_events_service_name', ['serviceName'])
@Index('idx_processed_events_processed_at', ['processedAt'])
export class ProcessedEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'service_name', type: 'varchar', length: 50 })
  serviceName: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;

  @Column({ name: 'payload_hash', type: 'varchar', length: 64, nullable: true })
  payloadHash?: string;
}
