import { UsageRecord } from "../usage-record.entity";

describe("UsageRecord Entity", () => {
  const createRecord = (
    id = "usage-1",
    subscriptionId = "sub-1",
    period = "2026-03",
  ) => {
    return UsageRecord.create(id, subscriptionId, period);
  };

  describe("create()", () => {
    it("should create with zero counters", () => {
      const record = createRecord();

      expect(record.id).toBe("usage-1");
      expect(record.subscriptionId).toBe("sub-1");
      expect(record.period).toBe("2026-03");
      expect(record.interviewsUsed).toBe(0);
      expect(record.analysisTokensUsed).toBe(0);
      expect(record.storageUsedMb).toBe(0);
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("reconstitute()", () => {
    it("should reconstitute with existing values", () => {
      const createdAt = new Date("2026-03-01");
      const updatedAt = new Date("2026-03-15");

      const record = UsageRecord.reconstitute("usage-1", {
        subscriptionId: "sub-1",
        period: "2026-03",
        interviewsUsed: 10,
        analysisTokensUsed: 5000,
        storageUsedMb: 250,
        createdAt,
        updatedAt,
      });

      expect(record.interviewsUsed).toBe(10);
      expect(record.analysisTokensUsed).toBe(5000);
      expect(record.storageUsedMb).toBe(250);
    });
  });

  describe("incrementInterviews()", () => {
    it("should increment by 1 by default", () => {
      const record = createRecord();

      record.incrementInterviews();

      expect(record.interviewsUsed).toBe(1);
    });

    it("should increment by specified count", () => {
      const record = createRecord();

      record.incrementInterviews(5);

      expect(record.interviewsUsed).toBe(5);
    });

    it("should accumulate multiple increments", () => {
      const record = createRecord();

      record.incrementInterviews(3);
      record.incrementInterviews(2);

      expect(record.interviewsUsed).toBe(5);
    });

    it("should update updatedAt timestamp", () => {
      const record = createRecord();
      const beforeUpdate = record.updatedAt;

      // Small delay to ensure different timestamp
      record.incrementInterviews();

      expect(record.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("incrementAnalysisTokens()", () => {
    it("should increment by specified amount", () => {
      const record = createRecord();

      record.incrementAnalysisTokens(1500);

      expect(record.analysisTokensUsed).toBe(1500);
    });

    it("should accumulate multiple increments", () => {
      const record = createRecord();

      record.incrementAnalysisTokens(1000);
      record.incrementAnalysisTokens(500);

      expect(record.analysisTokensUsed).toBe(1500);
    });
  });

  describe("incrementStorage()", () => {
    it("should increment by specified amount", () => {
      const record = createRecord();

      record.incrementStorage(100);

      expect(record.storageUsedMb).toBe(100);
    });

    it("should accumulate multiple increments", () => {
      const record = createRecord();

      record.incrementStorage(50);
      record.incrementStorage(30);

      expect(record.storageUsedMb).toBe(80);
    });
  });

  describe("Entity Equality", () => {
    it("should be equal when same id", () => {
      const record1 = createRecord("usage-1");
      const record2 = createRecord("usage-1");
      expect(record1.equals(record2)).toBe(true);
    });

    it("should not be equal when different id", () => {
      const record1 = createRecord("usage-1");
      const record2 = createRecord("usage-2");
      expect(record1.equals(record2)).toBe(false);
    });
  });
});
