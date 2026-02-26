import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ServiceProxyError } from '../../proxies/base/base-service-proxy';
import { LoggerService } from '../logging/logger.service';

/**
 * Global exception filter for ServiceProxyError.
 * Maps ServiceProxyError (from BaseServiceProxy) into standardized HTTP responses.
 *
 * Status code mapping:
 * - statusCode > 0: forward the original status from downstream service
 * - statusCode === 0: network/timeout error → 502 Bad Gateway
 */
@Catch(ServiceProxyError)
export class ServiceProxyExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: LoggerService) {}

  catch(error: ServiceProxyError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      error.statusCode > 0 ? error.statusCode : HttpStatus.BAD_GATEWAY;

    this.loggerService.error(
      `ServiceProxyError: [${error.serviceName}] ${error.message}`,
      error,
      {
        service: error.serviceName,
        statusCode: status,
        originalStatusCode: error.statusCode,
        path: request.url,
        method: request.method,
      },
    );

    response.status(status).json({
      success: false,
      error: error.message,
      service: error.serviceName,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
