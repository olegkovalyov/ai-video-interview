import { CircuitBreaker, CircuitState, CircuitBreakerError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let circuit: CircuitBreaker;

  beforeEach(() => {
    circuit = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,        // Быстрее для тестов
      resetTimeout: 1000,  // Быстрее для тестов
      name: 'test-circuit',
    });
  });

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(circuit.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute successful requests', async () => {
      const result = await circuit.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
      expect(circuit.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open after threshold failures', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));

      // Execute 3 failing requests
      for (let i = 0; i < 3; i++) {
        try {
          await circuit.execute(failingFn);
        } catch {}
      }

      expect(circuit.getState()).toBe(CircuitState.OPEN);
    });

    it('should timeout slow requests', async () => {
      const slowFn = () =>
        new Promise((resolve) => setTimeout(resolve, 200));

      await expect(circuit.execute(slowFn)).rejects.toThrow('timeout');
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      // Force circuit to OPEN
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuit.execute(failingFn);
        } catch {}
      }
    });

    it('should fail fast when OPEN', async () => {
      const start = Date.now();

      await expect(
        circuit.execute(() => Promise.resolve('ok')),
      ).rejects.toThrow(CircuitBreakerError);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50); // Instant fail
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Circuit should now be HALF_OPEN
      const result = await circuit.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      // Open circuit
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuit.execute(failingFn);
        } catch {}
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    it('should close after successful requests', async () => {
      const successFn = () => Promise.resolve('success');

      // Execute successThreshold (2) successful requests
      await circuit.execute(successFn);
      await circuit.execute(successFn);

      expect(circuit.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen on failure', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));

      try {
        await circuit.execute(failingFn);
      } catch {}

      expect(circuit.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistics', () => {
    it('should track failures', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));

      try {
        await circuit.execute(failingFn);
      } catch {}

      const stats = circuit.getStats();
      expect(stats.recentFailures).toBe(1);
    });

    it('should reset statistics when closed', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));

      // Cause failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuit.execute(failingFn);
        } catch {}
      }

      // Wait and recover
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await circuit.execute(() => Promise.resolve('ok'));
      await circuit.execute(() => Promise.resolve('ok'));

      const stats = circuit.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.recentFailures).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should reset circuit to CLOSED', async () => {
      // Open circuit
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuit.execute(failingFn);
        } catch {}
      }

      expect(circuit.getState()).toBe(CircuitState.OPEN);

      // Reset
      circuit.reset();

      expect(circuit.getState()).toBe(CircuitState.CLOSED);
      const stats = circuit.getStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.recentFailures).toBe(0);
    });
  });
});
