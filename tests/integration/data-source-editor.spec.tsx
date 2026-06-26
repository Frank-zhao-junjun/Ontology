import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataSourceEditor } from '@/components/ontology/data-source-editor';
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

describe('DataSourceEditor — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  it('renders the data source form when project has a data sources model', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<DataSourceEditor />);

    await waitFor(() => {
      expect(screen.getByText(/数据源对应 Manifest/)).toBeInTheDocument();
    });

    expect(screen.getByText('数据源列表')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ds-sap-po')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '添加数据源' })).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('allows adding an API data source and displays it in the list', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<DataSourceEditor />);

    await waitFor(() => {
      expect(screen.getByText('数据源列表')).toBeInTheDocument();
    });

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('ds-sap-po'), {
      target: { value: 'ds-erp' },
    });
    fireEvent.change(screen.getByPlaceholderText('SAP 生产订单 OData'), {
      target: { value: 'ERP 主数据' },
    });
    // authSecretRef
    fireEvent.change(screen.getByPlaceholderText('secret/sap-oauth-prod'), {
      target: { value: 'secret/erp-oauth' },
    });

    fireEvent.click(screen.getByRole('button', { name: '添加数据源' }));

    await waitFor(() => {
      expect(screen.getByText('ds-erp')).toBeInTheDocument();
    });

    const sources = useOntologyStore.getState().project?.dataSourcesModel?.sources;
    expect(sources).toHaveLength(1);
    expect(sources![0].id).toBe('ds-erp');
    expect(sources![0].api?.authSecretRef).toBe('secret/erp-oauth');
  });

  // -----------------------------------------------------------------------
  it('shows credential error when plain text password is used', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<DataSourceEditor />);

    await waitFor(() => {
      expect(screen.getByText('数据源列表')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('ds-sap-po'), {
      target: { value: 'ds-bad' },
    });
    fireEvent.change(screen.getByPlaceholderText('SAP 生产订单 OData'), {
      target: { value: 'Bad Source' },
    });
    // Try to enter a plain-text password
    fireEvent.change(screen.getByPlaceholderText('secret/sap-oauth-prod'), {
      target: { value: 'mypassword123' },
    });

    // Credential error should appear
    expect(screen.getByText(/请使用 authSecretRef/)).toBeInTheDocument();

    // Adding should still fail because validation prevents it
    fireEvent.click(screen.getByRole('button', { name: '添加数据源' }));

    const sources = useOntologyStore.getState().project?.dataSourcesModel?.sources;
    expect(sources).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  it('shows empty state when no data sources are defined', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<DataSourceEditor />);

    await waitFor(() => {
      expect(screen.getByText('数据源列表')).toBeInTheDocument();
    });

    // No <li> items in the sources list
    const listItems = screen.queryAllByRole('listitem');
    expect(listItems).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  it('allows deleting a data source', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project });

    render(<DataSourceEditor />);

    await waitFor(() => {
      expect(screen.getByText('数据源列表')).toBeInTheDocument();
    });

    // Add a source first
    fireEvent.change(screen.getByPlaceholderText('ds-sap-po'), {
      target: { value: 'ds-deleteme' },
    });
    fireEvent.change(screen.getByPlaceholderText('SAP 生产订单 OData'), {
      target: { value: 'To Delete' },
    });
    fireEvent.change(screen.getByPlaceholderText('secret/sap-oauth-prod'), {
      target: { value: 'secret/foo' },
    });

    fireEvent.click(screen.getByRole('button', { name: '添加数据源' }));

    await waitFor(() => {
      expect(screen.getByText('ds-deleteme')).toBeInTheDocument();
    });

    // Delete it
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    await waitFor(() => {
      const sources = useOntologyStore.getState().project?.dataSourcesModel?.sources;
      expect(sources).toHaveLength(0);
    });
  });
});
