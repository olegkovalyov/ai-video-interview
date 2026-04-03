import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CommandHandlers } from "./commands";
import { QueryHandlers } from "./queries";
import { DatabaseModule } from "../infrastructure/persistence/database.module";
import { CacheModule } from "../infrastructure/cache/cache.module";
import { StripeModule } from "../infrastructure/stripe/stripe.module";

/**
 * Application Module
 * Contains CQRS command/query handlers
 *
 * Note: EventHandlers are registered in AppModule where MessagingModule is available
 * This allows integration tests to run without Redis/BullMQ dependency
 */
@Module({
  imports: [CqrsModule, DatabaseModule, CacheModule, StripeModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
