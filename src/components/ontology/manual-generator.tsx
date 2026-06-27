'use client';

import { useMemo } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Entity, Rule, StateMachine, EventDefinition, Subscription } from '@/types/ontology';

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

export function ManualGenerator({ onBack, selectedEntityId, relatedModels }: ManualGeneratorProps) {
  const { project } = useOntologyStore();

  const projects = useMemo(() => project?.dataModel?.projects || [], [project?.dataModel?.projects]);

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return '未分类';
    const found = projects.find((p) => p.id === projectId);
    return found?.name || '未分类';
  };

  const isEntityMode = selectedEntityId && relatedModels?.entity;

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>无项目数据</p>
      </div>
    );
  }

  const generateMarkdown = () => {
    let md = '';

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

    if (isEntityMode && relatedModels?.entity) {
      const entity = relatedModels.entity;

      md += `## 实体概述\n\n`;
      if (entity.description) {
        md += `${entity.description}\n\n`;
      }

      md += `## 数据模型\n\n`;
      md += `### 属性定义\n\n`;
      if (entity.attributes.length > 0) {
        md += `| 属性名 | 英文名 | 类型 | 必填 | 唯一 | 说明 |\n`;
        md += `| --- | --- | --- | --- | --- | --- |\n`;
        entity.attributes.forEach((attr) => {
          md += `| ${attr.name} | ${attr.nameEn || '-'} | ${attr.dataType} | ${attr.required ? '✓' : ''} | ${attr.unique ? '✓' : ''} | ${attr.description || '-'} |\n`;
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

      md += `## 规则模型\n\n`;
      if (relatedModels.rules.length > 0) {
        relatedModels.rules.forEach((rule) => {
          md += `- **${rule.name}**: ${rule.errorMessage}\n`;
        });
        md += `\n`;
      } else {
        md += `*暂无规则定义*\n\n`;
      }

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

      md += `## 数据模型\n\n`;
      if (project.dataModel && project.dataModel.entities.length > 0) {
        project.dataModel.entities.forEach((entity) => {
          md += `### ${entity.name}\n\n`;
          md += `**英文名称**: ${entity.nameEn}\n\n`;
          if (entity.attributes.length > 0) {
            md += `| 属性名 | 类型 | 必填 |\n`;
            md += `| --- | --- | --- |\n`;
            entity.attributes.forEach((attr) => {
              md += `| ${attr.name} | ${attr.dataType} | ${attr.required ? '✓' : ''} |\n`;
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
    const fileName =
      isEntityMode && relatedModels?.entity
        ? `${relatedModels.entity.name}_建模手册.md`
        : `${project.name.replace(/\s+/g, '_')}_建模手册.md`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = isEntityMode && relatedModels ? { entity: relatedModels.entity, models: relatedModels } : project;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName =
      isEntityMode && relatedModels?.entity
        ? `${relatedModels.entity.name}_模型数据.json`
        : `${project.name.replace(/\s+/g, '_')}_本体模型.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                  {project.domain.name}
                  {isEntityMode && relatedModels?.entity
                    ? ` • ${getProjectName(relatedModels.entity.projectId)}`
                    : ''}
                  {' • '}
                  生成于 {new Date().toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownloadJson}>
                下载 JSON
              </Button>
              <Button onClick={handleDownload}>下载 Markdown</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {isEntityMode ? (
          <Card>
            <CardHeader>
              <CardTitle>当前模型数据</CardTitle>
              <CardDescription>实体「{relatedModels?.entity?.name}」已定义的模型</CardDescription>
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
                                <span className="text-muted-foreground ml-2">({attr.dataType})</span>
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
                                <Badge key={s.id} variant={s.isInitial ? 'default' : s.isFinal ? 'destructive' : 'outline'}>
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
        ) : (
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
