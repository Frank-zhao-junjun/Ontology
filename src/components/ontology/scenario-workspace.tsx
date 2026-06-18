'use client';

import { META_DIMENSION_LABELS } from '@/lib/element-selector/constants';
import type { EpcProcess, Scenario } from '@/types/ontology';
import type { ScenarioReferenceUnionItem } from '@/lib/scenario-workspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ScenarioWorkspaceProps {
  scenario: Scenario;
  childEpcs: EpcProcess[];
  referenceUnion: ScenarioReferenceUnionItem[];
  onSelectEpc: (epcId: string) => void;
}

export function ScenarioWorkspace({
  scenario,
  childEpcs,
  referenceUnion,
  onSelectEpc,
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
