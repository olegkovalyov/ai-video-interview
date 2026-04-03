export * from "./send-notification/send-notification.command";
export * from "./send-notification/send-notification.handler";
export * from "./process-webhook-delivery/process-webhook-delivery.command";
export * from "./process-webhook-delivery/process-webhook-delivery.handler";
export * from "./update-preferences/update-preferences.command";
export * from "./update-preferences/update-preferences.handler";
export * from "./register-webhook/register-webhook.command";
export * from "./register-webhook/register-webhook.handler";
export * from "./mark-notification-read/mark-notification-read.command";
export * from "./mark-notification-read/mark-notification-read.handler";

import { SendNotificationHandler } from "./send-notification/send-notification.handler";
import { ProcessWebhookDeliveryHandler } from "./process-webhook-delivery/process-webhook-delivery.handler";
import { UpdatePreferencesHandler } from "./update-preferences/update-preferences.handler";
import { RegisterWebhookHandler } from "./register-webhook/register-webhook.handler";
import { MarkNotificationReadHandler } from "./mark-notification-read/mark-notification-read.handler";

export const CommandHandlers = [
  SendNotificationHandler,
  ProcessWebhookDeliveryHandler,
  UpdatePreferencesHandler,
  RegisterWebhookHandler,
  MarkNotificationReadHandler,
];
