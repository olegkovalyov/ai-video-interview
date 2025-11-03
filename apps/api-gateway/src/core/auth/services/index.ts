// Экспортируем классы (не интерфейсы, чтобы избежать конфликтов)
export { AuthOrchestrator } from './auth-orchestrator.service';
export { SessionManager } from './session-manager.service';
export { RedirectUriHelper } from './redirect-uri.helper';

// Re-export Kafka producers for backward compatibility
export { AuthEventPublisher, AuthMethod, LogoutReason } from '../../../kafka/producers';

// Экспортируем типы из orchestrator (используем type для явности)
export type {
  LoginInitiationResult,
  CallbackResult,
  RefreshResult,
  LogoutResult,
} from './auth-orchestrator.service';
