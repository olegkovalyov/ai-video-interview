import type { Notification } from "../aggregates/notification.aggregate";
import type { ITransactionContext } from "../../application/interfaces/transaction-context.interface";

export interface INotificationRepository {
  save(notification: Notification, tx?: ITransactionContext): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByRecipientId(
    recipientId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]>;
  findUnread(recipientId: string): Promise<Notification[]>;
  countUnread(recipientId: string): Promise<number>;
}
