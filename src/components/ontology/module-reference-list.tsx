'use client';

import type { ModuleReferenceLink } from '@/lib/module-version/module-references';

export type ModuleReferenceListProps = {
  incoming: ModuleReferenceLink[];
  outgoing: ModuleReferenceLink[];
};

export function ModuleReferenceList({ incoming, outgoing }: ModuleReferenceListProps) {
  return (
    <div className="border-t pt-4 space-y-4" data-testid="module-reference-list">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">引用本节点</p>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">无</p>
        ) : (
          <ul className="space-y-1">
            {incoming.map((item) => (
              <li key={`in-${item.kind}-${item.id}`} className="text-sm" data-testid={`module-ref-in-${item.kind}-${item.id}`}>
                [{item.kind}] {item.name} · {item.relation}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">本节点引用</p>
        {outgoing.length === 0 ? (
          <p className="text-sm text-muted-foreground">无</p>
        ) : (
          <ul className="space-y-1">
            {outgoing.map((item) => (
              <li key={`out-${item.kind}-${item.id}`} className="text-sm" data-testid={`module-ref-out-${item.kind}-${item.id}`}>
                [{item.kind}] {item.name} · {item.relation}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
