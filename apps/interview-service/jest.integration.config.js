module.exports = {
  displayName: 'interview-service:integration',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  coverageDirectory: 'coverage/integration',
  testMatch: ['**/test/integration/**/*.spec.ts'],
  testTimeout: 30000, // 30 seconds (DB initialization can take time)
  maxWorkers: 1, // Run tests sequentially to avoid DB conflicts
  forceExit: true, // Force exit after tests (NestJS/TypeORM keep connections open)
  setupFilesAfterEnv: ['<rootDir>/test/integration/jest.setup.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
