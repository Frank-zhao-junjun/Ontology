'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useOntologyStore } from '@/store/ontology-store';
import {
  META_DIMENSION_LABELS,
  META_DIMENSION_ORDER,
} from '@/lib/element-selector/constants';
import {
  filterMetaElementsByDimension,
  filterUnreferencedElements,
  getUsageCount,
  resolveEpcName,
} from '@/lib/element-library';
import type { MetaDimension } from '@/types/ontology';
import { ElementCoverageBadge } from '@/components/ontology/element-coverage-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { E1EntityPanel } from './e1-entity-panel';

export interface ElementLibraryFocusTarget {
  elementId: string;
  dimension: MetaDimension;
}

export interface ElementLibraryProps {
  focusTarget?: ElementLibraryFocusTarget | null;
  onFocusConsumed?: () => void;
}

export function ElementLibrary({ focusTarget, onFocusConsumed }: ElementLibraryProps = {}) {
  const project = useOntologyStore((s) => s.project);
  const getElementUsageRefs = useOntologyStore((s) => s.getElementUsageRefs);
  const [onlyUnreferenced, setOnlyUnreferenced] = useState(false);
  const [activeDimension, setActiveDimension] = useState<MetaDimension>('E1');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const metaElements = useMemo(() => project?.metaElements ?? [], [project?.metaElements]);

  const unreferencedTotal = useMemo(
    () => filterUnreferencedElements(metaElements, true).length,
    [metaElements],
  );

  const activeList = useMemo(() => {
    const byDim = filterMetaElementsByDimension(metaElements, activeDimension);
    return filterUnreferencedElements(byDim, onlyUnreferenced);
  }, [metaElements, activeDimension, onlyUnreferenced]);

  // focusTarget is an imperative signal from parent to focus on a specific element.
  // The state updates here are the intended response to the parent signal.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!focusTarget) return;
    setActiveDimension(focusTarget.dimension);
    setOnlyUnreferenced(false);
    setExpandedId(focusTarget.elementId);
    onFocusConsumed?.();
  }, [focusTarget, onFocusConsumed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-4" data-testid="element-library">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">八维要素库</h2>
          <p className="text-sm text-muted-foreground">
            共 {metaElements.length} 个要素 · 未引用 {unreferencedTotal} 个
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="element-library-unreferenced"
            checked={onlyUnreferenced}
            onCheckedChange={setOnlyUnreferenced}
            data-testid="element-library-unreferenced-toggle"
          />
          <Label htmlFor="element-library-unreferenced">仅显示未引用</Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {META_DIMENSION_ORDER.map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            role="tab"
            aria-selected={activeDimension === d}
            variant={activeDimension === d ? 'default' : 'outline'}
            onClick={() => setActiveDimension(d)}
          >
            {META_DIMENSION_LABELS[d]}
          </Button>
        ))}
      </div>

      <div className="mt-4" data-testid={`element-library-panel-${activeDimension}`}>
        {activeDimension === 'E1' && (
          <div className="mb-6">
            <E1EntityPanel />
          </div>
        )}
        {activeDimension === 'E1' && (
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">要素注册表</h3>
        )}
        {activeList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {onlyUnreferenced ? '当前维度无未引用要素' : '当前维度暂无要素'}
          </p>
        ) : (
          <ul className="space-y-2">
            {activeList.map((el) => {
              const usageCount = getUsageCount(el);
              const expanded = expandedId === el.id;
              const refs = getElementUsageRefs(el.id);
              return (
                <li
                  key={el.id}
                  className="rounded-lg border p-3"
                  data-testid={`element-row-${el.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{el.name}</span>
                      <ElementCoverageBadge element={el} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        引用 {usageCount}
                      </span>
                      {usageCount > 0 && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="展开引用来源"
                          data-testid={`element-usage-toggle-${el.id}`}
                          onClick={() => setExpandedId(expanded ? null : el.id)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {expanded && refs.length > 0 && (
                    <ul
                      className={cn('mt-2 pl-4 text-sm text-muted-foreground space-y-1 border-l')}
                      data-testid={`element-usage-detail-${el.id}`}
                    >
                      {refs.map((ref) => (
                        <li key={`${ref.epcId}-${ref.stepId}`}>
                          {resolveEpcName(ref.epcId, project?.epcProcesses)} · 步骤 {ref.stepId}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
