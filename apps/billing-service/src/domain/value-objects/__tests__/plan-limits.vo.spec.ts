import { PlanLimits } from "../plan-limits.vo";

describe("PlanLimits Value Object", () => {
  describe("Creation", () => {
    it("should create with specific limits", () => {
      const limits = PlanLimits.create(100, 50, 5);

      expect(limits.interviewsPerMonth).toBe(100);
      expect(limits.maxTemplates).toBe(50);
      expect(limits.maxTeamMembers).toBe(5);
    });

    it("should create with unlimited values (-1)", () => {
      const limits = PlanLimits.create(-1, -1, -1);

      expect(limits.interviewsPerMonth).toBe(-1);
      expect(limits.maxTemplates).toBe(-1);
      expect(limits.maxTeamMembers).toBe(-1);
    });

    it("should create with mixed limits", () => {
      const limits = PlanLimits.create(3, 5, 1);

      expect(limits.interviewsPerMonth).toBe(3);
      expect(limits.maxTemplates).toBe(5);
      expect(limits.maxTeamMembers).toBe(1);
    });
  });

  describe("isUnlimited checks", () => {
    it("should report unlimited interviews when -1", () => {
      const limits = PlanLimits.create(-1, 50, 5);

      expect(limits.isUnlimitedInterviews()).toBe(true);
      expect(limits.isUnlimitedTemplates()).toBe(false);
      expect(limits.isUnlimitedTeamMembers()).toBe(false);
    });

    it("should report unlimited templates when -1", () => {
      const limits = PlanLimits.create(100, -1, 5);

      expect(limits.isUnlimitedInterviews()).toBe(false);
      expect(limits.isUnlimitedTemplates()).toBe(true);
      expect(limits.isUnlimitedTeamMembers()).toBe(false);
    });

    it("should report unlimited team members when -1", () => {
      const limits = PlanLimits.create(100, 50, -1);

      expect(limits.isUnlimitedInterviews()).toBe(false);
      expect(limits.isUnlimitedTemplates()).toBe(false);
      expect(limits.isUnlimitedTeamMembers()).toBe(true);
    });

    it("should report all unlimited when all -1", () => {
      const limits = PlanLimits.create(-1, -1, -1);

      expect(limits.isUnlimited()).toBe(true);
    });

    it("should NOT report all unlimited when any is limited", () => {
      const limits = PlanLimits.create(-1, 50, -1);

      expect(limits.isUnlimited()).toBe(false);
    });

    it("should NOT report unlimited for non-negative values", () => {
      const limits = PlanLimits.create(3, 5, 1);

      expect(limits.isUnlimitedInterviews()).toBe(false);
      expect(limits.isUnlimitedTemplates()).toBe(false);
      expect(limits.isUnlimitedTeamMembers()).toBe(false);
      expect(limits.isUnlimited()).toBe(false);
    });
  });

  describe("isWithinLimit()", () => {
    const freeLimits = PlanLimits.create(3, 5, 1);
    const unlimitedLimits = PlanLimits.create(-1, -1, -1);

    it("should return true when interviews usage is below limit", () => {
      expect(freeLimits.isWithinLimit("interviews", 0)).toBe(true);
      expect(freeLimits.isWithinLimit("interviews", 1)).toBe(true);
      expect(freeLimits.isWithinLimit("interviews", 2)).toBe(true);
    });

    it("should return false when interviews usage is at limit", () => {
      expect(freeLimits.isWithinLimit("interviews", 3)).toBe(false);
    });

    it("should return false when interviews usage exceeds limit", () => {
      expect(freeLimits.isWithinLimit("interviews", 10)).toBe(false);
    });

    it("should return true when templates usage is below limit", () => {
      expect(freeLimits.isWithinLimit("templates", 4)).toBe(true);
    });

    it("should return false when templates usage is at limit", () => {
      expect(freeLimits.isWithinLimit("templates", 5)).toBe(false);
    });

    it("should return true when teamMembers usage is below limit", () => {
      expect(freeLimits.isWithinLimit("teamMembers", 0)).toBe(true);
    });

    it("should return false when teamMembers usage is at limit", () => {
      expect(freeLimits.isWithinLimit("teamMembers", 1)).toBe(false);
    });

    it("should always return true for unlimited interviews", () => {
      expect(unlimitedLimits.isWithinLimit("interviews", 0)).toBe(true);
      expect(unlimitedLimits.isWithinLimit("interviews", 999999)).toBe(true);
    });

    it("should always return true for unlimited templates", () => {
      expect(unlimitedLimits.isWithinLimit("templates", 999999)).toBe(true);
    });

    it("should always return true for unlimited teamMembers", () => {
      expect(unlimitedLimits.isWithinLimit("teamMembers", 999999)).toBe(true);
    });
  });

  describe("toJSON()", () => {
    it("should serialize to plain object", () => {
      const limits = PlanLimits.create(100, 50, 5);
      const json = limits.toJSON();

      expect(json).toEqual({
        interviewsPerMonth: 100,
        maxTemplates: 50,
        maxTeamMembers: 5,
      });
    });
  });

  describe("Value Object Equality", () => {
    it("should be equal when same limits", () => {
      const limits1 = PlanLimits.create(100, 50, 5);
      const limits2 = PlanLimits.create(100, 50, 5);
      expect(limits1.equals(limits2)).toBe(true);
    });

    it("should not be equal when different limits", () => {
      const limits1 = PlanLimits.create(100, 50, 5);
      const limits2 = PlanLimits.create(3, 5, 1);
      expect(limits1.equals(limits2)).toBe(false);
    });
  });
});
