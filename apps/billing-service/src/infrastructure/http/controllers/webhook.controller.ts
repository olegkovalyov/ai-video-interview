import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { LoggerService } from "../../logger/logger.service";
import { Public } from "../decorators/public.decorator";
import type { IStripeService } from "../../../application/interfaces/stripe-service.interface";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhookController {
  constructor(
    @Inject("IStripeService")
    private readonly stripeService: IStripeService,
    @InjectQueue("stripe-webhooks")
    private readonly webhookQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  @Post("stripe")
  @Public()
  @ApiOperation({ summary: "Stripe webhook endpoint" })
  @ApiResponse({ status: 200, description: "Webhook accepted for processing" })
  @ApiResponse({ status: 400, description: "Invalid webhook signature" })
  async handleStripeWebhook(
    @Req() req: any,
    @Res() res: any,
    @Headers("stripe-signature") signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.warn("Stripe webhook missing raw body");
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: "Missing raw body" });
    }

    // Verify signature SYNCHRONOUSLY (fast, no DB)
    try {
      const event = await this.stripeService.constructWebhookEvent(
        rawBody.toString(),
        signature,
      );

      // Queue for async processing — return 200 immediately
      await this.webhookQueue.add(
        "process-webhook",
        {
          eventId: event.id,
          eventType: event.type,
          rawBody: rawBody.toString(),
          signature,
        },
        {
          jobId: event.id, // Deduplicate by Stripe event ID
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      );

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      this.logger.error(
        `Stripe webhook signature verification failed: ${error.message}`,
      );
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: "Invalid signature" });
    }
  }
}
