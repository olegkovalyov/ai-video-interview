export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotificationNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Notification not found: ${id}`);
  }
}

export class WebhookEndpointNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Webhook endpoint not found: ${id}`);
  }
}

export class InvalidChannelException extends DomainException {
  constructor(channel: string) {
    super(`Invalid notification channel: ${channel}`);
  }
}

export class TemplateNotFoundException extends DomainException {
  constructor(template: string) {
    super(`Notification template not found: ${template}`);
  }
}

export class RecipientNotFoundException extends DomainException {
  constructor(recipientId: string) {
    super(`Notification recipient not found: ${recipientId}`);
  }
}
