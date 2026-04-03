import { QuotaCacheService } from "../quota-cache.service";

describe("QuotaCacheService", () => {
  let service: QuotaCacheService;
  let redisMock: any;
  let configService: any;
  let logger: any;

  beforeEach(() => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      hincrby: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue("OK"),
      on: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue("localhost"),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    service = new QuotaCacheService(configService, logger);

    // Inject the mock Redis instance directly
    (service as any).redis = redisMock;
    (service as any).redisAvailable = true;
    // Clear default L1 cache
    (service as any).l1Cache = new Map();
  });

  afterEach(() => {
    // Clear any intervals
    if ((service as any).l1CleanupInterval) {
      clearInterval((service as any).l1CleanupInterval);
    }
  });

  // ─── getQuotaCheck ──────────────────────────────────────────

  describe("getQuotaCheck", () => {
    it("should return L1 cached value on L1 hit", async () => {
      const cachedResult = {
        allowed: true,
        remaining: 5,
        limit: 10,
        currentPlan: "plus",
      };

      // Manually set L1 cache
      (service as any).l1Cache.set("billing:quota:company-1:interviews", {
        data: cachedResult,
        expiresAt: Date.now() + 30_000,
      });

      const result = await service.getQuotaCheck("company-1", "interviews");

      expect(result).toEqual(cachedResult);
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it("should check Redis on L1 miss and set L1 on Redis hit", async () => {
      const quotaData = {
        allowed: true,
        remaining: 8,
        limit: 100,
        currentPlan: "plus",
      };
      redisMock.get.mockResolvedValue(JSON.stringify(quotaData));

      const result = await service.getQuotaCheck("company-2", "interviews");

      expect(result).toEqual(quotaData);
      expect(redisMock.get).toHaveBeenCalledWith(
        "billing:quota:company-2:interviews",
      );

      // Verify L1 was set
      const l1Entry = (service as any).l1Cache.get(
        "billing:quota:company-2:interviews",
      );
      expect(l1Entry).toBeDefined();
      expect(l1Entry.data).toEqual(quotaData);
    });

    it("should return null on both L1 and Redis miss", async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getQuotaCheck("company-3", "interviews");

      expect(result).toBeNull();
    });
  });

  // ─── setQuotaCheck ──────────────────────────────────────────

  describe("setQuotaCheck", () => {
    it("should set both L1 and Redis", async () => {
      const quotaResult = {
        allowed: true,
        remaining: 5,
        limit: 10,
        currentPlan: "free",
      };

      await service.setQuotaCheck("company-1", "interviews", quotaResult);

      // Verify L1
      const l1Entry = (service as any).l1Cache.get(
        "billing:quota:company-1:interviews",
      );
      expect(l1Entry.data).toEqual(quotaResult);

      // Verify Redis
      expect(redisMock.setex).toHaveBeenCalledWith(
        "billing:quota:company-1:interviews",
        60,
        JSON.stringify(quotaResult),
      );
    });
  });

  // ─── incrementUsage ─────────────────────────────────────────

  describe("incrementUsage", () => {
    it("should call Redis HINCRBY and invalidate quota key", async () => {
      await service.incrementUsage("company-1", "interviews", 1);

      expect(redisMock.hincrby).toHaveBeenCalledWith(
        expect.stringContaining("billing:usage:company-1:"),
        "interviews",
        1,
      );
      expect(redisMock.del).toHaveBeenCalledWith(
        "billing:quota:company-1:interviews",
      );
    });
  });

  // ─── Subscription cache ─────────────────────────────────────

  describe("getSubscription/setSubscription/invalidateSubscription", () => {
    it("should return cached subscription from L1", async () => {
      const sub = { id: "sub-1", planType: "plus" };
      (service as any).l1Cache.set("billing:subscription:company-1", {
        data: sub,
        expiresAt: Date.now() + 30_000,
      });

      const result = await service.getSubscription("company-1");
      expect(result).toEqual(sub);
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it("should set subscription in both L1 and Redis", async () => {
      const sub = { id: "sub-1", planType: "pro" };
      await service.setSubscription("company-1", sub);

      expect(redisMock.setex).toHaveBeenCalledWith(
        "billing:subscription:company-1",
        300,
        JSON.stringify(sub),
      );

      const l1Entry = (service as any).l1Cache.get(
        "billing:subscription:company-1",
      );
      expect(l1Entry.data).toEqual(sub);
    });

    it("should invalidate subscription from L1 and Redis", async () => {
      (service as any).l1Cache.set("billing:subscription:company-1", {
        data: { id: "sub-1" },
        expiresAt: Date.now() + 30_000,
      });

      await service.invalidateSubscription("company-1");

      expect(
        (service as any).l1Cache.has("billing:subscription:company-1"),
      ).toBe(false);
      expect(redisMock.del).toHaveBeenCalledWith(
        "billing:subscription:company-1",
      );
    });
  });

  // ─── Invoices cache ─────────────────────────────────────────

  describe("getInvoices/setInvoices", () => {
    it("should return cached invoices from Redis on L1 miss", async () => {
      const invoices = [{ id: "inv_1", status: "paid" }];
      redisMock.get.mockResolvedValue(JSON.stringify(invoices));

      const result = await service.getInvoices("cus_123");

      expect(result).toEqual(invoices);
      expect(redisMock.get).toHaveBeenCalledWith("billing:invoices:cus_123");
    });

    it("should set invoices in both L1 and Redis", async () => {
      const invoices = [{ id: "inv_1", status: "paid" }];
      await service.setInvoices("cus_123", invoices);

      expect(redisMock.setex).toHaveBeenCalledWith(
        "billing:invoices:cus_123",
        300,
        JSON.stringify(invoices),
      );
    });
  });

  // ─── L1 cache behavior ─────────────────────────────────────

  describe("L1 cache TTL and eviction", () => {
    it("should return null for expired L1 entries", async () => {
      (service as any).l1Cache.set("billing:quota:company-1:interviews", {
        data: { allowed: true },
        expiresAt: Date.now() - 1000, // expired
      });

      redisMock.get.mockResolvedValue(null);

      const result = await service.getQuotaCheck("company-1", "interviews");

      // L1 expired, Redis miss -> null
      expect(result).toBeNull();
    });

    it("should evict oldest entry when L1 reaches max size", async () => {
      const l1Cache = (service as any).l1Cache as Map<string, any>;
      const maxSize = (service as any).L1_MAX_SIZE;

      // Fill to max
      for (let i = 0; i < maxSize; i++) {
        l1Cache.set(`key-${i}`, {
          data: `value-${i}`,
          expiresAt: Date.now() + 30_000,
        });
      }

      expect(l1Cache.size).toBe(maxSize);

      // Set one more via the service (triggers eviction)
      await service.setQuotaCheck("new-company", "interviews", {
        allowed: true,
        remaining: 1,
        limit: 3,
        currentPlan: "free",
      });

      // Size should still be maxSize (evicted one, added one)
      expect(l1Cache.size).toBe(maxSize);
      // First key should have been evicted
      expect(l1Cache.has("key-0")).toBe(false);
    });

    it("should clean up expired L1 entries during eviction cycle", () => {
      const l1Cache = (service as any).l1Cache as Map<string, any>;

      l1Cache.set("expired-1", {
        data: "old",
        expiresAt: Date.now() - 60_000,
      });
      l1Cache.set("expired-2", {
        data: "old",
        expiresAt: Date.now() - 30_000,
      });
      l1Cache.set("valid-1", {
        data: "fresh",
        expiresAt: Date.now() + 30_000,
      });

      // Trigger eviction manually
      (service as any).evictL1();

      expect(l1Cache.size).toBe(1);
      expect(l1Cache.has("valid-1")).toBe(true);
      expect(l1Cache.has("expired-1")).toBe(false);
      expect(l1Cache.has("expired-2")).toBe(false);
    });
  });

  // ─── Redis error fallback ──────────────────────────────────

  describe("Redis error fallback", () => {
    it("should fall back gracefully when Redis get fails", async () => {
      redisMock.get.mockRejectedValue(new Error("Redis connection refused"));

      const result = await service.getQuotaCheck("company-1", "interviews");

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Redis quota read failed"),
      );
    });

    it("should still set L1 when Redis setex fails", async () => {
      redisMock.setex.mockRejectedValue(new Error("Redis connection refused"));

      await service.setQuotaCheck("company-1", "interviews", {
        allowed: true,
        remaining: 5,
        limit: 10,
        currentPlan: "plus",
      });

      // L1 should still be set
      const l1Entry = (service as any).l1Cache.get(
        "billing:quota:company-1:interviews",
      );
      expect(l1Entry.data).toEqual({
        allowed: true,
        remaining: 5,
        limit: 10,
        currentPlan: "plus",
      });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Redis quota write failed"),
      );
    });
  });
});
