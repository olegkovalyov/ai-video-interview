module.exports = {
  displayName: "billing-service:e2e",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: "test/e2e/.*\\.e2e-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jose|supertest)/)", // Transform ESM modules
  ],
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.spec.ts",
  ],
  coverageDirectory: "./coverage/e2e",
  testEnvironment: "node",
  roots: ["<rootDir>/test/"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/test/e2e/jest.setup.ts"],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially — shared test database
  forceExit: true, // Force exit after tests (BullMQ/Kafka keep connections open)
};
