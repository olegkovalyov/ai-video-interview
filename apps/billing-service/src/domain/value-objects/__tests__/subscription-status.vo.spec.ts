import { SubscriptionStatus } from "../subscription-status.vo";

describe("SubscriptionStatus Value Object", () => {
  describe("Creation", () => {
    it('should create from valid string "active"', () => {
      const status = SubscriptionStatus.create("active");
      expect(status.value).toBe("active");
    });

    it('should create from valid string "past_due"', () => {
      const status = SubscriptionStatus.create("past_due");
      expect(status.value).toBe("past_due");
    });

    it('should create from valid string "canceled"', () => {
      const status = SubscriptionStatus.create("canceled");
      expect(status.value).toBe("canceled");
    });

    it('should create from valid string "trialing"', () => {
      const status = SubscriptionStatus.create("trialing");
      expect(status.value).toBe("trialing");
    });

    it("should throw error for invalid status", () => {
      expect(() => SubscriptionStatus.create("suspended")).toThrow(
        "Invalid subscription status: suspended. Must be one of: active, past_due, canceled, trialing",
      );
    });

    it("should throw error for empty string", () => {
      expect(() => SubscriptionStatus.create("")).toThrow(
        "Invalid subscription status",
      );
    });
  });

  describe("Factory Methods", () => {
    it("should create active status", () => {
      const status = SubscriptionStatus.active();
      expect(status.value).toBe("active");
    });

    it("should create pastDue status", () => {
      const status = SubscriptionStatus.pastDue();
      expect(status.value).toBe("past_due");
    });

    it("should create canceled status", () => {
      const status = SubscriptionStatus.canceled();
      expect(status.value).toBe("canceled");
    });

    it("should create trialing status", () => {
      const status = SubscriptionStatus.trialing();
      expect(status.value).toBe("trialing");
    });
  });

  describe("Status Checking Methods", () => {
    it("should correctly identify active status", () => {
      const status = SubscriptionStatus.active();
      expect(status.isActive()).toBe(true);
      expect(status.isPastDue()).toBe(false);
      expect(status.isCanceled()).toBe(false);
      expect(status.isTrialing()).toBe(false);
    });

    it("should correctly identify past_due status", () => {
      const status = SubscriptionStatus.pastDue();
      expect(status.isActive()).toBe(false);
      expect(status.isPastDue()).toBe(true);
      expect(status.isCanceled()).toBe(false);
      expect(status.isTrialing()).toBe(false);
    });

    it("should correctly identify canceled status", () => {
      const status = SubscriptionStatus.canceled();
      expect(status.isActive()).toBe(false);
      expect(status.isPastDue()).toBe(false);
      expect(status.isCanceled()).toBe(true);
      expect(status.isTrialing()).toBe(false);
    });

    it("should correctly identify trialing status", () => {
      const status = SubscriptionStatus.trialing();
      expect(status.isActive()).toBe(false);
      expect(status.isPastDue()).toBe(false);
      expect(status.isCanceled()).toBe(false);
      expect(status.isTrialing()).toBe(true);
    });
  });

  describe("Business Rules - isUsable()", () => {
    it("should be usable when active", () => {
      expect(SubscriptionStatus.active().isUsable()).toBe(true);
    });

    it("should be usable when trialing", () => {
      expect(SubscriptionStatus.trialing().isUsable()).toBe(true);
    });

    it("should be usable when past_due (grace period)", () => {
      expect(SubscriptionStatus.pastDue().isUsable()).toBe(true);
    });

    it("should NOT be usable when canceled", () => {
      expect(SubscriptionStatus.canceled().isUsable()).toBe(false);
    });
  });

  describe("Business Rules - canUpgrade()", () => {
    it("should allow upgrade when active", () => {
      expect(SubscriptionStatus.active().canUpgrade()).toBe(true);
    });

    it("should allow upgrade when trialing", () => {
      expect(SubscriptionStatus.trialing().canUpgrade()).toBe(true);
    });

    it("should NOT allow upgrade when past_due", () => {
      expect(SubscriptionStatus.pastDue().canUpgrade()).toBe(false);
    });

    it("should NOT allow upgrade when canceled", () => {
      expect(SubscriptionStatus.canceled().canUpgrade()).toBe(false);
    });
  });

  describe("Business Rules - canCancel()", () => {
    it("should allow cancel when active", () => {
      expect(SubscriptionStatus.active().canCancel()).toBe(true);
    });

    it("should allow cancel when trialing", () => {
      expect(SubscriptionStatus.trialing().canCancel()).toBe(true);
    });

    it("should allow cancel when past_due", () => {
      expect(SubscriptionStatus.pastDue().canCancel()).toBe(true);
    });

    it("should NOT allow cancel when canceled", () => {
      expect(SubscriptionStatus.canceled().canCancel()).toBe(false);
    });
  });

  describe("Business Rules - canResume()", () => {
    it("should allow resume when active", () => {
      expect(SubscriptionStatus.active().canResume()).toBe(true);
    });

    it("should NOT allow resume when past_due", () => {
      expect(SubscriptionStatus.pastDue().canResume()).toBe(false);
    });

    it("should NOT allow resume when canceled", () => {
      expect(SubscriptionStatus.canceled().canResume()).toBe(false);
    });

    it("should NOT allow resume when trialing", () => {
      expect(SubscriptionStatus.trialing().canResume()).toBe(false);
    });
  });

  describe("Business Rules - canMarkPastDue()", () => {
    it("should allow marking past_due when active", () => {
      expect(SubscriptionStatus.active().canMarkPastDue()).toBe(true);
    });

    it("should allow marking past_due when trialing", () => {
      expect(SubscriptionStatus.trialing().canMarkPastDue()).toBe(true);
    });

    it("should NOT allow marking past_due when already past_due", () => {
      expect(SubscriptionStatus.pastDue().canMarkPastDue()).toBe(false);
    });

    it("should NOT allow marking past_due when canceled", () => {
      expect(SubscriptionStatus.canceled().canMarkPastDue()).toBe(false);
    });
  });

  describe("Business Rules - canMarkCanceled()", () => {
    it("should allow marking canceled when active", () => {
      expect(SubscriptionStatus.active().canMarkCanceled()).toBe(true);
    });

    it("should allow marking canceled when past_due", () => {
      expect(SubscriptionStatus.pastDue().canMarkCanceled()).toBe(true);
    });

    it("should allow marking canceled when trialing", () => {
      expect(SubscriptionStatus.trialing().canMarkCanceled()).toBe(true);
    });

    it("should NOT allow marking canceled when already canceled", () => {
      expect(SubscriptionStatus.canceled().canMarkCanceled()).toBe(false);
    });
  });

  describe("Business Rules - isTerminal()", () => {
    it("should be terminal when canceled", () => {
      expect(SubscriptionStatus.canceled().isTerminal()).toBe(true);
    });

    it("should NOT be terminal when active", () => {
      expect(SubscriptionStatus.active().isTerminal()).toBe(false);
    });

    it("should NOT be terminal when past_due", () => {
      expect(SubscriptionStatus.pastDue().isTerminal()).toBe(false);
    });

    it("should NOT be terminal when trialing", () => {
      expect(SubscriptionStatus.trialing().isTerminal()).toBe(false);
    });
  });

  describe("Value Object Equality", () => {
    it("should be equal when same status", () => {
      const status1 = SubscriptionStatus.active();
      const status2 = SubscriptionStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it("should not be equal when different status", () => {
      const status1 = SubscriptionStatus.active();
      const status2 = SubscriptionStatus.canceled();
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe("Serialization", () => {
    it("should convert to string correctly", () => {
      expect(SubscriptionStatus.active().toString()).toBe("active");
      expect(SubscriptionStatus.pastDue().toString()).toBe("past_due");
      expect(SubscriptionStatus.canceled().toString()).toBe("canceled");
      expect(SubscriptionStatus.trialing().toString()).toBe("trialing");
    });
  });
});
