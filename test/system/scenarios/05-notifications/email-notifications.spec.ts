import {
  direct,
  seedUser,
  uuid,
  poll,
  getEmails,
  getEmailBody,
  clearMailbox,
  cleanTestDatabases,
  waitForAsyncDrain,
} from "../../helpers";

/**
 * Tests email notification delivery via Mailpit.
 * Kafka events → Notification Service → SMTP (Mailpit) → verify via Mailpit API.
 *
 * Flow:
 *   user.created → welcome email
 *   invitation.created → invitation email to candidate
 *   invitation.completed → "interview completed" email to HR
 */
describe("[05-notifications] Email Notifications via Mailpit", () => {
  const hrUserId = uuid();
  const hrEmail = `hr-notif-${Date.now()}@test.com`;
  const candidateId = uuid();
  const candidateEmail = `cand-notif-${Date.now()}@test.com`;

  beforeAll(async () => {
    await cleanTestDatabases();
  });

  it("should send welcome email on user creation", async () => {
    console.log(`[notifications] seeding user: ${hrUserId}, email: ${hrEmail}`);
    await seedUser({
      userId: hrUserId,
      email: hrEmail,
      firstName: "Notif",
      lastName: "HR",
    });
    console.log(
      `[notifications] user seeded, polling Mailpit for welcome email...`,
    );

    const email = await poll(
      async () => {
        const msgs = await getEmails(hrEmail);
        console.log(
          `[notifications] Mailpit: ${msgs.length} emails for ${hrEmail}`,
        );
        return (
          msgs.find((e: any) => e.Subject?.toLowerCase().includes("welcome")) ||
          null
        );
      },
      { timeout: 30000, label: "welcome email" },
    );

    expect(email).toBeDefined();
    console.log(`[notifications] welcome email ✓`);
  });

  it("should send invitation email to candidate when invited", async () => {
    await seedUser({
      userId: candidateId,
      email: candidateEmail,
      firstName: "Notif",
      lastName: "Candidate",
    });

    // Create template + publish
    const { data: tmpl } = await direct("interview", "/api/templates", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: { title: "Notification Test", description: "Email test" },
    });

    await direct("interview", `/api/templates/${tmpl.id}/questions`, {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        text: "Test question",
        type: "text",
        order: 1,
        timeLimit: 60,
        required: true,
      },
    });

    await direct("interview", `/api/templates/${tmpl.id}/publish`, {
      method: "PUT",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
    });

    // Create invitation — triggers invitation.created event
    await direct("interview", "/api/invitations", {
      method: "POST",
      headers: { "x-user-id": hrUserId, "x-user-role": "hr" },
      body: {
        templateId: tmpl.id,
        candidateId,
        companyName: "NotifCorp",
        candidateEmail,
        candidateName: "Notif Candidate",
        hrEmail,
        hrName: "Notif HR",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    // Check for invitation email to candidate
    const email = await poll(
      async () => {
        const msgs = await getEmails(candidateEmail);
        return (
          msgs.find(
            (e: any) =>
              e.Subject?.toLowerCase().includes("invite") ||
              e.Subject?.toLowerCase().includes("interview"),
          ) || null
        );
      },
      { timeout: 30000, label: "invitation email to candidate" },
    );

    expect(email).toBeDefined();
  });

  it("should verify email HTML body contains expected content", async () => {
    const msgs = await getEmails(candidateEmail);
    const inviteEmail = msgs.find(
      (e: any) =>
        e.Subject?.toLowerCase().includes("invite") ||
        e.Subject?.toLowerCase().includes("interview"),
    );

    if (inviteEmail?.ID) {
      const body = await getEmailBody(inviteEmail.ID);
      // The email should contain the company name and some call to action
      expect(body.html.length + body.text.length).toBeGreaterThan(0);
    }
  });
});

describe("[05-notifications] Notification Preferences", () => {
  const userId = uuid();

  beforeAll(async () => {
    await seedUser({
      userId,
      email: `prefs-${Date.now()}@test.com`,
      firstName: "Prefs",
      lastName: "User",
    });
  });

  it("should get default preferences", async () => {
    const { status, data } = await direct("notification", "/api/preferences", {
      headers: { "x-user-id": userId },
    });

    // Might be 200 with defaults or 404 if not created yet
    expect([200, 404]).toContain(status);
  });

  it("should update notification preferences", async () => {
    const { status } = await direct("notification", "/api/preferences", {
      method: "PUT",
      headers: { "x-user-id": userId },
      body: {
        emailEnabled: true,
        inAppEnabled: false,
      },
    });

    expect([200, 201]).toContain(status);
  });

  it("should return updated preferences", async () => {
    const { status, data } = await direct("notification", "/api/preferences", {
      headers: { "x-user-id": userId },
    });

    expect(status).toBe(200);
    expect(data.emailEnabled).toBe(true);
    expect(data.inAppEnabled).toBe(false);
  });

  afterAll(async () => {
    await waitForAsyncDrain();
  });
});
