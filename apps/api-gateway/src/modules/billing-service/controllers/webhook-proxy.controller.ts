import { Controller, Post, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { BillingServiceClient } from '../clients/billing-service.client';

/**
 * Webhook Proxy Controller
 * Proxies Stripe webhook events to the Billing Service.
 * NO authentication — Stripe verifies via signature header.
 * Raw body passthrough is required for Stripe signature verification.
 */
@ApiTags('Billing Webhooks')
@Controller('api/billing/webhooks')
export class WebhookProxyController {
  private readonly logger = new Logger(WebhookProxyController.name);

  constructor(private readonly billingClient: BillingServiceClient) {}

  @Post('stripe')
  @Public()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed' })
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        this.logger.warn('Stripe webhook received without signature header');
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Missing stripe-signature header',
        });
      }

      // Pass raw body to billing service for signature verification
      // req.body should be the raw buffer when express raw middleware is configured
      const rawBody = (req as any).rawBody || req.body;

      const result = await this.billingClient['post'](
        '/api/billing/webhooks/stripe',
        rawBody,
        {
          headers: {
            'stripe-signature': signature,
            'content-type':
              (req.headers['content-type'] as string) || 'application/json',
          },
          bypassCircuitBreaker: true, // Webhooks must always be forwarded
        },
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error(
        `Failed to proxy Stripe webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Return 200 to Stripe to prevent retries for permanent failures
      // Stripe will retry on non-2xx responses
      return res.status(HttpStatus.OK).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  }
}
