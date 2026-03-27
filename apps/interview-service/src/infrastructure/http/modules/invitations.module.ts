import { Module } from '@nestjs/common';
import { InvitationsController } from '../controllers/invitations.controller';
import { ApplicationModule } from '../../../application/application.module';
import { DatabaseModule } from '../../persistence/database.module';
import { HttpModule } from '../http.module';

/**
 * Invitations Module
 * Encapsulates Invitations REST API
 * Imports:
 * - ApplicationModule: for CommandBus and QueryBus
 * - DatabaseModule: for IInvitationRepository (heartbeat)
 * - HttpModule: for Guards (InternalServiceGuard)
 */
@Module({
  imports: [ApplicationModule, DatabaseModule, HttpModule],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
