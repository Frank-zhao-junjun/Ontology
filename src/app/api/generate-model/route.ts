import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface GenerateModelRequest {
  entity: {
    id: string;
    name: string;
    nameEn: string;
    description?: string;
    projectId?: string;
    projectName?: string;
    attributes: Array<{ name?: string }>;
    relations: Array<{ name?: string }>;
  };
  domain?: {
    name: string;
    nameEn?: string;
    description?: string;
  };
  project?: {
    name: string;
    nameEn?: string;
    description?: string;
  } | null;
  existingModels?: {
    stateMachines?: unknown[];
    rules?: unknown[];
    events?: unknown[];
    roles?: unknown[];
    metrics?: unknown[];
    boundaries?: unknown[];
    dataSources?: unknown[];
  };
  metadataList?: Array<{ name: string; nameEn: string; description?: string; type?: string }>;
  masterDataList?: Array<{ name: string; nameEn?: string; description?: string }>;
  referenceDocuments?: string[];
}

interface GenerateModelResponse {
  success: boolean;
  data?: {
    e1?: {
      suggestedAttributes?: Array<Record<string, unknown>>;
      suggestedRelations?: Array<Record<string, unknown>>;
    };
    e2?: {
      suggestedStates?: Array<Record<string, unknown>>;
      suggestedActions?: Array<Record<string, unknown>>;
      suggestedTransitions?: Array<Record<string, unknown>>;
    };
    e3?: {
      suggestedRules?: Array<Record<string, unknown>>;
    };
    e4?: {
      suggestedEvents?: Array<Record<string, unknown>>;
      suggestedSubscriptions?: Array<Record<string, unknown>>;
    };
    e5?: {
      suggestedRoles?: Array<Record<string, unknown>>;
      suggestedDepartments?: Array<Record<string, unknown>>;
    };
    e6?: {
      suggestedMetrics?: Array<Record<string, unknown>>;
    };
    e7?: {
      suggestedBoundaries?: Array<Record<string, unknown>>;
    };
    e8?: {
      suggestedDataSources?: Array<Record<string, unknown>>;
      suggestedInterfaces?: Array<Record<string, unknown>>;
    };
  };
  error?: string;
}

function createPrompt(request: GenerateModelRequest): string {
  const { entity, domain, project, existingModels, metadataList, masterDataList, referenceDocuments } = request;

  const metadataContext = metadataList && metadataList.length > 0
    ? `\n可用标准元数据字段（生成属性时请优先从此列表匹配，名称/含义接近则直接复用）：\n${metadataList.map((m) => `- ${m.name} (${m.nameEn}): ${m.description || ''} [类型: ${m.type || 'string'}]`).join('\n')}`
    : '';

  const masterDataContext = masterDataList && masterDataList.length > 0
    ? `\n可用主数据（生成关系/引用时请优先从此列表匹配）：\n${masterDataList.map((m) => `- ${m.name} (${m.nameEn || ''}): ${m.description || ''}`).join('\n')}`
    : '';

  const existingContext = existingModels
    ? `\n已有模型上下文：\n- 状态机：${(existingModels.stateMachines || []).length} 个\n- 规则：${(existingModels.rules || []).length} 条\n- 事件：${(existingModels.events || []).length} 个\n- 岗位角色：${(existingModels.roles || []).length} 个\n- 指标：${(existingModels.metrics || []).length} 个\n- 边界约束：${(existingModels.boundaries || []).length} 个\n- 数据源：${(existingModels.dataSources || []).length} 个`
    : '';

  const referenceContext = referenceDocuments && referenceDocuments.length > 0
    ? `\n参考文档内容：\n${referenceDocuments.join('\n---\n').slice(0, 8000)}`
    : '';

  return `你是一位资深企业架构师，正在为${domain?.name || '目标领域'}设计本体模型。

请基于以下实体信息，生成完整的 E1-E8 八维元模型建议。每个维度只需返回最相关、最精简的 1-5 条建议。

## 目标实体
- 中文名：${entity.name}
- 英文名：${entity.nameEn}
- 描述：${entity.description || '暂无'}
- 所属项目：${entity.projectName || project?.name || '默认项目'}
- 领域：${domain?.name || '通用领域'}
- 现有属性：${(entity.attributes || []).map((a) => a.name).join('、') || '无'}
- 现有关系：${(entity.relations || []).map((r) => r.name).join('、') || '无'}
${metadataContext}${masterDataContext}${existingContext}${referenceContext}

## E1-E8 八维元模型定义
- E1 数据模型：实体、属性、关系。属性支持 string/text/integer/decimal/boolean/date/datetime/enum/reference。
- E2 行为模型：状态机（状态、转换）、动作。
- E3 规则模型：字段校验、跨字段校验、跨实体校验、聚合校验、时序规则。
- E4 事件模型：事件定义、订阅、处理。
- E5 岗位角色模型：部门、岗位、职责、治理角色。
- E6 指标模型：指标、阈值、目标、计算口径。
- E7 边界约束模型：合规边界、业务约束、技术约束。
- E8 数据/接口模型：数据源、接口定义、集成方式。

## 输出格式要求
请严格返回以下 JSON 结构，不要包含任何 markdown 代码块或额外解释：

{
  "e1": {
    "suggestedAttributes": [{ "name": "", "nameEn": "", "dataType": "string", "required": false, "description": "" }],
    "suggestedRelations": [{ "name": "", "type": "one_to_many", "targetEntity": "", "description": "" }]
  },
  "e2": {
    "suggestedStates": [{ "name": "", "isInitial": false, "isFinal": false, "description": "" }],
    "suggestedActions": [{ "name": "", "trigger": "manual", "description": "" }],
    "suggestedTransitions": [{ "name": "", "from": "", "to": "", "trigger": "manual", "description": "" }]
  },
  "e3": {
    "suggestedRules": [{ "name": "", "type": "field_validation", "field": "", "condition": { "type": "required" }, "errorMessage": "", "severity": "error" }]
  },
  "e4": {
    "suggestedEvents": [{ "name": "", "trigger": "create", "description": "" }],
    "suggestedSubscriptions": [{ "name": "", "event": "", "handler": "async", "action": "notification" }]
  },
  "e5": {
    "suggestedRoles": [{ "name": "", "description": "", "responsibilities": [] }],
    "suggestedDepartments": [{ "name": "", "type": "department", "description": "" }]
  },
  "e6": {
    "suggestedMetrics": [{ "name": "", "unit": "", "targetValue": "", "description": "" }]
  },
  "e7": {
    "suggestedBoundaries": [{ "name": "", "type": "business", "description": "" }]
  },
  "e8": {
    "suggestedDataSources": [{ "name": "", "type": "database", "connection": "", "description": "" }],
    "suggestedInterfaces": [{ "name": "", "protocol": "REST", "method": "GET", "description": "" }]
  }
}

注意：
1. 所有字段必须与目标实体${entity.name}强相关，避免泛泛而谈。
2. 如果某维度没有合适建议，返回空数组即可，不要编造。
3. 优先从提供的元数据/主数据列表中匹配已有字段名，保持术语一致性。`;
}

