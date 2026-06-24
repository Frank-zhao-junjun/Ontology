import { describe, expect, it } from 'vitest';
import {
  buildEpcDocPrompt,
  parseEpcSteps,
  EpcDocParseError,
  type EpcDocPromptContext,
} from '@/lib/ai-draft/epc-doc-prompt';

describe('buildEpcDocPrompt', () => {
  const sampleContext: EpcDocPromptContext = {
    chainPath: '生产域 > 计划能力 > 排产场景',
    confirmedElements: [
      { id: 'el1', name: '订单', dimension: 'E1', version: 'v1' },
      { id: 'el2', name: '审核', dimension: 'E2', version: 'v2' },
    ],
  };

  it('should include chain path, catalog and JSON schema in system prompt', () => {
    const prompt = buildEpcDocPrompt('用户文档内容', sampleContext);

    expect(prompt.system).toContain('EPC');
    expect(prompt.system).toContain('生成');
    // chainPath
    expect(prompt.system).toContain('生产域 > 计划能力 > 排产场景');
    // catalog
    expect(prompt.system).toContain('[E1] 订单 (el1, v1)');
    expect(prompt.system).toContain('[E2] 审核 (el2, v2)');
    // JSON schema hint
    expect(prompt.system).toContain('"elementRef"');
    expect(prompt.system).toContain('"versionPin"');
  });

  it('should put doc text as user prompt', () => {
    const docText = '采购流程：创建采购订单后，由主管审批，最后由财务付款。';
    const prompt = buildEpcDocPrompt(docText, sampleContext);

    expect(prompt.user).toBe(docText);
  });

  it('should handle empty confirmed elements gracefully', () => {
    const ctx: EpcDocPromptContext = {
      chainPath: '测试域',
      confirmedElements: [],
    };
    const prompt = buildEpcDocPrompt('测试文档', ctx);

    expect(prompt.system).toContain('暂无已确认要素');
    expect(prompt.system).not.toContain('- [E1]');
  });

  it('should handle empty chain path gracefully', () => {
    const ctx: EpcDocPromptContext = {
      chainPath: '',
      confirmedElements: [],
    };
    const prompt = buildEpcDocPrompt('测试文档', ctx);

    expect(prompt.system).toContain('(根节点)');
  });
});

describe('parseEpcSteps', () => {
  it('should parse valid LLM output correctly', () => {
    const llmOutput = JSON.stringify({
      steps: [
        {
          name: '创建订单',
          description: '在系统中录入采购订单信息',
          elementRef: { elementId: 'el1', versionPin: 'latest_confirmed' },
        },
        {
          name: '审核订单',
          description: '主管审核采购订单内容',
        },
      ],
    });

    const result = parseEpcSteps(llmOutput);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].name).toBe('创建订单');
    expect(result.steps[0].description).toBe('在系统中录入采购订单信息');
    expect(result.steps[0].elementRef?.elementId).toBe('el1');
    expect(result.steps[0].elementRef?.versionPin).toBe('latest_confirmed');
    expect(result.steps[1].name).toBe('审核订单');
    expect(result.steps[1].elementRef).toBeUndefined();
  });

  it('should throw EpcDocParseError for invalid JSON', () => {
    expect(() => parseEpcSteps('not json at all')).toThrow(EpcDocParseError);
    expect(() => parseEpcSteps('')).toThrow(EpcDocParseError);
  });

  it('should throw EpcDocParseError for missing required fields', () => {
    const llmOutput = JSON.stringify({
      steps: [{ name: '缺描述步骤' }],
    });

    expect(() => parseEpcSteps(llmOutput)).toThrow(EpcDocParseError);
    expect(() => parseEpcSteps(llmOutput)).toThrow(/Schema 校验失败/);
  });

  it('should throw EpcDocParseError for empty steps array', () => {
    const llmOutput = JSON.stringify({ steps: [] });

    expect(() => parseEpcSteps(llmOutput)).toThrow(EpcDocParseError);
    expect(() => parseEpcSteps(llmOutput)).toThrow(/至少需要 1 个步骤/);
  });

  it('should throw EpcDocParseError for wrong top-level structure', () => {
    const llmOutput = JSON.stringify({ notSteps: [] });

    expect(() => parseEpcSteps(llmOutput)).toThrow(EpcDocParseError);
    expect(() => parseEpcSteps(llmOutput)).toThrow(/Schema 校验失败/);
  });
});
