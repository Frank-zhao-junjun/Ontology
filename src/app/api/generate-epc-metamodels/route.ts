import { NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  buildEpcMetamodelPrompt,
  parseEpcMetamodelResponse,
  EpcMetamodelParseError,
} from '@/lib/ai-draft/epc-metamodel-prompt';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      epcName,
      epcDescription,
      epcNameEn,
      domainName,
      projectName,
      existingElements,
    } = body;

    if (!epcName || typeof epcName !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少 epcName 参数' },
        { status: 400 },
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);
    const prompt = buildEpcMetamodelPrompt({
      epcName,
      epcDescription: epcDescription ?? '',
      epcNameEn: epcNameEn ?? '',
      domainName: domainName ?? '',
      projectName: projectName ?? '',
      existingElements: existingElements ?? [],
    });

    const model = process.env.GENERATE_MODEL ?? process.env.CHAT_MODEL ?? 'doubao-seed-2-0-pro-260215';
    const messages = [
      { role: 'system' as const, content: prompt.system },
      { role: 'user' as const, content: prompt.user },
    ];
    const stream = client.stream(messages, {
      model,
      temperature: 0.3,
    });

    let rawText = '';
    for await (const chunk of stream) {
      if (chunk && typeof chunk === 'object' && 'content' in chunk && chunk.content) {
        rawText += String(chunk.content);
      }
    }

    const drafts = parseEpcMetamodelResponse(rawText);

    return NextResponse.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    const message =
      error instanceof EpcMetamodelParseError
        ? error.message
        : error instanceof Error
          ? error.message
          : '生成失败';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
