import { vi } from 'vitest';

export const toastError = vi.fn();
export const toastSuccess = vi.fn();
export const toastWarning = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
    warning: (...args: unknown[]) => toastWarning(...args),
  },
}));