function safeJsonParse(text: string): unknown {
  try {
    // 尝试直接解析
    return JSON.parse(text);
  } catch {
    // 尝试提取 JSON 代码块
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // ignore
      }
    }
    // 尝试提取第一个 { ... }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // ignore
      }
    }
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateModelResponse>> {
  try {
    const body = (await request.json()) as GenerateModelRequest;

    if (!body.entity) {
      return NextResponse.json({ success: false, error: '缺少实体信息' }, { status: 400 });
    }

    const prompt = createPrompt(body);

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const stream = client.stream(
      [
        {
          role: 'system',
          content: '你是一位资深企业架构师，专注于本体模型建模，输出严格 JSON。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        model: 'doubao-pro-128k',
        temperature: 0.3,
      },
    );

    let fullContent = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    // 尝试从 markdown 代码块中提取 JSON
    let jsonContent = fullContent;
    const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      const firstBrace = fullContent.indexOf('{');
      const lastBrace = fullContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonContent = fullContent.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = safeJsonParse(jsonContent);

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { success: false, error: 'AI 返回内容无法解析为 JSON', rawContent: fullContent },
        { status: 500 }
      );
    }

    // 兼容旧版四大模型格式，自动映射到 E1-E4
    const legacyData = parsed as Record<string, unknown>;
    const normalizedData: GenerateModelResponse['data'] = {};

    if (legacyData.e1 || legacyData.dataModel) {
      const source = (legacyData.e1 || legacyData.dataModel) as Record<string, unknown>;
      normalizedData.e1 = {
        suggestedAttributes: (source.suggestedAttributes || []) as Array<Record<string, unknown>>,
        suggestedRelations: (source.suggestedRelations || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e2 || legacyData.behaviorModel) {
      const source = (legacyData.e2 || legacyData.behaviorModel) as Record<string, unknown>;
      normalizedData.e2 = {
        suggestedStates: (source.suggestedStates || []) as Array<Record<string, unknown>>,
        suggestedActions: (source.suggestedActions || source.suggestedTransitions || []) as Array<Record<string, unknown>>,
        suggestedTransitions: (source.suggestedTransitions || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e3 || legacyData.ruleModel) {
      const source = (legacyData.e3 || legacyData.ruleModel) as Record<string, unknown>;
      normalizedData.e3 = {
        suggestedRules: (source.suggestedRules || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e4 || legacyData.eventModel) {
      const source = (legacyData.e4 || legacyData.eventModel) as Record<string, unknown>;
      normalizedData.e4 = {
        suggestedEvents: (source.suggestedEvents || []) as Array<Record<string, unknown>>,
        suggestedSubscriptions: (source.suggestedSubscriptions || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e5) {
      const source = legacyData.e5 as Record<string, unknown>;
      normalizedData.e5 = {
        suggestedRoles: (source.suggestedRoles || []) as Array<Record<string, unknown>>,
        suggestedDepartments: (source.suggestedDepartments || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e6) {
      const source = legacyData.e6 as Record<string, unknown>;
      normalizedData.e6 = {
        suggestedMetrics: (source.suggestedMetrics || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e7) {
      const source = legacyData.e7 as Record<string, unknown>;
      normalizedData.e7 = {
        suggestedBoundaries: (source.suggestedBoundaries || []) as Array<Record<string, unknown>>,
      };
    }

    if (legacyData.e8) {
      const source = legacyData.e8 as Record<string, unknown>;
      normalizedData.e8 = {
        suggestedDataSources: (source.suggestedDataSources || []) as Array<Record<string, unknown>>,
        suggestedInterfaces: (source.suggestedInterfaces || []) as Array<Record<string, unknown>>,
      };
    }

    return NextResponse.json({
      success: true,
      data: normalizedData,
    });
  } catch (error) {
    console.error('Generate model error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成模型失败' },
      { status: 500 }
    );
  }
}
