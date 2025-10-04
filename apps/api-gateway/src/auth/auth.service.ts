import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthOrchestrator } from './services/auth-orchestrator.service';

export interface LoginInitiationResult {
  success: boolean;
  authUrl?: string;
  state?: string;
  redirectUri?: string;
  error?: string;
}

export interface CallbackResult {
  success: boolean;
  expiresIn?: number;
  tokenType?: string;
  error?: string;
}

export interface RefreshResult {
  success: boolean;
  expiresIn?: number;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  endSessionEndpoint?: string;
  idToken?: string;
  requiresRedirect?: boolean;
}

/**
 * @deprecated Используйте AuthOrchestrator напрямую
 * Этот сервис оставлен для обратной совместимости
 * Все методы делегируются к AuthOrchestrator
 */
@Injectable()
export class AuthService {
  constructor(private readonly authOrchestrator: AuthOrchestrator) {}

  /**
   * Инициирует OAuth2 login flow
   */
  async initiateLogin(redirectUri?: string): Promise<LoginInitiationResult> {
    return this.authOrchestrator.initiateLogin(redirectUri);
  }

  /**
   * Инициирует OAuth2 registration flow через Keycloak
   */
  async initiateRegister(redirectUri?: string): Promise<LoginInitiationResult> {
    return this.authOrchestrator.initiateRegister(redirectUri);
  }

  /**
   * Обрабатывает OAuth2 callback
   */
  async handleCallback(
    code: string,
    state: string,
    redirectUri: string | undefined,
    res: Response
  ): Promise<CallbackResult> {
    return this.authOrchestrator.handleCallback(code, state, redirectUri, res);
  }

  /**
   * Обновляет токены используя refresh_token из cookies или body
   */
  async refreshTokens(
    req: Request,
    res: Response,
    bodyRefreshToken?: string
  ): Promise<RefreshResult> {
    return this.authOrchestrator.refreshTokens(req, res, bodyRefreshToken);
  }

  /**
   * Выполняет logout - отзывает токены и очищает cookies
   */
  async logout(
    req: Request,
    res: Response,
    bodyTokens?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    }
  ): Promise<LogoutResult> {
    return this.authOrchestrator.logout(req, res, bodyTokens);
  }

  /**
   * Проверяет валидность текущей сессии
   */
  async validateSession(req: Request): Promise<{
    isValid: boolean;
    userInfo?: any;
    error?: string;
  }> {
    return this.authOrchestrator.validateSession(req);
  }
}
