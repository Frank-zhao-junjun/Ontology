'use client';

import { isElementEpcCovered } from '@/lib/epc-coverage';
import { isUnreferencedElement } from '@/lib/element-library';
import type { MetaElement } from '@/types/ontology';
import { Badge } from '@/components/ui/badge';
import { useOntologyStore } from '@/store/ontology-store';

export interface ElementCoverageBadgeProps {
  element: MetaElement;
}

export function ElementCoverageBadge({ element }: ElementCoverageBadgeProps) {
  const project = useOntologyStore((s) => s.project);

  if (!project) return null;

  if (isUnreferencedElement(element)) {
    return (
      <Badge variant="outline" className="shrink-0" data-testid={`coverage-badge-${element.id}`} data-covered="false">
        未覆盖
      </Badge>
    );
  }

  const covered = isElementEpcCovered(
    element,
    project.epcProcesses ?? [],
    project.moduleVersionRecords ?? [],
  );

  return (
    <Badge
      variant={covered ? 'secondary' : 'outline'}
      className="shrink-0"
      data-testid={`coverage-badge-${element.id}`}
      data-covered={covered ? 'true' : 'false'}
    >
      {covered ? '已覆盖' : '未覆盖'}
    </Badge>
  );
}
