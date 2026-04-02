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
  SubscriptionNotFoundException,
  InvalidPlanTransitionException,
  QuotaExceededException,
  DuplicateSubscriptionException,
  PaymentRequiredException,
  InvalidSubscriptionStateException,
} from "../../../domain/exceptions/billing.exceptions";
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
    if (exception instanceof SubscriptionNotFoundException) {
      return { status: HttpStatus.NOT_FOUND, error: "Not Found" };
    }

    // 402 Payment Required
    if (
      exception instanceof PaymentRequiredException ||
      exception instanceof QuotaExceededException
    ) {
      return { status: HttpStatus.PAYMENT_REQUIRED, error: "Payment Required" };
    }

    // 409 Conflict
    if (exception instanceof DuplicateSubscriptionException) {
      return { status: HttpStatus.CONFLICT, error: "Conflict" };
    }

    // 422 Unprocessable Entity
    if (
      exception instanceof InvalidPlanTransitionException ||
      exception instanceof InvalidSubscriptionStateException
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
