import { describe, expect, it } from 'vitest';
import {
  buildElementDocPrompt,
  parseElementDrafts,
  ElementDocParseError,
  type ElementDocPromptContext,
} from '@/lib/ai-draft/element-doc-prompt';

describe('buildElementDocPrompt', () => {
  const sampleContext: ElementDocPromptContext = {
    domain: '制造业生产管理',
    existingElementNames: ['订单', '物料清单'],
  };

  it('should include domain, dimension definitions and JSON schema in system prompt', () => {
    const prompt = buildElementDocPrompt('用户文档内容', sampleContext);

    expect(prompt.system).toContain('制造业生产管理');
    // E1~E8 dimension titles
    expect(prompt.system).toContain('E1 — 数据模型');
    expect(prompt.system).toContain('E2 — 行为模型');
    expect(prompt.system).toContain('E3 — 事件模型');
    expect(prompt.system).toContain('E4 — 规则模型');
    expect(prompt.system).toContain('E5 — 岗位角色');
    expect(prompt.system).toContain('E6 — 指标模型');
    expect(prompt.system).toContain('E7 — 约束模型');
    expect(prompt.system).toContain('E8 — 接口模型');
    // dimension content
    expect(prompt.system).toContain('Entity');
    expect(prompt.system).toContain('StateMachine');
    expect(prompt.system).toContain('EventDefinition');
    expect(prompt.system).toContain('BusinessMetric');
    expect(prompt.system).toContain('Guard Condition');
    expect(prompt.system).toContain('Webhook');
    // JSON schema hint
    expect(prompt.system).toContain('"dimension"');
    expect(prompt.system).toContain('"fields"');
    // Existing element names (dedup hint)
    expect(prompt.system).toContain('订单');
    expect(prompt.system).toContain('物料清单');
  });

  it('should put doc text as user prompt', () => {
    const docText = '生产管理系统需要管理订单、物料和生产计划等核心数据。';
    const prompt = buildElementDocPrompt(docText, sampleContext);

    expect(prompt.user).toBe(docText);
  });

  it('should handle empty existing element names gracefully', () => {
    const ctx: ElementDocPromptContext = {
      domain: '测试域',
      existingElementNames: [],
    };
    const prompt = buildElementDocPrompt('测试文档', ctx);

    expect(prompt.system).toContain('暂无已存在要素');
    // Should not contain the dedup hint since there are no existing names
    expect(prompt.system).not.toContain('已存在要素名称:');
  });

  it('should handle empty domain gracefully', () => {
    const ctx: ElementDocPromptContext = {
      domain: '',
      existingElementNames: [],
    };
    const prompt = buildElementDocPrompt('测试文档', ctx);

    expect(prompt.system).toContain('(未指定)');
  });
});

describe('parseElementDrafts', () => {
  it('should parse valid LLM output correctly', () => {
    const llmOutput = JSON.stringify({
      elements: [
        {
          name: '订单',
          nameEn: 'Order',
          description: '客户下达的采购订单，包含商品明细和金额',
          dimension: 'E1',
          fields: {
            attributes: ['订单号', '客户', '金额', '状态'],
          },
        },
        {
          name: '审批流程',
          description: '订单审核的审批状态流转',
          dimension: 'E2',
          fields: {
            states: ['待审', '已通过', '已驳回'],
          },
        },
      ],
    });

    const result = parseElementDrafts(llmOutput);
    expect(result.elements).toHaveLength(2);

    expect(result.elements[0].name).toBe('订单');
    expect(result.elements[0].nameEn).toBe('Order');
    expect(result.elements[0].description).toBe('客户下达的采购订单，包含商品明细和金额');
    expect(result.elements[0].dimension).toBe('E1');
    expect(result.elements[0].fields).toEqual({ attributes: ['订单号', '客户', '金额', '状态'] });

    expect(result.elements[1].name).toBe('审批流程');
    expect(result.elements[1].nameEn).toBeUndefined();
    expect(result.elements[1].dimension).toBe('E2');
  });

  it('should throw ElementDocParseError for invalid JSON', () => {
    expect(() => parseElementDrafts('not json at all')).toThrow(ElementDocParseError);
    expect(() => parseElementDrafts('')).toThrow(ElementDocParseError);
  });

  it('should throw ElementDocParseError for missing required fields', () => {
    const llmOutput = JSON.stringify({
      elements: [{ name: '缺描述要素' }],
    });

    expect(() => parseElementDrafts(llmOutput)).toThrow(ElementDocParseError);
    expect(() => parseElementDrafts(llmOutput)).toThrow(/Schema 校验失败/);
  });

  it('should throw ElementDocParseError for empty elements array', () => {
    const llmOutput = JSON.stringify({ elements: [] });

    expect(() => parseElementDrafts(llmOutput)).toThrow(ElementDocParseError);
    expect(() => parseElementDrafts(llmOutput)).toThrow(/至少需要 1 个要素/);
  });

  it('should throw ElementDocParseError for wrong top-level structure', () => {
    const llmOutput = JSON.stringify({ notElements: [] });

    expect(() => parseElementDrafts(llmOutput)).toThrow(ElementDocParseError);
    expect(() => parseElementDrafts(llmOutput)).toThrow(/Schema 校验失败/);
  });
});
