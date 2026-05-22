'use client';

import { useEffect, useRef } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { updateProject } from '@/services/project-service';
import type { OntologyProject } from '@/types/ontology';

type QueuedProjectSync = { project: OntologyProject; projectJson: string };

type ProjectSyncRefs = {
  inFlightRef: { current: boolean };
  queuedSyncRef: { current: QueuedProjectSync | null };
  lastSyncRef: { current: string };
};

async function syncProject(
  projectToSync: OntologyProject,
  projectJson: string,
  refs: ProjectSyncRefs,
): Promise<void> {
  if (refs.inFlightRef.current) {
    refs.queuedSyncRef.current = { project: projectToSync, projectJson };
    return;
  }

  refs.inFlightRef.current = true;

  try {
    await updateProject(projectToSync);
    refs.lastSyncRef.current = projectJson;
    console.log('项目已自动保存');
  } catch (error) {
    console.error('自动保存失败:', error);
  } finally {
    refs.inFlightRef.current = false;

    const queuedSync = refs.queuedSyncRef.current;
    refs.queuedSyncRef.current = null;

    if (queuedSync && queuedSync.projectJson !== refs.lastSyncRef.current) {
      void syncProject(queuedSync.project, queuedSync.projectJson, refs);
    }
  }
}

/**
 * 自动同步项目数据到数据库的 hook
 * 当项目数据变化时，自动保存到数据库（防抖 2 秒）
 */
export function useProjectSync() {
  const project = useOntologyStore((state) => state.project);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string>('');
  const inFlightRef = useRef(false);
  const queuedSyncRef = useRef<QueuedProjectSync | null>(null);

  useEffect(() => {
    if (!project) return;

    // 防抖保存
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      // 检查是否有变化
      const projectJson = JSON.stringify(project);
      if (projectJson === lastSyncRef.current) {
        return;
      }

      await syncProject(project, projectJson, { inFlightRef, queuedSyncRef, lastSyncRef });
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project]);
}
