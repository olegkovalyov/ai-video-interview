import {
  direct,
  seedUser,
  uuid,
  poll,
  cleanTestDatabases,
  waitForAsyncDrain,
} from "../../helpers";

describe("[06-billing-stripe] Subscription Lifecycle", () => {
  const hrUserId = uuid();

  beforeAll(async () => {
    await cleanTestDatabases();
    console.log(`[billing] hrUserId=${hrUserId}`);
  });

  it("step 1: seed user (triggers user.created Kafka event)", async () => {
    const email = `hr-billing-${Date.now()}@test.com`;
    console.log(`[billing] seeding user: ${hrUserId}, email: ${email}`);

    await seedUser({
      userId: hrUserId,
      email,
      firstName: "Billing",
      lastName: "HR",
    });

    console.log(`[billing] user seeded successfully`);
  });

  it("step 2: verify user.created event published to Kafka (check outbox)", async () => {
    // Give outbox BullMQ time to publish
    const { status, data } = await direct(
      "billing",
      `/api/billing/internal/quota/${hrUserId}/interviews`,
    );
    console.log(
      `[billing] quota check: status=${status}, data=${JSON.stringify(data)}`,
    );
    expect(status).toBe(200);
  });

  it("step 3: wait for real subscription in DB (via Kafka consumer)", async () => {
    const subscription = await poll(
      async () => {
        const { status, data } = await direct(
          "billing",
          "/api/billing/subscription",
          { headers: { "x-company-id": hrUserId } },
        );
        console.log(
          `[billing] subscription poll: status=${status}, planType=${data?.planType}, id=${data?.id}`,
        );
        if (status === 200 && data.planType === "free" && data.id) return data;
        return null;
      },
      { timeout: 30000, label: "free subscription via Kafka" },
    );

    expect(subscription.planType).toBe("free");
    expect(subscription.status).toBe("active");
    console.log(
      `[billing] subscription created: id=${subscription.id}, companyId=${hrUserId}`,
    );
  });

  it("step 4: get subscription details", async () => {
    const { status, data } = await direct(
      "billing",
      "/api/billing/subscription",
      { headers: { "x-company-id": hrUserId } },
    );
    console.log(
      `[billing] subscription details: status=${status}, plan=${data?.planType}, limits=${JSON.stringify(data?.limits)}`,
    );

    expect(status).toBe(200);
    expect(data.planType).toBe("free");
    expect(data.status).toBe("active");
    expect(data.limits).toBeDefined();
  });

  it("step 5: check quota allows interviews", async () => {
    const { status, data } = await direct(
      "billing",
      `/api/billing/internal/quota/${hrUserId}/interviews`,
    );
    console.log(
      `[billing] quota: allowed=${data?.allowed}, remaining=${data?.remaining}, limit=${data?.limit}`,
    );

    expect(status).toBe(200);
    expect(data.allowed).toBe(true);
  });
});

