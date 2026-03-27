import { AsyncLocalStorage } from 'async_hooks';

export const correlationStore = new AsyncLocalStorage<{
  correlationId: string;
}>();
