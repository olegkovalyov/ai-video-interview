import { SYSTEM_CONFIG } from "./config";

const GW = SYSTEM_CONFIG.gateway;
const MAILPIT = SYSTEM_CONFIG.mailpitApi;
const SERVICES = {
  user: "http://localhost:9002",
  interview: "http://localhost:9003",
  analysis: "http://localhost:9005",
  billing: "http://localhost:9007",
  notification: "http://localhost:9006",
};

// ─── HTTP helpers ────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function gw(
  path: string,
  options: RequestOptions & {
    userId?: string;
    role?: string;
    companyId?: string;
  } = {},
): Promise<{ status: number; data: any; headers: Headers }> {
  const { method = "GET", body, userId, role = "hr", companyId } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-internal-token": "test-internal-token",
    ...(userId && { "x-user-id": userId }),
    ...(role && { "x-user-role": role }),
    ...(companyId && { "x-company-id": companyId }),
    ...options.headers,
  };

  const res = await fetch(`${GW}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data, headers: res.headers };
}

// ─── Direct service call (bypass gateway, for seeding) ───────

export async function direct(
  service: keyof typeof SERVICES,
  path: string,
  options: RequestOptions = {},
): Promise<{ status: number; data: any }> {
  const { method = "GET", body } = options;
  const baseUrl = SERVICES[service];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-internal-token": "test-internal-token",
    "x-internal-request": "true",
    "x-user-id": "system",
    "x-user-role": "admin",
    ...options.headers,
  };

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// ─── Seed helpers (direct to services) ───────────────────────

export async function seedUser(data: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  externalAuthId?: string;
}): Promise<string> {
  const { status, data: result } = await direct("user", "/users", {
    method: "POST",
    body: {
      userId: data.userId,
      externalAuthId: data.externalAuthId || `kc-${data.userId}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    },
  });
  if (status >= 400)
    throw new Error(`seedUser failed (${status}): ${JSON.stringify(result)}`);
  return data.userId;
}

// ─── Polling helper ──────────────────────────────────────────

export async function poll<T>(
  fn: () => Promise<T | null>,
  options: { timeout?: number; interval?: number; label?: string } = {},
): Promise<T> {
  const timeout = options.timeout || SYSTEM_CONFIG.timeouts.asyncEvent;
  const interval = options.interval || SYSTEM_CONFIG.timeouts.asyncPoll;
  const label = options.label || "poll";
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await fn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`${label}: timed out after ${timeout}ms`);
}

// ─── Mailpit helpers ─────────────────────────────────────────

export async function getEmails(to?: string): Promise<any[]> {
  const query = to ? `?query=to:${to}` : "";
  const res = await fetch(`${MAILPIT}/messages${query}`);
  const data = await res.json();
  return data.messages || [];
}

export async function getEmailBody(
  messageId: string,
): Promise<{ html: string; text: string }> {
  const res = await fetch(`${MAILPIT}/message/${messageId}`);
  const data = await res.json();
  return { html: data.HTML || "", text: data.Text || "" };
}

export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILPIT}/messages`, { method: "DELETE" });
}

// ─── DB cleanup ──────────────────────────────────────────────

export async function cleanTestDatabases(): Promise<void> {
  const { Client } = await import("pg");

  const databases = [
    "ai_video_interview_user_test",
    "ai_video_interview_interview_test",
    "ai_video_interview_analysis_test",
    "ai_video_interview_billing_test",
    "ai_video_interview_notification_test",
  ];

  for (const dbName of databases) {
    const client = new Client({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "postgres",
      database: dbName,
    });

    try {
      await client.connect();

      // Get all tables except migrations
      const { rows } = await client.query(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename != 'migrations'
      `);

      if (rows.length > 0) {
        const tables = rows.map((r: any) => `"${r.tablename}"`).join(", ");
        await client.query(`TRUNCATE ${tables} CASCADE`);
      }
    } catch {
      // DB might not have tables yet
    } finally {
      await client.end();
    }
  }

  // Clear Mailpit
  await clearMailbox().catch(() => {});
}

// ─── UUID helper ─────────────────────────────────────────────

export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
