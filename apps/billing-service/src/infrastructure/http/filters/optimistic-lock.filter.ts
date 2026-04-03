import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { OptimisticLockVersionMismatchError } from "typeorm";

@Catch(OptimisticLockVersionMismatchError)
export class OptimisticLockFilter implements ExceptionFilter {
  private readonly logger = new Logger(OptimisticLockFilter.name);

  catch(exception: OptimisticLockVersionMismatchError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.warn(
      `Optimistic lock conflict [${request.method} ${request.url}]`,
    );

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message:
        "Resource was modified by another request. Please reload and try again.",
      error: "Conflict",
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
