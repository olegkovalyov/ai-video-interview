import * as nock from 'nock';

// Set longer timeout for E2E tests
jest.setTimeout(15000);

// Disable real HTTP connections except to localhost (for supertest)
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
  nock.restore();
});
