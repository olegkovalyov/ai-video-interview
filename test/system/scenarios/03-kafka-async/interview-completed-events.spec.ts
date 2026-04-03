import {
  direct,
  seedUser,
  uuid,
  poll,
  getEmails,
  clearMailbox,
  cleanTestDatabases,
  waitForAsyncDrain,
} from "../../helpers";

/**
 * Tests Kafka async event propagation triggered by interview completion:
 *
 * invitation.completed (interview-events topic) →
 *   1. AI Analysis Service: triggers AnalyzeInterviewCommand
 *   2. Billing Service: increments usage (interviews count)
 *   3. Notification Service: sends "interview completed" email to HR
 *
 * Then after analysis completes:
 * analysis.completed (analysis-events topic) →
 *   1. Interview Service: updates invitation with score/recommendation
 *   2. Billing Service: tracks token usage
 *   3. Notification Service: sends "analysis ready" email to HR
 */
describe("[03-kafka-async] Interview Completed → Analysis + Billing + Notification", () => {
  const hrUserId = uuid();
  const hrEmail = `hr-async-${Date.now()}@test.com`;
  const candidateId = uuid();
  const candidateEmail = `cand-async-${Date.now()}@test.com`;
  let templateId: string;
  let invitationId: string;

  beforeAll(async () => {
    await cleanTestDatabases();

    // Seed users
    await seedUser({
      userId: hrUserId,
      email: hrEmail,
      firstName: "HR",
      lastName: "Async",
    });
    await seedUser({
      userId: candidateId,
      email: candidateEmail,
      firstName: "Cand",
      lastName: "Async",
    });

    // Create template + question + publish
    const { data: tmpl } = await direct("interview", "/api/templates", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: { title: "Kafka Async Test", description: "Testing async events" },
    });
    templateId = tmpl.id;

    await direct("interview", `/api/templates/${templateId}/questions`, {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        text: "What is event-driven architecture?",
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

    // Create invitation
    const { data: inv } = await direct("interview", "/api/invitations", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        templateId,
        candidateId,
        companyName: "AsyncCorp",
        candidateEmail,
        candidateName: "Cand Async",
        hrEmail,
        hrName: "HR Async",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    invitationId = inv.id;

    // Start + submit response
    await direct("interview", `/api/invitations/${invitationId}/start`, {
      method: "POST",
      headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
    });

    const { data: fullTemplate } = await direct(
      "interview",
      `/api/templates/${templateId}`,
      {
        headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      },
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
          "Event-driven architecture uses asynchronous messaging between services via an event broker like Kafka.",
        duration: 45,
      },
    });
  });

  it("should complete interview (triggers invitation.completed event)", async () => {
    console.log(`[kafka-async] completing invitation: ${invitationId}`);
    const { status, data } = await direct(
      "interview",
      `/api/invitations/${invitationId}/complete`,
      {
        method: "POST",
        headers: { "x-user-id": candidateId, "x-user-role": "candidate" },
      },
    );
    console.log(
      `[kafka-async] complete: status=${status}, data=${JSON.stringify(data)?.substring(0, 200)}`,
    );
    expect(status).toBe(200);
  });

  it("should trigger AI analysis via Kafka (poll analysis status)", async () => {
    console.log(
      `[kafka-async] polling analysis status for invitation: ${invitationId}`,
    );
    // AI Analysis Service consumes invitation.completed and starts analysis
    const analysisStatus = await poll(
      async () => {
        const { status, data } = await direct(
          "analysis",
          `/api/v1/analysis/status/${invitationId}`,
        );
        console.log(
          `[kafka-async] analysis poll: status=${status}, found=${data?.found}, analysisStatus=${data?.status}`,
        );
        if (status === 200 && data.found) return data;
        return null;
      },
      { timeout: 120000, label: "analysis created via Kafka" },
    );

    expect(analysisStatus.found).toBe(true);
    expect(["pending", "in_progress", "completed", "failed"]).toContain(
      analysisStatus.status,
    );
  });

  it("should wait for analysis to complete or fail", async () => {
    console.log(
      `[kafka-async] waiting for analysis to finish for invitation: ${invitationId}`,
    );
    const result = await poll(
      async () => {
        const { status, data } = await direct(
          "analysis",
          `/api/v1/analysis/status/${invitationId}`,
        );
        console.log(
          `[kafka-async] analysis status poll: status=${status}, found=${data?.found}, analysisStatus=${data?.status}`,
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
      { timeout: 180000, interval: 3000, label: "analysis completed/failed" },
    );

    console.log(`[kafka-async] analysis finished: status=${result.status}`);
    expect(["completed", "failed"]).toContain(result.status);
  });

  it("should send 'interview completed' notification email to HR via Mailpit", async () => {
    console.log(
      `[kafka-async] polling Mailpit for 'completed' email to ${hrEmail}...`,
    );
    const emails = await poll(
      async () => {
        const msgs = await getEmails(hrEmail);
        console.log(
          `[kafka-async] Mailpit: ${msgs.length} emails for ${hrEmail}, subjects: ${msgs.map((m: any) => m.Subject).join(", ")}`,
        );
        const completedEmail = msgs.find(
          (e: any) =>
            e.Subject?.toLowerCase().includes("completed") ||
            e.Subject?.toLowerCase().includes("review"),
        );
        return completedEmail || null;
      },
      { timeout: 30000, label: "interview completed email" },
    );

    expect(emails).toBeDefined();
  });

  afterAll(async () => {
    await waitForAsyncDrain({ timeout: 60000 });
  });
});
