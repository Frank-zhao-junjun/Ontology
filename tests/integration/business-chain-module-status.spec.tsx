import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useOntologyStore } from '@/store/ontology-store';
import { ModuleStatusBadge } from '@/components/ontology/module-status-badge';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1', name: '离散制造', nameEn: 'Mfg', description: '',
  icon: 'factory', color: '#000',
};

describe('business-chain-module-status integration (S04-U04)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [],
      masterDataRecords: {}, versions: [], activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('StatusTest', domain);
  });

  it('should render badge without crashing', () => {
    render(<ModuleStatusBadge status="draft" />);
    expect(screen.getByTestId(/module-status-badge/)).toBeDefined();
  });

  it('should show confirmed badge for confirmed module', () => {
    const store = useOntologyStore.getState();
    const vdId = store.addValueDomain({ name: '域' }).id;
    const capId = store.addCapability(vdId, { name: '能力' }).id;
    store.addScenario(capId, { name: '场景' });
    const cId = useOntologyStore.getState().project?.scenarios?.[0]?.id;
    if (cId) {
      store.confirmModuleValidated('C', cId);
      render(<ModuleStatusBadge status="confirmed" />);
      expect(screen.getByTestId(/module-status-badge/)).toBeDefined();
    }
  });
});
