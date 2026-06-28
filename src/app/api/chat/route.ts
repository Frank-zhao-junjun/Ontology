import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { COPILOT_SYSTEM_PROMPT } from '@/components/ontology/copilot/copilot-system-prompt';

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
 * 构建完整系统 Prompt（含项目上下文 + 文档内容）
 */
function buildSystemPrompt(documentText?: string, projectContext?: string): string {
  let prompt = COPILOT_SYSTEM_PROMPT;

  if (projectContext && projectContext.trim()) {
    prompt += `\n\n--- 当前项目上下文 ---\n${projectContext}`;
  }

  if (documentText && documentText.trim()) {
    const truncated = documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) + '\n... (文档已截断，仅展示前 10000 字符)'
      : documentText;
    prompt += `\n\n--- 用户上传的文档内容 ---\n${truncated}\n\n请分析以上文档内容，提取关键实体、业务流程和规则，并为用户生成建模建议。如果文档内容足够清晰，请直接建议创建对应的 A-价值域、B-能力、C-场景或 EPC 流程。`;
  }

  return prompt;
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

    // 提取鉴权 headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统 prompt
    const systemPrompt = buildSystemPrompt(documentText, projectContext);

    // 构建消息列表
    const sdkMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // 创建 SSE 流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = client.stream(sdkMessages, {
            model: CHAT_MODEL,
            temperature: 0.6,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`),
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
          );
          controller.close();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`),
          );
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
