import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ElementCoverageBadge } from '@/components/ontology/element-coverage-badge';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, MetaElement } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('ElementCoverageBadge (US-S18-U04)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('Badge测试', domain);
  });

  it('should show 未覆盖 for unreferenced element', () => {
    const el: MetaElement = { id: 'e1', name: '订单', dimension: 'E1' };
    render(<ElementCoverageBadge element={el} />);
    expect(screen.getByTestId('coverage-badge-e1')).toHaveTextContent('未覆盖');
    expect(screen.getByTestId('coverage-badge-e1')).toHaveAttribute('data-covered', 'false');
  });

  it('should show 已覆盖 when referenced by confirmed EPC', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });
    store.confirmModule('C', c.id);
    store.confirmModule('EPC', epc.id);

    const el: MetaElement = {
      id: 'e1',
      name: '订单',
      dimension: 'E1',
      usageRefs: [{ epcId: epc.id, stepId: 's1', scenarioId: c.id, versionPin: 'latest_confirmed' }],
    };

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: [el],
        epcProcesses: [{ ...epc, steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }] }],
      },
    });

    render(<ElementCoverageBadge element={el} />);
    expect(screen.getByTestId('coverage-badge-e1')).toHaveTextContent('已覆盖');
    expect(screen.getByTestId('coverage-badge-e1')).toHaveAttribute('data-covered', 'true');
  });
});
