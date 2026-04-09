module.exports = {
  displayName: "ai-analysis-service:e2e",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  rootDir: ".",
  coverageDirectory: "coverage/e2e",
  testRegex: ".e2e-spec.ts$",
  roots: ["<rootDir>/test/"],
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  setupFilesAfterEnv: ["<rootDir>/test/e2e/jest.setup.ts"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
