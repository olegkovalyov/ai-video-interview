import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ProcessedEventEntity } from '../persistence/entities/processed-event.entity';

const RETENTION_DAYS = 30;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(ProcessedEventEntity)
    private readonly processedEventRepo: Repository<ProcessedEventEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupProcessedEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    try {
      const result = await this.processedEventRepo.delete({
        processedAt: LessThan(cutoffDate),
      });

      const deletedCount = result.affected ?? 0;
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} processed events older than ${RETENTION_DAYS} days`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup processed events', error);
    }
  }
}
