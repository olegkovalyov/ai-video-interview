import { gw, direct, seedUser, uuid, cleanTestDatabases } from "../helpers";

describe("Interview Template & Invitation Flow", () => {
  const hrUserId = uuid();
  const candidateUserId = uuid();
  let templateId: string;
  let invitationId: string;

  beforeAll(async () => {
    await cleanTestDatabases();
    await seedUser({
      userId: hrUserId,
      email: `hr-${Date.now()}@test.com`,
      firstName: "HR",
      lastName: "Manager",
    });
    await seedUser({
      userId: candidateUserId,
      email: `cand-${Date.now()}@test.com`,
      firstName: "Candidate",
      lastName: "Smith",
    });
  });

  // ─── Template CRUD (direct to interview-service) ──────────

  it("should create a template", async () => {
    const { status, data } = await direct("interview", "/api/templates", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        title: "Frontend Developer Interview",
        description: "Technical interview for frontend",
      },
    });

    expect(status).toBe(201);
    expect(data.id).toBeDefined();
    templateId = data.id;
  });

  it("should add questions to template", async () => {
    const questions = [
      {
        text: "What is React?",
        type: "text",
        order: 1,
        timeLimit: 120,
        required: true,
      },
      {
        text: "Explain CSS Grid",
        type: "text",
        order: 2,
        timeLimit: 120,
        required: true,
      },
      {
        text: "What is TypeScript?",
        type: "text",
        order: 3,
        timeLimit: 120,
        required: true,
      },
    ];

    for (const q of questions) {
      const { status } = await direct(
        "interview",
        `/api/templates/${templateId}/questions`,
        {
          method: "POST",
          headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
          body: q,
        },
      );
      expect(status).toBe(201);
    }
  });

  it("should publish template", async () => {
    const { status } = await direct(
      "interview",
      `/api/templates/${templateId}/publish`,
      {
        method: "PUT",
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      },
    );
    expect(status).toBe(200);
  });

  // ─── Template via Gateway ─────────────────────────────────

  it("should get template via gateway", async () => {
    const { status, data } = await gw(`/api/templates/${templateId}`, {
      userId: hrUserId,
      role: "hr",
    });

    expect(status).toBe(200);
    expect(data.status).toBe("active");
    expect(data.questions).toHaveLength(3);
  });

  it("should reject modifications on published template via gateway", async () => {
    const { status } = await gw(`/api/templates/${templateId}`, {
      method: "PUT",
      userId: hrUserId,
      role: "hr",
      body: { title: "Changed Title" },
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  // ─── Invitation Flow (direct to interview-service) ────────

  it("should create invitation", async () => {
    const { status, data } = await direct("interview", "/api/invitations", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        templateId,
        candidateId: candidateUserId,
        companyName: "TechCorp",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect(status).toBe(201);
    expect(data.id).toBeDefined();
    invitationId = data.id;
  });

  it("should start interview as candidate", async () => {
    const { status } = await direct(
      "interview",
      `/api/invitations/${invitationId}/start`,
      {
        method: "POST",
        headers: { "x-user-id": candidateUserId, "x-user-role": "candidate" },
      },
    );
    expect(status).toBe(200);
  });

  it("should submit responses", async () => {
    const { data: template } = await direct(
      "interview",
      `/api/templates/${templateId}`,
      {
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      },
    );

    for (let i = 0; i < template.questions.length; i++) {
      const question = template.questions[i];
      const { status, data } = await direct(
        "interview",
        `/api/invitations/${invitationId}/responses`,
        {
          method: "POST",
          headers: { "x-user-id": candidateUserId, "x-user-role": "candidate" },
          body: {
            questionId: question.id,
            questionIndex: i,
            questionText: question.text,
            responseType: "text",
            textAnswer: `Answer for: ${question.text}`,
            duration: 30,
          },
        },
      );
      if (status !== 201) console.log("Submit response error:", data);
      expect(status).toBe(201);
    }
  });

  it("should complete interview", async () => {
    const { status } = await direct(
      "interview",
      `/api/invitations/${invitationId}/complete`,
      {
        method: "POST",
        headers: { "x-user-id": candidateUserId, "x-user-role": "candidate" },
      },
    );
    expect(status).toBe(200);
  });

  it("should verify invitation is completed via gateway", async () => {
    const { status, data } = await gw(`/api/invitations/${invitationId}`, {
      userId: hrUserId,
      role: "hr",
    });

    expect(status).toBe(200);
    expect(data.status).toBe("completed");
  });
});
