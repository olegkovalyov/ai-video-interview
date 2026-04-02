import { SubscriptionCreatedHandler } from "./subscription-created.handler";
import { SubscriptionUpgradedHandler } from "./subscription-upgraded.handler";

export const EventHandlers = [
  SubscriptionCreatedHandler,
  SubscriptionUpgradedHandler,
];
