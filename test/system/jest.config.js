/**
 * System E2E Test Configuration
 *
 * Categories (run individually or all together):
 *   01-sync-http           — User CRUD, Billing plans, Correlation ID
 *   02-interview-lifecycle  — Template → Publish → Invite → Respond → Complete
 *   03-kafka-async          — Kafka event propagation (user.created, invitation.completed)
 *   04-ai-analysis          — LLM scoring via Groq (sandbox + Kafka-triggered)
 *   05-notifications        — Email delivery via Mailpit, preferences
 *   06-billing-stripe       — Subscription lifecycle, checkout, cancel/resume
 *   07-auth                 — JWT auth, internal token, public endpoints
 *   08-resilience           — Error handling, health checks, concurrency
 *
 * Usage:
 *   npx jest --config test/system/jest.config.js                          # all categories
 *   npx jest --config test/system/jest.config.js --testPathPattern=01-sync-http  # one category
 */
module.exports = {
  testEnvironment: "node",
  testRegex: "test/system/scenarios/.+\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testTimeout: 180000, // 3 min — needed for AI analysis tests
  maxWorkers: 1, // Sequential — services share state
  setupFiles: ["./jest.setup.ts"],
};
