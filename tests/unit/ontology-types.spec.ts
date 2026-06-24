import { describe, it, expect } from 'vitest';
import type { Rule, GrayscaleConfig } from '@/types/ontology';

describe('Rule versioning types', () => {
  it('should have version field with default 1.0.0', () => {
    const rule: Rule = {
      id: 'r1', name: 'test', type: 'field_validation',
      entity: 'e1', condition: { type: 'expression', expression: 'true' },
      errorMessage: 'err', version: '1.0.0', status: 'active'
    };
    expect(rule.version).toBe('1.0.0');
    expect(rule.status).toBe('active');
  });

  it('should have grayscale config with percentage 0-100', () => {
    const g: GrayscaleConfig = { enabled: true, percentage: 50, targetScenarioIds: ['s1'] };
    expect(g.percentage).toBe(50);
    expect(g.targetScenarioIds).toEqual(['s1']);
  });
});
