import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock fetch
global.fetch = vi.fn();

// Mock console.error to reduce noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {});

// Setup environment variables
process.env.COZE_WORKSPACE_PATH = '/workspace/projects';
process.env.DEPLOY_RUN_PORT = '5000';
process.env.COZE_PROJECT_ENV = 'DEV';
