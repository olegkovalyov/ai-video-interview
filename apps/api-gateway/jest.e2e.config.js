/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/e2e/.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(jose)/)'],
  testEnvironment: 'node',
  testTimeout: 60000,
  moduleNameMapper: {
    '^@repo/shared$': '<rootDir>/../../packages/shared/src',
    '^@repo/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
};
