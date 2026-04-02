import type { NotificationPreference } from "../entities/notification-preference.entity";
import type { ITransactionContext } from "../../application/interfaces/transaction-context.interface";

export interface INotificationPreferenceRepository {
  save(
    preference: NotificationPreference,
    tx?: ITransactionContext,
  ): Promise<void>;
  findByUserId(userId: string): Promise<NotificationPreference | null>;
}
