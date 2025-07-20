// Jest setup file for workspace-wide test configuration

// Global test setup
beforeAll(() => {
    // Add any global setup logic here
});

afterAll(() => {
    // Add any global cleanup logic here
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(30000);

// Global mocks and utilities can be added here
global.console = {
    ...console,
    // Uncomment to suppress console logs during tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};