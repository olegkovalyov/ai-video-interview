import { ValueObject } from "../base/base.value-object";

interface PlanLimitsProps {
  interviewsPerMonth: number;
  maxTemplates: number;
  maxTeamMembers: number;
}

/**
 * PlanLimits Value Object
 * Defines resource limits for a subscription plan.
 * A value of -1 means unlimited.
 */
export class PlanLimits extends ValueObject<PlanLimitsProps> {
  private constructor(props: PlanLimitsProps) {
    super(props);
  }

  public static create(
    interviewsPerMonth: number,
    maxTemplates: number,
    maxTeamMembers: number,
  ): PlanLimits {
    return new PlanLimits({ interviewsPerMonth, maxTemplates, maxTeamMembers });
  }

  public get interviewsPerMonth(): number {
    return this.props.interviewsPerMonth;
  }

  public get maxTemplates(): number {
    return this.props.maxTemplates;
  }

  public get maxTeamMembers(): number {
    return this.props.maxTeamMembers;
  }

  /**
   * Check if interviews per month is unlimited (-1)
   */
  public isUnlimitedInterviews(): boolean {
    return this.props.interviewsPerMonth === -1;
  }

  /**
   * Check if templates are unlimited (-1)
   */
  public isUnlimitedTemplates(): boolean {
    return this.props.maxTemplates === -1;
  }

  /**
   * Check if team members are unlimited (-1)
   */
  public isUnlimitedTeamMembers(): boolean {
    return this.props.maxTeamMembers === -1;
  }

  /**
   * Check if all limits are unlimited
   */
  public isUnlimited(): boolean {
    return (
      this.isUnlimitedInterviews() &&
      this.isUnlimitedTemplates() &&
      this.isUnlimitedTeamMembers()
    );
  }

  /**
   * Check if a specific resource usage exceeds the limit
   */
  public isWithinLimit(
    resource: "interviews" | "templates" | "teamMembers",
    currentUsage: number,
  ): boolean {
    switch (resource) {
      case "interviews":
        return (
          this.isUnlimitedInterviews() ||
          currentUsage < this.props.interviewsPerMonth
        );
      case "templates":
        return (
          this.isUnlimitedTemplates() || currentUsage < this.props.maxTemplates
        );
      case "teamMembers":
        return (
          this.isUnlimitedTeamMembers() ||
          currentUsage < this.props.maxTeamMembers
        );
    }
  }

  public toJSON(): PlanLimitsProps {
    return { ...this.props };
  }
}
