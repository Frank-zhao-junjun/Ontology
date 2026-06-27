import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelingCopilotActions } from '@/components/ontology/copilot/modeling-copilot-actions';
import { BusinessChainTree } from '@/components/ontology/business-chain-tree';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const registeredActions = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (config: { name: string; handler: (...args: unknown[]) => unknown }) => {
    registeredActions.set(config.name, config.handler);
  },
  useCopilotAdditionalInstructions: vi.fn(),
}));

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Manufacturing',
  description: 'test',
  icon: 'factory',
  color: '#000',
};

describe('incremental modeling — TC-02', () => {
  beforeEach(() => {
    registeredActions.clear();
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
    useOntologyStore.getState().createProject('Copilot 集成测试', domain);
  });

  it('createValueDomain action updates store and business chain tree', async () => {
    render(<ModelingCopilotActions />);

    const handler = registeredActions.get('createValueDomain');
    expect(handler).toBeDefined();

    const raw = await handler!({ name: '生产制造', description: '生产相关价值域' });
    const result = JSON.parse(raw as string);

    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains).toHaveLength(1);
    expect(result.name).toBe('生产制造');

    render(<BusinessChainTree />);
    expect(screen.getByTestId(`business-chain-node-A-${result.id}`)).toBeInTheDocument();
  });
});
