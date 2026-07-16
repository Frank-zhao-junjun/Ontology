'use client';

import { useMemo, useState, useCallback } from 'react';
import { Download, Loader2, Package, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  buildManifestExportBundle,
  downloadManifestExport,
  type ManifestExportFormat,
} from '@/lib/manifest-export';
import { renderOntologyMarkdown, buildOntologyJson, resolveProjectStatus } from '@/lib/skill-export';
import type { OntologyProject } from '@/types/ontology';
import type { ManifestValidationIssue } from '@/lib/manifest-validator';

interface ManifestExportDialogProps {
  project: OntologyProject;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function IssueRow({ issue }: { issue: ManifestValidationIssue }) {
  const location = [issue.elementType, issue.id, issue.field].filter(Boolean).join(' · ');
  return (
    <li className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>{issue.code}</Badge>
        {location ? <span className="font-mono text-xs text-muted-foreground">{location}</span> : null}
      </div>
      <p className="mt-1 text-muted-foreground">{issue.message}</p>
    </li>
  );
}

type ExtendedExportFormat = ManifestExportFormat | 'md' | 'skill';
type SkillExportScope = 'all' | 'data' | 'behavior' | 'rule' | 'process' | 'event';

const SKILL_SCOPE_OPTIONS: { value: SkillExportScope; label: string }[] = [
  { value: 'all', label: '全部模型' },
  { value: 'data', label: '仅数据模型' },
  { value: 'behavior', label: '仅行为模型' },
  { value: 'rule', label: '仅规则模型' },
  { value: 'process', label: '仅流程模型' },
  { value: 'event', label: '仅事件模型' },
];

const STATUS_TEXT: Record<string, string> = {
  confirmed: '已确认',
  draft: '草稿',
  review: '审核中',
  archived: '已归档',
};

export function ManifestExportDialog({ project, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ManifestExportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const [format, setFormat] = useState<ExtendedExportFormat>('yaml');
  const [skillScope, setSkillScope] = useState<SkillExportScope>('all');
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);
  const [mdLoading, setMdLoading] = useState(false);

  const bundle = useMemo(() => {
    if (!open || format === 'skill' || format === 'md') return null;
    return buildManifestExportBundle(project, { format: format === 'xlsx' ? 'json' : format });
  }, [open, project, format]);

  const projectStatus = useMemo(() => resolveProjectStatus(project), [project]);

  const skillStatusAlert = useMemo(() => {
    if (format !== 'skill') return null;
    const status = STATUS_TEXT[projectStatus] || projectStatus;
    if (projectStatus === 'confirmed') {
      return `当前项目为 ${status} 状态，导出的 Skill 可直接使用。`;
    }
    return `当前项目为 ${status} 状态，导出的 Skill 将包含未确认对象，请谨慎使用。`;
  }, [format, projectStatus]);

  const handleDownload = () => {
    if (!bundle) return;
    downloadManifestExport(bundle);
  };

  const handleDownloadXlsx = useCallback(async () => {
    if (!bundle) return;
    setXlsxLoading(true);
    try {
      const response = await fetch('/api/export/xlsx-from-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle.manifest),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bundle.filename.replace(/\.(yaml|json)$/i, '.xlsx');
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('XLSX 导出失败:', err);
      toast.error(`Excel 导出失败：${msg}`);
    } finally {
      setXlsxLoading(false);
    }
  }, [bundle]);

  const handleDownloadMarkdown = useCallback(async () => {
    setMdLoading(true);
    try {
      const version = (project as { version?: string }).version || '1.0.0';
      const ontologyJson = buildOntologyJson(project, {
        scope: 'all',
        includeSemanticLayer: true,
        exportedAt: new Date().toISOString(),
        version,
      });
      const markdown = renderOntologyMarkdown(ontologyJson);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const nameSegment = project.name.replace(/[^\w\u4e00-\u9fff-]+/gu, '_').replace(/^_+|_+$/g, '') || 'ontology';
      a.download = `${nameSegment}-ontology-model.md`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Markdown 导出失败:', err);
      toast.error(`Markdown 导出失败：${msg}`);
    } finally {
      setMdLoading(false);
    }
  }, [project]);

  const handleDownloadSkill = useCallback(async () => {
    setSkillLoading(true);
    try {
      const response = await fetch('/api/export/skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          scope: skillScope,
          includeExamples: true,
          includeSemanticLayer: true,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'ontology-model-skill.zip';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Skill 导出失败:', err);
      toast.error(`Skill 导出失败：${msg}`);
    } finally {
      setSkillLoading(false);
    }
  }, [project, skillScope]);

  const displayFilename = bundle
    ? format === 'xlsx'
      ? bundle.filename.replace(/\.(yaml|json)$/i, '.xlsx')
      : bundle.filename
    : '';

  const errorCount = bundle?.validation?.errors.length ?? 0;
  const warningCount = bundle?.validation?.warnings.length ?? 0;

  const isManifestFormat = format === 'yaml' || format === 'json' || format === 'xlsx';
  const isDownloadDisabled = isManifestFormat && !bundle?.validation?.valid;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            导出 OntologyManifest
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>导出平台本体制品</DialogTitle>
          <DialogDescription>
            生成 <code className="text-xs">ontology.platform/v1</code> Manifest 或 Skill 包。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={format === 'yaml' ? 'default' : 'outline'}
            onClick={() => setFormat('yaml')}
          >
            YAML
          </Button>
          <Button
            type="button"
            size="sm"
            variant={format === 'json' ? 'default' : 'outline'}
            onClick={() => setFormat('json')}
          >
            JSON
          </Button>
          <Button
            type="button"
            size="sm"
            variant={format === 'xlsx' ? 'default' : 'outline'}
            onClick={() => setFormat('xlsx')}
          >
            XLSX
          </Button>
          <Button
            type="button"
            size="sm"
            variant={format === 'md' ? 'default' : 'outline'}
            onClick={() => setFormat('md')}
            className="gap-1"
          >
            <FileText className="h-4 w-4" />
            Markdown
          </Button>
          <Button
            type="button"
            size="sm"
            variant={format === 'skill' ? 'default' : 'outline'}
            onClick={() => setFormat('skill')}
            className="gap-1"
          >
            <Package className="h-4 w-4" />
            Skill ZIP
          </Button>
        </div>

        {format === 'skill' && (
          <div className="space-y-3 rounded-md border p-3">
            <Label className="text-sm font-medium">导出范围</Label>
            <RadioGroup
              value={skillScope}
              onValueChange={(value) => setSkillScope(value as SkillExportScope)}
              className="grid grid-cols-2 gap-2"
            >
              {SKILL_SCOPE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`scope-${option.value}`} />
                  <Label htmlFor={`scope-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Alert>
              <AlertDescription>{skillStatusAlert}</AlertDescription>
            </Alert>
          </div>
        )}

        {bundle?.validation ? (
          <div className="space-y-3">
            {bundle.validation.valid ? (
              <Alert>
                <AlertDescription>
                  校验通过（{warningCount > 0 ? `${warningCount} 条警告` : '无警告'}），可下载{' '}
                  <span className="font-mono text-xs">{displayFilename}</span>。
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  校验未通过（{errorCount} 条错误），请修复后再导出。下载已禁用。
                </AlertDescription>
              </Alert>
            )}

            {(bundle.validation.errors.length > 0 || bundle.validation.warnings.length > 0) && (
              <ScrollArea className="h-48 rounded-md border p-2">
                <ul className="space-y-2">
                  {bundle.validation.errors.map((issue, index) => (
                    <IssueRow key={`e-${issue.code}-${index}-${issue.message}`} issue={issue} />
                  ))}
                  {bundle.validation.warnings.map((issue, index) => (
                    <IssueRow key={`w-${issue.code}-${index}-${issue.message}`} issue={issue} />
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
          {format === 'skill' && (
            <Button
              type="button"
              disabled={skillLoading}
              onClick={handleDownloadSkill}
              className="gap-1"
            >
              {skillLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              下载 Skill ZIP
            </Button>
          )}
          {format === 'md' && (
            <Button
              type="button"
              disabled={mdLoading}
              onClick={handleDownloadMarkdown}
              className="gap-1"
            >
              {mdLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              下载 Markdown
            </Button>
          )}
          {isManifestFormat && (
            <Button
              type="button"
              disabled={isDownloadDisabled || xlsxLoading}
              onClick={format === 'xlsx' ? handleDownloadXlsx : handleDownload}
            >
              {xlsxLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              下载 {format.toUpperCase()}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
