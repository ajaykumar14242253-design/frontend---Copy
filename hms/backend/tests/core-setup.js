import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockVerify = jest.fn();
const mockJwt = { verify: mockVerify };

jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt, jwt: mockJwt }));
jest.unstable_mockModule('../config/db.js', () => ({
  query: mockQuery,
  pool: { query: mockQuery },
}));

process.env.JWT_SECRET = 'test_secret_key_2024_hms_backend';
process.env.NODE_ENV = 'test';

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  jest.resetModules();
});
