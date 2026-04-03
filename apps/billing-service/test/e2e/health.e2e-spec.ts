import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { DataSource } from "typeorm";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "../../src/infrastructure/http/controllers/health.controller";
import { createTestDataSource } from "../integration/setup";

/**
 * Mock KafkaService for health controller (avoids real Kafka connection)
 */
const mockKafkaService = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

describe("Health API (E2E)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true })],
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: dataSource },
        { provide: "KAFKA_SERVICE", useValue: mockKafkaService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe("GET /health", () => {
    it("should return 200 with service name", async () => {
      const res = await request(app.getHttpServer()).get("/health").expect(200);

      expect(res.body.service).toBe("billing-service");
      expect(res.body.status).toBe("ok");
      expect(res.body.database).toBe("connected");
      expect(res.body.timestamp).toBeDefined();
    });

    it("should include a valid ISO timestamp", async () => {
      const res = await request(app.getHttpServer()).get("/health").expect(200);

      const parsed = Date.parse(res.body.timestamp);
      expect(isNaN(parsed)).toBe(false);
    });
  });
});
