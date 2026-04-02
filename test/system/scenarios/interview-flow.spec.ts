import { gw, uuid, cleanTestDatabases } from "../helpers";

describe("Interview Template & Invitation Flow", () => {
  const hrUserId = uuid();
  const candidateUserId = uuid();
  let templateId: string;
  let invitationId: string;

  beforeAll(async () => {
    await cleanTestDatabases();

    // Seed HR user
    await gw("/api/users", {
      method: "POST",
      userId: hrUserId,
      role: "admin",
      body: {
        userId: hrUserId,
        externalAuthId: `keycloak-hr-${hrUserId}`,
        email: `hr-${Date.now()}@test.com`,
        firstName: "HR",
        lastName: "Manager",
      },
    });

    // Seed candidate user
    await gw("/api/users", {
      method: "POST",
      userId: candidateUserId,
      role: "admin",
      body: {
        userId: candidateUserId,
        externalAuthId: `keycloak-cand-${candidateUserId}`,
        email: `candidate-${Date.now()}@test.com`,
        firstName: "Candidate",
        lastName: "Smith",
      },
    });
  });

  // ─── Template CRUD ────────────────────────────────────────

  it("should create a template", async () => {
    const { status, data } = await gw("/api/templates", {
      method: "POST",
      userId: hrUserId,
      role: "hr",
      body: {
        title: "Frontend Developer Interview",
        description: "Technical interview for frontend position",
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
        type: "open",
        order: 1,
        timeLimit: 120,
        required: true,
      },
      {
        text: "Explain CSS Grid",
        type: "open",
        order: 2,
        timeLimit: 120,
        required: true,
      },
      {
        text: "What is TypeScript?",
        type: "open",
        order: 3,
        timeLimit: 120,
        required: true,
      },
    ];

    for (const q of questions) {
      const { status } = await gw(`/api/templates/${templateId}/questions`, {
        method: "POST",
        userId: hrUserId,
        role: "hr",
        body: q,
      });
      expect(status).toBe(201);
    }
  });

  it("should publish template", async () => {
    const { status } = await gw(`/api/templates/${templateId}/publish`, {
      method: "POST",
      userId: hrUserId,
      role: "hr",
    });

    expect(status).toBe(200);
  });

  it("should verify template is active", async () => {
    const { status, data } = await gw(`/api/templates/${templateId}`, {
      userId: hrUserId,
      role: "hr",
    });

    expect(status).toBe(200);
    expect(data.status).toBe("active");
    expect(data.questions).toHaveLength(3);
  });

  it("should reject modifications on published template", async () => {
    const { status } = await gw(`/api/templates/${templateId}`, {
      method: "PUT",
      userId: hrUserId,
      role: "hr",
      body: { title: "Changed Title" },
    });

    expect(status).toBeGreaterThanOrEqual(400);
  });

  // ─── Invitation Flow ──────────────────────────────────────

  it("should create invitation for candidate", async () => {
    const { status, data } = await gw("/api/invitations", {
      method: "POST",
      userId: hrUserId,
      role: "hr",
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
    const { status } = await gw(`/api/invitations/${invitationId}/start`, {
      method: "POST",
      userId: candidateUserId,
      role: "candidate",
    });

    expect(status).toBe(200);
  });

  it("should submit responses", async () => {
    // Get template questions for IDs
    const { data: template } = await gw(`/api/templates/${templateId}`, {
      userId: hrUserId,
      role: "hr",
    });

    for (const question of template.questions) {
      const { status } = await gw(
        `/api/invitations/${invitationId}/responses`,
        {
          method: "POST",
          userId: candidateUserId,
          role: "candidate",
          body: {
            questionId: question.id,
            textAnswer: `Answer for: ${question.text}`,
          },
        },
      );
      expect(status).toBe(201);
    }
  });

  it("should complete interview", async () => {
    const { status } = await gw(`/api/invitations/${invitationId}/complete`, {
      method: "POST",
      userId: candidateUserId,
      role: "candidate",
    });

    expect(status).toBe(200);
  });

  it("should verify invitation is completed", async () => {
    const { status, data } = await gw(`/api/invitations/${invitationId}`, {
      userId: hrUserId,
      role: "hr",
    });

    expect(status).toBe(200);
    expect(data.status).toBe("completed");
  });
});
