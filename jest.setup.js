// Load environment variables for testing
require('dotenv').config({ path: './examples/.env' });

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
