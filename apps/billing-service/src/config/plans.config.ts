export const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    limits: { interviewsPerMonth: 3, maxTemplates: 5, maxTeamMembers: 1 },
    features: ["basic_analysis"],
  },
  plus: {
    name: "Plus",
    priceMonthly: 2900, // cents
    limits: { interviewsPerMonth: 100, maxTemplates: 50, maxTeamMembers: 5 },
    features: ["full_analysis", "pdf_export", "email_support"],
  },
  pro: {
    name: "Pro",
    priceMonthly: 9900,
    limits: { interviewsPerMonth: -1, maxTemplates: -1, maxTeamMembers: -1 }, // unlimited
    features: [
      "full_analysis",
      "pdf_export",
      "csv_export",
      "api_access",
      "webhooks",
      "custom_branding",
      "priority_support",
    ],
  },
} as const;

export type PlanConfig = typeof PLANS;
