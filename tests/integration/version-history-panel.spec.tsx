import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { VersionHistoryPanel } from '@/components/ontology/version-history-panel';
import type { ModuleVersionRecord } from '@/types/ontology';

const versions: ModuleVersionRecord[] = [
  {
    id: 'd1',
    moduleKind: 'A',
    moduleId: 'a1',
    status: 'draft',
    createdAt: '2026-06-18T12:00:00.000Z',
    snapshot: { name: 'draft' },
  },
  {
    id: 'c1',
    moduleKind: 'A',
    moduleId: 'a1',
    status: 'confirmed',
    version: 'v2',
    createdAt: '2026-06-18T11:00:00.000Z',
    snapshot: { name: 'v2' },
  },
  {
    id: 'a1',
    moduleKind: 'A',
    moduleId: 'a1',
    status: 'archived',
    version: 'v1',
    createdAt: '2026-06-18T10:00:00.000Z',
    snapshot: { name: 'v1' },
  },
];

describe('VersionHistoryPanel (US-S14-U03)', () => {
  it('should list versions and mark current confirmed', () => {
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => undefined}
        kind="A"
        moduleId="a1"
        versions={versions}
        latestConfirmedVersion="v2"
      />,
    );

    expect(screen.getByTestId('version-history-panel')).toBeInTheDocument();
    expect(screen.getByTestId('version-history-row-v2')).toBeInTheDocument();
    expect(screen.getByTestId('version-history-row-v2-star')).toBeInTheDocument();
    expect(screen.getByTestId('version-history-row-v1')).toBeInTheDocument();
  });

  it('should trigger view on archived row', () => {
    const onViewSnapshot = vi.fn();
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => undefined}
        kind="A"
        moduleId="a1"
        versions={versions}
        latestConfirmedVersion="v2"
        onViewSnapshot={onViewSnapshot}
      />,
    );

    fireEvent.click(screen.getByTestId('version-history-row-v1-view'));
    expect(onViewSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ version: 'v1', status: 'archived' }),
    );
  });

  it('should sort rows draft → confirmed → archived after second confirm', () => {
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => undefined}
        kind="A"
        moduleId="a1"
        versions={versions}
        latestConfirmedVersion="v2"
      />,
    );

    const rows = within(screen.getByTestId('version-history-list'))
      .getAllByTestId(/^version-history-row-/)
      .filter((row) => !row.getAttribute('data-testid')!.endsWith('-star'));
    expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
      'version-history-row-draft',
      'version-history-row-v2',
      'version-history-row-v1',
    ]);
  });
});
