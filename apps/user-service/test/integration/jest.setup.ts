/**
 * Jest setup for integration tests
 * This file runs before all tests
 */

// Increase timeout for all tests (DB operations can be slow)
jest.setTimeout(30000);

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global setup/teardown if needed
beforeAll(async () => {
  // Check if PostgreSQL is available
  console.log('🔧 Setting up integration tests...');
  console.log('📦 Using test database: ai_video_interview_user_test');
});

afterAll(async () => {
  console.log('✅ Integration tests completed');
});
