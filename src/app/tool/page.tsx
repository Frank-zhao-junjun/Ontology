'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { ProjectSetup } from '@/components/ontology/project-setup';
import { ModelingWorkspace } from '@/components/ontology/modeling-workspace';

export default function ToolPage() {
  const { project } = useOntologyStore();
  const [mounted] = useState(true);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {!project ? (
        <ProjectSetup />
      ) : (
        <ModelingWorkspace project={project} />
      )}
    </main>
  );
}
