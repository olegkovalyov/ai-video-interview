/**
 * IEmailService — Application-layer port for sending emails.
 * Infrastructure provides the implementation (nodemailer/SMTP).
 *
 * Inject via token: @Inject('IEmailService')
 */
export interface IEmailService {
  /**
   * Send an email using a template.
   * @param template - Template name (e.g., 'welcome', 'invitation')
   * @param to - Recipient email address
   * @param subject - Email subject line
   * @param data - Template variables
   */
  send(
    template: string,
    to: string,
    subject: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}
