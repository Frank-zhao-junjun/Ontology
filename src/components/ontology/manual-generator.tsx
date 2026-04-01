'use client';

import { useState, useEffect } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { OntologyProject, Entity, Attribute, Relation, StateMachine, State, Transition, Rule, EventDefinition, Subscription } from '@/types/ontology';

interface RelatedModels {
  entity?: Entity;
  stateMachines: StateMachine[];
  rules: Rule[];
  events: EventDefinition[];
  subscriptions: Subscription[];
}

interface ManualGeneratorProps {
  onBack: () => void;
  selectedEntityId?: string | null;
  relatedModels?: RelatedModels | null;
}

interface AISuggestions {
  dataModel?: {
    suggestedAttributes?: Partial<Attribute>[];
    suggestedRelations?: Partial<Relation>[];
  };
  behaviorModel?: {
    suggestedStates?: Partial<State>[];
    suggestedTransitions?: Partial<Transition>[];
  };
  ruleModel?: {
    suggestedRules?: Partial<Rule>[];
  };
  eventModel?: {
    suggestedEvents?: Partial<EventDefinition>[];
    suggestedSubscriptions?: Partial<Subscription>[];
  };
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export function ManualGenerator({ onBack, selectedEntityId, relatedModels }: ManualGeneratorProps) {
  const { project, addEntity, updateEntity, addStateMachine, updateStateMachine, addRule, addEventDefinition, addSubscription, metadataList, masterDataList } = useOntologyStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set());

  // 获取项目列表
  const projects = project?.dataModel?.projects || [];
  
