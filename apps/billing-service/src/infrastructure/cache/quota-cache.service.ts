import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { LoggerService } from "../logger/logger.service";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * QuotaCacheService
 * Multi-layer cache: L1 (in-memory Map) → L2 (Redis) → L3 (PostgreSQL)
 *
 * Keys:
 *   billing:usage:{companyId}:{period}     → hash { interviews, analysis }  TTL: end of month
 *   billing:plan:{companyId}               → JSON { planType, limits }       TTL: 5min
 *   billing:quota:{companyId}:{resource}   → JSON { allowed, remaining }     TTL: 60s
 *   billing:invoices:{stripeCustomerId}    → JSON invoice[]                  TTL: 5min
 *   billing:subscription:{companyId}       → JSON subscription              TTL: 5min
 */
@Injectable()
export class QuotaCacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private redisAvailable = true;

  // L1 in-memory cache (survives Redis outages)
  private l1Cache = new Map<string, CacheEntry<any>>();
  private readonly L1_TTL_MS = 30_000; // 30s
  private readonly L1_MAX_SIZE = 1000;
  private l1CleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    const host = this.configService.get("REDIS_HOST", "localhost");
    const port = parseInt(this.configService.get("REDIS_PORT", "6379"), 10);
    const password = this.configService.get("REDIS_PASSWORD");

    this.redis = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 5) return null;
        return Math.min(times * 100, 2000);
      },
    });

    this.redis.on("error", (err) => {
      if (this.redisAvailable) {
        this.logger.error(
          "Redis connection lost — using L1 cache fallback",
          err,
        );
        this.redisAvailable = false;
      }
    });

    this.redis.on("connect", () => {
      if (!this.redisAvailable) {
        this.logger.info("Redis connection restored");
        this.redisAvailable = true;
      }
    });

    // L1 cache cleanup every 60s
    this.l1CleanupInterval = setInterval(() => this.evictL1(), 60_000);
  }

  async onModuleDestroy() {
    clearInterval(this.l1CleanupInterval);
    if (this.redis) {
      await this.redis.quit();
    }
  }

  // ─── Usage ─────────────────────────────────────────────────

  async incrementUsage(
    companyId: string,
    resource: string,
    amount: number = 1,
  ): Promise<void> {
    try {
      const period = this.getCurrentPeriod();
      const key = `billing:usage:${companyId}:${period}`;

      await this.redis.hincrby(key, resource, amount);
      await this.redis.expire(key, this.getEndOfMonthTtl());

      // Invalidate quota cache (L1 + L2)
      this.l1Cache.delete(`billing:quota:${companyId}:${resource}`);
      await this.redis.del(`billing:quota:${companyId}:${resource}`);
    } catch (error) {
      this.logger.warn(`Failed to increment usage in Redis: ${error.message}`);
    }
  }

  // ─── Quota Check (L1 → L2 → null) ─────────────────────────

  async getQuotaCheck(
    companyId: string,
    resource: string,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    currentPlan: string;
  } | null> {
    const cacheKey = `billing:quota:${companyId}:${resource}`;

    // L1 check
    const l1 = this.getL1(cacheKey);
    if (l1) return l1;

    // L2 check (Redis)
    try {
      const data = await this.redis.get(cacheKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.setL1(cacheKey, parsed);
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`Redis quota read failed: ${error.message}`);
    }

    return null;
  }

  async setQuotaCheck(
    companyId: string,
    resource: string,
    result: {
      allowed: boolean;
      remaining: number;
      limit: number;
      currentPlan: string;
    },
  ): Promise<void> {
    const cacheKey = `billing:quota:${companyId}:${resource}`;
    this.setL1(cacheKey, result);

    try {
      await this.redis.setex(cacheKey, 60, JSON.stringify(result));
    } catch (error) {
      this.logger.warn(`Redis quota write failed: ${error.message}`);
    }
  }

  // ─── Subscription Cache (L1 → L2 → null) ──────────────────

  async getSubscription(companyId: string): Promise<any | null> {
    const cacheKey = `billing:subscription:${companyId}`;

    const l1 = this.getL1(cacheKey);
    if (l1) return l1;

    try {
      const data = await this.redis.get(cacheKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.setL1(cacheKey, parsed);
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`Redis subscription read failed: ${error.message}`);
    }
    return null;
  }

  async setSubscription(companyId: string, subscription: any): Promise<void> {
    const cacheKey = `billing:subscription:${companyId}`;
    this.setL1(cacheKey, subscription);

    try {
      await this.redis.setex(cacheKey, 300, JSON.stringify(subscription)); // 5min
    } catch (error) {
      this.logger.warn(`Redis subscription write failed: ${error.message}`);
    }
  }

  async invalidateSubscription(companyId: string): Promise<void> {
    this.l1Cache.delete(`billing:subscription:${companyId}`);
    try {
      await this.redis.del(`billing:subscription:${companyId}`);
    } catch {
      // ignore
    }
  }

  // ─── Invoices Cache ────────────────────────────────────────

  async getInvoices(stripeCustomerId: string): Promise<any[] | null> {
    const cacheKey = `billing:invoices:${stripeCustomerId}`;

    const l1 = this.getL1(cacheKey);
    if (l1) return l1;

    try {
      const data = await this.redis.get(cacheKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.setL1(cacheKey, parsed);
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`Redis invoices read failed: ${error.message}`);
    }
    return null;
  }

  async setInvoices(stripeCustomerId: string, invoices: any[]): Promise<void> {
    const cacheKey = `billing:invoices:${stripeCustomerId}`;
    this.setL1(cacheKey, invoices);

    try {
      await this.redis.setex(cacheKey, 300, JSON.stringify(invoices)); // 5min
    } catch (error) {
      this.logger.warn(`Redis invoices write failed: ${error.message}`);
    }
  }

  // ─── L1 In-Memory Cache ────────────────────────────────────

  private getL1(key: string): any | null {
    const entry = this.l1Cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setL1(key: string, data: any): void {
    if (this.l1Cache.size >= this.L1_MAX_SIZE) {
      // Evict oldest entry
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey) this.l1Cache.delete(firstKey);
    }
    this.l1Cache.set(key, {
      data,
      expiresAt: Date.now() + this.L1_TTL_MS,
    });
  }

  private evictL1(): void {
    const now = Date.now();
    for (const [key, entry] of this.l1Cache) {
      if (entry.expiresAt <= now) {
        this.l1Cache.delete(key);
      }
    }
  }

  // ─── Helpers ───────────────────────────────────────────────

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  private getEndOfMonthTtl(): number {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
  }
}
