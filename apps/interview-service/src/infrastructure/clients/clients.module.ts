import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';
import { HttpBillingClient } from './http-billing.client';
import { IBillingClientToken } from '../../application/interfaces/billing-client.interface';

/**
 * Clients Module
 * Provides HTTP clients for other services (billing, etc.).
 * Port interfaces live in the application layer; implementations here.
 */
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    {
      provide: IBillingClientToken,
      useClass: HttpBillingClient,
    },
  ],
  exports: [IBillingClientToken],
})
export class ClientsModule {}
