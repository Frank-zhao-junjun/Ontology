import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GovernanceEditor } from '@/components/ontology/governance-editor';
import { useOntologyStore } from '@/store/ontology-store';
import { createFrozenProject } from '../unit/test-helpers';

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

describe('GovernanceEditor — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  it('renders the three governance sections when project has a governance model', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<GovernanceEditor />);

    // Wait for rendering — use regex to handle <code> element splitting DOM text
    await waitFor(() => {
      expect(screen.getByText(/治理层对应 Manifest/)).toBeInTheDocument();
    });

    expect(screen.getByText('角色 (roles)')).toBeInTheDocument();
    expect(screen.getByText('字段权限 (fieldPermissions)')).toBeInTheDocument();
    expect(screen.getByText('Agent 策略 (agentPolicies)')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('allows adding a role and displays it in the list', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<GovernanceEditor />);

    await waitFor(() => {
      expect(screen.getByText('角色 (roles)')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('role-planner'), {
      target: { value: 'role-admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('生产计划员'), {
      target: { value: '管理员' },
    });
    fireEvent.click(screen.getByRole('button', { name: '添加角色' }));

    await waitFor(() => {
      expect(screen.getByText('role-admin')).toBeInTheDocument();
    });

    const gov = useOntologyStore.getState().project?.governanceModel;
    expect(gov?.roles).toHaveLength(1);
    expect(gov?.roles[0].id).toBe('role-admin');
  });

  // -----------------------------------------------------------------------
  it('allows adding a field permission after creating a role', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<GovernanceEditor />);

    await waitFor(() => {
      expect(screen.getByText('角色 (roles)')).toBeInTheDocument();
    });

    // Add a role first so field permission can reference it
    fireEvent.change(screen.getByPlaceholderText('role-planner'), {
      target: { value: 'role-editor' },
    });
    fireEvent.change(screen.getByPlaceholderText('生产计划员'), {
      target: { value: '编辑者' },
    });
    fireEvent.click(screen.getByRole('button', { name: '添加角色' }));

    await waitFor(() => {
      expect(screen.getByText('role-editor')).toBeInTheDocument();
    });

    // Open entity select in field permissions card via combobox
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);

    // Pick the first entity
    const entityOptions = await screen.findAllByText(/合同/);
    fireEvent.click(entityOptions[0]);

    fireEvent.change(screen.getByPlaceholderText('cost_price'), {
      target: { value: 'contractAmount' },
    });

    fireEvent.click(screen.getByRole('button', { name: '添加字段权限' }));

    // Store must contain the new field permission
    await waitFor(() => {
      const gov = useOntologyStore.getState().project?.governanceModel;
      expect(gov?.fieldPermissions).toHaveLength(1);
    });

    // DOM displays "objectTypeId.propertyNameEn ← [roleIds]" — substring match
    expect(screen.getByText(/contractAmount/)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('does not add a role when id or name are empty', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<GovernanceEditor />);

    await waitFor(() => {
      expect(screen.getByText('角色 (roles)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '添加角色' }));

    const gov = useOntologyStore.getState().project?.governanceModel;
    expect(gov?.roles).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  it('disables the agent policy button when no roles exist', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<GovernanceEditor />);

    await waitFor(() => {
      expect(screen.getByText('Agent 策略 (agentPolicies)')).toBeInTheDocument();
    });

    const addPolicyBtn = screen.getByRole('button', { name: '添加 Agent 策略（草稿）' });
    expect(addPolicyBtn).toBeDisabled();
  });
});