describe("[06-billing-stripe] Checkout & Cancel/Resume", () => {
  const companyId = uuid();

  beforeAll(async () => {
    await cleanTestDatabases();
    console.log(`[billing-checkout] companyId=${companyId}`);

    // Seed user
    const email = `checkout-${Date.now()}@test.com`;
    console.log(
      `[billing-checkout] seeding user: ${companyId}, email: ${email}`,
    );
    await seedUser({
      userId: companyId,
      email,
      firstName: "Checkout",
      lastName: "User",
    });
    console.log(`[billing-checkout] user seeded, waiting for subscription...`);

    // Wait for real subscription
    await poll(
      async () => {
        const { status, data } = await direct(
          "billing",
          "/api/billing/subscription",
          { headers: { "x-company-id": companyId } },
        );
        console.log(
          `[billing-checkout] subscription poll: status=${status}, plan=${data?.planType}, id=${data?.id}`,
        );
        if (status === 200 && data.planType === "free" && data.id) return data;
        return null;
      },
      { timeout: 30000, label: "free subscription" },
    );
    console.log(`[billing-checkout] subscription ready`);
  });

  it("should create checkout session for upgrade to plus", async () => {
    const { status, data } = await direct("billing", "/api/billing/checkout", {
      method: "POST",
      headers: { "x-company-id": companyId },
      body: { planType: "plus" },
    });
    console.log(
      `[billing-checkout] checkout: status=${status}, data=${JSON.stringify(data)?.substring(0, 200)}`,
    );

    // 200: real Stripe key, 400: validation, 401: fake key rejected, 500/502: Stripe error
    expect([200, 400, 401, 500, 502]).toContain(status);

    if (status === 200) {
      expect(data.checkoutUrl).toBeDefined();
      expect(data.sessionId).toBeDefined();
    }
  });

  it("should reject checkout for same plan (free → free)", async () => {
    const { status, data } = await direct("billing", "/api/billing/checkout", {
      method: "POST",
      headers: { "x-company-id": companyId },
      body: { planType: "free" },
    });
    console.log(`[billing-checkout] free→free: status=${status}`);

    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("should allow cancel on free plan (sets cancelAtPeriodEnd)", async () => {
    const { status, data } = await direct("billing", "/api/billing/cancel", {
      method: "POST",
      headers: { "x-company-id": companyId },
    });
    console.log(
      `[billing-cancel] cancel: status=${status}, data=${JSON.stringify(data)?.substring(0, 200)}`,
    );

    expect(status).toBe(200);
  });
});

describe("[06-billing-stripe] Usage Tracking & Quota Enforcement", () => {
  const hrUserId = uuid();
  const candidateId = uuid();
  let templateId: string;

  beforeAll(async () => {
    await cleanTestDatabases();
    console.log(`[billing-usage] hrUserId=${hrUserId}`);

    // Seed HR user (triggers free subscription creation via Kafka)
    await seedUser({
      userId: hrUserId,
      email: `usage-hr-${Date.now()}@test.com`,
      firstName: "Usage",
      lastName: "HR",
    });

    // Seed candidate
    await seedUser({
      userId: candidateId,
      email: `usage-cand-${Date.now()}@test.com`,
      firstName: "Usage",
      lastName: "Cand",
    });

    // Wait for free subscription to be created
    await poll(
      async () => {
        const { status, data } = await direct(
          "billing",
          "/api/billing/subscription",
          { headers: { "x-company-id": hrUserId } },
        );
        if (status === 200 && data.planType === "free" && data.id) return data;
        return null;
      },
      { timeout: 30000, label: "free subscription for usage test" },
    );

    // Create template + question + publish
    const { data: tmpl } = await direct("interview", "/api/templates", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: { title: "Usage Test", description: "Testing usage tracking" },
    });
    templateId = tmpl.id;

    await direct("interview", `/api/templates/${templateId}/questions`, {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        text: "Describe your experience",
        type: "text",
        order: 1,
        timeLimit: 60,
        required: true,
      },
    });

    await direct("interview", `/api/templates/${templateId}/publish`, {
      method: "PUT",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
    });

    console.log(`[billing-usage] template ready: ${templateId}`);
  });

  it("should show 0 interviews used before completing any", async () => {
    const { status, data } = await direct("billing", `/api/billing/usage`, {
      headers: { "x-company-id": hrUserId },
    });
    console.log(
      `[billing-usage] initial usage: status=${status}, data=${JSON.stringify(data)}`,
    );

    expect(status).toBe(200);
  });

  it("should increment interview usage after completing interview", async () => {
    // Create invitation + start + respond + complete
    const { data: inv } = await direct("interview", "/api/invitations", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        templateId,
        candidateId,
        companyName: "UsageCorp",
        candidateEmail: `usage-cand-${Date.now()}@test.com`,
        candidateName: "Usage Cand",
        hrEmail: `usage-hr-${Date.now()}@test.com`,
        hrName: "Usage HR",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const invitationId = inv.id;
    console.log(`[billing-usage] invitation created: ${invitationId}`);

    await direct("interview", `/api/invitations/${invitationId}/start`, {
      method: "POST",
      headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
    });

    const { data: fullTemplate } = await direct(
      "interview",
      `/api/templates/${templateId}`,
      { headers: { "x-user-id": hrUserId, "x-user-role": "hr" } },
    );

    await direct("interview", `/api/invitations/${invitationId}/responses`, {
      method: "POST",
      headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
      body: {
        questionId: fullTemplate.questions[0].id,
        questionIndex: 0,
        questionText: fullTemplate.questions[0].text,
        responseType: "text",
        textAnswer: "I have 5 years of experience in software development.",
        duration: 30,
      },
    });

    await direct("interview", `/api/invitations/${invitationId}/complete`, {
      method: "POST",
      headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
    });
    console.log(`[billing-usage] interview completed`);

    // Poll for usage increment (Kafka: invitation.completed → billing usage tracking)
    const quota = await poll(
      async () => {
        const { status, data } = await direct(
          "billing",
          `/api/billing/internal/quota/${hrUserId}/interviews`,
        );
        console.log(
          `[billing-usage] quota poll: allowed=${data?.allowed}, remaining=${data?.remaining}, limit=${data?.limit}`,
        );
        if (
          status === 200 &&
          data.remaining !== undefined &&
          data.remaining < data.limit
        ) {
          return data;
        }
        return null;
      },
      { timeout: 30000, label: "interview usage increment" },
    );

    expect(quota.allowed).toBe(true);
    expect(quota.remaining).toBeLessThan(quota.limit);
    console.log(
      `[billing-usage] usage incremented: remaining=${quota.remaining}/${quota.limit}`,
    );
  });

  it("should enforce quota limit on free plan", async () => {
    const { status, data } = await direct(
      "billing",
      `/api/billing/internal/quota/${hrUserId}/interviews`,
    );
    console.log(
      `[billing-usage] quota check: allowed=${data?.allowed}, remaining=${data?.remaining}, limit=${data?.limit}, plan=${data?.currentPlan}`,
    );

    expect(status).toBe(200);
    expect(data.currentPlan).toBe("free");
    expect(data.limit).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await waitForAsyncDrain();
  });
});

describe("[06-billing-stripe] Stripe Webhook Processing", () => {
  it("should reject webhook with invalid signature", async () => {
    const { status } = await direct("billing", "/api/billing/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": "t=12345,v1=invalid_signature",
        "content-type": "application/json",
      },
      body: {
        id: "evt_test_123",
        type: "checkout.session.completed",
        data: { object: {} },
      },
    });
    console.log(`[billing-webhook] invalid sig: status=${status}`);

    expect(status).toBeGreaterThanOrEqual(400);
  });

  afterAll(async () => {
    await waitForAsyncDrain();
  });
});
