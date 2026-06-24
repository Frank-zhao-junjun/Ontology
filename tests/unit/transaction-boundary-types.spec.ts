import { describe, it, expect } from 'vitest';
import type { TransactionBoundary } from '@/types/ontology';

describe('TransactionBoundary types', () => {
  it('should define TransactionBoundary with actionIds and aggregateRootIds', () => {
    const tb: TransactionBoundary = {
      id: 'tb1', name: 'order-tx', nameEn: 'orderTx',
      description: 'Order transaction boundary',
      actionIds: ['a1', 'a2'], aggregateRootIds: ['ar1'],
      isolation: 'serializable', compensationActionId: 'a3',
    };
    expect(tb.actionIds).toEqual(['a1', 'a2']);
    expect(tb.isolation).toBe('serializable');
  });

  it('should accept all isolation levels', () => {
    const levels: TransactionBoundary['isolation'][] = ['read_committed', 'repeatable_read', 'serializable'];
    expect(levels).toHaveLength(3);
  });
});
