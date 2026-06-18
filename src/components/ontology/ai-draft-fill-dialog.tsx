'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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

export type AiDraftFillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleKind: BusinessChainNodeKind;
  moduleId: string;
  project: OntologyProject;
  disabled?: boolean;
  onEnsureDraft: () => void;
  onApply: (suggestion: ModuleDraftSuggestion) => void;
};

export function AiDraftFillDialog({
  open,
  onOpenChange,
  moduleKind,
  moduleId,
  project,
  disabled,
  onEnsureDraft,
  onApply,
}: AiDraftFillDialogProps) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);

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
          userHint: hint,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'AI 填充失败');
      }
      onApply(payload.data.suggestion as ModuleDraftSuggestion);
      toast.success('AI 已填充到当前草稿');
      onOpenChange(false);
      setHint('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 填充失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="ai-draft-fill-dialog">
        <DialogHeader>
          <DialogTitle>AI 填充草稿</DialogTitle>
          <DialogDescription>
            仅写入当前模块 draft，不会自动确认。已注入业务链上下文与已确认要素目录。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ai-draft-hint">补充说明（可选）</Label>
          <Textarea
            id="ai-draft-hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="例如：补充制造业场景描述与触发短语"
            data-testid="ai-draft-hint-input"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
};

export function AiDraftFillTrigger({
  moduleKind,
  moduleId,
  project,
  disabled,
  onEnsureDraft,
  onApply,
}: AiDraftFillTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        data-testid="module-action-ai-draft"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        AI 填充草稿
      </Button>
      <AiDraftFillDialog
        open={open}
        onOpenChange={setOpen}
        moduleKind={moduleKind}
        moduleId={moduleId}
        project={project}
        disabled={disabled}
        onEnsureDraft={onEnsureDraft}
        onApply={onApply}
      />
    </>
  );
}
