import { DomainExceptionFilter } from "../domain-exception.filter";
import {
  DomainException,
  SubscriptionNotFoundException,
  InvalidPlanTransitionException,
  QuotaExceededException,
  DuplicateSubscriptionException,
  PaymentRequiredException,
  InvalidSubscriptionStateException,
} from "../../../../domain/exceptions/billing.exceptions";
import { ArgumentsHost, HttpStatus } from "@nestjs/common";

// Concrete subclass for testing base DomainException behavior
class GenericDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

describe("DomainExceptionFilter", () => {
  let filter: DomainExceptionFilter;
  let logger: any;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      method: "POST",
      url: "/api/billing/checkout",
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    filter = new DomainExceptionFilter(logger);
  });

  it("should map SubscriptionNotFoundException to 404", () => {
    const exception = new SubscriptionNotFoundException("company-123");

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        error: "Not Found",
        message: expect.stringContaining("Subscription not found"),
      }),
    );
  });

  it("should map InvalidPlanTransitionException to 422", () => {
    const exception = new InvalidPlanTransitionException("pro", "plus");

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: "Unprocessable Entity",
      }),
    );
  });

  it("should map QuotaExceededException to 402", () => {
    const exception = new QuotaExceededException("interviews", 3, "free");

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.PAYMENT_REQUIRED,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: "Payment Required",
      }),
    );
  });

  it("should map DuplicateSubscriptionException to 409", () => {
    const exception = new DuplicateSubscriptionException("company-123");

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: "Conflict",
      }),
    );
  });

  it("should map PaymentRequiredException to 402", () => {
    const exception = new PaymentRequiredException(
      "Upgrade required for this feature",
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.PAYMENT_REQUIRED,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: "Payment Required",
      }),
    );
  });

  it("should map InvalidSubscriptionStateException to 422", () => {
    const exception = new InvalidSubscriptionStateException(
      "resume",
      "canceled",
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: "Unprocessable Entity",
      }),
    );
  });

  it("should map base DomainException to 400", () => {
    const exception = new GenericDomainException("Something went wrong");

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
      }),
    );
  });

  it("should include timestamp and path in response", () => {
    const exception = new SubscriptionNotFoundException("company-123");

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
        path: "/api/billing/checkout",
      }),
    );
  });

  it("should log warning with exception details", () => {
    const exception = new SubscriptionNotFoundException("company-123");

    filter.catch(exception, mockHost);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("SubscriptionNotFoundException"),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("POST /api/billing/checkout"),
    );
  });
});
