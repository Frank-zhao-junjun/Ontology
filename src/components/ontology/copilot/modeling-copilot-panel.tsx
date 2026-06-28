'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import { useCopilotChatHeadless_c as useCopilotChat } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import { Sparkles, Paperclip, Loader2, X, FileText, AlertCircle } from 'lucide-react';
import { COPILOT_SYSTEM_PROMPT } from '@/components/ontology/copilot/copilot-system-prompt';
import { useOntologyStore } from '@/store/ontology-store';
import type { ReferenceDocument } from '@/types/ontology';

const STORAGE_KEY = 'copilot-panel-width';
const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const ACCEPTED_EXTENSIONS = '.docx,.pdf,.xlsx,.pptx,.txt,.md,.csv';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface UploadedFileInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  document?: ReferenceDocument;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const { sendMessage } = useCopilotChat();
  const addReferenceDocument = useOntologyStore((s) => s.addReferenceDocument);

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

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setUploadedFile({
          fileName: file.name,
          fileSize: file.size,
          fileType: '',
          textLength: 0,
          status: 'error',
          error: '文件大小超过 10MB 限制',
        });
        return;
      }

      setUploadedFile({
        fileName: file.name,
        fileSize: file.size,
        fileType: '',
        textLength: 0,
        status: 'uploading',
      });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/reference-documents/upload', {
          method: 'POST',
          body: formData,
        });

        const payload = (await response.json()) as {
          success?: boolean;
          error?: string;
          data?: ReferenceDocument;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? '上传失败');
        }

        const doc = payload.data;
        addReferenceDocument(doc);

        setUploadedFile({
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          fileType: doc.fileType,
          textLength: doc.textLength,
          status: 'success',
          document: doc,
        });

        // Auto-trigger AI analysis
        await sendMessage({
          id: `upload-${Date.now()}`,
          role: 'user',
          content: `我上传了文档「${doc.fileName}」（${doc.textLength} 字），请分析文档内容并自动提取实体、生成业务链和 EPC 步骤草稿。`,
        });
      } catch (err) {
        setUploadedFile((prev) => ({
          ...(prev ?? {
            fileName: file.name,
            fileSize: file.size,
            fileType: '',
            textLength: 0,
          }),
          status: 'error',
          error: err instanceof Error ? err.message : '上传失败',
        }));
      }
    },
    [sendMessage, addReferenceDocument],
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so same file can be re-selected
      e.target.value = '';
    },
    [handleFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const dismissUploadedFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  return (
    <div
      data-testid="modeling-copilot-panel"
      className="relative flex shrink-0 border-l bg-card"
      style={{ width }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="调整 AI 面板宽度"
        className="absolute left-0 top-0 bottom-0 z-10 w-1 cursor-col-resize hover:bg-primary/20"
        onMouseDown={onMouseDown}
        data-testid="copilot-panel-resizer"
      />
      <div className="flex h-full w-full flex-col overflow-hidden">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI建模 · {projectName}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadedFile?.status === 'uploading'}
            className="flex items-center gap-1 rounded border border-input bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            title="上传文档（docx/pdf/xlsx/pptx/txt/md/csv）"
          >
            <Paperclip className="h-3 w-3" />
            上传文档
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={onFileInputChange}
            className="hidden"
          />
        </header>

        {/* Uploaded file status banner */}
        {uploadedFile && (
          <div className="shrink-0 border-b bg-muted/30 px-3 py-2">
            <div className="flex items-start gap-2">
              {uploadedFile.status === 'uploading' && (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              )}
              {uploadedFile.status === 'success' && (
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
              )}
              {uploadedFile.status === 'error' && (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="truncate font-medium">{uploadedFile.fileName}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatFileSize(uploadedFile.fileSize)}
                  </span>
                </div>
                {uploadedFile.status === 'uploading' && (
                  <p className="mt-0.5 text-muted-foreground">正在上传并解析...</p>
                )}
                {uploadedFile.status === 'success' && (
                  <p className="mt-0.5 text-green-600">
                    已解析 {uploadedFile.textLength.toLocaleString()} 字 · AI 正在分析...
                  </p>
                )}
                {uploadedFile.status === 'error' && (
                  <p className="mt-0.5 text-destructive">{uploadedFile.error}</p>
                )}
              </div>
              <button
                type="button"
                onClick={dismissUploadedFile}
                className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Chat area */}
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
                title: '生成要素',
                message: '从以下描述生成 E1-E8 要素：物料编码、名称、规格、单位',
              },
              {
                title: '项目摘要',
                message: '获取当前项目摘要',
              },
            ]}
          />
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t px-3 py-1.5 text-xs text-muted-foreground">
          支持对话建模 & 上传文档自动提取 · 所有写入均为草稿
        </footer>
      </div>
    </div>
  );
}
