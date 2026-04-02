/**
 * System test configuration
 * All services run on test ports (900x) with test databases
 */
export const SYSTEM_CONFIG = {
  services: {
    "api-gateway": {
      port: 9010,
      healthUrl: "http://localhost:9010/health",
      dir: "apps/api-gateway",
      env: {
        PORT: "9001",
        USER_SERVICE_URL: "http://localhost:9002",
        INTERVIEW_SERVICE_URL: "http://localhost:9003",
        ANALYSIS_SERVICE_URL: "http://localhost:9005",
        BILLING_SERVICE_URL: "http://localhost:9007",
        NOTIFICATION_SERVICE_URL: "http://localhost:9006",
        // Use mock Keycloak — tests use x-user-id headers directly
        KEYCLOAK_URL: "http://localhost:8090",
        KEYCLOAK_REALM: "ai-video-interview",
        KEYCLOAK_CLIENT_ID: "test-client",
      },
    },
    "user-service": {
      port: 9002,
      healthUrl: "http://localhost:9002/health",
      dir: "apps/user-service",
      env: {
        PORT: "9002",
        DATABASE_NAME: "ai_video_interview_user_test",
      },
    },
    "interview-service": {
      port: 9003,
      healthUrl: "http://localhost:9003/health",
      dir: "apps/interview-service",
      env: {
        PORT: "9003",
        DATABASE_NAME: "ai_video_interview_interview_test",
      },
    },
    "ai-analysis-service": {
      port: 9005,
      healthUrl: "http://localhost:9005/health",
      dir: "apps/ai-analysis-service",
      env: {
        PORT: "9005",
        DATABASE_NAME: "ai_video_interview_analysis_test",
        GROQ_API_KEY: "", // No real LLM in system tests
      },
    },
    "billing-service": {
      port: 9007,
      healthUrl: "http://localhost:9007/health",
      dir: "apps/billing-service",
      env: {
        PORT: "9007",
        DATABASE_NAME: "ai_video_interview_billing_test",
        STRIPE_SECRET_KEY: "sk_test_fake",
        STRIPE_WEBHOOK_SECRET: "whsec_fake",
      },
    },
    "notification-service": {
      port: 9006,
      healthUrl: "http://localhost:9006/health",
      dir: "apps/notification-service",
      env: {
        PORT: "9006",
        DATABASE_NAME: "ai_video_interview_notification_test",
        SMTP_HOST: "localhost",
        SMTP_PORT: "1025",
      },
    },
  },

  // Shared env for all services
  sharedEnv: {
    NODE_ENV: "test",
    DATABASE_HOST: "localhost",
    DATABASE_PORT: "5432",
    DATABASE_USER: "postgres",
    DATABASE_PASSWORD: "postgres",
    REDIS_HOST: "localhost",
    REDIS_PORT: "6379",
    KAFKA_BROKERS: "localhost:9092",
    INTERNAL_SERVICE_TOKEN: "test-internal-token",
    LOG_LEVEL: "warn",
  },

  gateway: "http://localhost:9010",
  mailpitApi: "http://localhost:8025/api/v1",

  timeouts: {
    serviceStartup: 30000, // 30s per service
    healthCheck: 2000, // 2s between retries
    healthRetries: 15, // 15 attempts = 30s max
    asyncEvent: 10000, // 10s for Kafka event processing
    asyncPoll: 1000, // 1s between polls
  },
};
