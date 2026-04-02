import "./infrastructure/tracing/tracing"; // Must be first — initializes OpenTelemetry before NestJS
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggerService } from "./infrastructure/logger/logger.service";
import { DomainExceptionFilter } from "./infrastructure/http/filters/domain-exception.filter";
import { OptimisticLockFilter } from "./infrastructure/http/filters/optimistic-lock.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);

  app.useLogger(logger);

  // Domain exception filter (maps DomainException -> HTTP status)
  const domainFilter = app.get(DomainExceptionFilter);
  app.useGlobalFilters(new OptimisticLockFilter(), domainFilter);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Notification Service API")
    .setDescription("Email, in-app, and webhook notification microservice")
    .setVersion("1.0")
    .addBearerAuth()
    .addApiKey(
      { type: "apiKey", name: "x-internal-token", in: "header" },
      "internal-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.use("/api/docs-json", (req, res) => {
    res.json(document);
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 8006;

  logger.info("Notification Service starting up", {
    service: "notification-service",
    action: "startup",
    port,
    nodeEnv: process.env.NODE_ENV || "development",
  });

  await app.listen(port);

  logger.info("Notification Service successfully started", {
    service: "notification-service",
    action: "startup_complete",
    port,
    url: `http://localhost:${port}`,
    docsUrl: `http://localhost:${port}/api/docs`,
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start Notification Service:", error);
  process.exit(1);
});
