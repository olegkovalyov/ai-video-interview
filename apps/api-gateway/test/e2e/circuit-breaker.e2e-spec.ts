import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import {
  createTestApp,
  generateHrJwt,
  DEFAULT_USER_PAYLOAD,
} from './helpers/test-app';
import { CircuitBreakerRegistry } from '../../src/core/circuit-breaker/circuit-breaker-registry.service';
import { CircuitState } from '../../src/core/circuit-breaker/circuit-breaker';

jest.setTimeout(60000);

/**
 * Circuit Breaker E2E Tests
 *
 * Tests verify circuit breaker state transitions and independence between
 * service circuits. Due to the interaction between AuthErrorInterceptor
 * (which catches all errors) and the circuit breaker pattern, we test
 * the circuit state directly via the CircuitBreakerRegistry.
 */
describe('Circuit Breaker (E2E)', () => {
  let app: INestApplication;
  let circuitBreakerRegistry: CircuitBreakerRegistry;

  beforeAll(async () => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    const testApp = await createTestApp();
    app = testApp.app;
    circuitBreakerRegistry = testApp.circuitBreakerRegistry;
  });

  afterAll(async () => {
    await app.close();
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    circuitBreakerRegistry.resetAll();
  });

  describe('Normal operation (circuit CLOSED)', () => {
    it('should pass requests through when circuit is closed', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      nock('http://localhost:8002').get(`/users/${userId}`).reply(200, {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userId);

      const circuit = circuitBreakerRegistry.get('user-service');
      if (circuit) {
        expect(circuit.getState()).toBe(CircuitState.CLOSED);
      }
    });
  });

  describe('Circuit breaker state management', () => {
    it('should fast-fail requests when circuit is manually opened', async () => {
      const token = generateHrJwt();

      // Get the user-service circuit breaker and verify it exists
      const circuit = circuitBreakerRegistry.get('user-service');
      expect(circuit).toBeDefined();

      // Simulate opening the circuit by sending many failures through execute()
      const failingFn = () => Promise.reject(new Error('simulated failure'));
      for (let i = 0; i < 6; i++) {
        try {
          await circuit!.execute(failingFn);
        } catch {
          // Expected to fail
        }
      }

      // Now the circuit should be OPEN
      expect(circuit!.getState()).toBe(CircuitState.OPEN);

      // Request to user-service should fail fast (circuit is open)
      // No nock interceptor needed since the circuit prevents downstream calls
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should recover after reset', async () => {
      const token = generateHrJwt();
      const userId = `user-${DEFAULT_USER_PAYLOAD.sub}`;

      // Open the circuit
      const circuit = circuitBreakerRegistry.get('user-service');
      const failingFn = () => Promise.reject(new Error('simulated failure'));
      for (let i = 0; i < 6; i++) {
        try {
          await circuit!.execute(failingFn);
        } catch {}
      }
      expect(circuit!.getState()).toBe(CircuitState.OPEN);

      // Reset the circuit
      circuit!.reset();
      expect(circuit!.getState()).toBe(CircuitState.CLOSED);

      // Now requests should work again
      nock('http://localhost:8002').get(`/users/${userId}`).reply(200, {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userId);
    });
  });

  describe('Different services have independent circuits', () => {
    it('should not affect interview-service when user-service circuit is open', async () => {
      const token = generateHrJwt();

      // Open user-service circuit directly
      const userCircuit = circuitBreakerRegistry.get('user-service');
      expect(userCircuit).toBeDefined();
      const failingFn = () => Promise.reject(new Error('simulated failure'));
      for (let i = 0; i < 6; i++) {
        try {
          await userCircuit!.execute(failingFn);
        } catch {}
      }
      expect(userCircuit!.getState()).toBe(CircuitState.OPEN);

      // Interview-service should still work (independent circuit)
      nock('http://localhost:8003')
        .get(/\/api\/templates/)
        .reply(200, { items: [], total: 0, page: 1, limit: 10 });

      const res = await request(app.getHttpServer())
        .get('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('items');

      // Interview circuit should still be CLOSED
      const interviewCircuit = circuitBreakerRegistry.get('interview-service');
      if (interviewCircuit) {
        expect(interviewCircuit.getState()).toBe(CircuitState.CLOSED);
      }
    });
  });

  describe('Circuit breaker health endpoint', () => {
    it('should expose circuit breaker states via health endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/health/circuits')
        .expect(200);

      expect(res.body).toHaveProperty('circuits');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should show circuit stats including failure count', async () => {
      // Verify that the circuits endpoint returns meaningful stats
      const circuit = circuitBreakerRegistry.get('user-service');
      expect(circuit).toBeDefined();

      // Verify initial state
      const stats = circuit!.getStats();
      expect(stats.state).toBe('CLOSED');
      expect(stats.failureCount).toBe(0);

      const res = await request(app.getHttpServer())
        .get('/health/circuits')
        .expect(200);

      expect(res.body.circuits).toHaveProperty('user-service');
      expect(res.body.circuits['user-service']).toHaveProperty('state');
      expect(res.body.circuits['user-service']).toHaveProperty('failureCount');
      expect(res.body.circuits['user-service']).toHaveProperty(
        'recentFailures',
      );
    });
  });
});
