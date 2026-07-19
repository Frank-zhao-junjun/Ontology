import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { buildProjectOntologySummary } from '@/lib/ai-draft/build-project-summary';
import { buildNlOntologyPrompt, parseNlOntologyResult } from '@/lib/ai-draft/nl-ontology-prompt';
import type { OntologyProject } from '@/types/ontology';

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

/**
 * POST /api/nl-to-ontology
 * 自然语言查询 → 本体要素语义匹配（LLM 只做匹配，不做创造性生成）。
 * 输入: { query: string, project: OntologyProject }
 * 输出: { success: true, data: NlOntologyResult }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, project } = body as { query?: string; project?: OntologyProject };

    if (!query?.trim() || !project) {
      return NextResponse.json(
        { error: '缺少参数：query、project' },
        { status: 400 },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const projectSummary = buildProjectOntologySummary(project);
    const prompt = buildNlOntologyPrompt({ query: query.trim(), projectSummary });

    const messages = [
      { role: 'system' as const, content: prompt.system },
      { role: 'user' as const, content: prompt.user },
    ];

    let fullContent = '';
    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.1,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    const jsonContent = extractJsonContent(fullContent);
    const result = parseNlOntologyResult(jsonContent);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('NL to ontology error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'NL 语义查询失败' },
      { status: 500 },
    );
  }
}
