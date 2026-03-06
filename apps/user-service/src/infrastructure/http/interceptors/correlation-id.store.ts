import { AsyncLocalStorage } from 'async_hooks';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export const correlationStore = new AsyncLocalStorage<{
  correlationId: string;
}>();
