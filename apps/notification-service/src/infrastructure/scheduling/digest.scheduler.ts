import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { LoggerService } from "../logger/logger.service";

/**
 * Digest Scheduler
 * Sends weekly digest emails every Monday at 9am UTC.
 *
 * Note: In a full implementation, this would aggregate data from
 * multiple services and send personalized digests to HR users.
 */
@Injectable()
export class DigestScheduler {
  constructor(private readonly logger: LoggerService) {}

  // Every Monday at 9:00 AM UTC
  @Cron("0 9 * * 1")
  async sendWeeklyDigests(): Promise<void> {
    this.logger.info("Starting weekly digest generation", {
      action: "scheduler.digest",
    });

    // TODO: For each HR user with digest enabled:
    // 1. Aggregate weekly stats (new candidates, pending reviews, completed interviews)
    // 2. Send digest email via SendNotificationCommand
    // This requires maintaining read models of interview activity
  }
}
