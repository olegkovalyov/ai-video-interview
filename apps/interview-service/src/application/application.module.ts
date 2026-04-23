import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './commands';
import { QueryHandlers } from './queries';
import { DatabaseModule } from '../infrastructure/persistence/database.module';
import { ClientsModule } from '../infrastructure/clients/clients.module';

/**
 * Application Module
 * Contains CQRS command/query handlers
 *
 * Note: EventHandlers are registered in AppModule where MessagingModule is available
 * This allows integration tests to run without Redis/BullMQ dependency
 */
@Module({
  imports: [CqrsModule, DatabaseModule, ClientsModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
