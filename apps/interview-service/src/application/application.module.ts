import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './commands';
import { QueryHandlers } from './queries';
import { DatabaseModule } from '../infrastructure/persistence/database.module';

@Module({
  imports: [CqrsModule, DatabaseModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
