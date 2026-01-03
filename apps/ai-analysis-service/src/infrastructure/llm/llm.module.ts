import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqAnalysisEngine } from './groq-analysis-engine';
import { ANALYSIS_ENGINE } from '../../application/ports/analysis-engine.port';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: ANALYSIS_ENGINE,
      useClass: GroqAnalysisEngine,
    },
  ],
  exports: [ANALYSIS_ENGINE],
})
export class LlmModule {}
