import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { IEmailService } from "../../application/interfaces/email-service.interface";
import { TemplateRendererService } from "./template-renderer.service";
import { LoggerService } from "../logger/logger.service";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class SmtpEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateRenderer: TemplateRendererService,
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    this.fromAddress = this.configService.get(
      "SMTP_FROM",
      "noreply@aiinterview.dev",
    );

    this.transporter = nodemailer.createTransport({
      host: this.configService.get("SMTP_HOST", "localhost"),
      port: parseInt(this.configService.get("SMTP_PORT", "1025"), 10),
      secure: this.configService.get("SMTP_SECURE", "false") === "true",
      auth:
        this.configService.get("SMTP_USER") &&
        this.configService.get("SMTP_PASSWORD")
          ? {
              user: this.configService.get("SMTP_USER"),
              pass: this.configService.get("SMTP_PASSWORD"),
            }
          : undefined,
    });
  }

  async send(
    template: string,
    to: string,
    subject: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const html = this.templateRenderer.render(template, {
        ...data,
        frontendUrl:
          this.configService.get("FRONTEND_URL") || "http://localhost:3000",
      });

      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });

      const duration = Date.now() - startTime;
      this.metricsService.recordEmailSent(template);

      this.logger.info(`Email sent: ${template} to ${to}`, {
        action: "email.sent",
        template,
        duration,
      });
    } catch (error) {
      this.metricsService.recordEmailFailed(template);

      this.logger.error(`Failed to send email: ${template} to ${to}`, error, {
        action: "email.failed",
        template,
      });

      throw error;
    }
  }
}
