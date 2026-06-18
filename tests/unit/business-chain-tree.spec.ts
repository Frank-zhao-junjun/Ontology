import { describe, it, expect } from 'vitest';
import type { BusinessChainSlices } from '@/lib/business-chain/tree';
import {
  buildBusinessChainTree,
  canDeleteBusinessChainNode,
  findBusinessChainNode,
  getBusinessChainDisplayPath,
} from '@/lib/business-chain/tree';

const fixture: BusinessChainSlices = {
  valueDomains: [
    { id: 'a1', name: '生产域' },
    { id: 'a2', name: '销售域' },
  ],
  capabilities: [
    { id: 'b1', name: '计划能力', parentId: 'a1' },
    { id: 'b-orphan', name: '孤儿B', parentId: 'missing-a' },
  ],
  scenarios: [
    { id: 'c1', name: '排产场景', parentId: 'b1' },
    { id: 'c-empty', name: '空场景', parentId: 'b1' },
  ],
  epcProcesses: [
    { id: 'epc1', name: '主排产流程', parentId: 'c1', steps: [] },
  ],
};

describe('business-chain tree lib (US-S04-U01)', () => {
  it('should build strict A→B→C→EPC tree and filter orphan B', () => {
    const tree = buildBusinessChainTree(fixture);
    expect(tree).toHaveLength(2);
    const prod = tree.find((n) => n.id === 'a1');
    expect(prod?.children).toHaveLength(1);
    expect(prod?.children[0].kind).toBe('B');
    expect(prod?.children[0].children[0].kind).toBe('C');
    expect(prod?.children[0].children[0].children[0].kind).toBe('EPC');
    expect(tree.flatMap((a) => a.children).some((b) => b.id === 'b-orphan')).toBe(false);
  });

  it('should return display path as name chain', () => {
    expect(getBusinessChainDisplayPath(fixture, 'EPC', 'epc1')).toBe(
      '生产域/计划能力/排产场景/主排产流程',
    );
    expect(getBusinessChainDisplayPath(fixture, 'A', 'a1')).toBe('生产域');
  });

  it('should find node by kind and id', () => {
    const node = findBusinessChainNode(fixture, 'C', 'c1');
    expect(node?.name).toBe('排产场景');
    expect(findBusinessChainNode(fixture, 'B', 'missing')).toBeUndefined();
  });

  it('should block delete when node has children', () => {
    expect(canDeleteBusinessChainNode(fixture, 'A', 'a1')).toBe(false);
    expect(canDeleteBusinessChainNode(fixture, 'B', 'b1')).toBe(false);
    expect(canDeleteBusinessChainNode(fixture, 'C', 'c1')).toBe(false);
    expect(canDeleteBusinessChainNode(fixture, 'C', 'c-empty')).toBe(true);
    expect(canDeleteBusinessChainNode(fixture, 'EPC', 'epc1')).toBe(true);
  });
});
