import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CommandBus } from "@nestjs/cqrs";
import { ANALYSIS_RESULT_REPOSITORY } from "../../domain/repositories/analysis-result.repository.interface";
import type { IAnalysisResultRepository } from "../../domain/repositories/analysis-result.repository.interface";
import { AnalysisStatusEnum } from "../../domain/value-objects/analysis-status.vo";
import { RetryAnalysisCommand } from "../../application/commands/retry-analysis/retry-analysis.command";

const MAX_AUTO_RETRIES = 2;
const RETRY_AFTER_MINUTES = 60;

@Injectable()
export class RetrySchedulerService {
  private readonly logger = new Logger(RetrySchedulerService.name);
  private isProcessing = false;

  /** Tracks retry attempts per analysis ID (resets on service restart) */
  private readonly retryCounts = new Map<string, number>();

  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedAnalyses(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const { items: failedAnalyses } = await this.repository.findAll({
        status: AnalysisStatusEnum.FAILED,
        limit: 10,
      });

      if (failedAnalyses.length === 0) return;

      const retryableAnalyses = failedAnalyses.filter((analysis) => {
        const retryCount = this.retryCounts.get(analysis.id) ?? 0;
        if (retryCount >= MAX_AUTO_RETRIES) return false;

        const failedAt = analysis.updatedAt;
        const retryAfter = new Date(
          failedAt.getTime() + RETRY_AFTER_MINUTES * 60_000,
        );
        return new Date() >= retryAfter;
      });

      if (retryableAnalyses.length === 0) return;

      this.logger.log(
        `Found ${retryableAnalyses.length} failed analyses eligible for auto-retry`,
      );

      for (const analysis of retryableAnalyses) {
        const retryCount = this.retryCounts.get(analysis.id) ?? 0;

        // Check if source event data exists before attempting retry
        const sourceEventData = await this.repository.getSourceEventData(
          analysis.id,
        );
        if (!sourceEventData) {
          this.logger.warn(
            `Skipping retry for analysis ${analysis.id}: no source event data (legacy record)`,
          );
          this.retryCounts.set(analysis.id, MAX_AUTO_RETRIES);
          continue;
        }

        try {
          this.retryCounts.set(analysis.id, retryCount + 1);
          await this.commandBus.execute(new RetryAnalysisCommand(analysis.id));

          this.logger.log(`Auto-retried analysis ${analysis.id}`, {
            invitationId: analysis.invitationId,
            attempt: retryCount + 1,
          });
          // Success — clean up counter
          this.retryCounts.delete(analysis.id);
        } catch (error) {
          this.logger.error(
            `Auto-retry failed for analysis ${analysis.id} (attempt ${retryCount + 1}/${MAX_AUTO_RETRIES}): ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Retry scheduler failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
