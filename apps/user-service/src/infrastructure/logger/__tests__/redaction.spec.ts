import {
  readRedactionMode,
  redactEmail,
  redactPIIFields,
  type RedactionMode,
} from '../redaction';

describe('redaction', () => {
  describe('readRedactionMode', () => {
    const ORIGINAL_ENV = process.env.NODE_ENV;
    const ORIGINAL_MODE = process.env.LOG_PII_REDACTION_MODE;

    afterEach(() => {
      process.env.NODE_ENV = ORIGINAL_ENV;
      if (ORIGINAL_MODE === undefined)
        delete process.env.LOG_PII_REDACTION_MODE;
      else process.env.LOG_PII_REDACTION_MODE = ORIGINAL_MODE;
    });

    it('honors explicit hash mode', () => {
      process.env.LOG_PII_REDACTION_MODE = 'hash';
      expect(readRedactionMode()).toBe('hash');
    });

    it('honors explicit strip mode', () => {
      process.env.LOG_PII_REDACTION_MODE = 'strip';
      expect(readRedactionMode()).toBe('strip');
    });

    it('honors explicit off mode', () => {
      process.env.LOG_PII_REDACTION_MODE = 'off';
      expect(readRedactionMode()).toBe('off');
    });

    it('defaults to hash in production when not set', () => {
      delete process.env.LOG_PII_REDACTION_MODE;
      process.env.NODE_ENV = 'production';
      expect(readRedactionMode()).toBe('hash');
    });

    it('defaults to off in development when not set', () => {
      delete process.env.LOG_PII_REDACTION_MODE;
      process.env.NODE_ENV = 'development';
      expect(readRedactionMode()).toBe('off');
    });
  });

  describe('redactEmail', () => {
    const email = 'John.Doe@gmail.com';

    it('returns input unchanged when mode=off', () => {
      expect(redactEmail(email, 'off')).toBe(email);
    });

    it('returns undefined when mode=strip', () => {
      expect(redactEmail(email, 'strip')).toBeUndefined();
    });

    it('returns deterministic sha256 prefix + open domain when mode=hash', () => {
      const a = redactEmail(email, 'hash');
      const b = redactEmail(email, 'hash');
      expect(a).toBe(b);
      expect(a).toMatch(/^sha256:[\da-f]{16}@gmail\.com$/);
    });

    it('normalizes case + whitespace before hashing', () => {
      const lowered = redactEmail('  john.doe@gmail.com  ', 'hash');
      // Domain part comes from raw input (preserves caller-visible form);
      // hash uses normalized input so case doesn't fragment the pseudonym.
      expect(lowered).toContain('@gmail.com');
      const upper = redactEmail('JOHN.DOE@GMAIL.COM', 'hash');
      // hash prefix should match (same lowercase input ⇒ same digest).
      const hashPrefixOf = (s: string | undefined): string =>
        (s ?? '').slice(7, 23); // 'sha256:' is 7 chars
      expect(hashPrefixOf(lowered)).toBe(hashPrefixOf(upper));
    });

    it('returns undefined for malformed input (no @)', () => {
      expect(redactEmail('not-an-email', 'hash')).toBeUndefined();
    });
  });

  describe('redactPIIFields', () => {
    const baseCtx = { correlationId: 'cid-1', userId: 'u1' };

    it('returns object unchanged when mode=off', () => {
      const ctx = { ...baseCtx, userEmail: 'a@b.com' };
      expect(redactPIIFields(ctx, 'off')).toBe(ctx);
    });

    it('hashes userEmail in mode=hash', () => {
      const ctx = { ...baseCtx, userEmail: 'a@b.com' };
      const out = redactPIIFields(ctx, 'hash');
      expect(out.userEmail).toMatch(/^sha256:[\da-f]{16}@b\.com$/);
      // does not mutate input
      expect(ctx.userEmail).toBe('a@b.com');
    });

    it('strips userEmail in mode=strip', () => {
      const ctx = { ...baseCtx, userEmail: 'a@b.com' };
      const out = redactPIIFields(ctx, 'strip');
      expect(out.userEmail).toBeUndefined();
      expect('userEmail' in out).toBe(false);
    });

    it('also redacts the email field (Kafka payload echo)', () => {
      const ctx = { ...baseCtx, email: 'x@y.com' };
      const out = redactPIIFields(ctx, 'hash');
      expect(out.email).toMatch(/^sha256:[\da-f]{16}@y\.com$/);
    });

    it('leaves non-string PII fields alone', () => {
      const ctx = { ...baseCtx, userEmail: undefined };
      const out = redactPIIFields(ctx, 'hash');
      expect(out.userEmail).toBeUndefined();
    });
  });

  describe('mode contract', () => {
    it('every RedactionMode literal is handled', () => {
      const modes: RedactionMode[] = ['off', 'hash', 'strip'];
      for (const m of modes) {
        expect(() => redactEmail('a@b.com', m)).not.toThrow();
      }
    });
  });
});
