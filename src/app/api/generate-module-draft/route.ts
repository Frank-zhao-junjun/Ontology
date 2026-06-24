import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  buildModuleDraftContext,
  buildModuleDraftPrompt,
  parseModuleDraftResponse,
  getConfirmedElementIds,
} from '@/lib/ai-draft';
import {
  buildEpcDocPrompt,
  parseEpcSteps,
} from '@/lib/ai-draft/epc-doc-prompt';
import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type { OntologyProject, ModuleVersionRecord } from '@/types/ontology';
import type { EpcDocPromptContext } from '@/lib/ai-draft/epc-doc-prompt';

type ProjectSlice = Pick<
  OntologyProject,
  'valueDomains' | 'capabilities' | 'scenarios' | 'epcProcesses' | 'metaElements' | 'moduleVersionRecords'
>;

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
 * Invoke LLM stream and return full content.
 */
async function invokeLlm(
  client: LLMClient,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
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
  return fullContent;
}

/**
 * EPC 文档 → 步骤 专用处理分支
 */
async function handleEpcDocDraft(
  client: LLMClient,
  project: ProjectSlice,
  documentText: string,
) {
  const context = buildModuleDraftContext(project as OntologyProject, 'EPC', '');

  const epcDocContext: EpcDocPromptContext = {
    chainPath: context.chainPath,
    confirmedElements: context.confirmedElements.map((item) => ({
      id: item.id,
      name: item.name,
      dimension: item.dimension,
      version: item.version,
    })),
  };

  const prompt = buildEpcDocPrompt(documentText, epcDocContext);
  const fullContent = await invokeLlm(client, prompt.system, prompt.user);
  const jsonContent = extractJsonContent(fullContent);

  const result = parseEpcSteps(jsonContent);
  return NextResponse.json({
    success: true,
    data: { suggestion: { steps: result.steps } },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleKind, moduleId, project, userHint, documentText } = body as {
      moduleKind: BusinessChainNodeKind;
      moduleId: string;
      project: ProjectSlice;
      userHint?: string;
      documentText?: string;
    };

    if (!moduleKind || !moduleId || !project) {
      return NextResponse.json(
        { success: false, error: '缺少参数：moduleKind、moduleId、project' },
        { status: 400 },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // ── EPC 文档→步骤 分支 ──
    if (moduleKind === 'EPC' && documentText?.trim()) {
      return handleEpcDocDraft(client, project, documentText);
    }

    // ── 通用填充分支 ──
    const context = buildModuleDraftContext(project as OntologyProject, moduleKind, moduleId);
    const basePrompt = buildModuleDraftPrompt(context, moduleKind, userHint);

    let userContent = basePrompt.user;
    if (documentText?.trim()) {
      const truncated =
        documentText.length > 10000
          ? documentText.slice(0, 8000) + '\n...(中间省略)...\n' + documentText.slice(-2000)
          : documentText;

      userContent += `\n\n## 参考文档内容\n请基于以下文档内容，为当前 EPC 流程生成步骤建议。\n每个步骤应引用已确认要素目录中的 elementId。\n\n"""\n${truncated}\n"""`;
    }

    const messages = [
      { role: 'system' as const, content: basePrompt.system },
      { role: 'user' as const, content: userContent },
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

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse LLM response:', fullContent);
      return NextResponse.json(
        { success: false, error: 'AI 响应格式解析失败', rawContent: fullContent },
        { status: 500 },
      );
    }

    const confirmedIds = getConfirmedElementIds(context);
    const suggestion = parseModuleDraftResponse(parsed, moduleKind, confirmedIds);

    return NextResponse.json({
      success: true,
      data: { suggestion },
    });
  } catch (error) {
    console.error('Generate module draft error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'AI 填充失败' },
      { status: 500 },
    );
  }
}