  // 获取实体所属项目名称
  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return '未分类';
    const found = projects.find(p => p.id === projectId);
    return found?.name || '未分类';
  };

  // 是否为实体模式（选中了具体实体）
  const isEntityMode = selectedEntityId && relatedModels?.entity;

  // 自动生成AI建议（如果是实体模式）
  useEffect(() => {
    if (isEntityMode && !aiSuggestions && !isGenerating) {
      handleGenerateAI();
    }
  }, [isEntityMode]);

  // 调用API生成AI建议
  const handleGenerateAI = async () => {
    const entity = relatedModels?.entity;
    if (!entity || !project) return;
    
    setIsGenerating(true);
    setGenerateError(null);
    setAppliedItems(new Set());

    try {
      const entityProject = projects.find(p => p.id === entity.projectId);
      
      const response = await fetch('/api/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: {
            id: entity.id,
            name: entity.name,
            nameEn: entity.nameEn,
            description: entity.description,
            projectId: entity.projectId,
            projectName: entityProject?.name || '默认项目',
            attributes: entity.attributes,
            relations: entity.relations,
          },
          domain: project.domain,
          project: entityProject ? {
            name: entityProject.name,
            nameEn: entityProject.nameEn,
            description: entityProject.description,
          } : null,
          existingModels: {
            stateMachines: relatedModels?.stateMachines || [],
            rules: relatedModels?.rules || [],
            events: relatedModels?.events || [],
          },
          metadataList: metadataList, // 传递元数据列表，AI生成时优先匹配
          masterDataList: masterDataList, // 传递主数据列表，AI生成时参考业务数据
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '生成失败');
      }

      setAiSuggestions(result.data);
    } catch (error) {
      console.error('AI generation error:', error);
      setGenerateError(error instanceof Error ? error.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 应用建议到模型 - 使用更宽松的类型
  interface SuggestionItem {
    name?: string;
    nameEn?: string;
    type?: string;
    required?: boolean;
    unique?: boolean;
    description?: string;
    targetEntity?: string;
    states?: Partial<State>[];
    transitions?: Partial<Transition>[];
    field?: string;
    condition?: unknown;
    errorMessage?: string;
    severity?: string;
    trigger?: string;
    payload?: unknown[];
    event?: string;
    handler?: string;
    action?: string;
    actionRef?: string;
  }

  const handleApplySuggestion = async (
    type: string,
    item: SuggestionItem,
    index: number
  ) => {
    const itemKey = `${type}-${index}`;
    if (appliedItems.has(itemKey)) return;

    const entity = relatedModels?.entity;
    if (!entity) return;

    try {
      switch (type) {
        case 'attribute': {
          const newAttr: Attribute = {
            id: generateId(),
            name: item.name || '新属性',
            nameEn: item.nameEn || '',
            type: (item.type as Attribute['type']) || 'string',
            required: item.required || false,
            unique: item.unique || false,
            description: item.description || '',
          };
          updateEntity(entity.id, {
            ...entity,
            attributes: [...entity.attributes, newAttr],
          });
          break;
        }

        case 'relation': {
          const newRel: Relation = {
            id: generateId(),
            name: item.name || '新关系',
            type: (item.type as Relation['type']) || 'one_to_many',
            targetEntity: item.targetEntity || '',
            description: item.description || '',
          };
          updateEntity(entity.id, {
            ...entity,
            relations: [...entity.relations, newRel],
          });
          break;
        }

        case 'stateMachine': {
          // 先创建状态机，再添加状态和转换
          const smId = generateId();
          const states: State[] = (item.states || []).map((s, i) => ({
            id: generateId(),
            name: s.name || `状态${i + 1}`,
            isInitial: s.isInitial || i === 0,
            isFinal: s.isFinal || false,
            description: s.description || '',
          }));
          
          const transitions: Transition[] = (item.transitions || []).map((t, i) => ({
            id: generateId(),
            name: t.name || `转换${i + 1}`,
            from: states.find(s => s.name === t.from)?.id || states[0]?.id || '',
            to: states.find(s => s.name === t.to)?.id || states[states.length - 1]?.id || '',
            trigger: t.trigger || 'manual',
            description: t.description || '',
          }));

          const newSM: StateMachine = {
            id: smId,
            name: `${entity.name}状态机`,
            entity: entity.id,
            statusField: 'status',
            states,
            transitions,
          };
          addStateMachine(newSM);
          break;
        }

        case 'rule': {
          const newRule: Rule = {
            id: generateId(),
            name: item.name || '新规则',
            type: (item.type as Rule['type']) || 'field_validation',
            entity: entity.id,
            field: item.field || '',
            condition: (item.condition as Rule['condition']) || { type: 'required' },
            errorMessage: item.errorMessage || '验证失败',
            severity: (item.severity as Rule['severity']) || 'error',
            description: item.description || '',
          };
          addRule(newRule);
          break;
        }

        case 'event': {
          const newEvent: EventDefinition = {
            id: generateId(),
            name: item.name || '新事件',
            nameEn: item.nameEn || '',
            entity: entity.id,
            trigger: (item.trigger as EventDefinition['trigger']) || 'create',
            condition: typeof item.condition === 'string' ? item.condition : '',
            payload: (item.payload as EventDefinition['payload']) || [],
            description: item.description || '',
          };
          addEventDefinition(newEvent);
          break;
        }

        case 'subscription': {
          // 需要先找到对应的事件ID
          const eventName = item.event || '';
          const existingEvents = relatedModels?.events || [];
          const targetEventId = existingEvents.find(e => e.name === eventName)?.id;
          
          // 如果找不到事件，可能事件还没创建，暂时跳过
          if (!targetEventId) {
            console.log('Subscription skipped: event not found', eventName);
            break;
          }
          
          const newSubscription: Subscription = {
            id: generateId(),
            name: item.name || '新订阅',
            eventId: targetEventId as string,
            handler: (item.handler as Subscription['handler']) || 'async',
            action: (item.action as Subscription['action']) || 'notification',
            actionRef: item.actionRef || '',
            description: item.description || '',
          };
          addSubscription(newSubscription);
          break;
        }
      }

      setAppliedItems(prev => new Set(prev).add(itemKey));
    } catch (error) {
      console.error('Apply suggestion error:', error);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>无项目数据</p>
      </div>
    );
  }

  const generateMarkdown = () => {
    let md = '';
    
    // 标题
    if (isEntityMode && relatedModels?.entity) {
      md += `# ${relatedModels.entity.name} - 实体建模手册\n\n`;
      md += `**英文名称**: ${relatedModels.entity.nameEn}\n`;
      md += `**所属领域**: ${project.domain.name}\n`;
    } else {
      md += `# ${project.name} - 本体模型建模手册\n\n`;
      md += `**版本**: v1.0\n`;
      md += `**领域**: ${project.domain.name}\n`;
    }
    md += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    
    md += `---\n\n`;
    
    // 如果是实体模式，显示实体的详细模型
    if (isEntityMode && relatedModels?.entity) {
      const entity = relatedModels.entity;
      
      md += `## 实体概述\n\n`;
      if (entity.description) {
        md += `${entity.description}\n\n`;
      }
      
      // 数据模型
      md += `## 数据模型\n\n`;
      md += `### 属性定义\n\n`;
      if (entity.attributes.length > 0) {
        md += `| 属性名 | 英文名 | 类型 | 必填 | 唯一 | 说明 |\n`;
        md += `| --- | --- | --- | --- | --- | --- |\n`;
        entity.attributes.forEach((attr) => {
          md += `| ${attr.name} | ${attr.nameEn || '-'} | ${attr.type} | ${attr.required ? '✓' : ''} | ${attr.unique ? '✓' : ''} | ${attr.description || '-'} |\n`;
        });
        md += `\n`;
      } else {
        md += `*暂无属性定义*\n\n`;
      }
      
      if (entity.relations.length > 0) {
        md += `### 关系定义\n\n`;
        md += `| 关系名 | 类型 | 目标实体 |\n`;
        md += `| --- | --- | --- |\n`;
        entity.relations.forEach((rel) => {
          md += `| ${rel.name} | ${rel.type} | ${rel.targetEntity} |\n`;
        });
        md += `\n`;
      }
      
      // 行为模型
      md += `## 行为模型\n\n`;
      if (relatedModels.stateMachines.length > 0) {
        relatedModels.stateMachines.forEach((sm) => {
          md += `### ${sm.name}\n\n`;
          md += `**状态定义**:\n`;
          sm.states.forEach((s) => {
            md += `- ${s.name}${s.isInitial ? ' (初始)' : ''}${s.isFinal ? ' (终态)' : ''}\n`;
          });
          md += `\n`;
        });
      } else {
        md += `*暂无状态机定义*\n\n`;
      }
      
      // 规则模型
      md += `## 规则模型\n\n`;
      if (relatedModels.rules.length > 0) {
        relatedModels.rules.forEach((rule) => {
          md += `- **${rule.name}**: ${rule.errorMessage}\n`;
        });
        md += `\n`;
      } else {
        md += `*暂无规则定义*\n\n`;
      }
      
      // 事件模型
      md += `## 事件模型\n\n`;
      if (relatedModels.events.length > 0) {
        relatedModels.events.forEach((event) => {
          md += `- **${event.name}**: ${event.trigger}\n`;
        });
        md += `\n`;
      } else {
        md += `*暂无事件定义*\n\n`;
      }
      
    } else {
      // 完整项目模式
      md += `## 目录\n\n`;
      md += `1. [概述](#概述)\n`;
      md += `2. [数据模型](#数据模型)\n`;
      md += `3. [行为模型](#行为模型)\n`;
      md += `4. [规则模型](#规则模型)\n`;
      md += `5. [事件模型](#事件模型)\n\n`;
      
      md += `---\n\n`;
      
      md += `## 概述\n\n`;
      md += `### 领域信息\n\n`;
      md += `- **领域名称**: ${project.domain.name}\n`;
      md += `- **英文名称**: ${project.domain.nameEn}\n\n`;
      
      md += `### 模型统计\n\n`;
      md += `| 模型类型 | 数量 |\n`;
      md += `| --- | --- |\n`;
      md += `| 实体 | ${project.dataModel?.entities.length || 0} |\n`;
      md += `| 状态机 | ${project.behaviorModel?.stateMachines.length || 0} |\n`;
      md += `| 规则 | ${project.ruleModel?.rules.length || 0} |\n`;
      md += `| 事件 | ${project.eventModel?.events.length || 0} |\n\n`;
      
      // 数据模型
      md += `## 数据模型\n\n`;
      if (project.dataModel && project.dataModel.entities.length > 0) {
        project.dataModel.entities.forEach((entity) => {
          md += `### ${entity.name}\n\n`;
          md += `**英文名称**: ${entity.nameEn}\n\n`;
          if (entity.attributes.length > 0) {
            md += `| 属性名 | 类型 | 必填 |\n`;
            md += `| --- | --- | --- |\n`;
            entity.attributes.forEach((attr) => {
              md += `| ${attr.name} | ${attr.type} | ${attr.required ? '✓' : ''} |\n`;
            });
            md += `\n`;
          }
        });
      }
    }
    
    return md;
  };

  const markdown = generateMarkdown();

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = isEntityMode && relatedModels?.entity 
      ? `${relatedModels.entity.name}_建模手册.md`
      : `${project.name.replace(/\s+/g, '_')}_建模手册.md`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = isEntityMode && relatedModels 
      ? { entity: relatedModels.entity, models: relatedModels }
      : project;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = isEntityMode && relatedModels?.entity 
      ? `${relatedModels.entity.name}_模型数据.json`
      : `${project.name.replace(/\s+/g, '_')}_本体模型.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 渲染AI建议卡片
  const renderAISuggestionCard = () => {
    if (!isEntityMode) return null;

    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            AI 智能建议
            {aiSuggestions && (
              <Badge variant="secondary" className="ml-2">已生成</Badge>
            )}
          </CardTitle>
          <CardDescription>
            基于实体「{relatedModels?.entity?.name}」和所属项目「{getProjectName(relatedModels?.entity?.projectId)}」生成的模型建议
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-muted-foreground">AI 正在分析并生成建议...</span>
            </div>
          ) : generateError ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">{generateError}</div>
              <Button onClick={handleGenerateAI} variant="outline">
                重试
              </Button>
            </div>
          ) : aiSuggestions ? (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-6">
                {/* 数据模型建议 */}
                {aiSuggestions.dataModel?.suggestedAttributes && aiSuggestions.dataModel.suggestedAttributes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      🗄️ 建议属性
                      <Badge variant="outline">{aiSuggestions.dataModel.suggestedAttributes.length}</Badge>
                    </h4>
                    <div className="grid gap-2">
                      {aiSuggestions.dataModel.suggestedAttributes.map((attr, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{attr.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {attr.type} {attr.required && '• 必填'} {attr.description && `• ${attr.description}`}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant={appliedItems.has(`attribute-${idx}`) ? "secondary" : "default"}
                            onClick={() => handleApplySuggestion('attribute', attr, idx)}
                            disabled={appliedItems.has(`attribute-${idx}`)}
                          >
                            {appliedItems.has(`attribute-${idx}`) ? '已应用' : '应用'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 关系建议 */}
                {aiSuggestions.dataModel?.suggestedRelations && aiSuggestions.dataModel.suggestedRelations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      🔗 建议关系
                      <Badge variant="outline">{aiSuggestions.dataModel.suggestedRelations.length}</Badge>
                    </h4>
                    <div className="grid gap-2">
                      {aiSuggestions.dataModel.suggestedRelations.map((rel, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{rel.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {rel.type} → {rel.targetEntity}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant={appliedItems.has(`relation-${idx}`) ? "secondary" : "default"}
                            onClick={() => handleApplySuggestion('relation', rel, idx)}
                            disabled={appliedItems.has(`relation-${idx}`)}
                          >
                            {appliedItems.has(`relation-${idx}`) ? '已应用' : '应用'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 行为模型建议 */}
                {aiSuggestions.behaviorModel?.suggestedStates && aiSuggestions.behaviorModel.suggestedStates.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      ⚡ 建议状态机
                      <Badge variant="outline">{aiSuggestions.behaviorModel.suggestedStates.length} 状态</Badge>
                    </h4>
                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.behaviorModel.suggestedStates.map((state, idx) => (
                            <Badge key={idx} variant={state.isInitial ? "default" : state.isFinal ? "destructive" : "outline"}>
                              {state.name}
                            </Badge>
                          ))}
                        </div>
                        {aiSuggestions.behaviorModel.suggestedTransitions && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {aiSuggestions.behaviorModel.suggestedTransitions.length} 个状态转换
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm"
                        variant={appliedItems.has(`stateMachine-0`) ? "secondary" : "default"}
                        onClick={() => handleApplySuggestion('stateMachine', {
                          states: aiSuggestions.behaviorModel?.suggestedStates,
                          transitions: aiSuggestions.behaviorModel?.suggestedTransitions
                        }, 0)}
                        disabled={appliedItems.has(`stateMachine-0`)}
                      >
                        {appliedItems.has(`stateMachine-0`) ? '已应用' : '应用'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 规则建议 */}
                {aiSuggestions.ruleModel?.suggestedRules && aiSuggestions.ruleModel.suggestedRules.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      📋 建议规则
                      <Badge variant="outline">{aiSuggestions.ruleModel.suggestedRules.length}</Badge>
                    </h4>
                    <div className="grid gap-2">
                      {aiSuggestions.ruleModel.suggestedRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {rule.errorMessage}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant={appliedItems.has(`rule-${idx}`) ? "secondary" : "default"}
                            onClick={() => handleApplySuggestion('rule', rule, idx)}
                            disabled={appliedItems.has(`rule-${idx}`)}
                          >
                            {appliedItems.has(`rule-${idx}`) ? '已应用' : '应用'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 事件建议 */}
                {aiSuggestions.eventModel?.suggestedEvents && aiSuggestions.eventModel.suggestedEvents.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      📨 建议事件
                      <Badge variant="outline">{aiSuggestions.eventModel.suggestedEvents.length}</Badge>
                    </h4>
                    <div className="grid gap-2">
                      {aiSuggestions.eventModel.suggestedEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-muted-foreground">
                              触发时机: {event.trigger}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant={appliedItems.has(`event-${idx}`) ? "secondary" : "default"}
                            onClick={() => handleApplySuggestion('event', event, idx)}
                            disabled={appliedItems.has(`event-${idx}`)}
                          >
                            {appliedItems.has(`event-${idx}`) ? '已应用' : '应用'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Button onClick={handleGenerateAI} className="bg-gradient-to-r from-purple-600 to-blue-600">
                ✨ 生成AI建议
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                ← 返回编辑
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {isEntityMode && relatedModels?.entity 
                    ? `${relatedModels.entity.name} - 实体建模` 
                    : `${project.name} - 建模手册`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {project.domain.name} • 生成于 {new Date().toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiSuggestions && (
                <Button variant="outline" onClick={handleGenerateAI}>
                  🔄 重新生成
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadJson}>
                下载 JSON
              </Button>
              <Button onClick={handleDownload}>
                下载 Markdown
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {isEntityMode ? (
          // 实体模式：显示AI建议和当前模型
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：AI建议 */}
            <div>
              {renderAISuggestionCard()}
            </div>
            
            {/* 右侧：当前模型 */}
            <Card>
              <CardHeader>
                <CardTitle>当前模型数据</CardTitle>
                <CardDescription>
                  实体「{relatedModels?.entity?.name}」已定义的模型
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="data" className="h-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="data">数据模型</TabsTrigger>
                    <TabsTrigger value="behavior">行为模型</TabsTrigger>
                    <TabsTrigger value="rule">规则模型</TabsTrigger>
                    <TabsTrigger value="event">事件模型</TabsTrigger>
                  </TabsList>

                  <TabsContent value="data">
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">属性 ({relatedModels?.entity?.attributes.length || 0})</h4>
                          {relatedModels?.entity?.attributes && relatedModels.entity.attributes.length > 0 ? (
                            <div className="space-y-2">
                              {relatedModels.entity.attributes.map((attr) => (
                                <div key={attr.id} className="p-2 bg-muted rounded-lg">
                                  <span className="font-medium">{attr.name}</span>
                                  <span className="text-muted-foreground ml-2">({attr.type})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">暂无属性</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">关系 ({relatedModels?.entity?.relations?.length || 0})</h4>
                          {relatedModels?.entity?.relations && relatedModels.entity.relations.length > 0 ? (
                            <div className="space-y-2">
                              {relatedModels.entity.relations.map((rel) => (
                                <div key={rel.id} className="p-2 bg-muted rounded-lg">
                                  <span className="font-medium">{rel.name}</span>
                                  <span className="text-muted-foreground ml-2">→ {rel.targetEntity}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">暂无关系</p>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="behavior">
                    <ScrollArea className="max-h-[400px]">
                      {relatedModels?.stateMachines && relatedModels.stateMachines.length > 0 ? (
                        <div className="space-y-4">
                          {relatedModels.stateMachines.map((sm) => (
                            <div key={sm.id} className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">{sm.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                {sm.states.map((s) => (
                                  <Badge key={s.id} variant={s.isInitial ? "default" : s.isFinal ? "destructive" : "outline"}>
                                    {s.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">暂无状态机</p>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="rule">
                    <ScrollArea className="max-h-[400px]">
                      {relatedModels?.rules && relatedModels.rules.length > 0 ? (
                        <div className="space-y-2">
                          {relatedModels.rules.map((rule) => (
                            <div key={rule.id} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-sm text-muted-foreground">{rule.errorMessage}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">暂无规则</p>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="event">
                    <ScrollArea className="max-h-[400px]">
                      {relatedModels?.events && relatedModels.events.length > 0 ? (
                        <div className="space-y-2">
                          {relatedModels.events.map((event) => (
                            <div key={event.id} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-muted-foreground">触发: {event.trigger}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">暂无事件</p>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : (
          // 项目模式：显示完整手册
          <Tabs defaultValue="markdown" className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="markdown">Markdown 预览</TabsTrigger>
              <TabsTrigger value="json">JSON 结构</TabsTrigger>
            </TabsList>

            <TabsContent value="markdown">
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[calc(100vh-250px)]">
                      {markdown}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json">
              <Card>
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[calc(100vh-250px)]">
                    {JSON.stringify(project, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
