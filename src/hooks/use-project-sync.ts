'use client';

import { useEffect, useRef } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { updateProject } from '@/services/project-service';
import type { OntologyProject } from '@/types/ontology';

interface PendingProjectSave {
  project: OntologyProject;
  projectJson: string;
}

interface ProjectSyncState {
  lastSyncJson: string;
  pendingSave: PendingProjectSave | null;
  saving: boolean;
}

async function flushPendingSave(syncStateRef: { current: ProjectSyncState }) {
  const syncState = syncStateRef.current;
  if (syncState.saving) {
    return;
  }

  const pendingSave = syncState.pendingSave;
  if (!pendingSave || pendingSave.projectJson === syncState.lastSyncJson) {
    syncState.pendingSave = null;
    return;
  }

  syncState.pendingSave = null;
  syncState.saving = true;

  try {
    await updateProject(pendingSave.project);
    syncState.lastSyncJson = pendingSave.projectJson;
    console.log('项目已自动保存');
  } catch (error) {
    console.error('自动保存失败:', error);
  } finally {
    syncState.saving = false;

    // Preserve write ordering: send any newer debounced snapshot only after
    // the active full-project save has finished.
    const nextPendingSave = syncStateRef.current.pendingSave;
    if (nextPendingSave && nextPendingSave.projectJson !== syncStateRef.current.lastSyncJson) {
      void flushPendingSave(syncStateRef);
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
  const syncStateRef = useRef<ProjectSyncState>({
    lastSyncJson: '',
    pendingSave: null,
    saving: false,
  });

  useEffect(() => {
    if (!project) return;

    // 防抖保存
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      // 检查是否有变化
      const projectJson = JSON.stringify(project);
      if (projectJson === syncStateRef.current.lastSyncJson) {
        return;
      }

      syncStateRef.current.pendingSave = { project, projectJson };
      void flushPendingSave(syncStateRef);
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project]);
}
