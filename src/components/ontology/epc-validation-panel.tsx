'use client';

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, PieChart, ShieldAlert } from "lucide-react";
import { useOntologyStore } from "@/store/ontology-store";
import { EPC_WARNING_RULES, type EpcWarningRuleId } from "@/lib/business-epc-linter";
import { VX_RULES, type CrossConsistencyIssue, type VxRuleId } from "@/lib/epc-cross-consistency";
import { EpcCoveragePanel } from "@/components/ontology/epc-coverage-panel";
import type { MetaDimension, ModuleKind } from "@/types/ontology";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EpcValidationPanelProps {
  scenarioId: string;
  onNavigateToElement?: (elementId: string, dimension: MetaDimension) => void;
  onNavigateToChain?: (moduleKind: ModuleKind, moduleId: string) => void;
}

type ValidationTab = "ve" | "vm" | "vx";

const VX_SEVERITY_ORDER: Array<"error" | "warning" | "info"> = ["error", "warning", "info"];

const VX_SEVERITY_LABELS: Record<"error" | "warning" | "info", string> = {
  error: "错误",
  warning: "警告",
  info: "提示",
};

const VX_RULE_IDS: VxRuleId[] = ["VX-01", "VX-02", "VX-03", "VX-04", "VX-05", "VX-06", "VX-09", "VX-10", "VX-11", "VX-12"];

function sevBadge(severity: string): "destructive" | "secondary" | "outline" {
  if (severity === "error") return "destructive";
  if (severity === "warning") return "secondary";
  return "outline";
}

function sevIcon(severity: "error" | "warning" | "info") {
  if (severity === "error") return { color: "text-destructive", label: "🔴" };
  if (severity === "warning") return { color: "text-yellow-600", label: "🟡" };
  return { color: "text-blue-600", label: "🔵" };
}

function groupVxBySeverity(issues: CrossConsistencyIssue[]) {
  const groups = new Map<"error" | "warning" | "info", CrossConsistencyIssue[]>();
  for (const s of VX_SEVERITY_ORDER) groups.set(s, []);
  for (const issue of issues) {
    groups.get(issue.severity)?.push(issue);
  }
  return VX_SEVERITY_ORDER
    .map((severity) => ({ severity, items: groups.get(severity) ?? [] }))
    .filter((g) => g.items.length > 0);
}

