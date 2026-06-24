'use client';

import { useMemo } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { validateLifecycle } from '@/lib/ontology-validator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info, ArrowRight, Shield, Clock, Eye, Tag } from 'lucide-react';

export function LifecycleTab({ entityId }: { entityId: string }) {
  const lifecycle = useOntologyStore((s) => s.getEntityLifecycle(entityId));
  const project = useOntologyStore((s) => s.project);
  const validationIssues = useMemo(
    () => (project ? validateLifecycle(project, entityId) : []),
    [project, entityId],
  );

  if (!lifecycle) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">🔄</div>
          <p>该实体未配置状态机，无法查看生命周期</p>
        </div>
      </div>
    );
  }

  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-1">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{lifecycle.stats.totalStates}</div>
              <div className="text-xs text-muted-foreground">状态</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{lifecycle.stats.totalTransitions}</div>
              <div className="text-xs text-muted-foreground">转换</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{lifecycle.stats.totalActions}</div>
              <div className="text-xs text-muted-foreground">操作</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{lifecycle.auditTrail.length}</div>
              <div className="text-xs text-muted-foreground">审计</div>
            </CardContent>
          </Card>
        </div>

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

        {/* State Flow */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              状态流转
              <Badge variant="secondary" className="text-[10px]">{lifecycle.stateMachine.states.length} 状态</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {lifecycle.stateMachine.states.map((state) => {
                const outgoing = lifecycle.stateMachine.transitions.filter((t) => {
                  const fromIds = Array.isArray(t.from) ? t.from : [t.from];
                  return fromIds.includes(state.id);
                });
                const stateActions = lifecycle.actionsByState[state.id] || [];
                const stateRules = lifecycle.rulesByState[state.id] || [];
                const stateRoles = lifecycle.rolesByState[state.id] || [];
                const stateEvents = lifecycle.eventsByState[state.id] || [];

                return (
                  <div key={state.id} className="p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{ backgroundColor: state.color || '#3b82f6' }}
                      />
                      <span className="font-medium text-sm">{state.name}</span>
                      {state.isInitial && <Badge variant="secondary" className="text-[10px]">初始</Badge>}
                      {state.isFinal && <Badge variant="secondary" className="text-[10px]">终止</Badge>}
                      {state.semanticTag && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Tag className="h-3 w-3" />{state.semanticTag}
                        </Badge>
                      )}
                      {state.timeout && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-orange-600">
                          <Clock className="h-3 w-3" />{state.timeout.duration}{state.timeout.unit}
                        </Badge>
                      )}
                    </div>

                    {/* Outgoing transitions */}
                    {outgoing.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {outgoing.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{t.name}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-blue-600 dark:text-blue-400">
                              {lifecycle.stateMachine.states.find((s) => s.id === t.to)?.name || t.to}
                            </span>
                            {t.guardCondition && (
                              <Badge variant="outline" className="text-[10px]">
                                <Shield className="h-3 w-3 mr-0.5" />{t.guardCondition}
                              </Badge>
                            )}
                            {t.requiresApproval && (
                              <Badge variant="outline" className="text-[10px] text-purple-600">需审批</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* State details */}
                    <div className="ml-6 flex flex-wrap gap-1">
                      {stateActions.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {stateActions.length} 操作
                        </Badge>
                      )}
                      {stateRules.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {stateRules.length} 规则
                        </Badge>
                      )}
                      {stateRoles.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {stateRoles.length} 角色
                        </Badge>
                      )}
                      {stateEvents.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {stateEvents.length} 事件
                        </Badge>
                      )}
                      {state.dataVisibility && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Eye className="h-3 w-3" />
                          {state.dataVisibility.editableFields?.length || 0} 可编辑
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        {lifecycle.auditTrail.length > 0 && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">审计记录 ({lifecycle.auditTrail.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {lifecycle.auditTrail.slice(-20).reverse().map((entry) => (
                  <div key={entry.id} className="p-2 px-4 flex items-center gap-2 text-xs">
                    <Badge variant={entry.result === 'success' ? 'default' : 'destructive'} className="text-[10px]">
                      {entry.eventType}
                    </Badge>
                    <span className="text-muted-foreground">{entry.timestamp?.slice(0, 16)}</span>
                    {entry.fromStateId && (
                      <>
                        <span className="text-muted-foreground">
                          {lifecycle.stateMachine.states.find((s) => s.id === entry.fromStateId)?.name || entry.fromStateId}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                    {entry.toStateId && (
                      <span>{lifecycle.stateMachine.states.find((s) => s.id === entry.toStateId)?.name || entry.toStateId}</span>
                    )}
                    {entry.actorDescription && (
                      <span className="text-muted-foreground ml-auto">{entry.actorDescription}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
