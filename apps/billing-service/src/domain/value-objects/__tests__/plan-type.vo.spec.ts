import { PlanType } from "../plan-type.vo";

describe("PlanType Value Object", () => {
  describe("Creation", () => {
    it('should create from valid string "free"', () => {
      const planType = PlanType.create("free");
      expect(planType.value).toBe("free");
    });

    it('should create from valid string "plus"', () => {
      const planType = PlanType.create("plus");
      expect(planType.value).toBe("plus");
    });

    it('should create from valid string "pro"', () => {
      const planType = PlanType.create("pro");
      expect(planType.value).toBe("pro");
    });

    it("should throw error for invalid plan type", () => {
      expect(() => PlanType.create("enterprise")).toThrow(
        "Invalid plan type: enterprise. Must be one of: free, plus, pro",
      );
    });

    it("should throw error for empty string", () => {
      expect(() => PlanType.create("")).toThrow("Invalid plan type");
    });
  });

  describe("Factory Methods", () => {
    it("should create free plan", () => {
      const planType = PlanType.free();
      expect(planType.value).toBe("free");
    });

    it("should create plus plan", () => {
      const planType = PlanType.plus();
      expect(planType.value).toBe("plus");
    });

    it("should create pro plan", () => {
      const planType = PlanType.pro();
      expect(planType.value).toBe("pro");
    });
  });

  describe("Type Checking Methods", () => {
    it("should correctly identify free plan", () => {
      const planType = PlanType.free();
      expect(planType.isFree()).toBe(true);
      expect(planType.isPlus()).toBe(false);
      expect(planType.isPro()).toBe(false);
    });

    it("should correctly identify plus plan", () => {
      const planType = PlanType.plus();
      expect(planType.isFree()).toBe(false);
      expect(planType.isPlus()).toBe(true);
      expect(planType.isPro()).toBe(false);
    });

    it("should correctly identify pro plan", () => {
      const planType = PlanType.pro();
      expect(planType.isFree()).toBe(false);
      expect(planType.isPlus()).toBe(false);
      expect(planType.isPro()).toBe(true);
    });
  });

  describe("canUpgradeTo()", () => {
    it("should allow free -> plus", () => {
      expect(PlanType.free().canUpgradeTo(PlanType.plus())).toBe(true);
    });

    it("should allow free -> pro", () => {
      expect(PlanType.free().canUpgradeTo(PlanType.pro())).toBe(true);
    });

    it("should allow plus -> pro", () => {
      expect(PlanType.plus().canUpgradeTo(PlanType.pro())).toBe(true);
    });

    it("should NOT allow pro -> plus (downgrade)", () => {
      expect(PlanType.pro().canUpgradeTo(PlanType.plus())).toBe(false);
    });

    it("should NOT allow pro -> free (downgrade)", () => {
      expect(PlanType.pro().canUpgradeTo(PlanType.free())).toBe(false);
    });

    it("should NOT allow plus -> free (downgrade)", () => {
      expect(PlanType.plus().canUpgradeTo(PlanType.free())).toBe(false);
    });

    it("should NOT allow same plan upgrade (free -> free)", () => {
      expect(PlanType.free().canUpgradeTo(PlanType.free())).toBe(false);
    });

    it("should NOT allow same plan upgrade (plus -> plus)", () => {
      expect(PlanType.plus().canUpgradeTo(PlanType.plus())).toBe(false);
    });

    it("should NOT allow same plan upgrade (pro -> pro)", () => {
      expect(PlanType.pro().canUpgradeTo(PlanType.pro())).toBe(false);
    });
  });

  describe("canDowngradeTo()", () => {
    it("should allow pro -> plus", () => {
      expect(PlanType.pro().canDowngradeTo(PlanType.plus())).toBe(true);
    });

    it("should allow pro -> free", () => {
      expect(PlanType.pro().canDowngradeTo(PlanType.free())).toBe(true);
    });

    it("should allow plus -> free", () => {
      expect(PlanType.plus().canDowngradeTo(PlanType.free())).toBe(true);
    });

    it("should NOT allow free to downgrade", () => {
      expect(PlanType.free().canDowngradeTo(PlanType.free())).toBe(false);
    });
  });

  describe("Value Object Equality", () => {
    it("should be equal when same plan type", () => {
      const plan1 = PlanType.free();
      const plan2 = PlanType.free();
      expect(plan1.equals(plan2)).toBe(true);
    });

    it("should not be equal when different plan type", () => {
      const plan1 = PlanType.free();
      const plan2 = PlanType.plus();
      expect(plan1.equals(plan2)).toBe(false);
    });
  });

  describe("Serialization", () => {
    it("should convert to string correctly", () => {
      expect(PlanType.free().toString()).toBe("free");
      expect(PlanType.plus().toString()).toBe("plus");
      expect(PlanType.pro().toString()).toBe("pro");
    });
  });
});
