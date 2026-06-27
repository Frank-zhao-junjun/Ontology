import { describe, expect, it } from 'vitest';
import { ALLOWED_ACTION_NAMES } from '@/lib/copilot/actions-registry';

describe('ALLOWED_ACTION_NAMES — TC-09', () => {
  it('does not include delete* actions', () => {
    expect(ALLOWED_ACTION_NAMES.some((n) => /delete/i.test(n))).toBe(false);
  });

  it('includes core write actions', () => {
    expect(ALLOWED_ACTION_NAMES).toContain('createValueDomain');
    expect(ALLOWED_ACTION_NAMES).toContain('generateEpcStepsFromText');
    expect(ALLOWED_ACTION_NAMES).toContain('updateModuleDraft');
  });
});
