import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/guards/roles.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import {
  CurrentUser,
  CurrentUserData,
  extractPrimaryRole,
} from '../../../core/auth/decorators/current-user.decorator';
import { BillingServiceClient } from '../clients/billing-service.client';

/**
 * Billing Proxy Controller
 * Proxies billing requests to the Billing Service.
 * Extracts companyId from JWT claims or x-company-id header.
 */
@ApiTags('Billing')
@ApiBearerAuth()
@Controller('api/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingProxyController {
  constructor(private readonly billingClient: BillingServiceClient) {}

  /**
   * Extract companyId from request.
   * Tries JWT user claims first, then falls back to x-company-id header.
   */
  private extractCompanyId(user: CurrentUserData | null, req: Request): string {
    const companyId =
      (user as any)?.companyId || (req.headers['x-company-id'] as string);

    if (!companyId) {
      throw new Error(
        'Company ID is required. Provide it via JWT claims or x-company-id header.',
      );
    }

    return companyId;
  }

  @Get('subscription')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current subscription details',
  })
  async getSubscription(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.getSubscription(companyId, user.userId, role);
  }

  @Post('checkout')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Create checkout session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe checkout session URL',
  })
  async createCheckoutSession(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
    @Body() body: { planType: string },
  ) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.createCheckoutSession(
      body,
      user.userId,
      companyId,
      role,
    );
  }

  @Post('portal')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Create customer portal session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe portal session URL',
  })
  async createPortalSession(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.createPortalSession(companyId, user.userId, role);
  }

  @Post('cancel')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription cancelled' })
  async cancelSubscription(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.cancelSubscription(companyId, user.userId, role);
  }

  @Post('resume')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Resume cancelled subscription' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription resumed' })
  async resumeSubscription(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.resumeSubscription(companyId, user.userId, role);
  }

  @Get('usage')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current usage stats' })
  async getUsage(@CurrentUser() user: CurrentUserData, @Req() req: Request) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.getUsage(companyId, user.userId, role);
  }

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Get available billing plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of available plans',
  })
  async getPlans() {
    return this.billingClient.getPlans();
  }

  @Get('invoices')
  @Roles('hr', 'admin')
  @ApiOperation({ summary: 'Get invoices' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of invoices' })
  async getInvoices(@CurrentUser() user: CurrentUserData, @Req() req: Request) {
    const companyId = this.extractCompanyId(user, req);
    const role = extractPrimaryRole(user);
    return this.billingClient.getInvoices(companyId, user.userId, role);
  }
}
