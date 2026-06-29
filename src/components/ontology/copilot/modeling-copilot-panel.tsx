'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Paperclip,
  Loader2,
  X,
  FileText,
  AlertCircle,
  Send,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Network,
} from 'lucide-react';
import { useOntologyStore } from '@/store/ontology-store';
import type { ReferenceDocument } from '@/types/ontology';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

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

// ---------- ACTION block parsing & execution ----------

interface ParsedAction {
  id: string;
  action: string;
  label: string;
  status: 'pending' | 'success' | 'error';
  detail?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ParsedAction[];
}

interface UploadedFileInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  extractedText?: string;
  document?: ReferenceDocument;
}

interface ModelingCopilotPanelProps {
  projectName: string;
  defaultWidth?: number;
}

/** Extract <<<ACTION>>>...<<<END_ACTION>>> blocks from text, return cleaned text + parsed actions */
function extractActionBlocks(text: string): { cleanText: string; rawActions: Record<string, unknown>[] } {
  const regex = /<<<ACTION>>>\s*([\s\S]*?)\s*<<<END_ACTION>>>/g;
  const actions: Record<string, unknown>[] = [];
  let cleanText = text;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const jsonStr = match[1].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && typeof parsed.action === 'string') {
        actions.push(parsed);
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  // Remove action blocks from display text
  cleanText = text.replace(regex, '').replace(/\n{3,}/g, '\n\n').trim();

  return { cleanText, rawActions: actions };
}

