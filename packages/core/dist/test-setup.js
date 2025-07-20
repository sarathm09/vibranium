"use strict";
/**
 * Test setup for core package
 */
// Mock external dependencies
jest.mock('@vibraniumjs/http-client');
jest.mock('@vibraniumjs/utils');
// Global test configuration
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TEST_API_URL = 'https://api.test.com';
process.env.TEST_TOKEN = 'test-token-123';
// Mock timers
beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});
afterEach(() => {
    jest.restoreAllMocks();
});
//# sourceMappingURL=test-setup.js.map