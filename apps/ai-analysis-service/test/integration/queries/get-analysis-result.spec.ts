import { INestApplication } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import {
  createTestDataSource,
  setupTestApp,
  cleanDatabase,
  seedCompletedAnalysis,
  seedAnalysisResult,
} from "../setup";
import { GetAnalysisResultQuery } from "src/application/queries/get-analysis-result/get-analysis-result.query";
import { AnalysisNotFoundException } from "src/domain/exceptions/analysis.exceptions";
import { v4 as uuidv4 } from "uuid";

describe("GetAnalysisResult Integration", () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it("should return analysis by ID", async () => {
    const analysis = await seedCompletedAnalysis(dataSource);

    const result = await queryBus.execute(
      new GetAnalysisResultQuery(analysis.id),
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(analysis.id);
    expect(result.status).toBe("completed");
    expect(result.overallScore).toBe(80);
  });

  it("should return pending analysis", async () => {
    const analysis = await seedAnalysisResult(dataSource, {
      status: "pending",
    });

    const result = await queryBus.execute(
      new GetAnalysisResultQuery(analysis.id),
    );

    expect(result).toBeDefined();
    expect(result.status).toBe("pending");
  });

  it("should throw AnalysisNotFoundException for non-existent ID", async () => {
    await expect(
      queryBus.execute(new GetAnalysisResultQuery(uuidv4())),
    ).rejects.toThrow(AnalysisNotFoundException);
  });
});
