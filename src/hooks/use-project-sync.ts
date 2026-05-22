'use client';

import { useEffect, useRef } from 'react';
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
  const inFlightRef = useRef(false);
  const queuedSyncRef = useRef<{ project: OntologyProject; projectJson: string } | null>(null);
  const syncProjectRef = useRef<(projectToSync: OntologyProject, projectJson: string) => Promise<void>>(async () => undefined);

  syncProjectRef.current = async (projectToSync, projectJson) => {
    if (inFlightRef.current) {
      queuedSyncRef.current = { project: projectToSync, projectJson };
      return;
    }

    inFlightRef.current = true;

    try {
      await updateProject(projectToSync);
      lastSyncRef.current = projectJson;
      console.log('项目已自动保存');
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      inFlightRef.current = false;

      const queuedSync = queuedSyncRef.current;
      queuedSyncRef.current = null;

      if (queuedSync && queuedSync.projectJson !== lastSyncRef.current) {
        void syncProjectRef.current(queuedSync.project, queuedSync.projectJson);
      }
    }
  };

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

      await syncProjectRef.current(project, projectJson);
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project]);
}
