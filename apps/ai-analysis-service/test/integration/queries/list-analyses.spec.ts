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
import { ListAnalysesQuery } from "src/application/queries/list-analyses/list-analyses.query";
import { v4 as uuidv4 } from "uuid";

describe("ListAnalyses Integration", () => {
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

  it("should return paginated analysis list", async () => {
    for (let i = 0; i < 5; i++) {
      await seedCompletedAnalysis(dataSource);
    }

    const result = await queryBus.execute(new ListAnalysesQuery(1, 3));

    expect(result.items).toHaveLength(3);
    expect(result.meta.total).toBe(5);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(3);
    expect(result.meta.totalPages).toBe(2);
  });

  it("should filter by status", async () => {
    await seedCompletedAnalysis(dataSource);
    await seedCompletedAnalysis(dataSource);
    await seedAnalysisResult(dataSource, { status: "failed" });

    const result = await queryBus.execute(
      new ListAnalysesQuery(1, 20, "completed" as any),
    );

    expect(result.items).toHaveLength(2);
    result.items.forEach((a: any) => expect(a.status).toBe("completed"));
  });

  it("should filter by candidateId", async () => {
    const candidateId = uuidv4();
    await seedCompletedAnalysis(dataSource, { candidateId });
    await seedCompletedAnalysis(dataSource, { candidateId });
    await seedCompletedAnalysis(dataSource);

    const result = await queryBus.execute(
      new ListAnalysesQuery(1, 20, undefined, candidateId),
    );

    expect(result.items).toHaveLength(2);
    result.items.forEach((a: any) => expect(a.candidateId).toBe(candidateId));
  });

  it("should return empty list when no analyses exist", async () => {
    const result = await queryBus.execute(new ListAnalysesQuery());

    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
