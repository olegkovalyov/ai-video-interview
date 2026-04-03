import {
  direct,
  seedUser,
  uuid,
  poll,
  cleanTestDatabases,
  waitForAsyncDrain,
} from "../../helpers";

/**
 * Tests AI Analysis via the sandbox endpoint (no Kafka dependency).
 * Uses /sandbox/analyze for direct LLM testing + /api/v1/analysis/* for status.
 *
 * NOTE: Requires GROQ_API_KEY to be set for real LLM analysis.
 * Without it, tests verify error handling (analysis.failed).
 */
describe("[04-ai-analysis] AI Analysis Scoring", () => {
  beforeAll(async () => {
    await cleanTestDatabases();
  });

  afterAll(async () => {
    await waitForAsyncDrain({ timeout: 60000 });
  });

  it("should check Groq API connectivity via sandbox", async () => {
    const { status, data } = await direct("analysis", "/sandbox/test-groq");

    // With valid API key: status=200, data.status="success"
    // Without API key: 500 or data.status="error"
    if (status === 200 && data.status === "success") {
      expect(data.tokensUsed).toBeGreaterThan(0);
    } else {
      // GROQ_API_KEY not set or Groq unavailable
      console.warn(
        "⚠️  Groq API not available — LLM analysis tests will verify error handling only",
      );
    }
  });

  it("should run analysis via sandbox endpoint", async () => {
    const invitationId = `sandbox-${uuid()}`;

    const { status, data } = await direct("analysis", "/sandbox/analyze", {
      method: "POST",
      body: {
        invitationId,
        candidateId: uuid(),
        templateId: uuid(),
        templateTitle: "System Test Interview",
        companyName: "TestCorp",
        language: "en",
        questions: [
          {
            id: "q-1",
            text: "What is dependency injection and why is it useful?",
            type: "text",
            orderIndex: 0,
          },
        ],
        responses: [
          {
            id: "r-1",
            questionId: "q-1",
            textAnswer:
              "Dependency injection is a design pattern where dependencies are provided to a class rather than created internally. It improves testability by allowing mock injection and promotes loose coupling between components.",
          },
        ],
      },
    });

    if (status >= 200 && status < 300) {
      // LLM analysis succeeded (Groq API key available)
      expect(data.overallScore).toBeGreaterThanOrEqual(0);
      expect(data.overallScore).toBeLessThanOrEqual(100);
      expect(data.recommendation).toMatch(/^(hire|consider|reject)$/);
      expect(data.strengths).toBeDefined();
      expect(data.weaknesses).toBeDefined();
      expect(data.questionAnalyses).toHaveLength(1);
      expect(data.questionAnalyses[0].score).toBeGreaterThanOrEqual(0);
    } else {
      // No API key — verify graceful failure
      expect(status).toBeGreaterThanOrEqual(400);
    }
  });

  describe("Kafka-triggered analysis (end-to-end)", () => {
    const hrUserId = uuid();
    const candidateId = uuid();
    let invitationId: string;

    beforeAll(async () => {
      // Set up a complete interview
      await seedUser({
        userId: hrUserId,
        email: `hr-analysis-${Date.now()}@test.com`,
        firstName: "HR",
        lastName: "Analysis",
      });
      await seedUser({
        userId: candidateId,
        email: `cand-analysis-${Date.now()}@test.com`,
        firstName: "Cand",
        lastName: "Analysis",
      });

      const { data: tmpl } = await direct("interview", "/api/templates", {
        method: "POST",
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
        body: { title: "Analysis E2E Test", description: "Testing AI scoring" },
      });

      await direct("interview", `/api/templates/${tmpl.id}/questions`, {
        method: "POST",
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
        body: {
          text: "Explain SOLID principles in software engineering",
          type: "text",
          order: 1,
          timeLimit: 120,
          required: true,
        },
      });

      await direct("interview", `/api/templates/${tmpl.id}/publish`, {
        method: "PUT",
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      });

      const { data: inv } = await direct("interview", "/api/invitations", {
        method: "POST",
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
        body: {
          templateId: tmpl.id,
          candidateId,
          companyName: "AnalysisCorp",
          candidateEmail: `cand-analysis-${Date.now()}@test.com`,
          candidateName: "Cand Analysis",
          hrEmail: `hr-analysis-${Date.now()}@test.com`,
          hrName: "HR Analysis",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      });
      invitationId = inv.id;

      await direct("interview", `/api/invitations/${invitationId}/start`, {
        method: "POST",
        headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
      });

      const { data: fullTemplate } = await direct(
        "interview",
        `/api/templates/${tmpl.id}`,
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
          textAnswer:
            "SOLID stands for Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. Each principle guides clean OOP design.",
          duration: 60,
        },
      });

      // Complete interview — triggers invitation.completed → analysis via Kafka
      await direct("interview", `/api/invitations/${invitationId}/complete`, {
        method: "POST",
        headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
      });
    });

    it("should create analysis record via Kafka event", async () => {
      console.log(
        `[ai-analysis] polling for analysis record, invitationId=${invitationId}`,
      );
      const result = await poll(
        async () => {
          const { status, data } = await direct(
            "analysis",
            `/api/v1/analysis/status/${invitationId}`,
          );
          console.log(
            `[ai-analysis] status poll: status=${status}, found=${data?.found}, analysisStatus=${data?.status}`,
          );
          return status === 200 && data.found ? data : null;
        },
        { timeout: 120000, label: "analysis record created" },
      );

      expect(result.found).toBe(true);
      expect(result.invitationId).toBe(invitationId);
      console.log(`[ai-analysis] record created ✓ status=${result.status}`);
    });

    it("should complete or fail analysis (depends on GROQ_API_KEY)", async () => {
      const result = await poll(
        async () => {
          const { status, data } = await direct(
            "analysis",
            `/api/v1/analysis/status/${invitationId}`,
          );
          if (
            status === 200 &&
            data.found &&
            (data.status === "completed" || data.status === "failed")
          ) {
            return data;
          }
          return null;
        },
        { timeout: 180000, interval: 3000, label: "analysis finished" },
      );

      expect(["completed", "failed"]).toContain(result.status);

      if (result.status === "completed") {
        // Fetch full results
        const { data: full } = await direct(
          "analysis",
          `/api/v1/analysis/${invitationId}`,
        );
        expect(full.overallScore).toBeGreaterThanOrEqual(0);
        expect(full.recommendation).toMatch(/^(hire|consider|reject)$/);
        expect(full.questionAnalyses.length).toBeGreaterThan(0);
      }
    });

    it("should propagate analysis result back to invitation (via analysis-events)", async () => {
      // Interview Service consumes analysis.completed and updates invitation
      const invitation = await poll(
        async () => {
          const { data } = await direct(
            "interview",
            `/api/invitations/${invitationId}`,
            { headers: { "x-user-id": hrUserId, "x-user-role": "hr" } },
          );
          // API returns analysis as nested object: data.analysis.status
          const analysisStatus = data.analysis?.status;
          if (analysisStatus === "completed" || analysisStatus === "failed") {
            return data;
          }
          return null;
        },
        { timeout: 120000, label: "analysis result propagated to invitation" },
      );

      const analysisStatus = invitation.analysis?.status;
      expect(["completed", "failed"]).toContain(analysisStatus);
      if (analysisStatus === "completed") {
        expect(invitation.analysis.score).toBeGreaterThanOrEqual(0);
        expect(invitation.analysis.recommendation).toBeDefined();
      }
    });
  });
});
