import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqAnalysisEngine } from './groq-analysis-engine';
import { StaticPromptLoader } from './adapters/static-prompt-loader.adapter';
import { ANALYSIS_ENGINE } from '../../application/ports/analysis-engine.port';
import { PROMPT_LOADER } from '../../application/ports/prompt-loader.port';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [
    {
      provide: ANALYSIS_ENGINE,
      useClass: GroqAnalysisEngine,
    },
    {
      provide: PROMPT_LOADER,
      useClass: StaticPromptLoader,
    },
  ],
  exports: [ANALYSIS_ENGINE, PROMPT_LOADER],
})
export class LlmModule {}
