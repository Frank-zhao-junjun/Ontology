import { describe, expect, it } from 'vitest';
import {
  buildNlOntologyPrompt,
  parseNlOntologyResult,
  NlOntologyParseError,
} from '@/lib/ai-draft/nl-ontology-prompt';

describe('buildNlOntologyPrompt', () => {
  it('应将查询与项目摘要注入 prompt', () => {
    const prompt = buildNlOntologyPrompt({
      query: '采购订单的金额字段',
      projectSummary: '实体 | e1 | 采购订单 (PurchaseOrder)',
    });
    expect(prompt.system).toContain('语义匹配');
    expect(prompt.user).toContain('采购订单的金额字段');
    expect(prompt.user).toContain('实体 | e1 | 采购订单 (PurchaseOrder)');
  });

  it('应约束 LLM 只返回 JSON 且只做匹配', () => {
    const prompt = buildNlOntologyPrompt({ query: 'q', projectSummary: 's' });
    expect(prompt.system).toContain('禁止创造');
    expect(prompt.system).toContain('matchedEntities');
    expect(prompt.system).toContain('matchedProperties');
    expect(prompt.system).toContain('matchedRelations');
  });
});

describe('parseNlOntologyResult', () => {
  it('应解析合法 JSON 并保留全部匹配区', () => {
    const json = JSON.stringify({
      matchedEntities: [
        { elementId: 'e1', elementName: '采购订单', dimension: 'E1', confidence: 0.95, explanation: '语义对应' },
      ],
      matchedProperties: [
        { entityId: 'e1', attributeId: 'a1', attributeName: '采购订单.金额', confidence: 0.9 },
      ],
      matchedRelations: [
        { sourceEntityId: 'e1', targetEntityId: 'e2', relationName: '包含', type: 'one_to_many', confidence: 0.85 },
      ],
    });
    const result = parseNlOntologyResult(json);
    expect(result.matchedEntities).toHaveLength(1);
    expect(result.matchedEntities[0]).toMatchObject({
      elementId: 'e1',
      dimension: 'E1',
      confidence: 0.95,
    });
    expect(result.matchedProperties[0].attributeId).toBe('a1');
    expect(result.matchedRelations[0].type).toBe('one_to_many');
  });

  it('应把 0-100 的百分数置信度归一到 0-1', () => {
    const json = JSON.stringify({
      matchedEntities: [
        { elementId: 'e1', elementName: '采购订单', dimension: 'E1', confidence: 95, explanation: 'x' },
      ],
    });
    const result = parseNlOntologyResult(json);
    expect(result.matchedEntities[0].confidence).toBe(0.95);
  });

  it('缺失的匹配区应默认为空数组', () => {
    const result = parseNlOntologyResult('{}');
    expect(result.matchedEntities).toEqual([]);
    expect(result.matchedProperties).toEqual([]);
    expect(result.matchedRelations).toEqual([]);
  });

  it('非法 JSON 应抛 NlOntologyParseError', () => {
    expect(() => parseNlOntologyResult('not-json')).toThrow(NlOntologyParseError);
  });

  it('schema 校验失败应抛 NlOntologyParseError', () => {
    // dimension 非法
    const badDimension = JSON.stringify({
      matchedEntities: [
        { elementId: 'e1', elementName: 'x', dimension: 'E9', confidence: 0.5, explanation: 'x' },
      ],
    });
    expect(() => parseNlOntologyResult(badDimension)).toThrow(NlOntologyParseError);

    // confidence 越界
    const badConfidence = JSON.stringify({
      matchedEntities: [
        { elementId: 'e1', elementName: 'x', dimension: 'E1', confidence: 120, explanation: 'x' },
      ],
    });
    expect(() => parseNlOntologyResult(badConfidence)).toThrow(NlOntologyParseError);
  });
});
