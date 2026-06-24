import { describe, it, expect } from 'vitest';
import type { SideEffect, RetryPolicy } from '@/types/ontology';

describe('SideEffect types', () => {
  it('should define SideEffect with type and async flag', () => {
    const se: SideEffect = {
      id: 'se1', type: 'notification', description: 'send email',
      async: true,
      retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
      config: { template: 'ship.tpl' },
    };
    expect(se.type).toBe('notification');
    expect(se.async).toBe(true);
    expect(se.retryPolicy?.maxAttempts).toBe(3);
  });

  it('should accept all side effect types', () => {
    const types: SideEffect['type'][] = ['notification', 'sync', 'log', 'webhook'];
    expect(types).toHaveLength(4);
  });

  it('should define RetryPolicy', () => {
    const rp: RetryPolicy = { maxAttempts: 5, backoffMs: 2000 };
    expect(rp.maxAttempts).toBe(5);
    expect(rp.backoffMs).toBe(2000);
  });
});
