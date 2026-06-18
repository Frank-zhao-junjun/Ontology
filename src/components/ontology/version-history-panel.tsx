'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type { ModuleVersionRecord } from '@/types/ontology';
import { Star } from 'lucide-react';

export type VersionHistoryPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: BusinessChainNodeKind;
  moduleId: string;
  versions: ModuleVersionRecord[];
  latestConfirmedVersion?: string;
  onViewSnapshot?: (record: ModuleVersionRecord) => void;
};

function formatCreatedAt(value: string): string {
  return value.slice(0, 19).replace('T', ' ');
}

export function VersionHistoryPanel({
  open,
  onOpenChange,
  versions,
  latestConfirmedVersion,
  onViewSnapshot,
}: VersionHistoryPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md" data-testid="version-history-panel">
        <SheetHeader>
          <SheetTitle>版本历史</SheetTitle>
          <SheetDescription>列出 draft / confirmed / archived 记录（不含 diff）</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {versions.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无版本记录</p>
          )}
          {versions.map((record) => {
            const rowId = record.version
              ? `version-history-row-${record.version}`
              : `version-history-row-${record.status}`;
            const isCurrentConfirmed =
              record.status === 'confirmed' && record.version === latestConfirmedVersion;
            return (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                data-testid={rowId}
              >
                <div className="flex items-center gap-2">
                  {isCurrentConfirmed && (
                    <Star className="h-3.5 w-3.5 text-amber-500" data-testid={`${rowId}-star`} />
                  )}
                  <span>
                    {record.version ?? 'draft'} · {record.status} · {formatCreatedAt(record.createdAt)}
                  </span>
                </div>
                {record.status === 'archived' && onViewSnapshot && (
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid={`${rowId}-view`}
                    onClick={() => onViewSnapshot(record)}
                  >
                    查看
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
