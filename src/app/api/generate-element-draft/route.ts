import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  buildElementDocPrompt,
  parseElementDrafts,
} from '@/lib/ai-draft/element-doc-prompt';

/**
 * Extract JSON content from LLM output string (strip markdown fences and extra text).
 */
function extractJsonContent(raw: string): string {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) return jsonMatch[1];
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return raw.substring(firstBrace, lastBrace + 1);
  }
  return raw;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, documentText, existingElementNames } = body as {
      projectId: string;
      documentText: string;
      existingElementNames?: string[];
    };

    if (!projectId || !documentText?.trim()) {
      return NextResponse.json(
        { error: '缺少参数：projectId、documentText' },
        { status: 400 },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const prompt = buildElementDocPrompt(documentText, {
      domain: '(未指定)',
      existingElementNames: existingElementNames ?? [],
    });

    const messages = [
      { role: 'system' as const, content: prompt.system },
      { role: 'user' as const, content: prompt.user },
    ];

    let fullContent = '';
    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.5,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    const jsonContent = extractJsonContent(fullContent);
    const result = parseElementDrafts(jsonContent);

    return NextResponse.json({ elements: result.elements });
  } catch (error) {
    console.error('Generate element draft error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 解析文档失败' },
      { status: 500 },
    );
  }
}
