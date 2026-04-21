'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { isEntityAggregateRoot } from '@/lib/entity-role';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EpcTabProps {
  entityId: string;
}

function toEpcFileBaseName(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_');
}

function downloadContent(content: string, mimeType: string, fileName: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadFromUrl(downloadUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
}

export function EpcTab({ entityId }: EpcTabProps) {
  const { project, ensureEpcProfile, regenerateEpcDocument } = useOntologyStore();
  const entity = project?.dataModel?.entities.find((item) => item.id === entityId);
  const profile = project?.epcModel?.profiles.find((item) => item.aggregateId === entityId);
  const isAggregate = isEntityAggregateRoot(entity);
  const [isPackageExporting, setIsPackageExporting] = useState(false);
  const [packageExportError, setPackageExportError] = useState<string | null>(null);

  const businessScenario =
    project?.dataModel && entity?.businessScenarioId
      ? project.dataModel.businessScenarios.find((scenario) => scenario.id === entity.businessScenarioId) ?? null
      : null;

  useEffect(() => {
    if (project && entity && isAggregate && !profile) {
      ensureEpcProfile(entityId);
    }
  }, [ensureEpcProfile, entity, entityId, isAggregate, profile, project]);

  const stats = useMemo(() => ({
    activities: profile?.activities.length || 0,
    informationObjects: profile?.informationObjects.length || 0,
    exceptions: profile?.exceptions.length || 0,
    issues: profile?.validationSummary?.issues.length || 0,
  }), [profile]);

  const fileBaseName = useMemo(() => toEpcFileBaseName(entity?.nameEn || entity?.name || 'epc'), [entity?.name, entity?.nameEn]);

  if (!entity) {
    return null;
  }

  if (!isAggregate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EPC事件说明书</CardTitle>
          <CardDescription>EPC 事件说明书仅对聚合根开放。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          当前实体不是聚合根，请先在数据模型中将其设置为聚合根后再生成 EPC 事件说明书。
        </CardContent>
      </Card>
    );
  }

  const handleDownloadMarkdown = () => {
    if (!profile?.generatedDocument) {
      return;
    }

    downloadContent(profile.generatedDocument, 'text/markdown', `${fileBaseName}.md`);
  };

  const handleDownloadPdf = () => {
    if (!profile?.generatedDocument) {
      return;
    }

    // MVP: 导出可归档的 PDF 命名工件，正文与当前预览保持一致，后续可接入真 PDF 渲染器。
    downloadContent(profile.generatedDocument, 'application/pdf', `${fileBaseName}.pdf`);
  };

  const handleDownloadJson = () => {
    if (!profile) {
      return;
    }

    downloadContent(JSON.stringify({
      aggregateId: profile.aggregateId,
      aggregateName: entity.name,
      businessScenarioId: entity.businessScenarioId,
      businessScenarioDescription: businessScenario?.description || '',
      profile,
    }, null, 2), 'application/json', `${fileBaseName}.json`);
  };

  const handleExportPackage = async () => {
    if (!project) {
      return;
    }

    setIsPackageExporting(true);
    setPackageExportError(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project,
          config: {
            includeData: false,
          },
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.downloadUrl) {
        throw new Error(result.error || '导出配置包失败');
      }

      downloadFromUrl(result.data.downloadUrl, `${project.name.replace(/\s+/g, '_')}_${fileBaseName}_config_package.json`);
    } catch (error) {
      setPackageExportError(error instanceof Error ? error.message : '导出配置包失败');
    } finally {
      setIsPackageExporting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>EPC事件说明书</CardTitle>
            <CardDescription>{entity.name} 的只读生成结果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">活动</div>
                <div className="text-xl font-semibold">{stats.activities}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">信息对象</div>
                <div className="text-xl font-semibold">{stats.informationObjects}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">异常项</div>
                <div className="text-xl font-semibold">{stats.exceptions}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">缺失提示</div>
                <div className="text-xl font-semibold">{stats.issues}</div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="font-medium">生成依据</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">数据模型</Badge>
                <Badge variant="outline">行为模型</Badge>
                <Badge variant="outline">规则模型</Badge>
                <Badge variant="outline">事件模型</Badge>
                <Badge variant="outline">业务场景说明</Badge>
                {typeof profile?.validationSummary?.score === 'number' && (
                  <Badge variant="secondary">质量评分 {profile.validationSummary.score}</Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                业务背景/场景说明严格取自当前实体所属业务场景的描述字段，不支持在页签内编辑。
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="font-medium">归属业务场景</div>
              <div>{businessScenario?.name || '未配置业务场景'}</div>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {businessScenario?.description || '业务场景未提供描述，说明书背景将显示为空。'}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => regenerateEpcDocument(entityId)}>重新生成</Button>
              <Button variant="outline" onClick={handleExportPackage} disabled={!project || isPackageExporting}>
                {isPackageExporting ? '导出中...' : '导出配置包'}
              </Button>
              <Button variant="outline" onClick={handleDownloadJson} disabled={!profile}>导出 JSON</Button>
              <Button onClick={handleDownloadMarkdown} disabled={!profile?.generatedDocument}>导出 Markdown</Button>
              <Button variant="outline" onClick={handleDownloadPdf} disabled={!profile?.generatedDocument}>导出 PDF</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>完整性提示</CardTitle>
            <CardDescription>说明书内容仅由模型数据推导，不提供手工补充入口。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(profile?.validationSummary?.issues || []).length > 0 ? (
              profile?.validationSummary?.issues.map((issue) => (
                <div key={`${issue.code}-${issue.message}`} className="rounded-lg border p-3">
                  <div className="font-medium">{issue.code}</div>
                  <div className="text-muted-foreground">{issue.message}</div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">当前说明书生成成功，未发现阻断项。</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-[640px]">
        <CardHeader>
          <CardTitle>文档预览</CardTitle>
          <CardDescription>重新生成后，预览和导出内容保持一致。</CardDescription>
        </CardHeader>
        <CardContent>
          {packageExportError && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {packageExportError}
            </div>
          )}
          <ScrollArea className="h-[720px] rounded-lg border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-6">{profile?.generatedDocument || '正在生成 EPC 事件说明书...'}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
