import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  buildModuleDraftContext,
} from '@/lib/ai-draft';
import {
  buildEpcDocPrompt,
  parseEpcSteps,
  type EpcStepSuggestion,
} from '@/lib/ai-draft/epc-doc-prompt';
import {
  buildElementDocPrompt,
  parseElementDrafts,
  type ElementDraftSuggestion,
} from '@/lib/ai-draft/element-doc-prompt';
import {
  buildChainDocPrompt,
  parseChainDoc,
  type ChainDocParseResult,
} from '@/lib/copilot/chain-doc-prompt';
import {
  runAnalyzeDocument,
  type AnalyzeDocumentProjectSlice,
  type EpcInferenceResult,
} from '@/lib/copilot/analyze-document-orchestrator';
import type { OntologyProject } from '@/types/ontology';

type ProjectSlice = AnalyzeDocumentProjectSlice;

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

function truncateDocumentText(documentText: string): string {
  if (documentText.length <= 10000) return documentText;
  return (
    documentText.slice(0, 8000) + '\n...(中间省略)...\n' + documentText.slice(-2000)
  );
}

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

function createInferFns(client: LLMClient, documentText: string) {
  const truncated = truncateDocumentText(documentText);

  return {
    inferBusinessChain: async (
      _doc: string,
      project: ProjectSlice,
    ): Promise<ChainDocParseResult> => {
      const prompt = buildChainDocPrompt(truncated, {
        domain: project.domain?.name ?? '(未指定)',
        existingValueDomainNames: (project.valueDomains ?? []).map((v) => v.name),
      });
      const raw = await invokeLlm(client, prompt.system, prompt.user);
      return parseChainDoc(extractJsonContent(raw));
    },

    inferEpcSteps: async (
      _doc: string,
      project: ProjectSlice,
    ): Promise<EpcInferenceResult> => {
      const context = buildModuleDraftContext(project as OntologyProject, 'EPC', '');
      const prompt = buildEpcDocPrompt(truncated, {
        chainPath: context.chainPath,
        confirmedElements: context.confirmedElements.map((item) => ({
          id: item.id,
          name: item.name,
          dimension: item.dimension,
          version: item.version,
        })),
      });
      const raw = await invokeLlm(client, prompt.system, prompt.user);
      const parsed = parseEpcSteps(extractJsonContent(raw));
      return { steps: parsed.steps as EpcStepSuggestion[] };
    },

    inferElements: async (
      _doc: string,
      project: ProjectSlice,
    ): Promise<{ elements: ElementDraftSuggestion[] }> => {
      const existingNames = (project.metaElements ?? []).map((el) => el.name);
      const prompt = buildElementDocPrompt(truncated, {
        domain: project.domain?.name ?? '(未指定)',
        existingElementNames: existingNames,
      });
      const raw = await invokeLlm(client, prompt.system, prompt.user);
      const parsed = parseElementDrafts(extractJsonContent(raw));
      return { elements: parsed.elements };
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentText, project } = body as {
      documentText: string;
      project: ProjectSlice;
    };

    if (!documentText?.trim() || !project) {
      return NextResponse.json(
        { success: false, error: '缺少参数：documentText、project' },
        { status: 400 },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);
    const inferFns = createInferFns(client, documentText);

    const data = await runAnalyzeDocument({
      documentText,
      project,
      inferBusinessChain: inferFns.inferBusinessChain,
      inferEpcSteps: inferFns.inferEpcSteps,
      inferElements: inferFns.inferElements,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Analyze document model error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '文档推断失败' },
      { status: 500 },
    );
  }
}
