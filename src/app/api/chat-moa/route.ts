import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { COPILOT_SYSTEM_PROMPT } from '@/components/ontology/copilot/copilot-system-prompt';
import {
  PROPOSER_AGENTS,
  AGGREGATOR_SYSTEM_PROMPT,
  buildAggregatorMessage,
} from '@/lib/copilot/moa-agents';

export const runtime = 'nodejs';

const MAX_DOCUMENT_CHARS = 10000;
const CHAT_MODEL = process.env.CHAT_MODEL || 'doubao-seed-2-0-pro-260215';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  documentText?: string;
  projectContext?: string;
}

/**
 * 构建提案 Agent 的系统 prompt（在 copilot 通用 prompt 基础上叠加专家角色）
 */
function buildProposerSystemPrompt(
  agentSystemPrompt: string,
  documentText?: string,
  projectContext?: string,
): string {
  let prompt = `${COPILOT_SYSTEM_PROMPT}\n\n---\n\n${agentSystemPrompt}`;

  if (projectContext && projectContext.trim()) {
    prompt += `\n\n--- 当前项目上下文 ---\n${projectContext}`;
  }

  if (documentText && documentText.trim()) {
    const truncated = documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) + '\n... (文档已截断)'
      : documentText;
    prompt += `\n\n--- 用户上传的文档内容 ---\n${truncated}`;
  }

  return prompt;
}

/**
 * 聚合 Agent 的系统 prompt
 */
function buildAggregatorSystemPrompt(documentText?: string, projectContext?: string): string {
  let prompt = `${COPILOT_SYSTEM_PROMPT}\n\n---\n\n${AGGREGATOR_SYSTEM_PROMPT}`;

  if (projectContext && projectContext.trim()) {
    prompt += `\n\n--- 当前项目上下文 ---\n${projectContext}`;
  }

  if (documentText && documentText.trim()) {
    const truncated = documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) + '\n... (文档已截断)'
      : documentText;
    prompt += `\n\n--- 用户上传的文档内容 ---\n${truncated}`;
  }

  return prompt;
}

/**
 * 收集 LLM 流的完整内容（非流式收集）
 */
async function collectStream(
  client: LLMClient,
  messages: { role: string; content: string }[],
  options: { model: string; temperature: number },
): Promise<string> {
  let fullContent = '';
  const stream = client.stream(
    messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
    options,
  );
  for await (const chunk of stream) {
    if (chunk.content) {
      fullContent += chunk.content.toString();
    }
  }
  return fullContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequestBody;
    const { messages, documentText, projectContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 提取最后一条用户消息
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 构建 SDK 消息（排除最后一条用户消息，后面单独传给各 Agent）
    const priorMessages = messages
      .filter((m, idx) => !(m.role === 'user' && idx === messages.lastIndexOf(lastUserMsg)))
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // ════════════════════════════════════════
          // Phase 1: 提案阶段 — 3 个 Agent 并行
          // ════════════════════════════════════════
          send({ phase: 'propose_start', agents: PROPOSER_AGENTS.map((a) => ({ id: a.id, name: a.name, role: a.role })) });

          const proposalPromises = PROPOSER_AGENTS.map(async (agent) => {
            const systemPrompt = buildProposerSystemPrompt(agent.systemPrompt, documentText, projectContext);
            const sdkMessages = [
              { role: 'system' as const, content: systemPrompt },
              ...priorMessages,
              { role: 'user' as const, content: lastUserMsg.content },
            ];

            send({ phase: 'propose', agentId: agent.id, agentName: agent.name, status: 'start' });

            try {
              const content = await collectStream(client, sdkMessages, {
                model: CHAT_MODEL,
                temperature: 0.7,
              });
              send({ phase: 'propose', agentId: agent.id, agentName: agent.name, status: 'done', length: content.length });
              return content;
            } catch (err: unknown) {
              const errMsg = err instanceof Error ? err.message : 'Unknown error';
              send({ phase: 'propose', agentId: agent.id, agentName: agent.name, status: 'error', error: errMsg });
              return `[${agent.name} 提案失败: ${errMsg}]`;
            }
          });

          const proposals = await Promise.all(proposalPromises);

          // ════════════════════════════════════════
          // Phase 2: 聚合阶段 — 流式输出
          // ════════════════════════════════════════
          send({ phase: 'aggregate_start' });

          const aggregatorSystem = buildAggregatorSystemPrompt(documentText, projectContext);
          const aggregatorMessages = [
            { role: 'system' as const, content: aggregatorSystem },
            ...priorMessages,
            { role: 'user' as const, content: buildAggregatorMessage(lastUserMsg.content, proposals) },
          ];

          const llmStream = client.stream(aggregatorMessages, {
            model: CHAT_MODEL,
            temperature: 0.5,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              send({ content: text });
            }
          }

          send({ done: true });
          controller.close();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          send({ error: errorMessage });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
