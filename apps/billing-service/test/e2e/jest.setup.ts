/**
 * Jest setup for E2E tests
 * Runs before all test files
 */

jest.setTimeout(30000);

beforeAll(async () => {
  console.log("Setting up E2E tests...");
  console.log("Using test database: ai_video_interview_billing_test");
});

afterAll(async () => {
  console.log("E2E tests completed");
});
