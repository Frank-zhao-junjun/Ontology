'use client';

import { Badge } from '@/components/ui/badge';
import {
  getModuleStatusTitle,
  MODULE_STATUS_LABEL,
} from '@/lib/business-chain/module-status-label';
import type { ModuleStatus } from '@/types/ontology';

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1 py-0"
      title={getModuleStatusTitle(status)}
      data-testid={`module-status-badge-${status}`}
    >
      {MODULE_STATUS_LABEL[status]}
    </Badge>
  );
}
