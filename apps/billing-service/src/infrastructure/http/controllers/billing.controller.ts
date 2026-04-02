import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CreateCheckoutSessionCommand } from "../../../application/commands/create-checkout-session/create-checkout-session.command";
import { CancelSubscriptionCommand } from "../../../application/commands/cancel-subscription/cancel-subscription.command";
import { ResumeSubscriptionCommand } from "../../../application/commands/resume-subscription/resume-subscription.command";
import { GetSubscriptionQuery } from "../../../application/queries/get-subscription/get-subscription.query";
import { GetUsageQuery } from "../../../application/queries/get-usage/get-usage.query";
import { CheckQuotaQuery } from "../../../application/queries/check-quota/check-quota.query";
import { ListInvoicesQuery } from "../../../application/queries/list-invoices/list-invoices.query";
import { CreateCheckoutDto } from "../../../application/dto/billing.request.dto";
import {
  SubscriptionResponseDto,
  UsageResponseDto,
  QuotaCheckResponseDto,
  PlanResponseDto,
  CheckoutResponseDto,
  PortalResponseDto,
  InvoiceResponseDto,
  SuccessMessageDto,
} from "../../../application/dto/billing.response.dto";
import { PLANS } from "../../../config/plans.config";
import type { IStripeService } from "../../../application/interfaces/stripe-service.interface";
import { InternalServiceGuard } from "../guards/internal-service.guard";
import { Public } from "../decorators/public.decorator";

@ApiTags("Billing")
@ApiHeader({
  name: "x-company-id",
  description: "Company UUID (from API Gateway)",
  required: true,
})
@ApiHeader({ name: "x-user-id", description: "User UUID", required: true })
@ApiHeader({
  name: "x-user-role",
  description: "User role (hr, admin)",
  required: true,
})
@Controller()
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject("IStripeService")
    private readonly stripeService: IStripeService,
  ) {}

  @Get("subscription")
  @ApiOperation({
    summary: "Get current subscription",
    description:
      "Returns subscription details including plan, limits, features, and period dates.",
  })
  @ApiResponse({
    status: 200,
    description: "Subscription details",
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "No subscription found for this company",
  })
  async getSubscription(@Req() req: any) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    return this.queryBus.execute(new GetSubscriptionQuery(companyId));
  }

  @Post("checkout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Create Stripe Checkout session",
    description:
      "Generates a Stripe Checkout URL for plan upgrade. Redirect the user to the returned URL.",
  })
  @ApiResponse({
    status: 200,
    description: "Checkout session created",
    type: CheckoutResponseDto,
  })
  @ApiResponse({ status: 400, description: "Missing planType" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  @ApiResponse({
    status: 422,
    description: "Invalid plan transition (e.g., downgrade or same plan)",
  })
  async createCheckout(@Body() dto: CreateCheckoutDto, @Req() req: any) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    return this.commandBus.execute(
      new CreateCheckoutSessionCommand(
        companyId,
        dto.planType,
        dto.successUrl || `${frontendUrl}/billing?success=true`,
        dto.cancelUrl || `${frontendUrl}/billing?canceled=true`,
      ),
    );
  }

  @Post("portal")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Create Stripe Customer Portal session",
    description:
      "Returns URL to Stripe-hosted portal for payment method management and invoice viewing.",
  })
  @ApiResponse({
    status: 200,
    description: "Portal session URL",
    type: PortalResponseDto,
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async createPortal(@Req() req: any) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    const subscription = await this.queryBus.execute(
      new GetSubscriptionQuery(companyId),
    );

    if (!subscription.stripeCustomerId) {
      return {
        portalUrl: null,
        message: "No Stripe customer found. Upgrade first.",
      };
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return this.stripeService.createPortalSession({
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: `${frontendUrl}/billing`,
    });
  }

  @Post("cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel subscription",
    description:
      "Schedules cancellation at the end of current billing period. Subscription stays active until then.",
  })
  @ApiResponse({
    status: 200,
    description: "Cancellation scheduled",
    type: SuccessMessageDto,
  })
  @ApiResponse({ status: 400, description: "Cannot cancel free plan" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  @ApiResponse({ status: 409, description: "Already canceled" })
  async cancelSubscription(@Req() req: any) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    await this.commandBus.execute(new CancelSubscriptionCommand(companyId));
    return {
      message: "Subscription will be canceled at the end of the current period",
    };
  }

  @Post("resume")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resume subscription",
    description: "Undo cancellation before period ends.",
  })
  @ApiResponse({
    status: 200,
    description: "Subscription resumed",
    type: SuccessMessageDto,
  })
  @ApiResponse({ status: 400, description: "Not in cancellation state" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async resumeSubscription(@Req() req: any) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    await this.commandBus.execute(new ResumeSubscriptionCommand(companyId));
    return { message: "Subscription resumed" };
  }

  @Get("usage")
  @ApiOperation({
    summary: "Get usage for current period",
    description:
      "Returns used/limit/remaining for interviews, templates, and team members.",
  })
  @ApiQuery({
    name: "period",
    required: false,
    description: "Period in YYYY-MM format (defaults to current month)",
  })
  @ApiResponse({
    status: 200,
    description: "Usage data",
    type: UsageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async getUsage(@Req() req: any, @Query("period") period?: string) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    return this.queryBus.execute(new GetUsageQuery(companyId, period));
  }

  @Get("plans")
  @Public()
  @ApiOperation({
    summary: "List available plans",
    description:
      "Returns all plans with pricing, limits, and features. Public endpoint — no auth required.",
  })
  @ApiResponse({
    status: 200,
    description: "Plan list",
    type: [PlanResponseDto],
  })
  async listPlans() {
    return Object.entries(PLANS).map(([type, config]) => ({ type, ...config }));
  }

  @Get("invoices")
  @ApiOperation({
    summary: "List payment invoices",
    description: "Returns invoices from Stripe. Cached for 5 minutes.",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Max invoices to return (default: 10)",
  })
  @ApiResponse({
    status: 200,
    description: "Invoice list",
    type: [InvoiceResponseDto],
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async listInvoices(@Req() req: any, @Query("limit") limit?: string) {
    const companyId = req.headers["x-company-id"] || req.user?.companyId;
    return this.queryBus.execute(
      new ListInvoicesQuery(companyId, limit ? parseInt(limit, 10) : undefined),
    );
  }

  @Get("internal/quota/:companyId/:resource")
  @UseGuards(InternalServiceGuard)
  @ApiOperation({
    summary: "Check quota (internal)",
    description:
      "Used by API Gateway to verify quota before forwarding requests.",
  })
  @ApiParam({ name: "companyId", type: "string", format: "uuid" })
  @ApiParam({
    name: "resource",
    enum: ["interviews", "templates", "teamMembers"],
  })
  @ApiResponse({
    status: 200,
    description: "Quota check result",
    type: QuotaCheckResponseDto,
  })
  async checkQuota(
    @Param("companyId") companyId: string,
    @Param("resource") resource: string,
  ) {
    return this.queryBus.execute(new CheckQuotaQuery(companyId, resource));
  }
}
