// @ts-check
import nestConfig from '@repo/eslint-config/nest';

export default [
  ...nestConfig({ tsconfigRootDir: import.meta.dirname }),

  // ──────────────────────────────────────────────────────────────────
  // Per-service overrides
  // ──────────────────────────────────────────────────────────────────

  // NestJS Swagger decorators (@ApiResponse, @ApiQuery, @ApiBody, ...) sit
  // between the controller method signature and its body, so ESLint counts
  // them toward `max-lines-per-function`. Real handler logic in this
  // codebase is short (5–15 lines after the 5.3.F try/catch removal); the
  // long line counts are documentation, not procedural code.
  // Relax the limit for controllers only — aggregates / handlers / services
  // keep the strict 30-line cap.
  {
    files: ['src/infrastructure/http/controllers/**/*.ts'],
    rules: {
      'max-lines-per-function': [
        'warn',
        { max: 100, skipComments: true, skipBlankLines: true, IIFEs: true },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // Ratchet lock — rules that have reached 0 violations are promoted to
  // `error` so any future regression fails CI. One-way movement: a rule
  // can go warn→error, never error→warn. See root CLAUDE.md hard limits.
  // ──────────────────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    rules: {
      'max-classes-per-file': ['error', 1], // locked after sub-phase 5.3.A
      'max-params': ['error', 4], // locked after Phase 5.2
      // `max-depth` keeps 2 pre-existing violations — promote in 5.3.D
      // when aggregate complexity is reduced.
    },
  },
];
