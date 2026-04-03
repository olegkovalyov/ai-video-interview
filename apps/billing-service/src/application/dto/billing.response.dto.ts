import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PlanLimitsDto {
  @ApiProperty({
    example: 100,
    description: "Interviews per month (-1 = unlimited)",
  })
  interviewsPerMonth: number;

  @ApiProperty({ example: 50, description: "Max templates (-1 = unlimited)" })
  maxTemplates: number;

  @ApiProperty({ example: 5, description: "Max team members (-1 = unlimited)" })
  maxTeamMembers: number;
}

export class SubscriptionResponseDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  companyId: string;

  @ApiProperty({ enum: ["free", "plus", "pro"], example: "plus" })
  planType: string;

  @ApiProperty({ example: "Plus" })
  planName: string;

  @ApiProperty({
    enum: ["active", "past_due", "canceled", "trialing"],
    example: "active",
  })
  status: string;

  @ApiProperty({ type: PlanLimitsDto })
  limits: PlanLimitsDto;

  @ApiProperty({ example: ["full_analysis", "pdf_export"] })
  features: string[];

  @ApiPropertyOptional({ example: "cus_xxxxx", nullable: true })
  stripeCustomerId: string | null;

  @ApiProperty({ example: "2026-04-01T00:00:00.000Z" })
  currentPeriodStart: string;

  @ApiProperty({ example: "2026-05-01T00:00:00.000Z" })
  currentPeriodEnd: string;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional({ example: null, nullable: true })
  canceledAt: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  trialEnd: string | null;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  createdAt: string;
}

export class UsageItemDto {
  @ApiProperty({ example: 5 })
  used: number;

  @ApiProperty({ example: 100, description: "-1 = unlimited" })
  limit: number;

  @ApiProperty({ example: 95, description: "-1 = unlimited" })
  remaining: number;
}

export class UsageResponseDto {
  @ApiProperty({ example: "2026-04" })
  period: string;

  @ApiProperty({ enum: ["free", "plus", "pro"] })
  planType: string;

  @ApiProperty({ type: UsageItemDto })
  interviews: UsageItemDto;

  @ApiProperty({ type: UsageItemDto })
  templates: UsageItemDto;

  @ApiProperty({ type: UsageItemDto })
  teamMembers: UsageItemDto;
}

export class QuotaCheckResponseDto {
  @ApiProperty({ example: true })
  allowed: boolean;

  @ApiProperty({ example: 95, description: "-1 = unlimited" })
  remaining: number;

  @ApiProperty({ example: 100, description: "-1 = unlimited" })
  limit: number;

  @ApiProperty({ enum: ["free", "plus", "pro"], example: "plus" })
  currentPlan: string;
}

export class PlanResponseDto {
  @ApiProperty({ enum: ["free", "plus", "pro"], example: "plus" })
  type: string;

  @ApiProperty({ example: "Plus" })
  name: string;

  @ApiProperty({ example: 2900, description: "Price in cents" })
  priceMonthly: number;

  @ApiProperty({ type: PlanLimitsDto })
  limits: PlanLimitsDto;

  @ApiProperty({ example: ["full_analysis", "pdf_export", "email_support"] })
  features: string[];
}

export class CheckoutResponseDto {
  @ApiProperty({ example: "https://checkout.stripe.com/c/pay/cs_test_xxx" })
  checkoutUrl: string;

  @ApiProperty({ example: "cs_test_xxx" })
  sessionId: string;
}

export class PortalResponseDto {
  @ApiProperty({ example: "https://billing.stripe.com/p/session/xxx" })
  portalUrl: string;
}

export class InvoiceResponseDto {
  @ApiProperty({ example: "in_xxxxx" })
  id: string;

  @ApiProperty({ example: 2900 })
  amountCents: number;

  @ApiProperty({ example: "usd" })
  currency: string;

  @ApiProperty({ enum: ["paid", "open", "void", "draft"], example: "paid" })
  status: string;

  @ApiPropertyOptional({ example: "https://pay.stripe.com/invoice/xxx/pdf" })
  pdfUrl: string;

  @ApiProperty({ example: "2026-04-01T00:00:00.000Z" })
  periodStart: string;

  @ApiProperty({ example: "2026-05-01T00:00:00.000Z" })
  periodEnd: string;

  @ApiPropertyOptional({ example: "2026-04-01T12:00:00.000Z", nullable: true })
  paidAt: string | null;
}

export class SuccessMessageDto {
  @ApiProperty({
    example: "Subscription will be canceled at the end of the current period",
  })
  message: string;
}
