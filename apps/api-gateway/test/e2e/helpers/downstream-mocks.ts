import * as nock from 'nock';

const USER_SERVICE_URL = 'http://localhost:8002';
const INTERVIEW_SERVICE_URL = 'http://localhost:8003';
const ANALYSIS_SERVICE_URL = 'http://localhost:8005';
const BILLING_SERVICE_URL = 'http://localhost:8007';

// ============================================================================
// Generic mock helpers
// ============================================================================

export interface MockOptions {
  delay?: number; // Response delay in ms
  times?: number; // Number of times to intercept (default: 1)
}

function applyOptions(
  interceptor: nock.Interceptor,
  options?: MockOptions,
): nock.Interceptor {
  if (options?.delay) {
    interceptor = interceptor.delay(options.delay);
  }
  if (options?.times) {
    interceptor = interceptor.times(options.times);
  }
  return interceptor;
}

// ============================================================================
// User Service mocks (port 8002)
// ============================================================================

export function mockUserServiceGet(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(USER_SERVICE_URL).get(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockUserServicePost(
  path: string,
  response: any,
  statusCode = 201,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(USER_SERVICE_URL).post(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockUserServicePut(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(USER_SERVICE_URL).put(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockUserServiceDelete(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(USER_SERVICE_URL).delete(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

/**
 * Mock user-service to return a standard user profile.
 */
export function mockUserServiceGetUser(
  userId: string,
  overrides?: Partial<any>,
): nock.Scope {
  return mockUserServiceGet(`/users/${userId}`, {
    id: userId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'hr',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  });
}

/**
 * Mock user-service health endpoint.
 */
export function mockUserServiceHealth(status = 'up'): nock.Scope {
  return mockUserServiceGet('/health', { status, uptime: 12345 });
}

// ============================================================================
// Interview Service mocks (port 8003)
// ============================================================================

export function mockInterviewServiceGet(
  path: string | RegExp,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(INTERVIEW_SERVICE_URL).get(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockInterviewServicePost(
  path: string,
  response: any,
  statusCode = 201,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(INTERVIEW_SERVICE_URL).post(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockInterviewServicePut(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(INTERVIEW_SERVICE_URL).put(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockInterviewServiceDelete(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(INTERVIEW_SERVICE_URL).delete(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

/**
 * Mock interview-service health endpoint.
 */
export function mockInterviewServiceHealth(status = 'up'): nock.Scope {
  return mockInterviewServiceGet('/health', { status, uptime: 12345 });
}

// ============================================================================
// Analysis Service mocks (port 8005)
// ============================================================================

export function mockAnalysisServiceGet(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(ANALYSIS_SERVICE_URL).get(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockAnalysisServicePost(
  path: string,
  response: any,
  statusCode = 201,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(ANALYSIS_SERVICE_URL).post(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

/**
 * Mock analysis-service health endpoint.
 */
export function mockAnalysisServiceHealth(status = 'up'): nock.Scope {
  return mockAnalysisServiceGet('/health', { status, uptime: 12345 });
}

// ============================================================================
// Billing Service mocks (port 8007)
// ============================================================================

export function mockBillingServiceGet(
  path: string,
  response: any,
  statusCode = 200,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(BILLING_SERVICE_URL).get(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

export function mockBillingServicePost(
  path: string,
  response: any,
  statusCode = 201,
  options?: MockOptions,
): nock.Scope {
  const interceptor = nock(BILLING_SERVICE_URL).post(path);
  return applyOptions(interceptor, options).reply(statusCode, response);
}

// ============================================================================
// Error simulation helpers
// ============================================================================

/**
 * Mock a service to return connection refused (simulates service down).
 */
export function mockUserServiceDown(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete' = 'get',
): nock.Scope {
  return nock(USER_SERVICE_URL)[method](path).replyWithError({
    code: 'ECONNREFUSED',
    message: 'connect ECONNREFUSED 127.0.0.1:8002',
  });
}

export function mockInterviewServiceDown(
  path: string | RegExp,
  method: 'get' | 'post' | 'put' | 'delete' = 'get',
): nock.Scope {
  return nock(INTERVIEW_SERVICE_URL)[method](path).replyWithError({
    code: 'ECONNREFUSED',
    message: 'connect ECONNREFUSED 127.0.0.1:8003',
  });
}

/**
 * Mock a service to timeout (simulates slow response).
 */
export function mockUserServiceTimeout(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete' = 'get',
): nock.Scope {
  return nock(USER_SERVICE_URL)
    [method](path)
    .delayConnection(30000)
    .reply(200, {});
}

export function mockInterviewServiceTimeout(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete' = 'get',
): nock.Scope {
  return nock(INTERVIEW_SERVICE_URL)
    [method](path)
    .delayConnection(30000)
    .reply(200, {});
}

// ============================================================================
// Convenience: mock all health endpoints for a healthy system
// ============================================================================

export function mockAllServicesHealthy(): void {
  mockUserServiceHealth('up');
  mockInterviewServiceHealth('up');
  mockAnalysisServiceHealth('up');
}
