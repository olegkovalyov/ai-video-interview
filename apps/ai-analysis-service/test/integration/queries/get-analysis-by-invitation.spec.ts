import { INestApplication } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import {
  createTestDataSource,
  setupTestApp,
  cleanDatabase,
  seedCompletedAnalysis,
  seedQuestionAnalysis,
} from "../setup";
import { GetAnalysisByInvitationQuery } from "src/application/queries/get-analysis-by-invitation/get-analysis-by-invitation.query";
import { AnalysisNotFoundException } from "src/domain/exceptions/analysis.exceptions";
import { v4 as uuidv4 } from "uuid";

describe("GetAnalysisByInvitation Integration", () => {
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

  it("should return completed analysis by invitation ID", async () => {
    const invitationId = uuidv4();
    const analysis = await seedCompletedAnalysis(dataSource, { invitationId });
    await seedQuestionAnalysis(dataSource, analysis.id);

    const result = await queryBus.execute(
      new GetAnalysisByInvitationQuery(invitationId),
    );

    expect(result).toBeDefined();
    expect(result.invitationId).toBe(invitationId);
    expect(result.status).toBe("completed");
    expect(result.overallScore).toBe(80);
    expect(result.recommendation).toBe("hire");
    expect(result.questionAnalyses).toHaveLength(1);
  });

  it("should throw AnalysisNotFoundException for non-existent invitation", async () => {
    await expect(
      queryBus.execute(new GetAnalysisByInvitationQuery(uuidv4())),
    ).rejects.toThrow(AnalysisNotFoundException);
  });
});
