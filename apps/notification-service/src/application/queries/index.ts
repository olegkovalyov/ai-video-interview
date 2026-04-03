export * from "./list-notifications/list-notifications.query";
export * from "./list-notifications/list-notifications.handler";
export * from "./get-preferences/get-preferences.query";
export * from "./get-preferences/get-preferences.handler";
export * from "./list-webhook-endpoints/list-webhook-endpoints.query";
export * from "./list-webhook-endpoints/list-webhook-endpoints.handler";
export * from "./get-unread-count/get-unread-count.query";
export * from "./get-unread-count/get-unread-count.handler";

import { ListNotificationsHandler } from "./list-notifications/list-notifications.handler";
import { GetPreferencesHandler } from "./get-preferences/get-preferences.handler";
import { ListWebhookEndpointsHandler } from "./list-webhook-endpoints/list-webhook-endpoints.handler";
import { GetUnreadCountHandler } from "./get-unread-count/get-unread-count.handler";

export const QueryHandlers = [
  ListNotificationsHandler,
  GetPreferencesHandler,
  ListWebhookEndpointsHandler,
  GetUnreadCountHandler,
];
