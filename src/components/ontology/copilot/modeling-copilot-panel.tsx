'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { Sparkles } from 'lucide-react';
import { COPILOT_SYSTEM_PROMPT } from '@/components/ontology/copilot/copilot-system-prompt';

const STORAGE_KEY = 'copilot-panel-width';
const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;

function getMaxWidth(): number {
  if (typeof window === 'undefined') return 800;
  return Math.floor(window.innerWidth * 0.5);
}

function readStoredWidth(defaultWidth: number): number {
  if (typeof window === 'undefined') return defaultWidth;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultWidth;
  const parsed = Number(stored);
  if (Number.isNaN(parsed)) return defaultWidth;
  return Math.min(Math.max(parsed, MIN_WIDTH), getMaxWidth());
}

interface ModelingCopilotPanelProps {
  projectName: string;
  defaultWidth?: number;
}

export function ModelingCopilotPanel({
  projectName,
  defaultWidth = DEFAULT_WIDTH,
}: ModelingCopilotPanelProps) {
  const [width, setWidth] = useState(() => readStoredWidth(defaultWidth));
  const dragging = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      const startX = e.clientX;
      const startWidth = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = startX - ev.clientX;
        const next = Math.min(Math.max(startWidth + delta, MIN_WIDTH), getMaxWidth());
        setWidth(next);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [width],
  );

  return (
    <div
      data-testid="modeling-copilot-panel"
      className="relative flex shrink-0 border-l bg-card"
      style={{ width }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="调整 Copilot 面板宽度"
        className="absolute left-0 top-0 bottom-0 z-10 w-1 cursor-col-resize hover:bg-primary/20"
        onMouseDown={onMouseDown}
        data-testid="copilot-panel-resizer"
      />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI建模 · {projectName}
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CopilotChat
            instructions={COPILOT_SYSTEM_PROMPT}
            className="h-full"
            suggestions={[
              {
                title: '创建价值域',
                message: '帮我创建一个物料管理的价值域',
              },
              {
                title: '上传文档建模',
                message: '上传文档并自动提取实体',
              },
              {
                title: '项目摘要',
                message: '获取当前项目摘要',
              },
            ]}
          />
        </div>
        <footer className="shrink-0 border-t px-3 py-1.5 text-xs text-muted-foreground">
          支持对话建模 & 上传文档自动提取 · 所有写入均为草稿
        </footer>
      </div>
    </div>
  );
}
