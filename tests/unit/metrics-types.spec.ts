import { describe, it, expect } from 'vitest';
import type { MetricsModel, BusinessMetric } from '@/types/ontology';

describe('MetricsModel types', () => {
  it('should define BusinessMetric with formula and boundActionId', () => {
    const m: BusinessMetric = {
      id: 'm1', name: 'on-time-rate', nameEn: 'onTimeRate',
      formula: 'completedOnTime / totalOrders * 100',
      unit: '%',
      boundActionId: 'a1',
      measurementType: 'automatic',
    };
    expect(m.formula).toBe('completedOnTime / totalOrders * 100');
    expect(m.boundActionId).toBe('a1');
  });

  it('should define MetricsModel with metrics array', () => {
    const mm: MetricsModel = {
      id: 'mm1', name: 'metrics', version: '1.0.0', domain: 'mfg',
      metrics: [], createdAt: '2026-01-01', updatedAt: '2026-01-01',
    };
    expect(mm.metrics).toEqual([]);
  });
});
