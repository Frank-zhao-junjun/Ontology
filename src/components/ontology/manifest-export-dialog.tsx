'use client';

import { useMemo, useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
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
import {
  buildManifestExportBundle,
  downloadManifestExport,
  type ManifestExportFormat,
} from '@/lib/manifest-export';
import type { OntologyProject } from '@/types/ontology';
import type { ManifestValidationIssue } from '@/lib/manifest-validator';

interface ManifestExportDialogProps {
  project: OntologyProject;
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

export function ManifestExportDialog({ project }: ManifestExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ManifestExportFormat>('yaml');
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const bundle = useMemo(() => {
    if (!open) return null;
    return buildManifestExportBundle(project, { format: format === 'xlsx' ? 'json' : format });
  }, [open, project, format]);

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
      // Delay revoke — some browsers handle download asynchronously
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('XLSX 导出失败:', err);
      toast.error(`Excel 导出失败：${msg}`);
    } finally {
      setXlsxLoading(false);
    }
  }, [bundle]);

  const displayFilename = bundle
    ? format === 'xlsx'
      ? bundle.filename.replace(/\.(yaml|json)$/i, '.xlsx')
      : bundle.filename
    : '';

  const errorCount = bundle?.validation.errors.length ?? 0;
  const warningCount = bundle?.validation.warnings.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          导出 OntologyManifest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>导出平台本体制品</DialogTitle>
          <DialogDescription>
            生成 <code className="text-xs">ontology.platform/v1</code> Manifest，供 ontology-platform 导入。
            EPC 事件说明书不写入主契约（见修改建议3）。
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
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
        </div>

        {bundle ? (
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
          <Button
            type="button"
            disabled={!bundle?.validation.valid || xlsxLoading}
            onClick={format === 'xlsx' ? handleDownloadXlsx : handleDownload}
          >
            {xlsxLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            下载 {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
