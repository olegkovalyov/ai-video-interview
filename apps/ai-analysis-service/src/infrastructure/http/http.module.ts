import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SandboxController } from './controllers/sandbox.controller';
import { AnalysisController } from './controllers/analysis.controller';
import { HealthController } from './controllers/health.controller';
import { LlmModule } from '../llm/llm.module';
import { AnalysisResultEntity } from '../persistence/entities/analysis-result.entity';

@Module({
  imports: [
    LlmModule,
    TypeOrmModule.forFeature([AnalysisResultEntity]),
  ],
  controllers: [SandboxController, AnalysisController, HealthController],
})
export class HttpModule {}
