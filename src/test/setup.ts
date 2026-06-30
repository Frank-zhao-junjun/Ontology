import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// MSW server for API mocking
import { server } from '../test/mocks/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// NOTE: Do NOT mock global.fetch — MSW already intercepts fetch at the network
// level. Mocking fetch breaks MSW and prevents integration tests from making real
// HTTP requests to a running dev server. Components that need fetch stubbed
// should use MSW handlers (src/test/mocks/handlers.ts) instead.

// Mock ResizeObserver for antd/cmdk components (must be a class for `new`)
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock console.error to reduce noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {});

// Setup environment variables
process.env.COZE_WORKSPACE_PATH = '/workspace/projects';
process.env.DEPLOY_RUN_PORT = '5000';
process.env.COZE_PROJECT_ENV = 'DEV';
