import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Server
  PORT: Joi.number().default(8001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Keycloak OIDC
  KEYCLOAK_URL: Joi.string().uri().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  KEYCLOAK_ADMIN_CLIENT_ID: Joi.string().allow('').optional(),
  KEYCLOAK_ADMIN_CLIENT_SECRET: Joi.string().allow('').optional(),

  // Downstream services
  USER_SERVICE_URL: Joi.string().uri().default('http://localhost:8002'),
  INTERVIEW_SERVICE_URL: Joi.string().uri().default('http://localhost:8003'),
  AI_ANALYSIS_SERVICE_URL: Joi.string().uri().default('http://localhost:8005'),

  // Internal auth
  INTERNAL_SERVICE_TOKEN: Joi.string().optional().default(''),

  // Frontend
  NEXT_PUBLIC_WEB_ORIGIN: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  // Kafka
  KAFKA_BROKERS: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // Observability
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('debug'),
  LOKI_HOST: Joi.string().default('http://localhost:3100'),
  JAEGER_ENDPOINT: Joi.string().default(
    'http://localhost:14268/api/traces',
  ),
}).options({ allowUnknown: true });
