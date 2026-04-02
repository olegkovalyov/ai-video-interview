import { gw, direct, seedUser, uuid, cleanTestDatabases } from "../helpers";

describe("Cross-Service Integration", () => {
  it("should handle downstream service errors gracefully", async () => {
    const { status } = await gw("/api/users/me", { userId: uuid() });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("should propagate correlation-id across services", async () => {
    const correlationId = `test-corr-${Date.now()}`;
    const { headers } = await gw("/api/billing/plans", {
      userId: uuid(),
      role: "admin",
      headers: { "x-correlation-id": correlationId },
    });
    expect(headers.get("x-correlation-id")).toBe(correlationId);
  });

  it("should generate correlation-id when not provided", async () => {
    const { headers } = await gw("/api/billing/plans", {
      userId: uuid(),
      role: "admin",
    });
    const cid = headers.get("x-correlation-id");
    expect(cid).toBeDefined();
    expect(cid!.length).toBeGreaterThan(0);
  });

  it("full journey: seed users → template → invite → respond → complete", async () => {
    await cleanTestDatabases();

    const hrId = uuid();
    const candidateId = uuid();

    // 1. Seed users (direct to user-service)
    await seedUser({
      userId: hrId,
      email: `hr-j-${Date.now()}@test.com`,
      firstName: "Journey",
      lastName: "HR",
    });
    await seedUser({
      userId: candidateId,
      email: `cand-j-${Date.now()}@test.com`,
      firstName: "Journey",
      lastName: "Candidate",
    });

    // 2. Create template (direct to interview-service)
    const { data: tmpl } = await direct("interview", "/api/templates", {
      method: "POST",
      headers: { "x-user-id": hrId, "x-user-role": "hr" },
      body: { title: "Journey Test", description: "E2E test" },
    });
    expect(tmpl.id).toBeDefined();

    // 3. Add question
    await direct("interview", `/api/templates/${tmpl.id}/questions`, {
      method: "POST",
      headers: { "x-user-id": hrId, "x-user-role": "hr" },
      body: {
        text: "Tell me about yourself",
        type: "open",
        order: 1,
        timeLimit: 60,
        required: true,
      },
    });

    // 4. Publish
    const { status: pubStatus } = await direct(
      "interview",
      `/api/templates/${tmpl.id}/publish`,
      {
        method: "POST",
        headers: { "x-user-id": hrId, "x-user-role": "hr" },
      },
    );
    expect(pubStatus).toBe(200);

    // 5. Create invitation
    const { data: inv } = await direct("interview", "/api/invitations", {
      method: "POST",
      headers: { "x-user-id": hrId, "x-user-role": "hr" },
      body: {
        templateId: tmpl.id,
        candidateId,
        companyName: "TestCorp",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(inv.id).toBeDefined();

    // 6. Start interview
    const { status: startStatus } = await direct(
      "interview",
      `/api/invitations/${inv.id}/start`,
      {
        method: "POST",
        headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
      },
    );
    expect(startStatus).toBe(200);

    // 7. Get question IDs
    const { data: fullTemplate } = await direct(
      "interview",
      `/api/templates/${tmpl.id}`,
      {
        headers: { "x-user-id": hrId, "x-user-role": "hr" },
      },
    );

    // 8. Submit response
    const { status: respStatus } = await direct(
      "interview",
      `/api/invitations/${inv.id}/responses`,
      {
        method: "POST",
        headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
        body: {
          questionId: fullTemplate.questions[0].id,
          textAnswer: "I am a software engineer.",
        },
      },
    );
    expect(respStatus).toBe(201);

    // 9. Complete
    const { status: completeStatus } = await direct(
      "interview",
      `/api/invitations/${inv.id}/complete`,
      {
        method: "POST",
        headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
      },
    );
    expect(completeStatus).toBe(200);

    // 10. Verify via gateway
    const { status: gwStatus, data: completed } = await gw(
      `/api/invitations/${inv.id}`,
      {
        userId: hrId,
        role: "hr",
      },
    );
    expect(gwStatus).toBe(200);
    expect(completed.status).toBe("completed");
  });
});
