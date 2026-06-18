import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  buildModuleDraftContext,
  buildModuleDraftPrompt,
  getConfirmedElementIds,
  parseModuleDraftResponse,
  type ModuleDraftSuggestion,
} from '@/lib/ai-draft';
import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type { OntologyProject } from '@/types/ontology';

type RequestBody = {
  moduleKind: BusinessChainNodeKind;
  moduleId: string;
  project: Pick<
    OntologyProject,
    'valueDomains' | 'capabilities' | 'scenarios' | 'epcProcesses' | 'metaElements' | 'moduleVersionRecords'
  >;
  userHint?: string;
};

function extractJsonContent(fullContent: string): string {
  const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) return jsonMatch[1];
  const firstBrace = fullContent.indexOf('{');
  const lastBrace = fullContent.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return fullContent.substring(firstBrace, lastBrace + 1);
  }
  return fullContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { moduleKind, moduleId, project, userHint } = body;

    if (!moduleKind || !moduleId || !project) {
      return NextResponse.json({ error: '缺少 moduleKind / moduleId / project' }, { status: 400 });
    }

    const context = buildModuleDraftContext(project, moduleKind, moduleId);
    const prompt = buildModuleDraftPrompt(context, moduleKind, userHint);
    const confirmedIds = getConfirmedElementIds(context);

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(new Config(), customHeaders);

    let fullContent = '';
    const stream = client.stream(
      [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.4,
        thinking: 'enabled',
      },
    );

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    let parsedRaw: unknown;
    try {
      parsedRaw = JSON.parse(extractJsonContent(fullContent));
    } catch {
      return NextResponse.json(
        { error: 'AI响应格式解析失败', rawContent: fullContent },
        { status: 500 },
      );
    }

    let suggestion: ModuleDraftSuggestion;
    try {
      suggestion = parseModuleDraftResponse(parsedRaw, moduleKind, confirmedIds);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'AI 建议校验失败',
          rawContent: fullContent,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { suggestion },
      rawContent: fullContent,
    });
  } catch (error) {
    console.error('Generate module draft error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成模块草稿失败' },
      { status: 500 },
    );
  }
}
