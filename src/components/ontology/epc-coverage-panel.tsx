'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useOntologyStore } from '@/store/ontology-store';
import { META_DIMENSION_LABELS, META_DIMENSION_ORDER } from '@/lib/element-selector/constants';
import type { MetaDimension } from '@/types/ontology';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EpcCoveragePanelProps {
  scenarioId: string;
  onNavigateToElement?: (elementId: string, dimension: MetaDimension) => void;
}

const DIM_COLORS: Record<MetaDimension, string> = {
  E1: 'bg-blue-500',
  E2: 'bg-orange-500',
  E3: 'bg-purple-500',
  E4: 'bg-red-500',
  E5: 'bg-green-500',
  E6: 'bg-yellow-500',
  E7: 'bg-gray-500',
  E8: 'bg-cyan-500',
};

export function EpcCoveragePanel({ scenarioId, onNavigateToElement }: EpcCoveragePanelProps) {
  const project = useOntologyStore((s) => s.project);
  const getEpcCoverage = useOntologyStore((s) => s.getEpcCoverage);
  const [expandedDim, setExpandedDim] = useState<MetaDimension | null>(null);

  const report = useMemo(
    () => getEpcCoverage(scenarioId),
    [getEpcCoverage, scenarioId, project],
  );

  const dimensions = useMemo(() => {
    return META_DIMENSION_ORDER
      .map((dim) => ({
        dim,
        data: report.byDimension[dim] ?? null,
      }))
      .filter((d) => d.data !== null);
  }, [report]);

  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (report.coveragePercent / 100) * ringCircumference;

  return (
    <section className="space-y-3" data-testid="epc-coverage-panel">
      <div className="flex items-start gap-6">
        {/* Ring chart */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle
              cx="60"
              cy="60"
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="60"
              cy="60"
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              className={cn(
                'transition-all duration-700',
                report.coveragePercent >= 80 ? 'text-green-500' :
                report.coveragePercent >= 50 ? 'text-yellow-500' :
                'text-red-500',
              )}
            />
          </svg>
          <div className="text-center -mt-[84px] pointer-events-none">
            <div className="text-xl font-bold" data-testid="epc-coverage-overall-percent">
              {report.coveragePercent}%
            </div>
            <div className="text-xs text-muted-foreground" data-testid="epc-coverage-overall-count">
              {report.coveredElements}/{report.totalElements}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 space-y-2 min-w-0">
          <h3 className="text-sm font-medium">EPC 覆盖率</h3>
          <p className="text-xs text-muted-foreground">
            {report.totalElements === 0
              ? '暂无八维要素数据，请先导入或创建要素。'
              : `已覆盖 ${report.coveredElements}/${report.totalElements} 个要素`}
          </p>
        </div>
      </div>

      {/* Dimension bars */}
      {dimensions.length > 0 && (
        <div className="space-y-1.5">
          {dimensions.map(({ dim, data }) => {
            if (!data) return null;
            const isExpanded = expandedDim === dim;
            return (
              <div key={dim}>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 text-left text-xs transition-colors"
                  onClick={() => setExpandedDim(isExpanded ? null : dim)}
                  data-testid={`coverage-dim-${dim}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3 shrink-0" />
                  ) : (
                    <ChevronRight className="size-3 shrink-0" />
                  )}
                  <span className="w-8 font-medium tabular-nums">{dim}</span>
                  <span className="w-20 text-muted-foreground truncate">
                    {META_DIMENSION_LABELS[dim] ?? dim}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', DIM_COLORS[dim])}
                      style={{ width: `${data.coveragePercent}%` }}
                    />
                  </div>
                  <span className="w-16 text-right tabular-nums text-muted-foreground">
                    {data.coveredElements}/{data.totalElements}
                  </span>
                  <span
                    className={cn(
                      'w-10 text-right tabular-nums font-medium',
                      data.coveragePercent >= 80 ? 'text-green-600' :
                      data.coveragePercent >= 50 ? 'text-yellow-600' :
                      'text-red-600',
                    )}
                  >
                    {data.coveragePercent}%
                  </span>
                </button>

                {/* Expanded: uncovered list */}
                {isExpanded && data.uncovered.length > 0 && (
                  <ul className="ml-10 space-y-0.5 pb-2">
                    {data.uncovered.map((el) => (
                      <li
                        key={el.elementId}
                        className="text-xs text-muted-foreground flex items-center gap-2 py-0.5"
                      >
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                        {onNavigateToElement ? (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            data-testid={`epc-coverage-nav-${el.elementId}`}
                            onClick={() => onNavigateToElement(el.elementId, dim)}
                          >
                            {el.elementName}
                          </Button>
                        ) : (
                          <span>{el.elementName}</span>
                        )}
                        <span className="text-muted-foreground/50">({el.elementId})</span>
                      </li>
                    ))}
                  </ul>
                )}
                {isExpanded && data.uncovered.length === 0 && (
                  <p className="ml-10 text-xs text-muted-foreground pb-2">全部覆盖 ✓</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
