import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { AnalysisResultEntity } from "src/infrastructure/persistence/entities/analysis-result.entity";
import { QuestionAnalysisEntity } from "src/infrastructure/persistence/entities/question-analysis.entity";
import { ProcessedEventEntity } from "src/infrastructure/persistence/entities/processed-event.entity";
import { OutboxEntity } from "src/infrastructure/persistence/entities/outbox.entity";
import { AnalysisController } from "src/infrastructure/http/controllers/analysis.controller";
import { HealthController } from "src/infrastructure/http/controllers/health.controller";
import { createE2EDataSource, cleanE2EDatabase } from "./test-database.setup";

describe("Analysis API (E2E)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createE2EDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
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
          synchronize: false,
          logging: false,
        }),
        TypeOrmModule.forFeature([AnalysisResultEntity]),
      ],
      controllers: [AnalysisController, HealthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await cleanE2EDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  // ─── Health ─────────────────────────────────────────

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app.getHttpServer())
        .get("/health")
        .expect(200);

      expect(response.body.status).toBeDefined();
    });
  });

  // ─── GET /api/v1/analysis/status/:invitationId ─────

  describe("GET /api/v1/analysis/status/:invitationId", () => {
    it("should return not_found for non-existent invitation", async () => {
      const invitationId = uuidv4();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/analysis/status/${invitationId}`)
        .expect(200);

      expect(response.body.found).toBe(false);
      expect(response.body.status).toBe("not_found");
    });

    it("should return analysis status for existing invitation", async () => {
      const invitationId = uuidv4();
      const repo = dataSource.getRepository(AnalysisResultEntity);
      await repo.save(
        repo.create({
          invitationId,
          candidateId: uuidv4(),
          templateId: uuidv4(),
          templateTitle: "Test",
          companyName: "TestCorp",
          status: "in_progress",
          strengths: [],
          weaknesses: [],
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/analysis/status/${invitationId}`)
        .expect(200);

      expect(response.body.found).toBe(true);
      expect(response.body.status).toBe("in_progress");
      expect(response.body.invitationId).toBe(invitationId);
    });

    it("should return completed analysis with all fields", async () => {
      const invitationId = uuidv4();
      const repo = dataSource.getRepository(AnalysisResultEntity);
      await repo.save(
        repo.create({
          invitationId,
          candidateId: uuidv4(),
          templateId: uuidv4(),
          templateTitle: "Frontend Interview",
          companyName: "TechCorp",
          status: "completed",
          overallScore: 85,
          summary: "Strong candidate",
          strengths: ["Technical"],
          weaknesses: ["Communication"],
          recommendation: "hire",
          completedAt: new Date(),
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/analysis/status/${invitationId}`)
        .expect(200);

      expect(response.body.found).toBe(true);
      expect(response.body.status).toBe("completed");
    });

    it("should reject invalid UUID", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/analysis/status/not-a-uuid")
        .expect(400);
    });
  });

  // ─── GET /api/v1/analysis/:invitationId ─────────────

  describe("GET /api/v1/analysis/:invitationId", () => {
    it("should return 404 for non-existent analysis", async () => {
      const invitationId = uuidv4();

      await request(app.getHttpServer())
        .get(`/api/v1/analysis/${invitationId}`)
        .expect(404);
    });

    it("should return full analysis with question analyses", async () => {
      const invitationId = uuidv4();
      const repo = dataSource.getRepository(AnalysisResultEntity);
      const qaRepo = dataSource.getRepository(QuestionAnalysisEntity);

      const analysis = await repo.save(
        repo.create({
          invitationId,
          candidateId: uuidv4(),
          templateId: uuidv4(),
          templateTitle: "Backend Interview",
          companyName: "DevCorp",
          status: "completed",
          overallScore: 78,
          summary: "Good technical skills",
          strengths: ["Problem solving"],
          weaknesses: ["Depth"],
          recommendation: "hire",
          modelUsed: "test-model",
          totalTokensUsed: 2000,
          processingTimeMs: 10000,
          completedAt: new Date(),
        }),
      );

      await qaRepo.save(
        qaRepo.create({
          analysisResultId: analysis.id,
          questionId: uuidv4(),
          questionText: "What is DDD?",
          questionType: "text",
          responseText: "Domain-Driven Design is...",
          score: 78,
          feedback: "Good understanding",
          criteriaScores: [
            { criterion: "relevance", score: 80, weight: 0.25 },
            { criterion: "completeness", score: 75, weight: 0.25 },
            { criterion: "clarity", score: 80, weight: 0.25 },
            { criterion: "depth", score: 77, weight: 0.25 },
          ],
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/analysis/${invitationId}`)
        .expect(200);

      expect(response.body.invitationId).toBe(invitationId);
      expect(response.body.overallScore).toBe(78);
      expect(response.body.recommendation).toBe("hire");
      expect(response.body.questionAnalyses).toHaveLength(1);
      expect(response.body.questionAnalyses[0].score).toBe(78);
      expect(response.body.questionAnalyses[0].questionText).toBe(
        "What is DDD?",
      );
    });
  });
});
