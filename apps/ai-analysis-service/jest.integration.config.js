module.exports = {
  displayName: "ai-analysis-service:integration",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  rootDir: ".",
  coverageDirectory: "coverage/integration",
  testMatch: ["**/test/integration/**/*.spec.ts"],
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  setupFilesAfterEnv: ["<rootDir>/test/integration/jest.setup.ts"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
