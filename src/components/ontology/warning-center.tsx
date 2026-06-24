'use client';

import { useMemo, useState } from 'react';
import { EPC_WARNING_RULES, type EpcWarning, type EpcWarningRuleId } from '@/lib/business-epc-linter';
import { VX_RULES, type CrossConsistencyIssue, type VxRuleId } from '@/lib/epc-cross-consistency';
import type { ModuleKind } from '@/types/ontology';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface WarningCenterProps {
  warnings: EpcWarning[];
  vxIssues?: CrossConsistencyIssue[];
  onNavigate: (moduleKind: ModuleKind, moduleId: string) => void;
}

const CHAIN_KINDS: ModuleKind[] = ['A', 'B', 'C', 'EPC'];
const ELEMENT_KINDS: ModuleKind[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
const NAVIGABLE_KINDS: ModuleKind[] = [...CHAIN_KINDS, ...ELEMENT_KINDS];

const VX_RULE_IDS: VxRuleId[] = ['VX-01', 'VX-02', 'VX-03', 'VX-04', 'VX-05', 'VX-06', 'VX-09', 'VX-10', 'VX-11', 'VX-12'];

function severityColor(severity: string): 'destructive' | 'secondary' | 'outline' {
  if (severity === 'error') return 'destructive';
  if (severity === 'warning') return 'secondary';
  return 'outline';
}

export function WarningCenter({ warnings, vxIssues, onNavigate }: WarningCenterProps) {
  const [ruleFilter, setRuleFilter] = useState<EpcWarningRuleId | 'all'>('all');
  const [vxFilter, setVxFilter] = useState<VxRuleId | 'all'>('all');
  const [tab, setTab] = useState<'wepc' | 'vx'>('wepc');
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set());

  const countsByRule = useMemo(() => {
    const map = new Map<EpcWarningRuleId, number>();
    for (const w of warnings) map.set(w.ruleId, (map.get(w.ruleId) ?? 0) + 1);
    return map;
  }, [warnings]);

  const vxCountsByRule = useMemo(() => {
    const map = new Map<VxRuleId, number>();
    for (const v of vxIssues ?? []) map.set(v.code, (map.get(v.code) ?? 0) + 1);
    return map;
  }, [vxIssues]);

  const vxTotal = (vxIssues ?? []).length;

  const visibleWepc = useMemo(() => {
    return warnings.filter((w) => {
      if (ignored.has(w.id)) return false;
      if (ruleFilter !== 'all' && w.ruleId !== ruleFilter) return false;
      return true;
    });
  }, [warnings, ignored, ruleFilter]);

  const visibleVx = useMemo(() => {
    return (vxIssues ?? []).filter((v) => {
      if (ignored.has(v.code + ':' + v.message)) return false;
      if (vxFilter !== 'all' && v.code !== vxFilter) return false;
      return true;
    });
  }, [vxIssues, ignored, vxFilter]);

  return (
    <div className="space-y-4" data-testid="warning-center">
      <div>
        <h2 className="text-lg font-semibold">EPC 校验中心</h2>
        <p className="text-sm text-muted-foreground">
          W-EPC {warnings.length} 条 · VX {vxTotal} 条 · 共 {warnings.length + vxTotal} 条
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          type="button" size="sm"
          variant={tab === 'wepc' ? 'default' : 'outline'}
          onClick={() => setTab('wepc')}
          data-testid="vx-tab-wepc"
        >
          W-EPC 警示
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{warnings.length}</Badge>
        </Button>
        <Button
          type="button" size="sm"
          variant={tab === 'vx' ? 'default' : 'outline'}
          onClick={() => setTab('vx')}
          data-testid="vx-tab-vx"
        >
          VX 交叉校验
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{vxTotal}</Badge>
        </Button>
      </div>

      {/* W-EPC tab */}
      {tab === 'wepc' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={ruleFilter === 'all' ? 'default' : 'outline'} onClick={() => setRuleFilter('all')}>
              全部 {warnings.length > 0 && <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{warnings.length}</Badge>}
            </Button>
            {EPC_WARNING_RULES.map((ruleId) => {
              const count = countsByRule.get(ruleId) ?? 0;
              return (
                <Button key={ruleId} type="button" size="sm" variant={ruleFilter === ruleId ? 'default' : 'outline'} data-testid={`warning-filter-${ruleId}`} onClick={() => setRuleFilter(ruleId)}>
                  {ruleId}
                  {count > 0 && <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{count}</Badge>}
                </Button>
              );
            })}
          </div>

          {visibleWepc.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">暂无 W-EPC 警示。</p>
          ) : (
            <ul className="space-y-2">
              {visibleWepc.map((warning) => (
                <li key={warning.id} className="rounded-lg border p-3 text-sm" data-testid={`warning-row-${warning.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{warning.ruleId}</Badge>
                      <span>{warning.message}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {NAVIGABLE_KINDS.includes(warning.moduleKind) && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => onNavigate(warning.moduleKind, warning.moduleId)}>定位</Button>
                      )}
                      <Button type="button" size="sm" variant="outline" data-testid={`warning-ignore-${warning.id}`} onClick={() => setIgnored((prev) => new Set(prev).add(warning.id))}>忽略</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* VX tab */}
      {tab === 'vx' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={vxFilter === 'all' ? 'default' : 'outline'} onClick={() => setVxFilter('all')}>
              全部 {vxTotal > 0 && <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{vxTotal}</Badge>}
            </Button>
            {VX_RULE_IDS.map((ruleId) => {
              const count = vxCountsByRule.get(ruleId) ?? 0;
              const rule = VX_RULES[ruleId];
              return (
                <Button key={ruleId} type="button" size="sm" variant={vxFilter === ruleId ? 'default' : 'outline'} data-testid={`vx-filter-${ruleId}`} onClick={() => setVxFilter(ruleId)}>
                  <Badge variant={severityColor(rule.severity)} className="mr-1 px-1 py-0 text-xs">{rule.severity === 'error' ? 'E' : rule.severity === 'warning' ? 'W' : 'I'}</Badge>
                  {ruleId}
                  {count > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{count}</Badge>}
                </Button>
              );
            })}
          </div>

          {visibleVx.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">暂无 VX 交叉校验问题。</p>
          ) : (
            <ul className="space-y-2">
              {visibleVx.map((v, idx) => (
                <li key={`${v.code}-${idx}`} className="rounded-lg border p-3 text-sm" data-testid={`vx-row-${idx}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={severityColor(v.severity)}>{v.code}</Badge>
                      <span>{v.message}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button type="button" size="sm" variant="outline" data-testid={`vx-ignore-${idx}`} onClick={() => setIgnored((prev) => new Set(prev).add(v.code + ':' + v.message))}>忽略</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
