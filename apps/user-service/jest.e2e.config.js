module.exports = {
  displayName: 'user-service:e2e',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  coverageDirectory: 'coverage/e2e',
  testMatch: ['**/test/e2e/**/*.e2e-spec.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid DB conflicts
  setupFilesAfterEnv: ['<rootDir>/test/e2e/jest.setup.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
