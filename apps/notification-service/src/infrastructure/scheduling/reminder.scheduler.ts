import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { LoggerService } from "../logger/logger.service";

/**
 * Reminder Scheduler
 * Sends invitation reminders 24h before expiry.
 *
 * Note: In a full implementation, this would query the Interview Service
 * (via Kafka or HTTP) for invitations expiring in 24h.
 * For now, this is a placeholder for the scheduling infrastructure.
 */
@Injectable()
export class ReminderScheduler {
  constructor(private readonly logger: LoggerService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiringInvitations(): Promise<void> {
    this.logger.debug("Checking for expiring invitations", {
      action: "scheduler.reminder",
    });

    // TODO: Query interview-service for invitations expiring within 24h
    // For each expiring invitation, send a reminder notification
    // This requires either:
    // 1. A read model maintained by consuming invitation events, or
    // 2. An HTTP call to interview-service
  }
}
