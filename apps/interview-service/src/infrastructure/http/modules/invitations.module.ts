import { Module } from '@nestjs/common';
import { InvitationsController } from '../controllers/invitations.controller';
import { ApplicationModule } from '../../../application/application.module';
import { HttpModule } from '../http.module';

/**
 * Invitations Module
 * Encapsulates Invitations REST API
 * Imports:
 * - ApplicationModule: for CommandBus and QueryBus
 * - HttpModule: for Guards (InternalServiceGuard)
 */
@Module({
  imports: [ApplicationModule, HttpModule],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
