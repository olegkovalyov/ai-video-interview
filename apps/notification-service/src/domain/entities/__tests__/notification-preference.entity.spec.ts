import { NotificationPreference } from "../notification-preference.entity";

describe("NotificationPreference Entity", () => {
  describe("create()", () => {
    it("should create with defaults (all enabled)", () => {
      const pref = NotificationPreference.create("user-1");

      expect(pref.userId).toBe("user-1");
      expect(pref.emailEnabled).toBe(true);
      expect(pref.inAppEnabled).toBe(true);
      expect(pref.subscriptions).toEqual({});
      expect(pref.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("isSubscribed()", () => {
    it("should return true for types not explicitly set (default behavior)", () => {
      const pref = NotificationPreference.create("user-1");
      expect(pref.isSubscribed("welcome")).toBe(true);
      expect(pref.isSubscribed("analysis_ready")).toBe(true);
    });

    it("should return false for explicitly disabled types", () => {
      const pref = NotificationPreference.create("user-1");
      pref.updateSubscription("weekly_digest", false);
      expect(pref.isSubscribed("weekly_digest")).toBe(false);
    });
  });

  describe("toggleEmail()", () => {
    it("should toggle email enabled off and on", () => {
      const pref = NotificationPreference.create("user-1");
      expect(pref.emailEnabled).toBe(true);

      pref.toggleEmail();
      expect(pref.emailEnabled).toBe(false);

      pref.toggleEmail();
      expect(pref.emailEnabled).toBe(true);
    });
  });

  describe("toggleInApp()", () => {
    it("should toggle in-app enabled off and on", () => {
      const pref = NotificationPreference.create("user-1");
      expect(pref.inAppEnabled).toBe(true);

      pref.toggleInApp();
      expect(pref.inAppEnabled).toBe(false);

      pref.toggleInApp();
      expect(pref.inAppEnabled).toBe(true);
    });
  });

  describe("updatePreferences()", () => {
    it("should update only specified fields", () => {
      const pref = NotificationPreference.create("user-1");
      pref.updatePreferences({ emailEnabled: false });

      expect(pref.emailEnabled).toBe(false);
      expect(pref.inAppEnabled).toBe(true); // unchanged
    });

    it("should merge subscriptions with existing ones", () => {
      const pref = NotificationPreference.create("user-1");
      pref.updateSubscription("welcome", true);

      pref.updatePreferences({
        subscriptions: { weekly_digest: false },
      });

      expect(pref.subscriptions).toEqual({
        welcome: true,
        weekly_digest: false,
      });
    });
  });
});
