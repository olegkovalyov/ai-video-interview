/**
 * Base exception for application-level errors
 * These represent application flow errors
 */
export class ApplicationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationException';
    Error.captureStackTrace(this, this.constructor);
  }
}
