import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

export interface OrphanedUserDetails {
  reason: 'rollback_failed' | 'user_service_unavailable' | 'keycloak_delete_failed';
  originalError?: string;
  rollbackError?: string;
  operationId: string;
  timestamp?: Date;
}

export interface OrphanedUser extends OrphanedUserDetails {
  keycloakId: string;
  timestamp: Date;
}

/**
 * Service for tracking orphaned users
 * When Saga rollback fails, we need to track these for manual cleanup
 */
@Injectable()
export class OrphanedUsersService {
  private orphanedUsers: Map<string, OrphanedUser> = new Map();

  constructor(private readonly logger: LoggerService) {}

  /**
   * Track orphaned user (when rollback failed)
   * These need manual cleanup
   */
  async trackOrphanedUser(keycloakId: string, details: OrphanedUserDetails): Promise<void> {
    const orphanedUser: OrphanedUser = {
      keycloakId,
      ...details,
      timestamp: details.timestamp || new Date(),
    };

    this.orphanedUsers.set(keycloakId, orphanedUser);

    // Log critical alert
    this.logger.error('CRITICAL: Orphaned user detected', null, {
      keycloakId,
      reason: details.reason,
      operationId: details.operationId,
      originalError: details.originalError,
      rollbackError: details.rollbackError,
    });

    // TODO: Send alert to monitoring system (Sentry, Slack, PagerDuty)
    // TODO: Save to database for persistence
    // await this.saveToDatabase(orphanedUser);
  }

  /**
   * Get all orphaned users for manual cleanup
   */
  getOrphanedUsers(): OrphanedUser[] {
    return Array.from(this.orphanedUsers.values());
  }

  /**
   * Get specific orphaned user
   */
  getOrphanedUser(keycloakId: string): OrphanedUser | undefined {
    return this.orphanedUsers.get(keycloakId);
  }

  /**
   * Mark orphaned user as cleaned up
   */
  markAsCleaned(keycloakId: string): void {
    const orphanedUser = this.orphanedUsers.get(keycloakId);
    
    if (orphanedUser) {
      this.logger.info('Orphaned user marked as cleaned', {
        keycloakId,
        reason: orphanedUser.reason,
      });
      
      this.orphanedUsers.delete(keycloakId);
      
      // TODO: Update database
      // await this.updateDatabase(keycloakId, 'cleaned');
    }
  }

  /**
   * Get count of orphaned users
   */
  getOrphanedUsersCount(): number {
    return this.orphanedUsers.size;
  }

  /**
   * Get orphaned users by reason
   */
  getOrphanedUsersByReason(reason: OrphanedUserDetails['reason']): OrphanedUser[] {
    return Array.from(this.orphanedUsers.values()).filter(
      (user) => user.reason === reason,
    );
  }
}
