import { Injectable, Inject } from '@nestjs/common';
import { 
  KafkaService, 
  UserCommandFactory, 
  KAFKA_TOPICS,
  injectTraceContext,
  getTraceInfo,
} from '@repo/shared';
import { LoggerService } from '../logger/logger.service';
import { trace } from '@opentelemetry/api';
import { v4 as uuid } from 'uuid';

/**
 * Service for publishing user commands to user-commands Kafka topic
 * Commands are imperative (do this) and consumed by User Service
 */
@Injectable()
export class UserCommandPublisher {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Publish user.create command
   * @param keycloakId - External auth provider ID (Keycloak)
   * @returns userId - Generated internal UUID for User Service
   */
  async publishUserCreate(
    keycloakId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    password?: string,
  ): Promise<string> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.create');
    
    try {
      // Generate internal userId for User Service
      const userId = uuid();
      
      const command = UserCommandFactory.createUserCreate(
        userId,          // Internal UUID
        keycloakId,      // External auth provider ID
        email,
        firstName,
        lastName,
        password,
      );
      
      this.loggerService.info('API Gateway: Generated userId for user', {
        userId,
        keycloakId,
        email,
      });

      const traceInfo = getTraceInfo();

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(), // Inject trace context into Kafka headers
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.create',
        userId,
        keycloakId,
        email,
        traceId: traceInfo?.traceId,
        spanId: traceInfo?.spanId,
      });

      span.setStatus({ code: 0 }); // OK
      span.end();
      
      return userId; // Return generated userId
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.create',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 }); // ERROR
      span.end();
      
      throw error;
    }
  }

  /**
   * Publish user.update command
   */
  async publishUserUpdate(
    userId: string,
    firstName?: string,
    lastName?: string,
    avatarUrl?: string,
  ): Promise<void> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.update');
    
    try {
      const command = UserCommandFactory.createUserUpdate(
        userId,
        firstName,
        lastName,
        avatarUrl,
      );

      const traceInfo = getTraceInfo();

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(),
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.update',
        userId,
        traceId: traceInfo?.traceId,
      });

      span.setStatus({ code: 0 });
      span.end();
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.update',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 });
      span.end();
      
      throw error;
    }
  }

  /**
   * Publish user.delete command
   */
  async publishUserDelete(
    userId: string,
    deletedBy: 'admin' | 'user' | 'system' = 'admin',
  ): Promise<void> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.delete');
    
    try {
      const command = UserCommandFactory.createUserDelete(userId, deletedBy);

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(),
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.delete',
        userId,
        deletedBy,
      });

      span.setStatus({ code: 0 });
      span.end();
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.delete',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 });
      span.end();
      
      throw error;
    }
  }

  /**
   * Publish user.suspend command
   */
  async publishUserSuspend(
    userId: string,
    reason?: string,
  ): Promise<void> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.suspend');
    
    try {
      const command = UserCommandFactory.createUserSuspend(userId, reason);

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(),
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.suspend',
        userId,
      });

      span.setStatus({ code: 0 });
      span.end();
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.suspend',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 });
      span.end();
      
      throw error;
    }
  }

  /**
   * Publish user.activate command
   */
  async publishUserActivate(userId: string): Promise<void> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.activate');
    
    try {
      const command = UserCommandFactory.createUserActivate(userId);

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(),
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.activate',
        userId,
      });

      span.setStatus({ code: 0 });
      span.end();
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.activate',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 });
      span.end();
      
      throw error;
    }
  }

  /**
   * Publish user.assign_role command
   */
  async publishUserAssignRole(
    userId: string,
    roleName: string,
    assignedBy?: string,
  ): Promise<void> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.assign_role');
    
    try {
      const command = UserCommandFactory.createUserAssignRole(
        userId,
        roleName,
        assignedBy,
      );

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(),
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.assign_role',
        userId,
        roleName,
      });

      span.setStatus({ code: 0 });
      span.end();
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.assign_role',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 });
      span.end();
      
      throw error;
    }
  }

  /**
   * Publish user.remove_role command
   */
  async publishUserRemoveRole(
    userId: string,
    roleName: string,
    removedBy?: string,
  ): Promise<void> {
    const span = trace.getTracer('api-gateway').startSpan('kafka.publish.user.remove_role');
    
    try {
      const command = UserCommandFactory.createUserRemoveRole(
        userId,
        roleName,
        removedBy,
      );

      await this.kafkaService.publishEvent(
        KAFKA_TOPICS.USER_COMMANDS,
        command,
        injectTraceContext(),
      );

      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, true, {
        commandType: 'user.remove_role',
        userId,
        roleName,
      });

      span.setStatus({ code: 0 });
      span.end();
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_COMMANDS, false, {
        commandType: 'user.remove_role',
        error: error.message,
      });

      span.recordException(error);
      span.setStatus({ code: 2 });
      span.end();
      
      throw error;
    }
  }
}
