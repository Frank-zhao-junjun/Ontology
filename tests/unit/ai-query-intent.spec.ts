/**
 * AI 查询意图识别测试
 * 
 * 测试用例：
 * - UT-AI-001: 意图识别 list
 * - UT-AI-002: 意图识别 analyze
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BasicQueryService } from '@/lib/ai/query-service';

describe('AI Query Intent', () => {
  let service: BasicQueryService;

  beforeEach(() => {
    service = new BasicQueryService();
  });

  describe('UT-AI-001: 意图识别 list', () => {
    it('应正确识别列表查询意图', () => {
      const testCases = [
        { input: '查询合同列表', expected: 'list' },
        { input: '列出所有合同', expected: 'list' },
        { input: '获取合同列表', expected: 'list' },
        { input: '查看所有合同', expected: 'list' },
        { input: '显示合同列表', expected: 'list' },
        { input: '合同列表', expected: 'list' },
      ];

      for (const { input, expected } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe(expected);
      }
    });

    it('不同查询词应映射到 list 意图', () => {
      const testCases = [
        '查询用户列表',
        '列出订单',
        '获取客户列表',
        '查看产品列表',  // 需要包含"列表"关键词
      ];

      for (const input of testCases) {
        const intent = service.recognizeIntent(input);
        // 如果不包含"列表"，则可能是 unknown
        if (input.includes('列表') || input.includes('列出')) {
          expect(intent).toBe('list');
        }
      }
    });
  });

  describe('UT-AI-002: 意图识别 analyze', () => {
    it('应正确识别分析查询意图', () => {
      const testCases = [
        { input: '统计合同数量', expected: 'analyze' },
        { input: '分析合同数据', expected: 'analyze' },
        { input: '计算合同总额', expected: 'analyze' },
        { input: '汇总合同信息', expected: 'analyze' },
        { input: '合同数量', expected: 'analyze' },
        { input: '合同总额', expected: 'analyze' },
        { input: '合同平均值', expected: 'analyze' },
      ];

      for (const { input, expected } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe(expected);
      }
    });

    it('统计类查询应映射到 analyze 意图', () => {
      const testCases = [
        '统计订单总额',
        '分析用户行为',
        '计算平均金额',
        '汇总销售数据',
      ];

      for (const input of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe('analyze');
      }
    });
  });

  describe('实体识别', () => {
    it('应正确识别实体类型', () => {
      const testCases = [
        { input: '查询合同列表', expected: 'Contract' },
        { input: '统计合同条款数量', expected: 'ContractClause' },
        { input: '查看审批状态', expected: 'ApprovalInstance' },
        { input: '获取付款计划', expected: 'PaymentSchedule' },
        { input: '下载附件', expected: 'ContractAttachment' },
      ];

      for (const { input, expected } of testCases) {
        const entity = service.recognizeEntity(input);
        expect(entity).toBe(expected);
      }
    });

    it('无法识别实体时应返回 undefined', () => {
      const input = '查询某某东西';
      const entity = service.recognizeEntity(input);
      expect(entity).toBeUndefined();
    });

    it('"合同条款"应优先于"合同"被识别', () => {
      const input = '查询合同条款列表';
      const entity = service.recognizeEntity(input);
      // 由于"合同条款"关键词更长，应该匹配到 ContractClause
      expect(entity).toBe('ContractClause');
    });
  });
});
