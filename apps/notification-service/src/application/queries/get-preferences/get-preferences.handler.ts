import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetPreferencesQuery } from "./get-preferences.query";
import { NotificationPreference } from "../../../domain/entities/notification-preference.entity";
import type { INotificationPreferenceRepository } from "../../../domain/repositories/notification-preference.repository.interface";
import type { NotificationPreferenceResponseDto } from "../../dto/notification.response.dto";

@QueryHandler(GetPreferencesQuery)
export class GetPreferencesHandler
  implements IQueryHandler<GetPreferencesQuery>
{
  constructor(
    @Inject("INotificationPreferenceRepository")
    private readonly preferenceRepo: INotificationPreferenceRepository,
  ) {}

  async execute(
    query: GetPreferencesQuery,
  ): Promise<NotificationPreferenceResponseDto> {
    let preference = await this.preferenceRepo.findByUserId(query.userId);

    if (!preference) {
      // Return default preferences
      preference = NotificationPreference.create(query.userId);
    }

    return {
      userId: preference.userId,
      emailEnabled: preference.emailEnabled,
      inAppEnabled: preference.inAppEnabled,
      subscriptions: preference.subscriptions,
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}
