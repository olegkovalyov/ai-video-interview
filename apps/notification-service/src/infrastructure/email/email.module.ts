import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SmtpEmailService } from "./smtp-email.service";
import { TemplateRendererService } from "./template-renderer.service";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [
    TemplateRendererService,
    SmtpEmailService,
    {
      provide: "IEmailService",
      useExisting: SmtpEmailService,
    },
  ],
  exports: [SmtpEmailService, "IEmailService", TemplateRendererService],
})
export class EmailModule {}
