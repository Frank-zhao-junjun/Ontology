/**
 * AI 基础查询服务
 * 
 * 提供自然语言查询意图识别和执行能力
 */

// ========== 类型定义 ==========

export type QueryIntent = 'list' | 'detail' | 'create' | 'update' | 'delete' | 'analyze' | 'unknown';

export interface QueryRequest {
  input: string;
  context?: {
    entityType?: string;
    projectId?: string;
    [key: string]: unknown;
  };
}

export interface QueryResponse {
  message: string;
  results: unknown[];
  query?: {
    intent: QueryIntent;
    entity?: string;
    filters?: Record<string, unknown>;
  };
  error?: string;
}

// ========== 意图识别器 ==========

interface IntentPattern {
  intent: QueryIntent;
  patterns: RegExp[];
  entities?: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'list',
    patterns: [
      /查询.*列表/,
      /列出.*/,
      /获取.*列表/,
      /查看所有.*/,
      /显示.*列表/,
      /.*列表/,
    ],
  },
  {
    intent: 'analyze',
    patterns: [
      /统计.*/,
      /分析.*/,
      /计算.*/,
      /汇总.*/,
      /.*数量/,
      /.*总额/,
      /.*平均值/,
    ],
  },
  {
    intent: 'detail',
    patterns: [
      /查询.*详情/,
      /获取.*详情/,
      /查看.*详情/,
      /.*详细信息/,
    ],
  },
  {
    intent: 'create',
    patterns: [
      /创建.*/,
      /新增.*/,
      /添加.*/,
      /新建.*/,
    ],
  },
  {
    intent: 'update',
    patterns: [
      /更新.*/,
      /修改.*/,
      /编辑.*/,
      /更改.*/,
    ],
  },
  {
    intent: 'delete',
    patterns: [
      /删除.*/,
      /移除.*/,
      /取消.*/,
    ],
  },
];

// 实体关键词映射（按关键词长度降序排列，确保优先匹配更具体的实体）
const ENTITY_KEYWORDS: Record<string, string[]> = {
  ContractClause: ['合同条款', '条款', 'clause'],
  ApprovalInstance: ['审批实例', '审批', 'approval'],
  PaymentSchedule: ['付款计划', '付款', 'payment'],
  ContractAttachment: ['合同附件', '附件', 'attachment'],
  Contract: ['合同', 'contract'],
};

// ========== 查询服务类 ==========

export class BasicQueryService {
  /**
   * 识别用户输入的意图
   */
  recognizeIntent(input: string): QueryIntent {
    const normalizedInput = input.trim().toLowerCase();

    for (const { intent, patterns } of INTENT_PATTERNS) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          return intent;
        }
      }
    }

    return 'unknown';
  }

  /**
   * 从输入中识别实体类型
   * 优先匹配更长的关键词（如"合同条款"优先于"合同"）
   */
  recognizeEntity(input: string): string | undefined {
    // 收集所有匹配的关键词，按长度降序排列
    const matches: { entity: string; keyword: string; keywordLength: number }[] = [];

    for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          matches.push({ entity, keyword, keywordLength: keyword.length });
        }
      }
    }

    // 如果有匹配，返回最长关键词对应的实体
    if (matches.length > 0) {
      matches.sort((a, b) => b.keywordLength - a.keywordLength);
      return matches[0].entity;
    }

    return undefined;
  }

  /**
   * 执行查询（抽象方法，由具体实现覆盖）
   */
  protected async _execute_query(
    intent: QueryIntent,
    entity: string | undefined,
    filters: Record<string, unknown>
  ): Promise<unknown[]> {
    void intent;
    void entity;
    void filters;
    // 默认实现返回空数组
    // 实际实现应该查询数据库
    return [];
  }

  /**
   * 处理查询请求
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    try {
      const { input, context } = request;

      // 1. 识别意图
      const intent = this.recognizeIntent(input);

      // 2. 识别实体
      const entity = context?.entityType || this.recognizeEntity(input);

      // 3. 执行查询
      let results: unknown[] = [];
      let message = '';

      if (intent !== 'unknown' && entity) {
        results = await this._execute_query(intent, entity, {});
        message = '查询成功';
      } else if (intent === 'unknown') {
        message = '无法识别查询意图';
      } else {
        message = '无法识别实体类型';
      }

      return {
        message,
        results,
        query: {
          intent,
          entity,
        },
      };

    } catch (error) {
      return {
        message: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
        results: [],
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}

// ========== 导出单例 ==========

export const basicQueryService = new BasicQueryService();
