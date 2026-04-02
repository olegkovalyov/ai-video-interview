module.exports = {
  testEnvironment: "node",
  testRegex: "test/system/scenarios/.*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testTimeout: 60000,
  maxWorkers: 1, // Sequential — services share state
  setupFilesAfterSetup: ["./jest.setup.ts"],
};
