import { DataSource } from "typeorm";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { v4 as uuidv4 } from "uuid";
import { AnalysisResultEntity } from "src/infrastructure/persistence/entities/analysis-result.entity";
import { QuestionAnalysisEntity } from "src/infrastructure/persistence/entities/question-analysis.entity";
import { ProcessedEventEntity } from "src/infrastructure/persistence/entities/processed-event.entity";
import { OutboxEntity } from "src/infrastructure/persistence/entities/outbox.entity";
import { DatabaseModule } from "src/infrastructure/persistence/database.module";
import { TestApplicationModule } from "./test-application.module";

const TEST_DB = "ai_video_interview_analysis_test";

export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    database: TEST_DB,
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

  await dataSource.initialize();
  await dropAllTables(dataSource);
  await createExtensions(dataSource);
  await dataSource.runMigrations();

  return dataSource;
}

async function dropAllTables(dataSource: DataSource): Promise<void> {
  const tables = await dataSource.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  if (tables.length > 0) {
    const tableNames = tables.map((t: any) => `"${t.tablename}"`).join(", ");
    await dataSource.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
  }
  // Drop enum types that might conflict with migrations
  await dataSource.query(
    `DROP TYPE IF EXISTS analysis_results_status_enum CASCADE`,
  );
  await dataSource.query(
    `DROP TYPE IF EXISTS analysis_results_recommendation_enum CASCADE`,
  );
  await dataSource.query(
    `DROP TYPE IF EXISTS question_analyses_question_type_enum CASCADE`,
  );
}

async function createExtensions(dataSource: DataSource): Promise<void> {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}

export async function setupTestApp(
  dataSource: DataSource,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      DatabaseModule,
      TestApplicationModule,
    ],
  })
    .overrideProvider(DataSource)
    .useValue(dataSource)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE TABLE
      question_analyses,
      analysis_results,
      processed_events,
      outbox
    RESTART IDENTITY CASCADE
  `);
}

// ─── Seed helpers ────────────────────────────────────────

export async function seedAnalysisResult(
  dataSource: DataSource,
  overrides: Partial<AnalysisResultEntity> = {},
): Promise<AnalysisResultEntity> {
  const repo = dataSource.getRepository(AnalysisResultEntity);
  const entity = repo.create({
    invitationId: uuidv4(),
    candidateId: uuidv4(),
    templateId: uuidv4(),
    templateTitle: "Test Interview",
    companyName: "TestCorp",
    status: "pending",
    strengths: [],
    weaknesses: [],
    ...overrides,
  });
  return repo.save(entity);
}

export async function seedCompletedAnalysis(
  dataSource: DataSource,
  overrides: Partial<AnalysisResultEntity> = {},
): Promise<AnalysisResultEntity> {
  return seedAnalysisResult(dataSource, {
    status: "completed",
    overallScore: 80,
    summary: "Strong candidate with good technical skills.",
    strengths: ["Technical knowledge", "Problem solving"],
    weaknesses: ["Communication"],
    recommendation: "hire",
    modelUsed: "test-model",
    totalTokensUsed: 1500,
    processingTimeMs: 5000,
    completedAt: new Date(),
    ...overrides,
  });
}

export async function seedQuestionAnalysis(
  dataSource: DataSource,
  analysisResultId: string,
  overrides: Partial<QuestionAnalysisEntity> = {},
): Promise<QuestionAnalysisEntity> {
  const repo = dataSource.getRepository(QuestionAnalysisEntity);
  const entity = repo.create({
    analysisResultId,
    questionId: uuidv4(),
    questionText: "What is event-driven architecture?",
    questionType: "text",
    responseText: "Event-driven architecture uses asynchronous messaging.",
    score: 75,
    feedback: "Good understanding of core concepts.",
    criteriaScores: [
      { criterion: "relevance", score: 80, weight: 0.25 },
      { criterion: "completeness", score: 70, weight: 0.25 },
      { criterion: "clarity", score: 80, weight: 0.25 },
      { criterion: "depth", score: 70, weight: 0.25 },
    ],
    ...overrides,
  });
  return repo.save(entity);
}
