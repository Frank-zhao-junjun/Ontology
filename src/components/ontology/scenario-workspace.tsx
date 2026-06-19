'use client';

import { META_DIMENSION_LABELS } from '@/lib/element-selector/constants';
import type { EpcProcess, MetaDimension, ModuleKind, Scenario } from '@/types/ontology';
import type { ScenarioReferenceUnionItem } from '@/lib/scenario-workspace';
import type { DerivedEpcStep } from '@/lib/epc-derivation';
import { EpcValidationPanel } from '@/components/ontology/epc-validation-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ScenarioWorkspaceProps {
  scenario: Scenario;
  childEpcs: EpcProcess[];
  referenceUnion: ScenarioReferenceUnionItem[];
  onSelectEpc: (epcId: string) => void;
  onNavigateToElement?: (elementId: string, dimension: MetaDimension) => void;
  onNavigateToChain?: (moduleKind: ModuleKind, moduleId: string) => void;
  /** US-S18-U03: derived steps from models */
  derivedSteps?: DerivedEpcStep[];
  /** US-S18-U03: callback to trigger derivation */
  onDeriveSteps?: () => void;
  /** US-S18-U03: apply derived steps to EPC draft */
  onApplyDerivedSteps?: () => void;
  /** When false, 「应用到 EPC」 stays disabled until scenario is confirmed (US-S14). */
  canApplyDerivedSteps?: boolean;
}

export function ScenarioWorkspace({
  scenario,
  childEpcs,
  referenceUnion,
  onSelectEpc,
  onNavigateToElement,
  onNavigateToChain,
  derivedSteps,
  onDeriveSteps,
  onApplyDerivedSteps,
  canApplyDerivedSteps = true,
}: ScenarioWorkspaceProps) {
  const semantics = scenario.semantics;
  const hasSemantics =
    (semantics?.terms?.length ?? 0) > 0
    || (semantics?.triggerPhrases?.length ?? 0) > 0
    || (semantics?.synonyms?.length ?? 0) > 0;

  return (
    <div className="space-y-6 border-t pt-6 max-w-3xl" data-testid="scenario-workspace">
      {hasSemantics && (
        <section data-testid="scenario-semantics">
          <h3 className="text-sm font-medium mb-2">场景语义</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {semantics?.terms?.map((term) => (
              <Badge key={`term-${term}`} variant="secondary">{term}</Badge>
            ))}
            {semantics?.triggerPhrases?.map((phrase) => (
              <Badge key={`tp-${phrase}`} variant="outline">{phrase}</Badge>
            ))}
            {semantics?.synonyms?.map((syn) => (
              <Badge key={`syn-${syn}`} variant="outline">{syn}</Badge>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium mb-2">子 EPC 流程</h3>
        {childEpcs.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无子流程，请在左侧树中新建 EPC。</p>
        ) : (
          <ul className="space-y-2" data-testid="scenario-child-epc-list">
            {childEpcs.map((epc) => (
              <li key={epc.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{epc.name}</p>
                  <p className="text-xs text-muted-foreground">{epc.steps.length} 个步骤</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-testid={`scenario-epc-link-${epc.id}`}
                  onClick={() => onSelectEpc(epc.id)}
                >
                  打开
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* US-S18-U03: derivation panel */}
      {onDeriveSteps && (
        <section data-testid="derive-epc-steps-section">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-sm font-medium">从模型推导 EPC 步骤</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="derive-epc-steps-btn"
              onClick={onDeriveSteps}
            >
              推导步骤
            </Button>
            {derivedSteps && derivedSteps.length > 0 && onApplyDerivedSteps && (
              <Button
                type="button"
                size="sm"
                data-testid="apply-derived-steps-btn"
                disabled={!canApplyDerivedSteps}
                title={
                  canApplyDerivedSteps
                    ? '将推导步骤写入 EPC 草稿'
                    : '请先确认场景 (C) 后再应用到 EPC'
                }
                onClick={onApplyDerivedSteps}
              >
                应用到 EPC
              </Button>
            )}
          </div>
          {derivedSteps && derivedSteps.length > 0 ? (
            <ul className="space-y-1" data-testid="derive-epc-steps-list">
              {derivedSteps.map((step, idx) => (
                <li key={`${step.elementId}-${idx}`} className="text-sm flex items-center gap-2 rounded border px-3 py-1.5">
                  <Badge variant="outline">{step.dimension}</Badge>
                  <span>{step.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{step.derivation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground" data-testid="derive-epc-steps-empty">
              点击「推导步骤」从当前场景的模型要素生成 EPC 步骤建议。
            </p>
          )}
        </section>
      )}

      <EpcValidationPanel
        scenarioId={scenario.id}
        onNavigateToElement={onNavigateToElement}
        onNavigateToChain={onNavigateToChain}
      />

      <section>
        <h3 className="text-sm font-medium mb-2">引用要素并集（只读）</h3>
        <p className="text-xs text-muted-foreground mb-3">
          聚合本场景下全部子 EPC 步骤挂接的八维要素，不维护独立挂接表。
        </p>
        {referenceUnion.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无挂接要素。</p>
        ) : (
          <ul className="space-y-2" data-testid="scenario-ref-union">
            {referenceUnion.map((item) => (
              <li
                key={item.elementId}
                className="rounded-lg border p-3 text-sm"
                data-testid={`scenario-ref-union-${item.elementId}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.elementName}</span>
                  <Badge variant="outline">{META_DIMENSION_LABELS[item.dimension]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.sources.length} 处引用
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-2 border-l">
                  {item.sources.map((src) => (
                    <li key={`${src.epcId}-${src.stepId}`}>
                      {src.epcName} · {src.stepName}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
