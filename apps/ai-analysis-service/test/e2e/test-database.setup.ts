import { DataSource } from "typeorm";
import { AnalysisResultEntity } from "src/infrastructure/persistence/entities/analysis-result.entity";
import { QuestionAnalysisEntity } from "src/infrastructure/persistence/entities/question-analysis.entity";
import { ProcessedEventEntity } from "src/infrastructure/persistence/entities/processed-event.entity";
import { OutboxEntity } from "src/infrastructure/persistence/entities/outbox.entity";

export async function createE2EDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    database: "ai_video_interview_analysis_test",
    entities: [
      AnalysisResultEntity,
      QuestionAnalysisEntity,
      ProcessedEventEntity,
      OutboxEntity,
    ],
    migrations: ["src/infrastructure/persistence/migrations/*.ts"],
    synchronize: false,
    logging: false,
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

export async function cleanE2EDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource?.isInitialized) return;

  try {
    await dataSource.query(`
      TRUNCATE TABLE
        question_analyses,
        analysis_results,
        processed_events,
        outbox
      RESTART IDENTITY CASCADE
    `);
  } catch (error: any) {
    console.warn("E2E cleanup warning:", error.message);
  }
}
