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
  Users,
} from 'lucide-react';
import { useOntologyStore } from '@/store/ontology-store';
import type { ReferenceDocument } from '@/types/ontology';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  extractActionBlocks,
  executeAction,
  buildProjectContext,
  type ParsedAction,
} from '@/lib/copilot/chat-actions';

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ParsedAction[];
  moaPhase?: 'proposing' | 'aggregating' | null;
}

interface MoaAgentStatus {
  id: number;
  name: string;
  role: string;
  status: 'pending' | 'running' | 'done' | 'error';
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
  const [moaEnabled, setMoaEnabled] = useState(false);
  const [moaAgents, setMoaAgents] = useState<MoaAgentStatus[]>([]);
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
      setMessages((prev) => [...prev, { role: 'assistant', content: '', moaPhase: moaEnabled ? 'proposing' : null }]);

      // Reset MoA agent statuses
      if (moaEnabled) {
        setMoaAgents([]);
      }

      try {
        const allMessages = [...messagesRef.current, userMsg]
          .filter((m) => m.role === 'user' || m.content)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const endpoint = moaEnabled ? '/api/chat-moa' : '/api/chat';
        const response = await fetch(endpoint, {
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
        let buffer = '';

        const updateLastAssistant = (content: string, extra?: Partial<ChatMessage>) => {
          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = { ...next[lastIdx], content, ...extra };
            }
            return next;
          });
        };

        const processLine = (line: string) => {
          if (!line.startsWith('data: ')) return;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) return;
          try {
            const data = JSON.parse(jsonStr);

            // ── MoA propose phase events ──
            if (data.phase === 'propose_start' && data.agents) {
              setMoaAgents(
                data.agents.map((a: { id: number; name: string; role: string }) => ({
                  id: a.id,
                  name: a.name,
                  role: a.role,
                  status: 'pending' as const,
                })),
              );
              return;
            }
            if (data.phase === 'propose') {
              setMoaAgents((prev) =>
                prev.map((a) =>
                  a.id === data.agentId
                    ? { ...a, status: data.status === 'start' ? 'running' : data.status === 'error' ? 'error' : 'done' }
                    : a,
                ),
              );
              return;
            }
            if (data.phase === 'aggregate_start') {
              updateLastAssistant('', { moaPhase: 'aggregating' });
              return;
            }

            // ── Content streaming (both regular and MoA aggregate) ──
            if (data.content) {
              accumulated += data.content;
              updateLastAssistant(accumulated);
            }
            if (data.error) {
              accumulated += `\n\n**错误:** ${data.error}`;
              updateLastAssistant(accumulated);
            }
          } catch {
            // Ignore parse errors for malformed frames
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last element as the (possibly incomplete) trailing line.
          buffer = lines.pop() ?? '';
          for (const line of lines) processLine(line);
        }

        // Flush any remaining buffered line after the stream ends.
        buffer += decoder.decode();
        if (buffer) {
          for (const line of buffer.split('\n')) processLine(line);
        }

        // --- Post-stream: parse and execute ACTION blocks ---
        if (accumulated) {
          const { cleanText, rawActions } = extractActionBlocks(accumulated);

          if (rawActions.length > 0) {
            // Execute actions and collect results
            const executedActions: ParsedAction[] = rawActions.map((a) => executeAction(a as unknown as Record<string, unknown>));

            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: cleanText || '(已完成建模操作)',
                  actions: executedActions,
                  moaPhase: null,
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
                  moaPhase: null,
                };
              }
              return next;
            });
          } else {
            // Content but no actions — clear moaPhase
            updateLastAssistant(accumulated, { moaPhase: null });
          }
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
        setMoaAgents([]);
      }
    },
    [isStreaming, moaEnabled],
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
      className="relative flex h-full shrink-0 overflow-hidden border-l bg-card"
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
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMoaEnabled((v) => !v)}
              disabled={isStreaming}
              className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                moaEnabled
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              title="MoA 模式：3 个专家 Agent 并行提案 + 1 个聚合 Agent 综合"
            >
              <Users className="h-3 w-3" />
              MoA
            </button>
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
          </div>
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

        {/* MoA agent status panel */}
        {moaEnabled && moaAgents.length > 0 && (
          <div className="shrink-0 border-b bg-muted/20 px-3 py-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              MoA 提案阶段 · 3 Agent 并行
            </div>
            <div className="flex flex-col gap-1">
              {moaAgents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 text-xs">
                  {agent.status === 'pending' && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
                  )}
                  {agent.status === 'running' && (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
                  )}
                  {agent.status === 'done' && (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600" />
                  )}
                  {agent.status === 'error' && (
                    <XCircle className="h-3 w-3 shrink-0 text-destructive" />
                  )}
                  <span className={agent.status === 'done' ? 'text-foreground' : 'text-muted-foreground'}>
                    {agent.name}
                  </span>
                  <span className="text-muted-foreground/60">
                    {agent.status === 'pending' && '等待中'}
                    {agent.status === 'running' && '思考中...'}
                    {agent.status === 'done' && '已完成'}
                    {agent.status === 'error' && '失败'}
                  </span>
                </div>
              ))}
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
                          {msg.moaPhase === 'proposing' ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              MoA 提案中，3 位专家正在并行分析...
                            </span>
                          ) : msg.moaPhase === 'aggregating' ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              MoA 聚合中，正在综合三方提案...
                            </span>
                          ) : (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          )}
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
            {moaEnabled
              ? 'MoA 模式已启用 · 3 专家并行提案 + 聚合综合 · AI 回复仅供参考'
              : '支持对话建模 & 上传文档自动提取 · AI 回复仅供参考'}
          </p>
        </div>
      </div>
    </div>
  );
}
