'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOntologyStore } from '@/store/ontology-store';
import type { MetaDimension } from '@/types/ontology';
import type { NlOntologyResult } from '@/lib/ai-draft/nl-ontology-prompt';

interface NlOntologyPreviewProps {
  /** 点击匹配实体时跳转到要素库对应元素 */
  onNavigateToElement: (elementId: string, dimension: MetaDimension) => void;
}

const DIMENSION_LABELS: Record<MetaDimension, string> = {
  E1: 'E1 数据',
  E2: 'E2 行为',
  E3: 'E3 规则',
  E4: 'E4 事件',
  E5: 'E5 组织',
  E6: 'E6 指标',
  E7: 'E7 约束',
  E8: 'E8 接口',
};

/** 置信度颜色球：绿 > 80%，黄 > 50%，灰 <= 50% */
function confidenceDotClass(confidence: number): string {
  if (confidence > 0.8) return 'bg-green-500';
  if (confidence > 0.5) return 'bg-yellow-500';
  return 'bg-gray-400';
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${confidenceDotClass(confidence)}`} />
      置信度 {Math.round(confidence * 100)}%
    </span>
  );
}

export function NlOntologyPreview({ onNavigateToElement }: NlOntologyPreviewProps) {
  const project = useOntologyStore((s) => s.project);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NlOntologyResult | null>(null);

  const handleQuery = async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    if (!project) {
      toast.error('当前没有打开的项目');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/nl-to-ontology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, project }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || `HTTP ${response.status}`);
      }
      setResult(body.data as NlOntologyResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('NL 语义查询失败:', err);
      toast.error(`语义查询失败：${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty =
    result !== null &&
    result.matchedEntities.length === 0 &&
    result.matchedProperties.length === 0 &&
    result.matchedRelations.length === 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4" data-testid="nl-ontology-preview">
      {/* 查询输入区 */}
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleQuery();
          }}
          placeholder="输入自然语言查询，如：采购订单包含哪些信息"
          disabled={loading}
          data-testid="nl-query-input"
        />
        <Button
          type="button"
          onClick={handleQuery}
          disabled={loading || !query.trim()}
          className="gap-1.5 shrink-0"
          data-testid="nl-query-submit"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          查询
        </Button>
      </div>

      {/* 加载态 */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          AI 正在分析查询语义…
        </div>
      )}

      {/* 空态 */}
      {!loading && isEmpty && (
        <div className="text-sm text-muted-foreground py-8 text-center">
          未找到匹配要素，尝试换一种表述
        </div>
      )}

      {/* 结果区 */}
      {!loading && result && !isEmpty && (
        <div className="space-y-4">
          {result.matchedEntities.length > 0 && (
            <section className="rounded-md border">
              <h3 className="px-3 py-2 text-sm font-medium border-b bg-muted/40">匹配实体</h3>
              <ul className="divide-y">
                {result.matchedEntities.map((m, index) => (
                  <li key={`${m.elementId}-${index}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => onNavigateToElement(m.elementId, m.dimension)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {m.elementName}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {DIMENSION_LABELS[m.dimension] ?? m.dimension}
                          </span>
                        </span>
                        <ConfidenceBadge confidence={m.confidence} />
                      </div>
                      {m.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{m.explanation}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.matchedProperties.length > 0 && (
            <section className="rounded-md border">
              <h3 className="px-3 py-2 text-sm font-medium border-b bg-muted/40">匹配属性</h3>
              <ul className="divide-y">
                {result.matchedProperties.map((m, index) => (
                  <li
                    key={`${m.entityId}-${m.attributeId}-${index}`}
                    className="px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">{m.attributeName}</span>
                    <ConfidenceBadge confidence={m.confidence} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.matchedRelations.length > 0 && (
            <section className="rounded-md border">
              <h3 className="px-3 py-2 text-sm font-medium border-b bg-muted/40">匹配关系</h3>
              <ul className="divide-y">
                {result.matchedRelations.map((m, index) => (
                  <li
                    key={`${m.sourceEntityId}-${m.targetEntityId}-${index}`}
                    className="px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">
                      {m.relationName}
                      <span className="ml-2 text-xs text-muted-foreground">({m.type})</span>
                    </span>
                    <ConfidenceBadge confidence={m.confidence} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
