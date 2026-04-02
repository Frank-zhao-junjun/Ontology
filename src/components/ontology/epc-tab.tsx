'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { isEntityAggregateRoot } from '@/lib/entity-role';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { EpcInformationObject, EpcOrganizationalUnit, EpcSystemActor } from '@/types/ontology';

interface EpcTabProps {
  entityId: string;
}

function generateDraftId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
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

function getSourceLabel(sourceType: EpcInformationObject['sourceType']): string {
  switch (sourceType) {
    case 'aggregate':
      return '聚合根派生';
    case 'child_entity':
      return '子实体派生';
    case 'masterdata':
      return '主数据派生';
    case 'manual':
    default:
      return '手工补充';
  }
}

export function EpcTab({ entityId }: EpcTabProps) {
  const { project, ensureEpcProfile, updateEpcProfile, regenerateEpcDocument } = useOntologyStore();
  const entity = project?.dataModel?.entities.find((item) => item.id === entityId);
  const isAggregate = isEntityAggregateRoot(entity);
  const profile = project?.epcModel?.profiles.find((item) => item.aggregateId === entityId);

  const [draft, setDraft] = useState({
    businessName: '',
    businessCode: '',
    purpose: '',
    scopeStart: '',
    scopeEnd: '',
    businessBackground: '',
    notes: '',
  });
  const [organizationalUnitsDraft, setOrganizationalUnitsDraft] = useState<EpcOrganizationalUnit[]>([]);
  const [systemsDraft, setSystemsDraft] = useState<EpcSystemActor[]>([]);
  const [informationObjectsDraft, setInformationObjectsDraft] = useState<EpcInformationObject[]>([]);
  const [isPackageExporting, setIsPackageExporting] = useState(false);
  const [packageExportError, setPackageExportError] = useState<string | null>(null);

  useEffect(() => {
    if (project && isAggregate && !profile) {
      ensureEpcProfile(entityId);
    }
  }, [entityId, ensureEpcProfile, isAggregate, profile, project]);

  useEffect(() => {
    setDraft({
      businessName: profile?.businessName || entity?.name || '',
      businessCode: profile?.businessCode || entity?.nameEn || '',
      purpose: profile?.purpose || '',
      scopeStart: profile?.scopeStart || '',
      scopeEnd: profile?.scopeEnd || '',
      businessBackground: profile?.businessBackground || '',
      notes: profile?.notes || '',
    });
    setOrganizationalUnitsDraft(profile?.organizationalUnits || []);
    setSystemsDraft(profile?.systems || []);
    setInformationObjectsDraft(profile?.informationObjects || []);
  }, [entity?.name, entity?.nameEn, profile]);

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
          <CardTitle>EPC业务活动规格说明书</CardTitle>
          <CardDescription>EPC 仅对聚合根开放。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          当前实体不是聚合根，请先在数据模型中将其设置为聚合根后再生成 EPC 文档。
        </CardContent>
      </Card>
    );
  }

  const handleSave = () => {
    updateEpcProfile(entityId, {
      businessName: draft.businessName,
      businessCode: draft.businessCode,
      purpose: draft.purpose,
      scopeStart: draft.scopeStart,
      scopeEnd: draft.scopeEnd,
      businessBackground: draft.businessBackground,
      notes: draft.notes,
    });
  };

  const handleAddManualInformationObject = () => {
    setInformationObjectsDraft((current) => ([
      ...current,
      {
        id: generateDraftId('manual-info'),
        name: '新信息对象',
        sourceType: 'manual',
        attributes: [],
        description: '',
      },
    ]));
  };

  const handleInfoObjectChange = (id: string, updates: Partial<EpcInformationObject>) => {
    setInformationObjectsDraft((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteManualInformationObject = (id: string) => {
    setInformationObjectsDraft((current) => current.filter((item) => item.id !== id));
  };

  const handleSaveInformationObjects = () => {
    updateEpcProfile(entityId, {
      informationObjects: informationObjectsDraft,
    });
  };

  const handleAddOrganizationalUnit = () => {
    setOrganizationalUnitsDraft((current) => ([
      ...current,
      {
        id: generateDraftId('org-unit'),
        name: '新组织单元',
        type: 'role',
        responsibilities: '',
        permissions: '',
      },
    ]));
  };

  const handleOrganizationalUnitChange = (id: string, updates: Partial<EpcOrganizationalUnit>) => {
    setOrganizationalUnitsDraft((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteOrganizationalUnit = (id: string) => {
    setOrganizationalUnitsDraft((current) => current.filter((item) => item.id !== id));
  };

  const handleSaveOrganizationalUnits = () => {
    updateEpcProfile(entityId, {
      organizationalUnits: organizationalUnitsDraft,
    });
  };

  const handleAddSystem = () => {
    setSystemsDraft((current) => ([
      ...current,
      {
        id: generateDraftId('system'),
        name: '新系统',
        type: 'internal',
        description: '',
      },
    ]));
  };

  const handleSystemChange = (id: string, updates: Partial<EpcSystemActor>) => {
    setSystemsDraft((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteSystem = (id: string) => {
    setSystemsDraft((current) => current.filter((item) => item.id !== id));
  };

  const handleSaveSystems = () => {
    updateEpcProfile(entityId, {
      systems: systemsDraft,
    });
  };

  const handleDownloadMarkdown = () => {
    if (!profile?.generatedDocument) {
      return;
    }

    downloadContent(profile.generatedDocument, 'text/markdown', `${fileBaseName}.md`);
  };

  const handleDownloadJson = () => {
    if (!profile) {
      return;
    }

    downloadContent(JSON.stringify({
      aggregateId: profile.aggregateId,
      aggregateName: entity.name,
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
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>EPC概览</CardTitle>
            <CardDescription>{entity.name} 的生成型业务活动规格说明书</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>基本信息补充</CardTitle>
            <CardDescription>第一期仅开放文档级补充字段。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="epc-business-name">业务名称</Label>
              <Input id="epc-business-name" value={draft.businessName} onChange={(event) => setDraft((current) => ({ ...current, businessName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epc-business-code">业务编码</Label>
              <Input id="epc-business-code" value={draft.businessCode} onChange={(event) => setDraft((current) => ({ ...current, businessCode: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epc-purpose">文档目的</Label>
              <Textarea id="epc-purpose" value={draft.purpose} onChange={(event) => setDraft((current) => ({ ...current, purpose: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="epc-scope-start">起始点</Label>
                <Input id="epc-scope-start" value={draft.scopeStart} onChange={(event) => setDraft((current) => ({ ...current, scopeStart: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="epc-scope-end">结束点</Label>
                <Input id="epc-scope-end" value={draft.scopeEnd} onChange={(event) => setDraft((current) => ({ ...current, scopeEnd: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="epc-background">业务背景</Label>
              <Textarea id="epc-background" value={draft.businessBackground} onChange={(event) => setDraft((current) => ({ ...current, businessBackground: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epc-notes">备注</Label>
              <Textarea id="epc-notes" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">保存补充信息</Button>
              <Button variant="outline" onClick={() => regenerateEpcDocument(entityId)}>重新生成</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>组织单元</CardTitle>
                <CardDescription>用于补齐 EPC 中的执行角色、部门职责与权限矩阵。</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddOrganizationalUnit}>+ 添加组织单元</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizationalUnitsDraft.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无组织单元，请补充执行角色或责任部门。</div>
            ) : organizationalUnitsDraft.map((unit) => (
              <div key={unit.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{unit.name || '未命名组织单元'}</div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteOrganizationalUnit(unit.id)}>删除</Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`org-name-${unit.id}`}>组织单元名称</Label>
                  <Input
                    id={`org-name-${unit.id}`}
                    value={unit.name}
                    onChange={(event) => handleOrganizationalUnitChange(unit.id, { name: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`org-type-${unit.id}`}>组织单元类型</Label>
                  <Select value={unit.type || 'role'} onValueChange={(value) => handleOrganizationalUnitChange(unit.id, { type: value as EpcOrganizationalUnit['type'] })}>
                    <SelectTrigger id={`org-type-${unit.id}`} className="w-full">
                      <SelectValue placeholder="请选择组织单元类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">角色</SelectItem>
                      <SelectItem value="department">部门</SelectItem>
                      <SelectItem value="system">系统角色</SelectItem>
                      <SelectItem value="external_party">外部参与方</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`org-responsibilities-${unit.id}`}>职责说明</Label>
                  <Textarea
                    id={`org-responsibilities-${unit.id}`}
                    value={unit.responsibilities || ''}
                    onChange={(event) => handleOrganizationalUnitChange(unit.id, { responsibilities: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`org-permissions-${unit.id}`}>权限说明</Label>
                  <Textarea
                    id={`org-permissions-${unit.id}`}
                    value={unit.permissions || ''}
                    onChange={(event) => handleOrganizationalUnitChange(unit.id, { permissions: event.target.value })}
                  />
                </div>
              </div>
            ))}
            <Button onClick={handleSaveOrganizationalUnits} className="w-full">保存组织单元</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>执行系统</CardTitle>
                <CardDescription>用于补齐 EPC 中的系统边界、平台参与方与系统章节。</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddSystem}>+ 添加系统</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemsDraft.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无执行系统，请补充内部系统、外部系统或平台。</div>
            ) : systemsDraft.map((system) => (
              <div key={system.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{system.name || '未命名系统'}</div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSystem(system.id)}>删除</Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`system-name-${system.id}`}>系统名称</Label>
                  <Input
                    id={`system-name-${system.id}`}
                    value={system.name}
                    onChange={(event) => handleSystemChange(system.id, { name: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`system-type-${system.id}`}>系统类型</Label>
                  <Select value={system.type || 'internal'} onValueChange={(value) => handleSystemChange(system.id, { type: value as EpcSystemActor['type'] })}>
                    <SelectTrigger id={`system-type-${system.id}`} className="w-full">
                      <SelectValue placeholder="请选择系统类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">内部系统</SelectItem>
                      <SelectItem value="external">外部系统</SelectItem>
                      <SelectItem value="platform">平台</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`system-description-${system.id}`}>系统说明</Label>
                  <Textarea
                    id={`system-description-${system.id}`}
                    value={system.description || ''}
                    onChange={(event) => handleSystemChange(system.id, { description: event.target.value })}
                  />
                </div>
              </div>
            ))}
            <Button onClick={handleSaveSystems} className="w-full">保存执行系统</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>信息对象</CardTitle>
                <CardDescription>派生对象只读保护真值，手工对象用于补充流程语义。</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddManualInformationObject}>+ 添加手工对象</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {informationObjectsDraft.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无信息对象。</div>
            ) : informationObjectsDraft.map((info) => {
              const isManual = info.sourceType === 'manual';
              return (
                <div key={info.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{info.name || '未命名信息对象'}</div>
                      <Badge variant={isManual ? 'secondary' : 'outline'}>{getSourceLabel(info.sourceType)}</Badge>
                      {!isManual && <Badge variant="outline">结构只读</Badge>}
                    </div>
                    {isManual && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteManualInformationObject(info.id)}>删除</Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`info-name-${info.id}`}>对象名称</Label>
                    <Input
                      id={`info-name-${info.id}`}
                      value={info.name}
                      disabled={!isManual}
                      onChange={(event) => handleInfoObjectChange(info.id, { name: event.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`info-attributes-${info.id}`}>属性摘要</Label>
                    <Input
                      id={`info-attributes-${info.id}`}
                      value={info.attributes.join('、')}
                      disabled={!isManual}
                      onChange={(event) => handleInfoObjectChange(info.id, {
                        attributes: event.target.value.split(/[、,]/).map((value) => value.trim()).filter(Boolean),
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`info-description-${info.id}`}>流程说明</Label>
                    <Textarea
                      id={`info-description-${info.id}`}
                      value={info.description || ''}
                      onChange={(event) => handleInfoObjectChange(info.id, { description: event.target.value })}
                    />
                  </div>

                  {!isManual && (
                    <div className="text-xs text-muted-foreground">
                      来源：{info.sourceRefId || '系统派生'}。名称与属性摘要来源于数据模型/主数据引用，重生成时会自动刷新，流程说明会保留。
                    </div>
                  )}
                </div>
              );
            })}
            <Button onClick={handleSaveInformationObjects} className="w-full">保存信息对象规则</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>完整性提示</CardTitle>
            <CardDescription>第二期开始校验组织单元、系统与信息对象的建模边界。</CardDescription>
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
              <div className="text-muted-foreground">当前骨架无阻断错误。</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-[640px]">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>文档预览</CardTitle>
              <CardDescription>由四大元模型与 EPC 补充信息动态生成，可直接导出 Markdown、JSON 或整包配置包。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportPackage} disabled={!project || isPackageExporting}>
                {isPackageExporting ? '导出中...' : '导出配置包'}
              </Button>
              <Button variant="outline" onClick={handleDownloadJson} disabled={!profile}>导出 JSON</Button>
              <Button onClick={handleDownloadMarkdown} disabled={!profile?.generatedDocument}>导出 Markdown</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {packageExportError && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {packageExportError}
            </div>
          )}
          <ScrollArea className="h-[720px] rounded-lg border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-6">{profile?.generatedDocument || '正在生成 EPC 预览...'}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}