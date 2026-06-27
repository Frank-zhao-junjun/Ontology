'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useOntologyStore } from '@/store/ontology-store';
import {
  META_DIMENSION_LABELS,
  META_DIMENSION_ORDER,
} from '@/lib/element-selector/constants';
import {
  filterMetaElementsByDimension,
  filterUnreferencedElements,
  getUsageCount,
  resolveEpcName,
} from '@/lib/element-library';
import type { MetaDimension } from '@/types/ontology';
import { ElementCoverageBadge } from '@/components/ontology/element-coverage-badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { E1EntityPanel } from './e1-entity-panel';

export interface ElementLibraryFocusTarget {
  elementId: string;
  dimension: MetaDimension;
}

export interface ElementLibraryProps {
  focusTarget?: ElementLibraryFocusTarget | null;
  onFocusConsumed?: () => void;
  activeDimension?: MetaDimension;
  onDimensionChange?: (dimension: MetaDimension) => void;
}

export function ElementLibrary({
  focusTarget,
  onFocusConsumed,
  activeDimension: controlledDimension,
  onDimensionChange,
}: ElementLibraryProps = {}) {
  const project = useOntologyStore((s) => s.project);
  const getElementUsageRefs = useOntologyStore((s) => s.getElementUsageRefs);
  const applyAiElementDrafts = useOntologyStore((s) => s.applyAiElementDrafts);
  const [onlyUnreferenced, setOnlyUnreferenced] = useState(false);
  const [internalDimension, setInternalDimension] = useState<MetaDimension>('E1');
  const activeDimension = controlledDimension ?? internalDimension;
  const setActiveDimension = (dimension: MetaDimension) => {
    if (controlledDimension === undefined) {
      setInternalDimension(dimension);
    }
    onDimensionChange?.(dimension);
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI 解析文档对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.docx', '.pdf'];

  const metaElements = useMemo(() => project?.metaElements ?? [], [project?.metaElements]);

  const unreferencedTotal = useMemo(
    () => filterUnreferencedElements(metaElements, true).length,
    [metaElements],
  );

  const activeList = useMemo(() => {
    const byDim = filterMetaElementsByDimension(metaElements, activeDimension);
    return filterUnreferencedElements(byDim, onlyUnreferenced);
  }, [metaElements, activeDimension, onlyUnreferenced]);

  // focusTarget is an imperative signal from parent to focus on a specific element.
  // The state updates here are the intended response to the parent signal.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!focusTarget) return;
    setActiveDimension(focusTarget.dimension);
    setOnlyUnreferenced(false);
    setExpandedId(focusTarget.elementId);
    onFocusConsumed?.();
  }, [focusTarget, onFocusConsumed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── AI 解析文档 ─────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      toast.error(`不支持 ${ext} 格式，仅支持 ${ALLOWED_EXTENSIONS.join(' / ')}`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // 非文本格式提示使用文本格式
    const binaryFormats = ['.docx', '.pdf'];
    if (binaryFormats.includes(ext as typeof binaryFormats[number])) {
      toast.error(`${ext} 格式暂不支持客户端直接读取，请使用 .txt / .md / .csv / .json 格式`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content.length > 50000) {
        toast.error('文件过大，请裁剪至 50000 字以内');
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
      setDocumentText(content);
      setDocumentName(file.name);
    };
    reader.onerror = () => {
      toast.error('文件读取失败');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleAiSubmit = async () => {
    if (!project || !documentText.trim()) {
      toast.error('请先选择文档');
      return;
    }
    setAiLoading(true);
    try {
      const existingNames = metaElements.map((el) => el.name);
      const response = await fetch('/api/generate-element-draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          documentText,
          existingElementNames: existingNames,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? 'AI 解析文档失败');
      }
      const { elements } = payload;
      if (!elements || elements.length === 0) {
        toast.error('AI 未识别出任何要素');
        return;
      }
      const result = applyAiElementDrafts(elements);
      const skipMsg =
        result.skipped.length > 0
          ? `，跳过 ${result.skipped.length} 个重复要素`
          : '';
      const updateMsg = result.updated > 0 ? `，更新 ${result.updated} 个 draft 要素` : '';
      toast.success(`成功插入 ${result.inserted} 个要素${updateMsg}${skipMsg}`);
      setDialogOpen(false);
      setDocumentText('');
      setDocumentName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 解析文档失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDocumentText('');
    setDocumentName('');
    if (fileRef.current) fileRef.current.value = '';
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4" data-testid="element-library">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">八维要素库</h2>
          <p className="text-sm text-muted-foreground">
            共 {metaElements.length} 个要素 · 未引用 {unreferencedTotal} 个
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="element-library-unreferenced"
            checked={onlyUnreferenced}
            onCheckedChange={setOnlyUnreferenced}
            data-testid="element-library-unreferenced-toggle"
          />
          <Label htmlFor="element-library-unreferenced">仅显示未引用</Label>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setDialogOpen(true)}
              data-testid="ai-element-draft-btn"
            >
              <FileText className="h-4 w-4 mr-1" />
              AI 解析文档
            </Button>
          </TooltipTrigger>
          <TooltipContent data-testid="legacy-ai-copilot-tooltip">
            建议使用右侧 Copilot
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {META_DIMENSION_ORDER.map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            role="tab"
            aria-selected={activeDimension === d}
            variant={activeDimension === d ? 'default' : 'outline'}
            onClick={() => setActiveDimension(d)}
          >
            {META_DIMENSION_LABELS[d]}
          </Button>
        ))}
      </div>

      <div className="mt-4" data-testid={`element-library-panel-${activeDimension}`}>
        {activeDimension === 'E1' && (
          <div className="mb-6">
            <E1EntityPanel />
          </div>
        )}
        {activeDimension === 'E1' && (
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">要素注册表</h3>
        )}
        {activeList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {onlyUnreferenced ? '当前维度无未引用要素' : '当前维度暂无要素'}
          </p>
        ) : (
          <ul className="space-y-2">
            {activeList.map((el) => {
              const usageCount = getUsageCount(el);
              const expanded = expandedId === el.id;
              const refs = getElementUsageRefs(el.id);
              return (
                <li
                  key={el.id}
                  className="rounded-lg border p-3"
                  data-testid={`element-row-${el.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{el.name}</span>
                      <ElementCoverageBadge element={el} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        引用 {usageCount}
                      </span>
                      {usageCount > 0 && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="展开引用来源"
                          data-testid={`element-usage-toggle-${el.id}`}
                          onClick={() => setExpandedId(expanded ? null : el.id)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {expanded && refs.length > 0 && (
                    <ul
                      className={cn('mt-2 pl-4 text-sm text-muted-foreground space-y-1 border-l')}
                      data-testid={`element-usage-detail-${el.id}`}
                    >
                      {refs.map((ref) => (
                        <li key={`${ref.epcId}-${ref.stepId}`}>
                          {resolveEpcName(ref.epcId, project?.epcProcesses)} · 步骤 {ref.stepId}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* AI 解析文档对话框 */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent data-testid="ai-element-draft-dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 解析文档生成要素</DialogTitle>
            <DialogDescription>
              上传业务文档，AI 将自动提取要素并归入 E1~E8 八维建模维度。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2" data-testid="element-doc-upload-section">
            <Label>上传业务文档</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={aiLoading}
                data-testid="element-doc-upload-btn"
              >
                选择文件
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="hidden"
                data-testid="element-doc-file-input"
              />
              {documentName ? (
                <span
                  className="text-sm text-muted-foreground truncate max-w-[280px]"
                  data-testid="element-doc-filename"
                >
                  {documentName}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  支持 .txt .md .csv .json .docx .pdf（50KB 以内）
                </span>
              )}
            </div>
          </div>

          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="element-doc-loading">
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              AI 正在解析文档…
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose} disabled={aiLoading}>
              取消
            </Button>
            <Button
              data-testid="element-doc-submit"
              onClick={() => void handleAiSubmit()}
              disabled={aiLoading || !documentText.trim()}
            >
              {aiLoading ? '解析中…' : '提交解析'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
