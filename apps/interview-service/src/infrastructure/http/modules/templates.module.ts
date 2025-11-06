import { Module } from '@nestjs/common';
import { TemplatesController } from '../controllers/templates.controller';
import { ApplicationModule } from '../../../application/application.module';
import { HttpModule } from '../http.module';

/**
 * Templates Module
 * Encapsulates Templates REST API
 * Imports:
 * - ApplicationModule: for CommandBus and QueryBus
 * - HttpModule: for Guards (JwtAuthGuard, RolesGuard) and JwtService
 */
@Module({
  imports: [ApplicationModule, HttpModule],
  controllers: [TemplatesController],
})
export class TemplatesModule {}
