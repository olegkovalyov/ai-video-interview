/**
 * Jest setup for integration tests
 * Runs before all tests
 */

jest.setTimeout(30000);

beforeAll(async () => {
  console.log("Setting up integration tests...");
  console.log("Using test database: ai_video_interview_billing_test");
});

afterAll(async () => {
  console.log("Integration tests completed");
});
