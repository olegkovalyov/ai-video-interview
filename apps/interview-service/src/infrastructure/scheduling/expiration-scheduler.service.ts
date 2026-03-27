import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import type { IInvitationRepository } from '../../domain/repositories/invitation.repository.interface';
import { CompleteInvitationCommand } from '../../application/commands/complete-invitation/complete-invitation.command';
import { LoggerService } from '../logger/logger.service';

const TIMEOUT_MINUTES = 30;

@Injectable()
export class ExpirationSchedulerService {
  private isProcessingExpired = false;
  private isProcessingTimedOut = false;

  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredInvitations(): Promise<void> {
    if (this.isProcessingExpired) return;
    this.isProcessingExpired = true;

    try {
      const expired = await this.invitationRepository.findExpiredInvitations();

      if (expired.length === 0) return;

      this.logger.info(
        `Found ${expired.length} expired invitations to process`,
        {
          action: 'expiration_check',
          count: expired.length,
        },
      );

      for (const invitation of expired) {
        try {
          await this.commandBus.execute(
            new CompleteInvitationCommand(invitation.id, null, 'expired'),
          );

          this.logger.info(`Auto-expired invitation ${invitation.id}`, {
            action: 'invitation_expired',
            invitationId: invitation.id,
            candidateId: invitation.candidateId,
          });
        } catch (error) {
          this.logger.error(
            `Failed to expire invitation ${invitation.id}: ${error.message}`,
            error.stack,
            { action: 'expiration_error', invitationId: invitation.id },
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Expiration scheduler failed: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessingExpired = false;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTimedOutInvitations(): Promise<void> {
    if (this.isProcessingTimedOut) return;
    this.isProcessingTimedOut = true;

    try {
      const timedOut =
        await this.invitationRepository.findTimedOutInvitations(
          TIMEOUT_MINUTES,
        );

      if (timedOut.length === 0) return;

      this.logger.info(
        `Found ${timedOut.length} timed-out invitations to process`,
        {
          action: 'timeout_check',
          count: timedOut.length,
          timeoutMinutes: TIMEOUT_MINUTES,
        },
      );

      for (const invitation of timedOut) {
        try {
          await this.commandBus.execute(
            new CompleteInvitationCommand(invitation.id, null, 'auto_timeout'),
          );

          this.logger.info(
            `Auto-completed timed-out invitation ${invitation.id}`,
            {
              action: 'invitation_timed_out',
              invitationId: invitation.id,
              candidateId: invitation.candidateId,
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to timeout invitation ${invitation.id}: ${error.message}`,
            error.stack,
            { action: 'timeout_error', invitationId: invitation.id },
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Timeout scheduler failed: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessingTimedOut = false;
    }
  }
}
