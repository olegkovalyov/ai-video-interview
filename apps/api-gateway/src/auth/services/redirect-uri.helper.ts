import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Helper service для управления redirect URIs
 * Централизованная логика формирования redirect URLs
 */
@Injectable()
export class RedirectUriHelper {
  private readonly frontendOrigin: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendOrigin = 
      this.configService.get<string>('NEXT_PUBLIC_WEB_ORIGIN') || 
      'http://localhost:3000';
  }

  /**
   * Получает дефолтный callback URI
   */
  getDefaultCallbackUri(): string {
    return `${this.frontendOrigin}/auth/callback`;
  }

  /**
   * Получает актуальный redirect URI (переданный или дефолтный)
   */
  getActualRedirectUri(providedUri?: string): string {
    return providedUri || this.getDefaultCallbackUri();
  }

  /**
   * Получает post-logout redirect URI
   */
  getPostLogoutRedirectUri(): string {
    return `${this.frontendOrigin}/`;
  }

  /**
   * Получает frontend origin
   */
  getFrontendOrigin(): string {
    return this.frontendOrigin;
  }
}
