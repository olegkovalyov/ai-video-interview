import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge?: number;
}

export interface AuthTokens {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
}

@Injectable()
export class CookieService {
  private readonly logger = new Logger(CookieService.name);
  private readonly defaultConfig: CookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in prod behind HTTPS
    sameSite: 'lax',
    path: '/',
  };

  /**
   * Парсит cookie из заголовков запроса
   */
  parseCookie(req: Request, cookieName: string): string | undefined {
    const cookies = req.headers.cookie || '';
    const parts = cookies.split(';');
    
    for (const part of parts) {
      const [key, ...rest] = part.split('=');
      if (!key || rest.length === 0) continue;
      
      if (key.trim() === cookieName) {
        const value = rest.join('=').trim();
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Извлекает все auth токены из cookies
   */
  extractAuthTokens(req: Request): AuthTokens {
    return {
      access_token: this.parseCookie(req, 'access_token'),
      refresh_token: this.parseCookie(req, 'refresh_token'),
      id_token: this.parseCookie(req, 'id_token'),
    };
  }

  /**
   * Устанавливает access_token cookie
   */
  setAccessTokenCookie(
    res: Response, 
    token: string, 
    expiresInSeconds: number = 300
  ): void {
    const config = {
      ...this.defaultConfig,
      maxAge: expiresInSeconds * 1000,
    };

    res.cookie('access_token', token, config);
  }

  /**
   * Устанавливает refresh_token cookie
   */
  setRefreshTokenCookie(
    res: Response, 
    token: string, 
    expiresInSeconds: number = 30 * 24 * 60 * 60 // 30 days
  ): void {
    const config = {
      ...this.defaultConfig,
      maxAge: expiresInSeconds * 1000,
    };

    res.cookie('refresh_token', token, config);
  }

  /**
   * Устанавливает id_token cookie
   */
  setIdTokenCookie(
    res: Response, 
    token: string, 
    expiresInSeconds: number = 300
  ): void {
    const config = {
      ...this.defaultConfig,
      maxAge: expiresInSeconds * 1000,
    };

    res.cookie('id_token', token, config);
  }

  /**
   * Устанавливает все auth токены одновременно
   */
  setAuthTokensCookies(
    res: Response,
    tokens: {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_in?: number;
    }
  ): void {
    const accessExpiresIn = tokens.expires_in || 1800; // 30 минут вместо 5
    
    const cookieInfo = {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      has_id_token: !!tokens.id_token,
      expires_in: accessExpiresIn
    };
    this.logger.debug(`Setting auth cookies: ${JSON.stringify(cookieInfo)}`);
    
    this.setAccessTokenCookie(res, tokens.access_token, accessExpiresIn);
    
    if (tokens.refresh_token) {
      this.setRefreshTokenCookie(res, tokens.refresh_token);
    }
    
    if (tokens.id_token) {
      this.setIdTokenCookie(res, tokens.id_token, accessExpiresIn);
    }
    
    this.logger.debug('Auth cookies set successfully');
  }

  /**
   * Очищает все auth cookies
   */
  clearAuthCookies(res: Response): void {
    const clearConfig = {
      ...this.defaultConfig,
      maxAge: 0,
    };

    res.cookie('access_token', '', clearConfig);
    res.cookie('refresh_token', '', clearConfig);
    res.cookie('id_token', '', clearConfig);
  }

  /**
   * Проверяет наличие refresh_token в cookies
   */
  hasRefreshToken(req: Request): boolean {
    return !!this.parseCookie(req, 'refresh_token');
  }

  /**
   * Debug helper - логирует все cookies
   */
  logCookiesDebug(req: Request, prefix = 'Cookies Debug'): void {
    const cookies = req.headers.cookie || '';
    const tokens = this.extractAuthTokens(req);
    
    const debugData = {
      hasCookies: !!cookies,
      cookieLength: cookies.length,
      extractedTokens: {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        has_id_token: !!tokens.id_token,
      }
    };
    
    // NestJS Logger: строка первым параметром, данные вторым
    this.logger.debug(`${prefix}: ${JSON.stringify(debugData)}`);
  }
}
