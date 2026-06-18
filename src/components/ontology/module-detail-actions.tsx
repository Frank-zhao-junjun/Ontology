'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type { ValidationError } from '@/lib/module-version/confirm-flow';
import type { ModuleStatus } from '@/types/ontology';
import { useState } from 'react';

export type ModuleDetailActionsProps = {
  kind: BusinessChainNodeKind;
  status: ModuleStatus;
  hasDraft: boolean;
  hasConfirmed: boolean;
  nextVersionLabel: string;
  validationErrors: ValidationError[];
  readOnly: boolean;
  onConfirm: () => void;
  onCancelEdit: () => void;
  onFork: () => void;
  onViewHistory: () => void;
};

export function ModuleDetailActions({
  status,
  hasDraft,
  hasConfirmed,
  nextVersionLabel,
  validationErrors,
  readOnly,
  onConfirm,
  onCancelEdit,
  onFork,
  onViewHistory,
}: ModuleDetailActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmDisabled = !hasDraft || validationErrors.length > 0;
  const confirmTitle = validationErrors.length
    ? validationErrors.map((item) => item.message).join('；')
    : hasDraft
      ? '确认后将冻结当前草稿为可引用版本'
      : '没有可确认的草稿';

  const showConfirm = hasDraft && !readOnly;
  const showCancel = hasDraft && !readOnly;
  const showFork = hasConfirmed && !hasDraft && !readOnly && status === 'confirmed';

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="module-detail-actions">
      {showConfirm && (
        <>
          <Button
            size="sm"
            data-testid="module-action-confirm"
            disabled={confirmDisabled}
            title={confirmTitle}
            onClick={() => setConfirmOpen(true)}
          >
            确认
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认模块版本</AlertDialogTitle>
                <AlertDialogDescription>
                  将把当前草稿冻结为 {nextVersionLabel} confirmed。{hasConfirmed ? '上一 confirmed 版本将变为 archived。' : ''}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  data-testid="module-action-confirm-submit"
                  onClick={() => {
                    onConfirm();
                    setConfirmOpen(false);
                  }}
                >
                  确认冻结
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {showCancel && (
        <Button
          size="sm"
          variant="outline"
          data-testid="module-action-cancel"
          onClick={onCancelEdit}
        >
          取消编辑
        </Button>
      )}

      {showFork && (
        <Button size="sm" variant="outline" data-testid="module-action-fork" onClick={onFork}>
          编辑
        </Button>
      )}

      <Button size="sm" variant="ghost" data-testid="module-action-history" onClick={onViewHistory}>
        查看历史
      </Button>
    </div>
  );
}