/** Execute a single parsed action against the store, return result */
function executeAction(data: Record<string, unknown>): ParsedAction {
  const action = data.action as string;
  const store = useOntologyStore.getState();
  const project = store.project;
  const actionId = `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!project) {
    return {
      id: actionId,
      action,
      label: getActionLabel(action, data),
      status: 'error',
      detail: '没有活动项目，请先创建项目',
    };
  }

  try {
    switch (action) {
      case 'create_value_domain': {
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        if (!name) throw new Error('name 字段必填');
        const vd = store.addValueDomain({ name, nameEn, description });
        return { id: actionId, action, label: `A-价值域: ${name}`, status: 'success', detail: '已创建' };
      }

      case 'create_capability': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        const parent = (project.valueDomains ?? []).find((v) => v.name === parentName);
        if (!parent) throw new Error(`找不到父级价值域: ${parentName}`);
        store.addCapability(parent.id, { name, nameEn, description });
        return { id: actionId, action, label: `B-能力: ${name}`, status: 'success', detail: `挂载到「${parentName}」` };
      }

      case 'create_scenario': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        const parent = (project.capabilities ?? []).find((c) => c.name === parentName);
        if (!parent) throw new Error(`找不到父级能力: ${parentName}`);
        store.addScenario(parent.id, { name, nameEn, description });
        return { id: actionId, action, label: `C-场景: ${name}`, status: 'success', detail: `挂载到「${parentName}」` };
      }

      case 'create_epc_process': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        const parent = (project.scenarios ?? []).find((s) => s.name === parentName);
        if (!parent) throw new Error(`找不到父级场景: ${parentName}`);
        store.addEpcProcess(parent.id, { name, nameEn, description });
        return { id: actionId, action, label: `EPC: ${name}`, status: 'success', detail: `挂载到「${parentName}」` };
      }

      case 'create_chain': {
        const chain = data.chain as Array<{ type: string; name: string; nameEn?: string; description?: string }>;
        if (!Array.isArray(chain) || chain.length === 0) throw new Error('chain 数组为空');

        let valueDomainId: string | null = null;
        let capabilityId: string | null = null;
        let scenarioId: string | null = null;
        const created: string[] = [];

        // Re-read project after each creation to get fresh state
        for (const item of chain) {
          const currentProject = useOntologyStore.getState().project;
          if (!currentProject) throw new Error('项目状态丢失');

          if (item.type === 'value_domain') {
            const vd = store.addValueDomain({ name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            valueDomainId = vd.id;
            created.push(`A-价值域: ${item.name}`);
          } else if (item.type === 'capability' && valueDomainId) {
            const cap = store.addCapability(valueDomainId, { name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            capabilityId = cap.id;
            created.push(`B-能力: ${item.name}`);
          } else if (item.type === 'scenario' && capabilityId) {
            const sc = store.addScenario(capabilityId, { name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            scenarioId = sc.id;
            created.push(`C-场景: ${item.name}`);
          } else if (item.type === 'epc' && scenarioId) {
            store.addEpcProcess(scenarioId, { name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            created.push(`EPC: ${item.name}`);
          }
        }

        return {
          id: actionId,
          action,
          label: `业务链 (${created.length} 个节点)`,
          status: 'success',
          detail: created.join(' / '),
        };
      }

      default:
        return {
          id: actionId,
          action,
          label: `未知动作: ${action}`,
          status: 'error',
          detail: '不支持的动作类型',
        };
    }
  } catch (err) {
    return {
      id: actionId,
      action,
      label: getActionLabel(action, data),
      status: 'error',
      detail: err instanceof Error ? err.message : '执行失败',
    };
  }
}

function getActionLabel(action: string, data: Record<string, unknown>): string {
  const name = (data.name as string) || '';
  switch (action) {
    case 'create_value_domain': return `A-价值域: ${name}`;
    case 'create_capability': return `B-能力: ${name}`;
    case 'create_scenario': return `C-场景: ${name}`;
    case 'create_epc_process': return `EPC: ${name}`;
    case 'create_chain': return `业务链`;
    default: return action;
  }
}

// ---------- Project context ----------

function buildProjectContext(): string {
  const store = useOntologyStore.getState();
  const project = store.project;
  const valueDomains = project?.valueDomains ?? [];
  const capabilities = project?.capabilities ?? [];
  const scenarios = project?.scenarios ?? [];
  const epcProcesses = project?.epcProcesses ?? [];

  const lines: string[] = [];
  lines.push(`项目名称: ${project?.name ?? '未命名'}`);
  lines.push(`领域: ${project?.domain?.name ?? '未指定'}`);

  if (valueDomains.length > 0) {
    lines.push(`\n已有 A-价值域 (${valueDomains.length}):`);
    for (const v of valueDomains) {
      lines.push(`  - ${v.name}${v.nameEn ? ` (${v.nameEn})` : ''}`);
    }
  }

  if (capabilities.length > 0) {
    lines.push(`\n已有 B-能力 (${capabilities.length}):`);
    for (const c of capabilities) {
      lines.push(`  - ${c.name}${c.nameEn ? ` (${c.nameEn})` : ''}`);
    }
  }

  if (scenarios.length > 0) {
    lines.push(`\n已有 C-场景 (${scenarios.length}):`);
    for (const s of scenarios) {
      lines.push(`  - ${s.name}`);
    }
  }

  if (epcProcesses.length > 0) {
    lines.push(`\n已有 EPC 流程 (${epcProcesses.length}):`);
    for (const p of epcProcesses) {
      lines.push(`  - ${p.name}`);
    }
  }

  return lines.join('\n');
}

const SUGGESTIONS = [
  { label: '创建价值域', message: '帮我创建一个物料管理的价值域，包含基本信息和库存管理能力' },
  { label: '生成业务链', message: '帮我创建一个完整业务链：采购管理价值域 -> 供应商管理能力 -> 供应商准入场景 -> 供应商准入流程' },
  { label: '项目摘要', message: '请总结当前项目的建模情况，给出下一步建议' },
];

export function ModelingCopilotPanel({
  projectName,
  defaultWidth = DEFAULT_WIDTH,
}: ModelingCopilotPanelProps) {
  const [width, setWidth] = useState(() => readStoredWidth(defaultWidth));
  const dragging = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const addReferenceDocument = useOntologyStore((s) => s.addReferenceDocument);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollEl = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [messages]);

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

  /**
   * Send a message to the streaming chat API and render the response.
   * After streaming completes, parse ACTION blocks and execute them.
   */
  const sendMessage = useCallback(
    async (userText: string, documentText?: string) => {
      if (!userText.trim() || isStreaming) return;

      // Add user message
      const userMsg: ChatMessage = { role: 'user', content: userText };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      // Add empty assistant message for streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      try {
        const allMessages = [...messagesRef.current, userMsg]
          .filter((m) => m.role === 'user' || m.content)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            documentText,
            projectContext: buildProjectContext(),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const data = JSON.parse(jsonStr);
                if (data.content) {
                  accumulated += data.content;
                  // Show raw text during streaming (including ACTION markers)
                  setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                      next[lastIdx] = { ...next[lastIdx], content: accumulated };
                    }
                    return next;
                  });
                }
                if (data.error) {
                  accumulated += `\n\n**错误:** ${data.error}`;
                  setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                      next[lastIdx] = { ...next[lastIdx], content: accumulated };
                    }
                    return next;
                  });
                }
              } catch {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }

        // --- Post-stream: parse and execute ACTION blocks ---
        if (accumulated) {
          const { cleanText, rawActions } = extractActionBlocks(accumulated);

          if (rawActions.length > 0) {
            // Execute actions and collect results
            const executedActions: ParsedAction[] = rawActions.map((raw) => executeAction(raw));

            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: cleanText || '(已完成建模操作)',
                  actions: executedActions,
                };
              }
              return next;
            });
          } else if (!accumulated) {
            // No content at all
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: '抱歉，我暂时无法回复。请稍后重试。',
                };
              }
              return next;
            });
          }
          // If no actions, the raw accumulated text stays as-is (already set during streaming)
        } else {
          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                content: '抱歉，我暂时无法回复。请稍后重试。',
              };
            }
            return next;
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '未知错误';
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
            next[lastIdx] = {
              ...next[lastIdx],
              content: `**请求失败:** ${errMsg}\n\n请检查网络连接后重试。`,
            };
          }
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming],
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
          extractedText: doc.extractedText,
          document: doc,
        });

        // Auto-trigger AI analysis with the extracted text
        await sendMessage(
          `我上传了文档「${doc.fileName}」（${doc.textLength} 字），请分析文档内容并自动提取实体、生成业务链和 EPC 步骤草稿。`,
          doc.extractedText,
        );
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

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input],
  );

  const onSuggestionClick = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage],
  );

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
            disabled={uploadedFile?.status === 'uploading' || isStreaming}
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

        {/* Chat messages */}
        <div ref={scrollAreaRef} className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Bot className="h-10 w-10 text-muted-foreground/50" />
                  <div className="text-sm text-muted-foreground">
                    AI建模助手已就绪
                    <br />
                    支持对话建模 &amp; 上传文档自动提取
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => onSuggestionClick(s.message)}
                        className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isLastAssistant = idx === messages.length - 1 && msg.role === 'assistant';
                const isStreamingThis = isStreaming && isLastAssistant;
                // During streaming, hide ACTION markers from display
                const displayContent = isStreamingThis
                  ? msg.content.replace(/<<<ACTION>>>/g, '').replace(/<<<END_ACTION>>>/g, '')
                  : msg.content;

                return (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        msg.role === 'user'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? '' : 'min-w-0 flex-1'}`}>
                      {displayContent && (
                        <div
                          className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {displayContent || (isStreamingThis ? '...' : '')}
                        </div>
                      )}
                      {/* Action cards */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1.5">
                          {msg.actions.map((act) => (
                            <div
                              key={act.id}
                              className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                                act.status === 'success'
                                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                                  : act.status === 'error'
                                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                    : 'border-border bg-background'
                              }`}
                            >
                              {act.status === 'success' ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                              ) : act.status === 'error' ? (
                                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                              ) : (
                                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 font-medium">
                                  <Network className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{act.label}</span>
                                </div>
                                {act.detail && (
                                  <p className="mt-0.5 text-muted-foreground">{act.detail}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Loading indicator when streaming with no content yet */}
                      {isStreamingThis && !displayContent && !msg.actions && (
                        <div className="rounded-lg bg-muted px-3 py-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              type="button"
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            支持对话建模 &amp; 上传文档自动提取 · AI 回复仅供参考
          </p>
        </div>
      </div>
    </div>
  );
}
