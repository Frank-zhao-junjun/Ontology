'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { updateProject } from '@/services/project-service';
import type { OntologyProject } from '@/types/ontology';

/**
 * 自动同步项目数据到数据库的 hook
 * 当项目数据变化时，自动保存到数据库（防抖 2 秒）
 */
export function useProjectSync() {
  const project = useOntologyStore((state) => state.project);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string>('');
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<{ project: OntologyProject; projectJson: string } | null>(null);

  const flushPendingSave = useCallback(async () => {
    if (savingRef.current) {
      return;
    }

    const pendingSave = pendingSaveRef.current;
    if (!pendingSave || pendingSave.projectJson === lastSyncRef.current) {
      pendingSaveRef.current = null;
      return;
    }

    pendingSaveRef.current = null;
    savingRef.current = true;

    try {
      await updateProject(pendingSave.project);
      lastSyncRef.current = pendingSave.projectJson;
      console.log('项目已自动保存');
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      savingRef.current = false;

      // Preserve write ordering: send any newer debounced snapshot only after
      // the active full-project save has finished.
      if (pendingSaveRef.current && pendingSaveRef.current.projectJson !== lastSyncRef.current) {
        void flushPendingSave();
      }
    }
  }, []);

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

      pendingSaveRef.current = { project, projectJson };
      void flushPendingSave();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [flushPendingSave, project]);
}
