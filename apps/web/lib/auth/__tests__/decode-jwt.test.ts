import { describe, it, expect } from 'vitest';
import { decodeJwtPayload, extractAppRoles, isTokenExpired, isPendingOnly } from '../decode-jwt';

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const token = makeToken({ sub: 'user-1', email: 'test@example.com' });
    const payload = decodeJwtPayload(token);
    expect(payload).toEqual(expect.objectContaining({ sub: 'user-1', email: 'test@example.com' }));
  });

  it('returns null for invalid token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('')).toBeNull();
    expect(decodeJwtPayload('a.b')).toBeNull();
  });

  it('returns null for malformed base64', () => {
    expect(decodeJwtPayload('header.!!!invalid!!!.sig')).toBeNull();
  });
});

describe('extractAppRoles', () => {
  it('extracts app roles from payload', () => {
    const payload = { realm_access: { roles: ['admin', 'hr', 'offline_access', 'uma_authorization'] } };
    expect(extractAppRoles(payload)).toEqual(['admin', 'hr']);
  });

  it('returns empty array when no roles', () => {
    expect(extractAppRoles({})).toEqual([]);
    expect(extractAppRoles({ realm_access: { roles: [] } })).toEqual([]);
  });

  it('filters out non-app roles', () => {
    const payload = { realm_access: { roles: ['default-roles-realm', 'uma_authorization'] } };
    expect(extractAppRoles(payload)).toEqual([]);
  });
});

describe('isTokenExpired', () => {
  it('returns false for valid token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 600;
    const token = makeToken({ exp: futureExp });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60;
    const token = makeToken({ exp: pastExp });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('respects buffer seconds', () => {
    const nearExp = Math.floor(Date.now() / 1000) + 30;
    const token = makeToken({ exp: nearExp });
    expect(isTokenExpired(token, 0)).toBe(false);
    expect(isTokenExpired(token, 60)).toBe(true);
  });

  it('returns true for invalid token', () => {
    expect(isTokenExpired('invalid')).toBe(true);
  });

  it('returns true for token without exp', () => {
    const token = makeToken({ sub: 'user-1' });
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('isPendingOnly', () => {
  it('returns true when only pending role', () => {
    expect(isPendingOnly(['pending'])).toBe(true);
  });

  it('returns false when other roles present', () => {
    expect(isPendingOnly(['pending', 'candidate'])).toBe(false);
    expect(isPendingOnly(['admin'])).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(isPendingOnly([])).toBe(false);
  });
});
