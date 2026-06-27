import { describe, expect, it } from 'vitest';
import {
  buildChainDocPrompt,
  parseChainDoc,
  ChainDocParseError,
} from '@/lib/copilot/chain-doc-prompt';

describe('buildChainDocPrompt', () => {
  it('includes domain and existing value domain names in system prompt', () => {
    const { system, user } = buildChainDocPrompt('SOP 文档正文', {
      domain: '离散制造',
      existingValueDomainNames: ['生产域', '供应链'],
    });

    expect(system).toContain('离散制造');
    expect(system).toContain('生产域');
    expect(system).toContain('供应链');
    expect(user).toBe('SOP 文档正文');
  });

  it('shows placeholder when no existing value domains', () => {
    const { system } = buildChainDocPrompt('doc', {
      domain: '',
      existingValueDomainNames: [],
    });

    expect(system).toContain('(暂无)');
    expect(system).toContain('(未指定)');
  });

  it('embeds JSON schema hint in system prompt', () => {
    const { system } = buildChainDocPrompt('x', {
      domain: '测试',
      existingValueDomainNames: [],
    });

    expect(system).toContain('valueDomains');
    expect(system).toContain('capabilities');
    expect(system).toContain('epcProcesses');
  });
});

describe('parseChainDoc', () => {
  const validJson = JSON.stringify({
    valueDomains: [
      {
        name: '供应链',
        nameEn: 'SupplyChain',
        capabilities: [
          {
            name: '采购能力',
            scenarios: [{ name: '收货场景', epcProcesses: [{ name: '收货流程' }] }],
          },
        ],
      },
    ],
  });

  it('parses valid nested chain JSON', () => {
    const result = parseChainDoc(validJson);
    expect(result.valueDomains).toHaveLength(1);
    expect(result.valueDomains[0].name).toBe('供应链');
    expect(result.valueDomains[0].capabilities?.[0].scenarios?.[0].epcProcesses?.[0].name).toBe(
      '收货流程',
    );
  });

  it('throws ChainDocParseError on empty output', () => {
    expect(() => parseChainDoc('   ')).toThrow(ChainDocParseError);
    expect(() => parseChainDoc('   ')).toThrow('LLM 输出为空');
  });

  it('throws ChainDocParseError on invalid JSON', () => {
    expect(() => parseChainDoc('{ not json')).toThrow(ChainDocParseError);
    expect(() => parseChainDoc('{ not json')).toThrow('不是合法 JSON');
  });

  it('throws ChainDocParseError when valueDomains missing', () => {
    expect(() => parseChainDoc(JSON.stringify({ foo: 1 }))).toThrow(ChainDocParseError);
    expect(() => parseChainDoc(JSON.stringify({ foo: 1 }))).toThrow('Schema 校验失败');
  });

  it('accepts minimal single value domain without nested children', () => {
    const result = parseChainDoc(
      JSON.stringify({ valueDomains: [{ name: '财务域', nameEn: 'Finance' }] }),
    );
    expect(result.valueDomains[0].nameEn).toBe('Finance');
    expect(result.valueDomains[0].capabilities).toBeUndefined();
  });
});