export function EpcValidationPanel({ scenarioId, onNavigateToElement, onNavigateToChain }: EpcValidationPanelProps) {
  const [tab, setTab] = useState<ValidationTab>("ve");
  const [wepcFilter, setWepcFilter] = useState<EpcWarningRuleId | "all">("all");
  const [vxFilter, setVxFilter] = useState<VxRuleId | "all">("all");

  const project = useOntologyStore((s) => s.project);
  const getBusinessEpcWarnings = useOntologyStore((s) => s.getBusinessEpcWarnings);
  const getEpcCoverage = useOntologyStore((s) => s.getEpcCoverage);
  const getCrossConsistency = useOntologyStore((s) => s.getCrossConsistency);
  const getScenarioChildEpcs = useOntologyStore((s) => s.getScenarioChildEpcs);
  const getBusinessChainModuleStatus = useOntologyStore((s) => s.getBusinessChainModuleStatus);

  const epcWarnings = useMemo(() => getBusinessEpcWarnings(), [getBusinessEpcWarnings, project]);

  const report = useMemo(() => getEpcCoverage(scenarioId), [getEpcCoverage, scenarioId, project]);
  const vxIssues = useMemo(() => getCrossConsistency(scenarioId), [getCrossConsistency, scenarioId, project]);

  const childEpcs = useMemo(
    () => getScenarioChildEpcs(scenarioId),
    [getScenarioChildEpcs, scenarioId, project],
  );
  const childEpcIds = useMemo(() => new Set(childEpcs.map((epc) => epc.id)), [childEpcs]);

  const cStatus = getBusinessChainModuleStatus("C", scenarioId);
  const isScenarioConfirmed = cStatus === "confirmed";
  const hasChildEpcs = childEpcs.length > 0;
  const panelInactive = !isScenarioConfirmed || !hasChildEpcs;
  const inactiveMessage = !isScenarioConfirmed
    ? "场景未确认，请先确认场景后再查看校验结果"
    : "当前场景下没有 EPC 子流程，请先创建 EPC";

  const scenarioWarnings = useMemo(() => {
    return epcWarnings.filter((w) => {
      if (w.moduleKind === "C" && w.moduleId === scenarioId) return true;
      if (w.moduleKind === "EPC" && childEpcIds.has(w.moduleId)) return true;
      if (w.epcId && childEpcIds.has(w.epcId)) return true;
      return false;
    });
  }, [epcWarnings, scenarioId, childEpcIds]);

  // Summary stats
  const stats = useMemo(() => {
    const errors = vxIssues.filter((i) => i.severity === "error").length;
    const warnings = scenarioWarnings.length + vxIssues.filter((i) => i.severity === "warning").length;
    const infos = vxIssues.filter((i) => i.severity === "info").length;
    return { errors, warnings, infos, coverage: report.coveragePercent };
  }, [scenarioWarnings, vxIssues, report]);

  // Filtered lists
  const visibleWepc = useMemo(() => {
    return wepcFilter === "all" ? scenarioWarnings : scenarioWarnings.filter((w) => w.ruleId === wepcFilter);
  }, [scenarioWarnings, wepcFilter]);

  const visibleVx = useMemo(() => {
    const filtered = vxFilter === "all" ? vxIssues : vxIssues.filter((i) => i.code === vxFilter);
    // Sort: error first, then warning, then info
    return filtered.slice().sort((a, b) => {
      const order = (s: string) => (s === "error" ? 0 : s === "warning" ? 1 : 2);
      return order(a.severity) - order(b.severity);
    });
  }, [vxIssues, vxFilter]);

  const vxGroups = useMemo(() => groupVxBySeverity(visibleVx), [visibleVx]);

  function renderEmptyState(message: string) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center" data-testid="vp-empty-state">
        <CheckCircle2 className="h-5 w-5 inline-block mr-1 text-green-500" />
        {message}
      </p>
    );
  }

  function renderInactiveState() {
    return renderEmptyState(inactiveMessage);
  }

  const wepcCounts = useMemo(() => {
    const map = new Map<EpcWarningRuleId, number>();
    for (const w of scenarioWarnings) map.set(w.ruleId, (map.get(w.ruleId) ?? 0) + 1);
    return map;
  }, [scenarioWarnings]);

  const vxCounts = useMemo(() => {
    const map = new Map<VxRuleId, number>();
    for (const v of vxIssues) map.set(v.code, (map.get(v.code) ?? 0) + 1);
    return map;
  }, [vxIssues]);

  return (
    <section className="space-y-3" data-testid="epc-validation-panel">
      <h3 className="text-sm font-medium">EPC 校验</h3>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-1.5 text-sm">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <span className="font-semibold text-destructive" data-testid="vp-summary-errors">{stats.errors}</span>
          <span className="text-muted-foreground">错误</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-yellow-600" data-testid="vp-summary-warnings">{stats.warnings}</span>
          <span className="text-muted-foreground">警告</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-blue-600" data-testid="vp-summary-infos">{stats.infos}</span>
          <span className="text-muted-foreground">提示</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm ml-auto">
          <PieChart className="h-4 w-4 text-green-500" />
          <span className="font-semibold text-green-600" data-testid="vp-summary-coverage">{stats.coverage}%</span>
          <span className="text-muted-foreground">覆盖率</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b pb-2">
        {([
          ["ve", "VE 要素校验", scenarioWarnings.length] as const,
          ["vm", "VM 覆盖率", Math.max(0, report.totalElements - report.coveredElements)] as const,
          ["vx", "VX 交叉一致性", vxIssues.length] as const,
        ]).map(([key, label, count]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={tab === key ? "default" : "ghost"}
            data-testid={`vp-tab-${key}`}
            onClick={() => setTab(key)}
            className="gap-1.5"
          >
            {label}
            {count > 0 && <Badge variant="secondary" className="px-1.5 py-0 text-xs">{count}</Badge>}
          </Button>
        ))}
      </div>

      {/* VE: W-EPC warnings */}
      {tab === "ve" && (
        <div className="space-y-2" data-testid="vp-panel-ve">
          {panelInactive ? renderInactiveState() : (
            <>
              <div className="flex flex-wrap gap-1.5" data-testid="vp-ve-filters">
                <Button type="button" size="sm" variant={wepcFilter === "all" ? "default" : "outline"} onClick={() => setWepcFilter("all")}>
                  全部 {scenarioWarnings.length > 0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{scenarioWarnings.length}</Badge>}
                </Button>
                {EPC_WARNING_RULES.map((rid) => {
                  const c = wepcCounts.get(rid) ?? 0;
                  return (
                    <Button key={rid} type="button" size="sm" variant={wepcFilter === rid ? "default" : "outline"} onClick={() => setWepcFilter(rid)}>
                      {rid} {c > 0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{c}</Badge>}
                    </Button>
                  );
                })}
              </div>

              {visibleWepc.length === 0 ? (
                renderEmptyState("当前场景下未发现 EPC 引用警告")
              ) : (
                <ul className="space-y-1.5 max-h-[420px] overflow-auto" data-testid="vp-ve-list">
                  {visibleWepc.map((w) => (
                    <li key={w.id} className="rounded border px-3 py-2 text-sm flex items-center justify-between gap-2" data-testid={`vp-wepc-${w.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className="shrink-0">{w.ruleId}</Badge>
                        <span className="truncate">{w.message}</span>
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="shrink-0"
                        onClick={() => onNavigateToChain?.(w.moduleKind, w.moduleId)}>
                        定位
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* VM: Coverage (reuses S16 dashboard) */}
      {tab === "vm" && (
        <div data-testid="vp-panel-vm">
          {panelInactive ? renderInactiveState() : (
            <EpcCoveragePanel
              scenarioId={scenarioId}
              onNavigateToElement={onNavigateToElement}
            />
          )}
        </div>
      )}

      {/* VX: Cross-consistency */}
      {tab === "vx" && (
        <div className="space-y-2" data-testid="vp-panel-vx">
          {panelInactive ? renderInactiveState() : (
            <>
              <div className="flex flex-wrap gap-1.5" data-testid="vp-vx-filters">
                <Button type="button" size="sm" variant={vxFilter === "all" ? "default" : "outline"} onClick={() => setVxFilter("all")}>
                  全部 {vxIssues.length > 0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{vxIssues.length}</Badge>}
                </Button>
                {VX_RULE_IDS.map((rid) => {
                  const c = vxCounts.get(rid) ?? 0;
                  const rule = VX_RULES[rid];
                  return (
                    <Button key={rid} type="button" size="sm" variant={vxFilter === rid ? "default" : "outline"} onClick={() => setVxFilter(rid)}>
                      <Badge variant={sevBadge(rule.severity)} className="mr-1 px-1 py-0 text-xs">
                        {rule.severity === "error" ? "E" : rule.severity === "warning" ? "W" : "I"}
                      </Badge>
                      {rid} {c > 0 && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">{c}</Badge>}
                    </Button>
                  );
                })}
              </div>

              {visibleVx.length === 0 ? (
                renderEmptyState("当前场景下未发现交叉一致性问题")
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-auto" data-testid="vp-vx-list">
                  {vxGroups.map((group) => {
                    let idx = 0;
                    return (
                      <div key={group.severity} data-testid={`vp-vx-group-${group.severity}`}>
                        <div className="flex items-center gap-2 text-sm font-medium mb-1.5 px-1" data-testid={`vp-vx-group-header-${group.severity}`}>
                          <span>{sevIcon(group.severity).label}</span>
                          <span className={sevIcon(group.severity).color}>{VX_SEVERITY_LABELS[group.severity]}</span>
                          <Badge variant={sevBadge(group.severity)} className="px-1 py-0 text-xs">{group.items.length}</Badge>
                        </div>
                        <ul className="space-y-1.5">
                          {group.items.map((v) => {
                            const thisIdx = idx++;
                            return (
                              <li key={`${v.code}-${thisIdx}`} className="rounded border px-3 py-2 text-sm flex items-center justify-between gap-2" data-testid={`vp-vx-${thisIdx}`} data-severity={v.severity}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Badge variant={sevBadge(v.severity)} className="shrink-0">{v.code}</Badge>
                                  <span className="truncate">
                                    {v.message}
                                    {v.elementName ? ` · ${v.elementName}` : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {v.epcId && onNavigateToChain && (
                                    <Button type="button" size="sm" variant="ghost"
                                      onClick={() => onNavigateToChain("EPC", v.epcId!)}>
                                      定位 EPC
                                    </Button>
                                  )}
                                  {v.elementId && v.dimension && onNavigateToElement && (
                                    <Button type="button" size="sm" variant="ghost"
                                      onClick={() => onNavigateToElement(v.elementId!, v.dimension!)}>
                                      定位要素
                                    </Button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
