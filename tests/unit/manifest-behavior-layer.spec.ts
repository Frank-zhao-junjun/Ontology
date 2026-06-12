import { describe, it, expect } from 'vitest';
import { compileBehavior } from '@/lib/manifest-compiler/behavior';
import type { OntologyProject } from '@/types/ontology';

describe('compileBehavior golden test — all B04-B07 layers', () => {
  it('should produce complete ManifestBehavior with all layers populated', () => {
    const project: OntologyProject = {
      id: 'p1',
      name: 'golden-test',
      domain: {
        id: 'd1',
        name: '制造域',
        nameEn: 'manufacturing',
        description: '制造领域模型',
      },
      dataModel: {
        id: 'dm1',
        name: 'data',
        version: '1.0.0',
        domain: 'manufacturing',
        projects: [],
        businessScenarios: [],
        entities: [
          {
            id: 'e1',
            name: '订单',
            nameEn: 'Order',
            type: 'entity',
            isAggregateRoot: true,
            attributes: [],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        enums: [],
        relations: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      } as unknown as OntologyProject['dataModel'],
      behaviorModel: {
        id: 'bm1',
        name: 'behavior',
        version: '1.0.0',
        domain: 'manufacturing',
        stateMachines: [],
        actions: [
          {
            id: 'a1',
            name: '发货',
            nameEn: 'shipOrder',
            actionType: 'custom',
            targetEntityId: 'e1',
            sideEffects: [
              {
                id: 'se1',
                type: 'notification',
                description: '发送发货通知邮件',
                async: true,
                config: { template: 'ship-notification.tpl' },
              },
            ],
          },
        ],
        transactionBoundaries: [
          {
            id: 'tb1',
            name: '订单完成事务',
            nameEn: 'order-completion-tx',
            actionIds: ['a1'],
            aggregateRootIds: ['ar1'],
            isolation: 'serializable',
          },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      } as unknown as OntologyProject['behaviorModel'],
      ruleModel: {
        id: 'rm1',
        name: 'rules',
        version: '1.0.0',
        domain: 'manufacturing',
        rules: [
          {
            id: 'r1',
            name: '数量必须为正',
            type: 'field_validation',
            entity: 'e1',
            condition: { type: 'range', field: 'quantity', min: 1 },
            errorMessage: '数量必须大于0',
            version: '2.1.0',
            status: 'active',
            grayscale: { enabled: true, percentage: 30 },
          },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      } as unknown as OntologyProject['ruleModel'],
      eventModel: null,
      metricsModel: {
        id: 'mm1',
        name: 'metrics',
        version: '1.0.0',
        domain: 'manufacturing',
        metrics: [
          {
            id: 'm1',
            name: '准时完工率',
            nameEn: 'onTimeCompletionRate',
            formula: 'completedOnTime / totalOrders * 100',
            unit: '%',
            boundActionId: 'a1',
            measurementType: 'automatic',
          },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as unknown as OntologyProject;

    const result = compileBehavior(project);

    // B04: rules have version and status
    expect(result.rules).toBeDefined();
    expect(result.rules!.length).toBe(1);
    expect(result.rules![0].version).toBe('2.1.0');
    expect(result.rules![0].status).toBe('active');
    expect(result.rules![0].grayscale).toEqual({ enabled: true, percentage: 30 });

    // B05: metrics populated
    expect(result.metrics).toBeDefined();
    expect(result.metrics!.length).toBe(1);
    expect(result.metrics![0].formula).toBe('completedOnTime / totalOrders * 100');
    expect(result.metrics![0].unit).toBe('%');

    // B06: transactionBoundaries populated
    expect(result.transactionBoundaries).toBeDefined();
    expect(result.transactionBoundaries!.length).toBe(1);
    expect(result.transactionBoundaries![0].isolation).toBe('serializable');
    expect(result.transactionBoundaries![0].actionIds).toEqual(['a1']);

    // B07: sideEffects extracted from actions
    expect(result.sideEffects).toBeDefined();
    expect(result.sideEffects!.length).toBe(1);
    expect(result.sideEffects![0].type).toBe('notification');
    expect(result.sideEffects![0].async).toBe(true);

    // Actions still work
    expect(result.actions).toBeDefined();
    expect(result.actions!.length).toBeGreaterThan(0);
  });

  it('should return empty arrays when no data exists', () => {
    const project: OntologyProject = {
      id: 'p-empty',
      name: 'empty',
      domain: { id: 'd1', name: 'test', nameEn: 'test', description: '' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as unknown as OntologyProject;

    const result = compileBehavior(project);
    expect(result.metrics).toEqual([]);
    expect(result.transactionBoundaries).toEqual([]);
    expect(result.sideEffects).toEqual([]);
    expect(result.rules).toEqual([]);
  });
});
