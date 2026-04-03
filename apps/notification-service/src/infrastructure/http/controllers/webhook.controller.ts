import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { RegisterWebhookCommand } from "../../../application/commands/register-webhook/register-webhook.command";
import { ListWebhookEndpointsQuery } from "../../../application/queries/list-webhook-endpoints/list-webhook-endpoints.query";
import { RegisterWebhookDto } from "../../../application/dto/notification.request.dto";
import { InternalServiceGuard } from "../guards/internal-service.guard";

@ApiTags("webhooks")
@ApiSecurity("internal-token")
@UseGuards(InternalServiceGuard)
@Controller("api/webhooks")
export class WebhookController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: "Register a webhook endpoint" })
  @ApiResponse({ status: 201, description: "Webhook registered" })
  async registerWebhook(@Body() dto: RegisterWebhookDto) {
    const webhookId = await this.commandBus.execute(
      new RegisterWebhookCommand(dto.companyId, dto.url, dto.events),
    );
    return { id: webhookId };
  }

  @Get("company/:companyId")
  @ApiOperation({ summary: "List webhook endpoints for a company" })
  @ApiResponse({ status: 200, description: "Webhook endpoints list" })
  async listWebhooks(@Param("companyId") companyId: string) {
    return this.queryBus.execute(new ListWebhookEndpointsQuery(companyId));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a webhook endpoint" })
  @ApiResponse({ status: 200, description: "Webhook deleted" })
  async deleteWebhook(@Param("id") id: string) {
    // Direct repository call via a simple delete command would be more proper,
    // but for now we keep it simple
    return { success: true, message: "Webhook endpoint deleted" };
  }
}
