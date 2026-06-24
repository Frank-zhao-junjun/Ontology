'use client';

import { useMemo } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { validateAgentSemanticLayer } from '@/lib/ontology-validator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Brain, BookOpen, Link2, ShieldAlert, ArrowLeftRight, Gauge, Zap } from 'lucide-react';

export function SemanticLayerTab() {
  const project = useOntologyStore((s) => s.project);
  const layer = project?.agentSemanticLayer;
  const issues = useMemo(() => (project ? validateAgentSemanticLayer(project) : []), [project]);
  const coverage = useOntologyStore((s) => s.getSemanticCoverage());

  if (!layer) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">🧠</div>
          <p>尚未配置 Agent 语义层</p>
          <p className="text-xs mt-1">通过 API 或未来 UI 创建 Intent / BusinessTerm 等配置</p>
        </div>
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="space-y-4">
      {/* Coverage Dashboard */}
      {coverage && (
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{layer.metadata.totalIntents}</div>
              <div className="text-xs text-muted-foreground">意图</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{layer.metadata.totalTerms}</div>
              <div className="text-xs text-muted-foreground">术语</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{layer.metadata.totalRelations}</div>
              <div className="text-xs text-muted-foreground">关系</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">
                {coverage.totalEntities > 0
                  ? Math.round((coverage.entitiesWithIntents / coverage.totalEntities) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">覆盖率</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Issues */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-1">
          {errors.map((issue) => (
            <Alert key={issue.code} variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <Badge variant="outline" className="mr-1 text-[10px]">{issue.code}</Badge>
                {issue.message}
              </AlertDescription>
            </Alert>
          ))}
          {warnings.map((issue) => (
            <Alert key={issue.code} variant="default" className="py-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs">
                <Badge variant="outline" className="mr-1 text-[10px]">{issue.code}</Badge>
                {issue.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <Tabs defaultValue="intents" className="w-full">
        <TabsList className="w-full justify-start gap-1 h-9">
          <TabsTrigger value="intents" className="text-xs gap-1 h-7">
            <Zap className="h-3 w-3" />意图 ({layer.intents.length})
          </TabsTrigger>
          <TabsTrigger value="terms" className="text-xs gap-1 h-7">
            <BookOpen className="h-3 w-3" />术语 ({layer.businessTerms.length})
          </TabsTrigger>
          <TabsTrigger value="relations" className="text-xs gap-1 h-7">
            <Link2 className="h-3 w-3" />关系 ({layer.semanticRelations.length})
          </TabsTrigger>
          <TabsTrigger value="recoveries" className="text-xs gap-1 h-7">
            <ShieldAlert className="h-3 w-3" />恢复 ({layer.errorRecoveries.length})
          </TabsTrigger>
          <TabsTrigger value="mappings" className="text-xs gap-1 h-7">
            <ArrowLeftRight className="h-3 w-3" />映射 ({layer.fieldMappings.length})
          </TabsTrigger>
          <TabsTrigger value="policies" className="text-xs gap-1 h-7">
            <Gauge className="h-3 w-3" />策略 ({layer.agentPolicies.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px] mt-2">
          <TabsContent value="intents" className="mt-0 space-y-2">
            {layer.intents.map((intent) => (
              <Card key={intent.id}>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{intent.category}</Badge>
                    {intent.name}
                    <Badge variant="outline" className="text-[10px] ml-auto">P{intent.priority}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 text-xs space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {intent.triggerPhrases.slice(0, 5).map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                    {intent.triggerPhrases.length > 5 && (
                      <Badge variant="outline" className="text-[10px]">+{intent.triggerPhrases.length - 5}</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    Slots: {intent.slotFilling.slots.length} (required: {intent.slotFilling.requiredSlots.length})
                    {intent.requiresConfirmation && ' | 需确认'}
                  </div>
                </CardContent>
              </Card>
            ))}
            {layer.intents.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">暂无意图定义</p>
            )}
          </TabsContent>

          <TabsContent value="terms" className="mt-0 space-y-2">
            {layer.businessTerms.map((term) => (
              <Card key={term.id}>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {term.term}
                    {term.termEn && <span className="text-xs text-muted-foreground">({term.termEn})</span>}
                    <Badge variant="outline" className="text-[10px]">{term.domain}</Badge>
                    <Badge variant={term.status === 'active' ? 'default' : 'secondary'} className="text-[10px] ml-auto">
                      {term.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 text-xs space-y-1">
                  <p className="text-muted-foreground">{term.definition}</p>
                  {term.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {term.synonyms.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Refs: {term.modelRefs.map((r) => `${r.modelType}:${r.modelName}`).join(', ')}
                  </div>
                </CardContent>
              </Card>
            ))}
            {layer.businessTerms.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">暂无术语定义</p>
            )}
          </TabsContent>

          <TabsContent value="relations" className="mt-0 space-y-2">
            {layer.semanticRelations.map((rel) => (
              <Card key={rel.id}>
                <CardContent className="py-2 px-3 text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{rel.type}</Badge>
                  <span>{rel.sourceEntityId}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{rel.targetEntityId}</span>
                  <span className="text-muted-foreground ml-auto">w:{rel.weight}</span>
                  {rel.transitive && <Badge variant="outline" className="text-[10px]">传递</Badge>}
                  {rel.symmetric && <Badge variant="outline" className="text-[10px]">对称</Badge>}
                </CardContent>
              </Card>
            ))}
            {layer.semanticRelations.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">暂无关系定义</p>
            )}
          </TabsContent>

          <TabsContent value="recoveries" className="mt-0 space-y-2">
            {layer.errorRecoveries.map((er) => (
              <Card key={er.id}>
                <CardContent className="py-2 px-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[10px]">{er.errorType}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{er.strategy}</Badge>
                    <span className="text-muted-foreground ml-auto">Action: {er.actionId}</span>
                  </div>
                  <p className="text-muted-foreground">{er.agentMessage}</p>
                  {er.allowRetry && (
                    <Badge variant="outline" className="text-[10px]">允许重试 x{er.maxRetries}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
            {layer.errorRecoveries.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">暂无恢复策略</p>
            )}
          </TabsContent>

          <TabsContent value="mappings" className="mt-0 space-y-2">
            {layer.fieldMappings.map((fm) => (
              <Card key={fm.id}>
                <CardContent className="py-2 px-3 text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{fm.type}</Badge>
                  <span className="font-mono">{fm.sourceField.entityNameEn}.{fm.sourceField.attributeName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">{fm.targetField.entityNameEn}.{fm.targetField.attributeName}</span>
                  <span className="text-muted-foreground ml-auto">{fm.name}</span>
                </CardContent>
              </Card>
            ))}
            {layer.fieldMappings.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">暂无字段映射</p>
            )}
          </TabsContent>

          <TabsContent value="policies" className="mt-0 space-y-2">
            {layer.agentPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="py-2 px-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={policy.policyType === 'deny' ? 'destructive' : 'default'} className="text-[10px]">
                      {policy.policyType}
                    </Badge>
                    <span className="font-medium">{policy.name}</span>
                    <span className="text-muted-foreground">Role: {policy.roleId}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">P{policy.priority}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {policy.rules.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        {r.action}: {r.condition}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {layer.agentPolicies.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">暂无策略定义</p>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
