import { Injectable, OnModuleInit } from "@nestjs/common";
import * as Handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";
import { LoggerService } from "../logger/logger.service";

@Injectable()
export class TemplateRendererService implements OnModuleInit {
  private templates = new Map<string, Handlebars.TemplateDelegate>();
  private layoutTemplate: Handlebars.TemplateDelegate | null = null;

  constructor(private readonly logger: LoggerService) {}

  async onModuleInit() {
    await this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, "templates");

    if (!fs.existsSync(templatesDir)) {
      this.logger.warn("Email templates directory not found", {
        action: "template_renderer.init",
        path: templatesDir,
      });
      return;
    }

    const files = fs
      .readdirSync(templatesDir)
      .filter((f) => f.endsWith(".hbs"));

    for (const file of files) {
      const templateName = file.replace(".hbs", "");
      const templatePath = path.join(templatesDir, file);
      const templateSource = fs.readFileSync(templatePath, "utf-8");

      if (templateName === "_layout") {
        this.layoutTemplate = Handlebars.compile(templateSource);
      } else {
        this.templates.set(templateName, Handlebars.compile(templateSource));
      }
    }

    this.logger.info(`Loaded ${this.templates.size} email templates`, {
      action: "template_renderer.init",
      templates: Array.from(this.templates.keys()),
    });
  }

  render(templateName: string, data: Record<string, unknown>): string {
    const template = this.templates.get(templateName);

    if (!template) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    const content = template(data);

    if (this.layoutTemplate) {
      return this.layoutTemplate({ ...data, content });
    }

    return content;
  }

  hasTemplate(templateName: string): boolean {
    return this.templates.has(templateName);
  }
}
