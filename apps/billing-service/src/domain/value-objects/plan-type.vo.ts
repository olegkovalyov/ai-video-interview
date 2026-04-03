import { ValueObject } from "../base/base.value-object";

export type PlanTypeValue = "free" | "plus" | "pro";

const VALID_PLAN_TYPES: PlanTypeValue[] = ["free", "plus", "pro"];

/**
 * PlanType Value Object
 * Represents the subscription plan tier
 */
export class PlanType extends ValueObject<{ value: PlanTypeValue }> {
  private constructor(value: PlanTypeValue) {
    super({ value });
  }

  public static create(value: string): PlanType {
    if (!VALID_PLAN_TYPES.includes(value as PlanTypeValue)) {
      throw new Error(
        `Invalid plan type: ${value}. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
      );
    }
    return new PlanType(value as PlanTypeValue);
  }

  public static free(): PlanType {
    return new PlanType("free");
  }

  public static plus(): PlanType {
    return new PlanType("plus");
  }

  public static pro(): PlanType {
    return new PlanType("pro");
  }

  public get value(): PlanTypeValue {
    return this.props.value;
  }

  public isFree(): boolean {
    return this.props.value === "free";
  }

  public isPlus(): boolean {
    return this.props.value === "plus";
  }

  public isPro(): boolean {
    return this.props.value === "pro";
  }

  /**
   * Check if upgrade to target plan is valid
   * free -> plus, free -> pro, plus -> pro
   */
  public canUpgradeTo(target: PlanType): boolean {
    if (this.isFree()) return target.isPlus() || target.isPro();
    if (this.isPlus()) return target.isPro();
    return false; // pro cannot upgrade further
  }

  /**
   * Check if downgrade to target plan is valid
   * pro -> plus, pro -> free, plus -> free
   */
  public canDowngradeTo(target: PlanType): boolean {
    if (this.isPro()) return target.isPlus() || target.isFree();
    if (this.isPlus()) return target.isFree();
    return false; // free cannot downgrade
  }

  public toString(): string {
    return this.props.value;
  }
}
