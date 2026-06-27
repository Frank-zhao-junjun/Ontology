'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type { ModuleDraftSuggestion } from '@/lib/ai-draft';
import type { OntologyProject } from '@/types/ontology';
import type { EpcStepSuggestion } from '@/lib/ai-draft/epc-doc-prompt';

export type AiDraftFillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleKind: BusinessChainNodeKind;
  moduleId: string;
  project: OntologyProject;
  disabled?: boolean;
  onEnsureDraft: () => void;
  onApply: (suggestion: ModuleDraftSuggestion) => void;
  /** When moduleKind === 'EPC', called instead of onApply with parsed EPC steps from doc */
  onApplyEpcDraft?: (steps: EpcStepSuggestion[]) => void;
};

export type { EpcStepSuggestion };

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json'];

export function AiDraftFillDialog({
  open,
  onOpenChange,
  moduleKind,
  moduleId,
  project,
  disabled,
  onEnsureDraft,
  onApply,
  onApplyEpcDraft,
}: AiDraftFillDialogProps) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isEpc = moduleKind === 'EPC';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!TEXT_EXTENSIONS.includes(ext as typeof TEXT_EXTENSIONS[number])) {
      toast.error(`不支持 ${ext} 格式，仅支持文本文件（.txt / .md / .csv / .json）`);
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

  const handleSubmit = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      onEnsureDraft();
      const response = await fetch('/api/generate-module-draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          moduleKind,
          moduleId,
          project: {
            valueDomains: project.valueDomains,
            capabilities: project.capabilities,
            scenarios: project.scenarios,
            epcProcesses: project.epcProcesses,
            metaElements: project.metaElements,
            moduleVersionRecords: project.moduleVersionRecords,
          },
          userHint: hint || undefined,
          documentText: documentText || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'AI 填充失败');
      }

      // EPC 文档→步骤 分支
      if (isEpc && payload.data?.suggestion?.steps && onApplyEpcDraft) {
        onApplyEpcDraft(payload.data.suggestion.steps as EpcStepSuggestion[]);
      } else {
        onApply(payload.data.suggestion as ModuleDraftSuggestion);
      }

      toast.success('AI 已填充到当前草稿');
      onOpenChange(false);
      setHint('');
      setDocumentText('');
      setDocumentName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 填充失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHint('');
    setDocumentText('');
    setDocumentName('');
    if (fileRef.current) fileRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="ai-draft-fill-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI 填充草稿</DialogTitle>
          <DialogDescription>
            {isEpc
              ? '上传业务文档并生成 EPC 步骤建议，或提供补充说明。已注入已确认要素目录。'
              : '仅写入当前模块 draft，不会自动确认。已注入业务链上下文与已确认要素目录。'}
          </DialogDescription>
        </DialogHeader>

        {/* EPC 文档上传区域：仅在 EPC 节点显示 */}
        {isEpc && (
          <div className="space-y-2" data-testid="epc-doc-upload-section">
            <Label>上传业务文档</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                data-testid="epc-doc-upload-btn"
              >
                选择文件
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept={TEXT_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="hidden"
                data-testid="epc-doc-file-input"
              />
              {documentName ? (
                <span
                  className="text-sm text-muted-foreground truncate max-w-[280px]"
                  data-testid="epc-doc-filename"
                >
                  {documentName}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  支持 .txt .md .csv .json（50KB 以内）
                </span>
              )}
            </div>
          </div>
        )}

        {/* 补充说明 */}
        <div className="space-y-2">
          <Label htmlFor="ai-draft-hint">{isEpc ? '补充说明（可选）' : '补充说明（可选）'}</Label>
          <Textarea
            id="ai-draft-hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={isEpc ? '例如：重点关注审批与付款步骤' : '例如：补充制造业场景描述与触发短语'}
            data-testid="ai-draft-hint-input"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button
            data-testid="ai-draft-submit"
            onClick={() => void handleSubmit()}
            disabled={disabled || loading}
          >
            {loading ? '生成中…' : '生成并应用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type AiDraftFillTriggerProps = {
  moduleKind: BusinessChainNodeKind;
  moduleId: string;
  project: OntologyProject;
  disabled?: boolean;
  onEnsureDraft: () => void;
  onApply: (suggestion: ModuleDraftSuggestion) => void;
  onApplyEpcDraft?: (steps: EpcStepSuggestion[]) => void;
};

export function AiDraftFillTrigger({
  moduleKind,
  moduleId,
  project,
  disabled,
  onEnsureDraft,
  onApply,
  onApplyEpcDraft,
}: AiDraftFillTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            data-testid="module-action-ai-draft"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            AI 填充草稿
          </Button>
        </TooltipTrigger>
        <TooltipContent data-testid="legacy-ai-copilot-tooltip">
          建议使用右侧 Copilot
        </TooltipContent>
      </Tooltip>
      <AiDraftFillDialog
        open={open}
        onOpenChange={setOpen}
        moduleKind={moduleKind}
        moduleId={moduleId}
        project={project}
        disabled={disabled}
        onEnsureDraft={onEnsureDraft}
        onApply={onApply}
        onApplyEpcDraft={onApplyEpcDraft}
      />
    </>
  );
}
