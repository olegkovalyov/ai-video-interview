import { gw, uuid, cleanTestDatabases } from "../helpers";

describe("Cross-Service Integration", () => {
  it("should handle downstream service errors gracefully", async () => {
    // This tests that Gateway returns proper errors when downstream responds with errors
    const { status, data } = await gw("/api/users/me", {
      userId: uuid(), // Non-existent user
    });

    // Should get a proper error response, not a 500
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  it("should propagate correlation-id across services", async () => {
    const correlationId = `test-corr-${Date.now()}`;
    const { headers } = await gw("/api/billing/plans", {
      headers: {
        "x-correlation-id": correlationId,
        "x-internal-token": "test-internal-token",
      },
    });

    // Gateway should return the same correlation ID
    const returnedCorrelationId = headers.get("x-correlation-id");
    expect(returnedCorrelationId).toBe(correlationId);
  });

  it("should generate correlation-id when not provided", async () => {
    const { headers } = await gw("/api/billing/plans", {
      headers: { "x-internal-token": "test-internal-token" },
    });

    const correlationId = headers.get("x-correlation-id");
    expect(correlationId).toBeDefined();
    expect(correlationId).toMatch(/^[0-9a-f-]+$/);
  });

  it("full journey: create user → template → invite → start → respond → complete", async () => {
    await cleanTestDatabases();

    const hrId = uuid();
    const candidateId = uuid();

    // 1. Create HR user
    await gw("/api/users", {
      method: "POST",
      userId: hrId,
      role: "admin",
      body: {
        userId: hrId,
        externalAuthId: `kc-${hrId}`,
        email: `hr-journey-${Date.now()}@test.com`,
        firstName: "Journey",
        lastName: "HR",
      },
    });

    // 2. Create candidate
    await gw("/api/users", {
      method: "POST",
      userId: candidateId,
      role: "admin",
      body: {
        userId: candidateId,
        externalAuthId: `kc-${candidateId}`,
        email: `cand-journey-${Date.now()}@test.com`,
        firstName: "Journey",
        lastName: "Candidate",
      },
    });

    // 3. Create template
    const { data: tmpl } = await gw("/api/templates", {
      method: "POST",
      userId: hrId,
      role: "hr",
      body: { title: "Journey Test", description: "End-to-end test" },
    });
    expect(tmpl.id).toBeDefined();

    // 4. Add question
    await gw(`/api/templates/${tmpl.id}/questions`, {
      method: "POST",
      userId: hrId,
      role: "hr",
      body: {
        text: "Tell me about yourself",
        type: "open",
        order: 1,
        timeLimit: 60,
        required: true,
      },
    });

    // 5. Publish
    const { status: pubStatus } = await gw(
      `/api/templates/${tmpl.id}/publish`,
      {
        method: "POST",
        userId: hrId,
        role: "hr",
      },
    );
    expect(pubStatus).toBe(200);

    // 6. Create invitation
    const { data: inv } = await gw("/api/invitations", {
      method: "POST",
      userId: hrId,
      role: "hr",
      body: {
        templateId: tmpl.id,
        candidateId,
        companyName: "TestCorp",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(inv.id).toBeDefined();

    // 7. Start interview
    const { status: startStatus } = await gw(
      `/api/invitations/${inv.id}/start`,
      {
        method: "POST",
        userId: candidateId,
        role: "candidate",
      },
    );
    expect(startStatus).toBe(200);

    // 8. Get template for question IDs
    const { data: fullTemplate } = await gw(`/api/templates/${tmpl.id}`, {
      userId: hrId,
      role: "hr",
    });

    // 9. Submit response
    const { status: respStatus } = await gw(
      `/api/invitations/${inv.id}/responses`,
      {
        method: "POST",
        userId: candidateId,
        role: "candidate",
        body: {
          questionId: fullTemplate.questions[0].id,
          textAnswer: "I am a software engineer with 5 years of experience.",
        },
      },
    );
    expect(respStatus).toBe(201);

    // 10. Complete
    const { status: completeStatus } = await gw(
      `/api/invitations/${inv.id}/complete`,
      {
        method: "POST",
        userId: candidateId,
        role: "candidate",
      },
    );
    expect(completeStatus).toBe(200);

    // 11. Verify completed
    const { data: completed } = await gw(`/api/invitations/${inv.id}`, {
      userId: hrId,
      role: "hr",
    });
    expect(completed.status).toBe("completed");
  });
});
