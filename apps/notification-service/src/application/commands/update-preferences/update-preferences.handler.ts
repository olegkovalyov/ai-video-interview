import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdatePreferencesCommand } from "./update-preferences.command";
import { NotificationPreference } from "../../../domain/entities/notification-preference.entity";
import type { INotificationPreferenceRepository } from "../../../domain/repositories/notification-preference.repository.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";

@CommandHandler(UpdatePreferencesCommand)
export class UpdatePreferencesHandler
  implements ICommandHandler<UpdatePreferencesCommand>
{
  constructor(
    @Inject("INotificationPreferenceRepository")
    private readonly preferenceRepo: INotificationPreferenceRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UpdatePreferencesCommand): Promise<void> {
    const { userId, emailEnabled, inAppEnabled, subscriptions } = command;

    let preference = await this.preferenceRepo.findByUserId(userId);

    if (!preference) {
      preference = NotificationPreference.create(userId);
    }

    preference.updatePreferences({
      emailEnabled,
      inAppEnabled,
      subscriptions,
    });

    await this.preferenceRepo.save(preference);

    this.logger.commandLog("UpdatePreferences", true, {
      action: "update_preferences",
      userId,
    });
  }
}
