import { Controller, Get, Put, Body, Headers } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GetPreferencesQuery } from "../../../application/queries/get-preferences/get-preferences.query";
import { UpdatePreferencesCommand } from "../../../application/commands/update-preferences/update-preferences.command";
import { UpdatePreferencesDto } from "../../../application/dto/notification.request.dto";

@ApiTags("preferences")
@ApiBearerAuth()
@Controller("preferences")
export class PreferencesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiResponse({ status: 200, description: "User preferences" })
  async getPreferences(@Headers("x-user-id") userId: string) {
    return this.queryBus.execute(new GetPreferencesQuery(userId));
  }

  @Put()
  @ApiOperation({ summary: "Update notification preferences" })
  @ApiResponse({ status: 200, description: "Preferences updated" })
  async updatePreferences(
    @Headers("x-user-id") userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    await this.commandBus.execute(
      new UpdatePreferencesCommand(
        userId,
        dto.emailEnabled,
        dto.inAppEnabled,
        dto.subscriptions,
      ),
    );
    return { success: true };
  }
}
