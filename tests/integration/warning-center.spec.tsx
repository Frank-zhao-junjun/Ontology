import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WarningCenter } from '@/components/ontology/warning-center';
import type { EpcWarning } from '@/lib/business-epc-linter';

const sampleWarnings: EpcWarning[] = [
  {
    id: 'w1',
    ruleId: 'W-EPC-04',
    level: 'warning',
    message: '场景下没有 EPC',
    moduleKind: 'C',
    moduleId: 'c1',
  },
  {
    id: 'w2',
    ruleId: 'W-EPC-02',
    level: 'warning',
    message: '要素未引用',
    moduleKind: 'E1',
    moduleId: 'el-1',
    elementId: 'el-1',
  },
];

describe('WarningCenter (US-S09-U03)', () => {
  beforeEach(() => {
    // no store needed
  });

  it('should list warnings and filter by rule', () => {
    render(
      <WarningCenter
        warnings={sampleWarnings}
        onNavigate={() => undefined}
      />,
    );

    expect(screen.getByTestId('warning-center')).toBeInTheDocument();
    expect(screen.getByTestId('warning-row-w1')).toBeInTheDocument();
    expect(screen.getByTestId('warning-row-w2')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('warning-filter-W-EPC-02'));
    expect(screen.queryByTestId('warning-row-w1')).not.toBeInTheDocument();
    expect(screen.getByTestId('warning-row-w2')).toBeInTheDocument();
  });

  it('should ignore warning locally', () => {
    render(
      <WarningCenter
        warnings={sampleWarnings}
        onNavigate={() => undefined}
      />,
    );

    fireEvent.click(screen.getByTestId('warning-ignore-w1'));
    expect(screen.queryByTestId('warning-row-w1')).not.toBeInTheDocument();
    expect(screen.getByTestId('warning-row-w2')).toBeInTheDocument();
  });
});
