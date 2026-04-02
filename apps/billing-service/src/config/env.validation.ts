import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(8007),
  DATABASE_HOST: Joi.string().default("localhost"),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().default("ai_video_interview_billing"),
  DATABASE_USER: Joi.string().default("postgres"),
  DATABASE_PASSWORD: Joi.string().default("postgres"),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_PRICE_PLUS: Joi.string().required(),
  STRIPE_PRICE_PRO: Joi.string().required(),
  FRONTEND_URL: Joi.string().default("http://localhost:3000"),
  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(""),
  KAFKA_BROKERS: Joi.string().default("localhost:9092"),
  INTERNAL_SERVICE_TOKEN: Joi.string().default("internal-secret"),
  LOKI_HOST: Joi.string().optional().allow(""),
  JAEGER_ENDPOINT: Joi.string().default("http://localhost:14268/api/traces"),
  LOG_LEVEL: Joi.string().default("info"),
  NODE_ENV: Joi.string().default("development"),
});
