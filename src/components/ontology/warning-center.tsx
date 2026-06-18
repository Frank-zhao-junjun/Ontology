'use client';

import { useMemo, useState } from 'react';
import { EPC_WARNING_RULES, type EpcWarning, type EpcWarningRuleId } from '@/lib/business-epc-linter';
import type { ModuleKind } from '@/types/ontology';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface WarningCenterProps {
  warnings: EpcWarning[];
  onNavigate: (moduleKind: ModuleKind, moduleId: string) => void;
}

export function WarningCenter({ warnings, onNavigate }: WarningCenterProps) {
  const [ruleFilter, setRuleFilter] = useState<EpcWarningRuleId | 'all'>('all');
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set());

  const visible = useMemo(() => {
    return warnings.filter((w) => {
      if (ignored.has(w.id)) return false;
      if (ruleFilter !== 'all' && w.ruleId !== ruleFilter) return false;
      return true;
    });
  }, [warnings, ignored, ruleFilter]);

  return (
    <div className="space-y-4" data-testid="warning-center">
      <div>
        <h2 className="text-lg font-semibold">EPC 警示中心</h2>
        <p className="text-sm text-muted-foreground">
          W-EPC 规则均为 warning，不阻断确认与导出。共 {warnings.length} 条，显示 {visible.length} 条。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={ruleFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setRuleFilter('all')}
        >
          全部
        </Button>
        {EPC_WARNING_RULES.map((ruleId) => (
          <Button
            key={ruleId}
            type="button"
            size="sm"
            variant={ruleFilter === ruleId ? 'default' : 'outline'}
            data-testid={`warning-filter-${ruleId}`}
            onClick={() => setRuleFilter(ruleId)}
          >
            {ruleId}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">暂无警示（或已全部忽略）。</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((warning) => (
            <li
              key={warning.id}
              className="rounded-lg border p-3 text-sm"
              data-testid={`warning-row-${warning.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{warning.ruleId}</Badge>
                  <span>{warning.message}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(warning.moduleKind === 'A'
                    || warning.moduleKind === 'B'
                    || warning.moduleKind === 'C'
                    || warning.moduleKind === 'EPC') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onNavigate(warning.moduleKind, warning.moduleId)}
                    >
                      定位
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid={`warning-ignore-${warning.id}`}
                    onClick={() => setIgnored((prev) => new Set(prev).add(warning.id))}
                  >
                    忽略
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
