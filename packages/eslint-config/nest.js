// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import boundaries from "eslint-plugin-boundaries";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint configuration for NestJS backend services (DDD + CQRS).
 * Enforces hard limits from root CLAUDE.md + layer boundaries + TypeScript safety.
 *
 * Usage in a service's eslint.config.mjs:
 *
 *   import nestConfig from '@repo/eslint-config/nest';
 *   export default nestConfig({ tsconfigRootDir: import.meta.dirname });
 *
 * @param {{ tsconfigRootDir: string }} opts
 * @returns {import('typescript-eslint').ConfigArray}
 */
export default function nestConfig(opts) {
  return tseslint.config(
    {
      ignores: [
        "eslint.config.mjs",
        "jest.config.js",
        "jest.*.config.js",
        "dist/**",
        "coverage/**",
        "*.generated.ts",
      ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    // @ts-expect-error — sonarjs flat config export typing lag
    sonarjs.configs.recommended,
    // @ts-expect-error — unicorn flat config export typing lag
    unicorn.configs["flat/recommended"],
    eslintPluginPrettierRecommended,

    // ──────────────────────────────────────────────────────────────────
    // Base language options (NestJS is Node.js runtime)
    // ──────────────────────────────────────────────────────────────────
    {
      languageOptions: {
        globals: { ...globals.node, ...globals.jest },
        sourceType: "commonjs",
        parserOptions: {
          projectService: true,
          tsconfigRootDir: opts.tsconfigRootDir,
        },
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // Plugin: eslint-plugin-boundaries — DDD layer separation
    // Domain → zero framework deps.
    // Application → depends on domain only.
    // Infrastructure → depends on domain + application.
    // ──────────────────────────────────────────────────────────────────
    {
      plugins: { boundaries },
      settings: {
        "boundaries/elements": [
          { type: "domain", pattern: "src/domain/**" },
          { type: "application", pattern: "src/application/**" },
          { type: "infrastructure", pattern: "src/infrastructure/**" },
          { type: "config", pattern: "src/config/**" },
          { type: "root", pattern: "src/*.ts" },
        ],
        "boundaries/include": ["src/**/*"],
      },
      rules: {
        "boundaries/element-types": [
          "error",
          {
            default: "disallow",
            rules: [
              { from: "domain", allow: ["domain"] },
              {
                from: "application",
                allow: ["domain", "application", "config"],
              },
              {
                from: "infrastructure",
                allow: ["domain", "application", "infrastructure", "config"],
              },
              { from: "config", allow: ["config"] },
              {
                from: "root",
                allow: ["domain", "application", "infrastructure", "config"],
              },
            ],
          },
        ],
        // Domain layer must not import framework packages
        "boundaries/external": [
          "error",
          {
            default: "allow",
            rules: [
              {
                from: ["domain"],
                disallow: [
                  "@nestjs/*",
                  "typeorm",
                  "kafkajs",
                  "bullmq",
                  "stripe",
                  "ioredis",
                  "groq-sdk",
                  "axios",
                ],
              },
            ],
          },
        ],
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // Hard limits from root CLAUDE.md
    // Currently WARN during migration — raise to ERROR per-service
    // once the codebase fits within them.
    //
    // NOTE: we intentionally do NOT enforce a `max-lines` rule on files.
    // Rich aggregates with state machines + events legitimately run
    // 500–800 lines; splitting is artificial and hurts readability.
    // God-object detection relies on `max-classes-per-file`,
    // `sonarjs/cognitive-complexity`, and `max-lines-per-function`
    // instead of a raw line count. Review catches the rest.
    // ──────────────────────────────────────────────────────────────────
    {
      rules: {
        "max-lines-per-function": [
          "warn",
          { max: 30, skipComments: true, skipBlankLines: true, IIFEs: true },
        ],
        "max-params": ["warn", 4],
        "max-depth": ["warn", 3],
        "max-classes-per-file": ["warn", 1],
        complexity: ["warn", 10],
        "sonarjs/cognitive-complexity": ["warn", 10],
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // TypeScript type-safety
    // ERROR = critical correctness / safety (async, strict typing core).
    // WARN  = tech-debt to fix gradually (work with `any` values, legacy patterns).
    // Raise WARN to ERROR per-service once the codebase is cleaned up.
    // ──────────────────────────────────────────────────────────────────
    {
      rules: {
        // critical: stay as error
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "no-console": "error",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],

        // tech-debt: warn while we migrate legacy code
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/require-await": "warn",
        "@typescript-eslint/unbound-method": "warn",
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // Unicorn tuning — some defaults too opinionated for our stack
    // ──────────────────────────────────────────────────────────────────
    {
      rules: {
        "unicorn/prevent-abbreviations": "off", // we use `repo`, `dto`, `vo`, etc. domain terms
        "unicorn/no-null": "off", // TypeORM uses null
        "unicorn/filename-case": ["error", { cases: { kebabCase: true } }], // *.handler.ts etc
        "unicorn/prefer-module": "off", // NestJS uses CommonJS
        "unicorn/prefer-top-level-await": "off", // NestJS bootstrap not top-level await
        "unicorn/no-array-reduce": "off", // reduce is fine
        "unicorn/no-useless-undefined": "off", // NestJS DI often needs explicit undefined
        "unicorn/no-array-for-each": "off", // forEach is fine for side effects
        // Dangerous auto-fix — turns `if (entity.size)` into `if (entity.size > 0)`
        // for string-typed fields (e.g., enum-backed columns). Runtime behavior changes silently.
        "unicorn/explicit-length-check": "off",
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // Test files — relax rules (mocks, setup scripts, long describe blocks)
    // ──────────────────────────────────────────────────────────────────
    {
      files: [
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/__tests__/**/*.ts",
        "**/test/**/*.ts",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/require-await": "off",
        "max-lines-per-function": "off",
        "max-params": "off",
        "max-classes-per-file": "off",
        complexity: "off",
        "sonarjs/no-duplicate-string": "off",
        "sonarjs/cognitive-complexity": "off",
        "sonarjs/no-nested-functions": "off",
        "unicorn/consistent-function-scoping": "off",
        "no-console": "off",
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // Migrations — auto-generated, don't enforce style.
    // TypeORM migration filenames encode a timestamp + PascalCase class
    // name and are part of the migration history (DB tracks them).
    // Renaming would desync from the `migrations` table.
    // ──────────────────────────────────────────────────────────────────
    {
      files: ["**/migrations/*.ts"],
      rules: {
        "max-lines-per-function": "off",
        "sonarjs/no-duplicate-string": "off",
        "unicorn/filename-case": "off",
      },
    },

    // ──────────────────────────────────────────────────────────────────
    // Comment tags — we use `TODO(#issue):` as the canonical pattern for
    // tracked follow-ups. Core `no-warning-comments` is already disabled
    // by default; sonarjs/todo-tag is redundant and over-zealous.
    // ──────────────────────────────────────────────────────────────────
    {
      rules: {
        "sonarjs/todo-tag": "off",
      },
    },
  );
}
