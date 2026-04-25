// @ts-check
import nestConfig from '@repo/eslint-config/nest';

export default [
  ...nestConfig({ tsconfigRootDir: import.meta.dirname }),

  // ──────────────────────────────────────────────────────────────────
  // Ratchet lock — rules that have reached 0 violations are promoted to
  // `error` so any future regression fails CI. One-way movement: a rule
  // can go warn→error, never error→warn. See root CLAUDE.md hard limits.
  //
  // Locked in:
  //   - 5.3.A: max-classes-per-file
  //   - Phase 5.2: max-params
  //   - 5.3.C: max-lines-per-function, complexity, sonarjs/cognitive-complexity
  //
  // `max-depth` keeps 2 pre-existing violations — promote in 5.3.D
  // when aggregate complexity is reduced.
  // ──────────────────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    rules: {
      'max-classes-per-file': ['error', 1],
      'max-params': ['error', 4],
      'max-lines-per-function': [
        'error',
        { max: 30, skipComments: true, skipBlankLines: true, IIFEs: true },
      ],
      complexity: ['error', 10],
      'sonarjs/cognitive-complexity': ['error', 10],
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // Per-service overrides — placed AFTER the ratchet so they relax it
  // for the controller layer only. NestJS Swagger decorators (@ApiResponse,
  // @ApiQuery, @ApiBody, ...) sit between the controller method signature
  // and its body, so ESLint counts them toward `max-lines-per-function`.
  // Real handler logic in this codebase is short (5–15 lines after the
  // 5.3.F try/catch removal); the long line counts are documentation,
  // not procedural code. Aggregates / handlers / services keep the
  // strict 30-line cap.
  // ──────────────────────────────────────────────────────────────────
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
  // Re-disable ratchet rules for test files and migrations (the base
  // nest config already exempts them, but our `src/**/*.ts` ratchet
  // above is broader and re-promotes them). Order matters: this block
  // must come AFTER the ratchet to win the cascade.
  // ──────────────────────────────────────────────────────────────────
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/__tests__/**/*.ts',
      '**/test/**/*.ts',
      '**/migrations/*.ts',
    ],
    rules: {
      'max-lines-per-function': 'off',
      complexity: 'off',
      'sonarjs/cognitive-complexity': 'off',
      'max-classes-per-file': 'off',
      'max-params': 'off',
    },
  },
];
