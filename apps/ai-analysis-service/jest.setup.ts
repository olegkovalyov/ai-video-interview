import { Logger } from "@nestjs/common";

// Override NestJS Logger for unit tests.
// Tests verify logging via mock assertions, not console output.
// This removes ~100 lines of expected ERROR/WARN/LOG/DEBUG noise from test output.
Logger.overrideLogger(false);
