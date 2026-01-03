import { Module } from '@nestjs/common';
import { SandboxController } from './controllers/sandbox.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [SandboxController],
})
export class HttpModule {}
