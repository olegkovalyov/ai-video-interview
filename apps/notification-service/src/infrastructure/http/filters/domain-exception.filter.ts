import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Response } from "express";
import {
  DomainException,
  NotificationNotFoundException,
  WebhookEndpointNotFoundException,
  InvalidChannelException,
  TemplateNotFoundException,
  RecipientNotFoundException,
} from "../../../domain/exceptions/notification.exceptions";
import { LoggerService } from "../../logger/logger.service";

@Injectable()
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { status, error } = this.mapExceptionToHttp(exception);

    this.logger.warn(
      `Domain exception [${exception.name}]: ${exception.message} [${request.method} ${request.url}]`,
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapExceptionToHttp(exception: DomainException): {
    status: number;
    error: string;
  } {
    // 404 Not Found
    if (
      exception instanceof NotificationNotFoundException ||
      exception instanceof WebhookEndpointNotFoundException ||
      exception instanceof RecipientNotFoundException
    ) {
      return { status: HttpStatus.NOT_FOUND, error: "Not Found" };
    }

    // 422 Unprocessable Entity
    if (
      exception instanceof InvalidChannelException ||
      exception instanceof TemplateNotFoundException
    ) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        error: "Unprocessable Entity",
      };
    }

    // 400 Bad Request (default)
    return { status: HttpStatus.BAD_REQUEST, error: "Bad Request" };
  }
}
