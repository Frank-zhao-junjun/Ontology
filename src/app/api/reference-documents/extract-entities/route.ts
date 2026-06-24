import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { ExtractedEntity, ExtractedAttribute } from '@/types/ontology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docId, documentText, title, domain } = body as {
      docId: string;
      documentText: string;
      title?: string;
      domain?: { name: string; nameEn?: string; description?: string };
    };

    if (!documentText) {
      return NextResponse.json({ success: false, error: '缺少文档内容' }, { status: 400 });
    }

    // Truncate for LLM
    const truncatedText = documentText.length > 8000
      ? documentText.slice(0, 8000) + '\n...(truncated)...\n' + documentText.slice(-2000)
      : documentText;

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const prompt = `从以下业务文档中提取可以建模为本体实体的业务概念。

${title ? `文档标题: ${title}` : ''}
${domain ? `所属领域: ${domain.name}${domain.description ? ' - ' + domain.description : ''}` : ''}

文档内容:
"""
${truncatedText}
"""

请以JSON格式返回提取的实体候选列表，每个实体包含:
- name: 实体中文名称
- nameEn: 实体英文名称（驼峰命名）
- description: 实体的业务描述
- source: 来源段落（引用文档中的原文）
- confidence: 置信度 0-1
- attributes: 可选，提取的属性候选列表（name/nameEn/dataType/description/required/source）

只返回JSON数组，不要其他内容。`;

    const messages = [{ role: 'user' as const, content: prompt }];
    const stream = client.stream(messages, { temperature: 0.3 });
    let result = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        result += chunk.content.toString();
      }
    }

    let entities: ExtractedEntity[] = [];
    try {
      // Try to parse JSON from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        entities = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: return empty
      entities = [];
    }

    return NextResponse.json({ success: true, data: { docId, entities } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: `实体提取失败: ${message}` }, { status: 500 });
  }
}

