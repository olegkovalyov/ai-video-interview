import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('processed_events')
@Unique(['eventId', 'serviceName'])
export class ProcessedEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ type: 'varchar', length: 100, default: 'ai-analysis-service', name: 'service_name' })
  serviceName: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
