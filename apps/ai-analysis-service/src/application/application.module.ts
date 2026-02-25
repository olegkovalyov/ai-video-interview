import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../infrastructure/persistence/database.module';
import { LlmModule } from '../infrastructure/llm/llm.module';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';
import { MetricsModule } from '../infrastructure/metrics/metrics.module';

// Commands
import { AnalyzeInterviewHandler } from './commands/analyze-interview/analyze-interview.handler';
import { RetryAnalysisHandler } from './commands/retry-analysis/retry-analysis.handler';

// Queries
import { GetAnalysisResultHandler } from './queries/get-analysis-result/get-analysis-result.handler';
import { GetAnalysisByInvitationHandler } from './queries/get-analysis-by-invitation/get-analysis-by-invitation.handler';
import { ListAnalysesHandler } from './queries/list-analyses/list-analyses.handler';

const CommandHandlers = [AnalyzeInterviewHandler, RetryAnalysisHandler];

const QueryHandlers = [
  GetAnalysisResultHandler,
  GetAnalysisByInvitationHandler,
  ListAnalysesHandler,
];

/**
 * Application module — registers all CQRS command and query handlers.
 *
 * Handlers depend on ports (IAnalysisResultRepository, IAnalysisEngine,
 * IEventPublisher, IPromptLoader) which are provided by infrastructure modules
 * (DatabaseModule, LlmModule, KafkaModule).
 */
@Module({
  imports: [CqrsModule, DatabaseModule, LlmModule, KafkaModule, MetricsModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
