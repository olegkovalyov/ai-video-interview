import {
  direct,
  seedUser,
  uuid,
  poll,
  getEmails,
  cleanTestDatabases,
  waitForAsyncDrain,
} from "../../helpers";

describe("[03-kafka-async] User Created → Billing + Notification", () => {
  const hrUserId = uuid();
  const hrEmail = `hr-kafka-${Date.now()}@test.com`;

  beforeAll(async () => {
    await cleanTestDatabases();
    console.log(`[user-created] hrUserId=${hrUserId}, email=${hrEmail}`);
  });

  it("should seed an HR user (triggers user.created event)", async () => {
    console.log(`[user-created] seeding user...`);
    await seedUser({
      userId: hrUserId,
      email: hrEmail,
      firstName: "Kafka",
      lastName: "HR",
    });
    console.log(`[user-created] user seeded ✓`);
  });

  it("should auto-create free subscription for the company via Kafka", async () => {
    console.log(`[user-created] polling billing for subscription...`);
    const subscription = await poll(
      async () => {
        const { status, data } = await direct(
          "billing",
          "/api/billing/subscription",
          { headers: { "x-company-id": hrUserId } },
        );
        console.log(
          `[user-created] billing subscription: status=${status}, plan=${data?.planType}, id=${data?.id}`,
        );
        if (status === 200 && data.planType === "free" && data.id) return data;
        return null;
      },
      { timeout: 30000, label: "free subscription created via Kafka" },
    );

    expect(subscription.planType).toBe("free");
    expect(subscription.status).toBe("active");
    console.log(`[user-created] subscription created ✓ id=${subscription.id}`);
  });

  it("should send welcome email via Kafka → Notification Service → Mailpit", async () => {
    console.log(
      `[user-created] polling Mailpit for welcome email to ${hrEmail}...`,
    );
    const emails = await poll(
      async () => {
        const msgs = await getEmails(hrEmail);
        console.log(
          `[user-created] Mailpit: ${msgs.length} emails for ${hrEmail}`,
        );
        return msgs.length > 0 ? msgs : null;
      },
      { timeout: 30000, label: "welcome email in Mailpit" },
    );

    expect(emails.length).toBeGreaterThanOrEqual(1);
    const welcome = emails.find(
      (e: any) =>
        e.Subject?.toLowerCase().includes("welcome") ||
        e.snippet?.toLowerCase().includes("welcome"),
    );
    expect(welcome).toBeDefined();
    console.log(
      `[user-created] welcome email received ✓ subject="${welcome?.Subject}"`,
    );
  });

  afterAll(async () => {
    await waitForAsyncDrain({ timeout: 60000 });
  });
});
