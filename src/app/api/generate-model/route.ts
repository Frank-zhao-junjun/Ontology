import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { Metadata, MasterData } from '@/types/ontology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, domain, project, existingModels, metadataList, masterDataList } = body;

    if (!entity || !domain) {
      return NextResponse.json(
        { error: '缺少实体或领域信息' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建元数据提示部分
    let metadataPrompt = '';
    if (metadataList && metadataList.length > 0) {
      // 按类型分组元数据
      const groupedMetadata: Record<string, Metadata[]> = {};
      metadataList.forEach((m: Metadata) => {
        if (!groupedMetadata[m.type]) {
          groupedMetadata[m.type] = [];
        }
        groupedMetadata[m.type].push(m);
      });

      metadataPrompt = `\n## 可用元数据字典（重要！生成属性时优先从此列表匹配）

以下是系统预定义的标准元数据，生成属性时**必须优先**从此列表中匹配相似的属性，保持命名和类型的一致性：

`;
      
      Object.entries(groupedMetadata).forEach(([type, items]) => {
        metadataPrompt += `### ${type.toUpperCase()} 类型字段\n`;
        items.slice(0, 15).forEach((item) => {
          metadataPrompt += `- **${item.name}** (${item.nameEn}): ${item.description || '暂无描述'}`;
          if (item.valueRange) {
            metadataPrompt += ` | 值范围: ${item.valueRange}`;
          }
          if (item.standard) {
            metadataPrompt += ` | 标准: ${item.standard}`;
          }
          metadataPrompt += '\n';
        });
        metadataPrompt += '\n';
      });

      metadataPrompt += `**使用规则**：
1. 当实体需要类似功能的属性时，优先使用上述元数据中的定义
2. 保持英文名称、类型、值范围与元数据一致
3. 可以根据实体特点适当扩展描述
4. 如果元数据中没有合适的属性，可以自定义新属性
`;
    }

    // 构建主数据提示部分
    let masterDataPrompt = '';
    if (masterDataList && masterDataList.length > 0) {
      // 按领域分组主数据
      const groupedMasterData: Record<string, MasterData[]> = {};
      masterDataList.forEach((m: MasterData) => {
        if (!groupedMasterData[m.domain]) {
          groupedMasterData[m.domain] = [];
        }
        groupedMasterData[m.domain].push(m);
      });

      masterDataPrompt = `\n## 可用主数据参考（用于生成引用关系和业务属性）

以下是系统预定义的主数据记录，可用于生成引用类型的属性或建立实体间关系：

`;
      
      Object.entries(groupedMasterData).forEach(([domain, items]) => {
        masterDataPrompt += `### ${domain}\n`;
        items.slice(0, 10).forEach((item) => {
          masterDataPrompt += `- **${item.name}** (${item.nameEn})`;
          if (item.code) masterDataPrompt += ` [${item.code}]`;
          masterDataPrompt += `: ${item.description || '暂无描述'}`;
          if (item.fieldNames) masterDataPrompt += ` | 字段: ${item.fieldNames}`;
          masterDataPrompt += '\n';
        });
        masterDataPrompt += '\n';
      });

      masterDataPrompt += `**使用规则**：
1. 当实体需要引用核心业务数据时，可使用reference类型属性引用主数据
2. 例如：合同实体可引用"客户主数据"或"供应商主数据"
3. 引用主数据时，在属性中标记masterDataId和masterDataName
`;
    }

    // 构建提示词
    const systemPrompt = `你是一个专业的本体建模专家，擅长为业务实体设计四大元模型：数据模型、行为模型、规则模型和事件模型。

请根据提供的实体信息和业务领域，为该实体生成合理的模型建议。输出必须是严格的JSON格式，不要包含任何markdown标记。

输出格式要求：
{
  "dataModel": {
    "suggestedAttributes": [
      { "name": "属性名", "nameEn": "英文名", "type": "类型", "required": true/false, "description": "说明" }
    ],
    "suggestedRelations": [
      { "name": "关系名", "type": "one_to_one/one_to_many/many_to_many", "targetEntity": "目标实体", "description": "说明" }
    ]
  },
  "behaviorModel": {
    "suggestedStates": [
      { "name": "状态名", "nameEn": "英文名", "isInitial": true/false, "isFinal": true/false, "description": "说明" }
    ],
    "suggestedTransitions": [
      { "name": "转换名", "from": "起始状态", "to": "目标状态", "trigger": "manual/automatic/scheduled", "description": "说明" }
    ]
  },
  "ruleModel": {
    "suggestedRules": [
      { "name": "规则名", "type": "field_validation/cross_field_validation", "field": "字段名", "condition": { "type": "条件类型", "value": "值" }, "errorMessage": "错误消息", "description": "说明" }
    ]
  },
  "eventModel": {
    "suggestedEvents": [
      { "name": "事件名", "nameEn": "英文名", "trigger": "create/update/delete/state_change", "description": "说明" }
    ],
    "suggestedSubscriptions": [
      { "name": "订阅名", "event": "事件名", "action": "skill/webhook/notification", "description": "说明" }
    ]
  }
}

属性类型可选：string, integer, decimal, boolean, date, datetime, enum, text, reference

请确保生成的建议符合业务逻辑和领域特点。`;

    const userPrompt = `请为以下业务实体生成四大模型建议：

## 领域信息
- 领域名称：${domain.name}
- 领域描述：${domain.description || '暂无描述'}

## 所属项目信息
${entity.projectName ? `- 项目名称：${entity.projectName}` : '- 未指定项目'}
${project?.description ? `- 项目描述：${project.description}` : ''}

## 实体信息
- 实体名称：${entity.name}
- 英文名称：${entity.nameEn}
- 实体描述：${entity.description || '暂无描述'}
${metadataPrompt}${masterDataPrompt}
## 已有模型数据
${existingModels ? JSON.stringify(existingModels, null, 2) : '暂无已有模型数据'}

请基于领域知识和业务场景，为该实体生成合理的模型建议。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    // 使用流式输出获取响应
    let fullContent = '';
    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.7,
      thinking: 'enabled'
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    // 解析JSON响应
    // 尝试提取JSON部分（处理可能的markdown代码块）
    let jsonContent = fullContent;
    const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      // 尝试找到第一个 { 和最后一个 }
      const firstBrace = fullContent.indexOf('{');
      const lastBrace = fullContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonContent = fullContent.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse LLM response:', jsonContent);
      return NextResponse.json(
        { error: 'AI响应格式解析失败', rawContent: fullContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedContent,
      rawContent: fullContent
    });

  } catch (error) {
    console.error('Generate model error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成模型失败' },
      { status: 500 }
    );
  }
}
