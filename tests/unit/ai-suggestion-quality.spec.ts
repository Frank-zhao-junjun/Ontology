import { describe, expect, it } from 'vitest';
import {
  assessModelSuggestions,
  buildPersonalizationPrompt,
  resolvePersonalizationProfile,
} from '@/lib/ai/suggestion-quality';

describe('US-11.1 / AI suggestion quality & personalization', () => {
  it('空建议应给出错误并降低质量分', () => {
    const summary = assessModelSuggestions({});

    expect(summary.isValid).toBe(false);
    expect(summary.score).toBeLessThan(100);
    expect(summary.issues.some((issue) => issue.code === 'SUGGESTION_EMPTY')).toBe(true);
  });

  it('完整建议应得到较高质量分', () => {
    const summary = assessModelSuggestions({
      dataModel: {
        suggestedAttributes: [
          { name: '合同编号', nameEn: 'contractNo', type: 'string', description: '唯一编号' },
        ],
        suggestedRelations: [{ name: '关联订单' }],
      },
      behaviorModel: {
        suggestedStates: [{ name: '草稿', isInitial: true }, { name: '已生效', isFinal: true }],
        suggestedTransitions: [{ name: '提交' }],
      },
      ruleModel: { suggestedRules: [{ name: '编号必填' }] },
      eventModel: {
        suggestedEvents: [{ name: '合同已创建', nameEn: 'ContractCreated', trigger: 'create' }],
        suggestedSubscriptions: [{ name: '通知订阅' }],
      },
    });

    expect(summary.isValid).toBe(true);
    expect(summary.score).toBeGreaterThanOrEqual(80);
    expect(summary.suggestionCounts.attributes).toBe(1);
    expect(summary.suggestionCounts.events).toBe(1);
  });

  it('缺少英文名与初始态应产生质量告警', () => {
    const summary = assessModelSuggestions({
      dataModel: {
        suggestedAttributes: [{ name: '合同编号', type: 'string' }],
      },
      behaviorModel: {
        suggestedStates: [{ name: '审批中' }],
      },
      eventModel: {
        suggestedEvents: [{ name: '创建合同', trigger: 'create' }],
      },
    });

    expect(summary.issues.some((issue) => issue.code === 'ATTR_MISSING_NAME_EN')).toBe(true);
    expect(summary.issues.some((issue) => issue.code === 'BEHAVIOR_NO_INITIAL_STATE')).toBe(true);
    expect(summary.issues.some((issue) => issue.code === 'EVENT_NOT_PAST_TENSE')).toBe(true);
  });

  it('元数据对齐率低时应提示 METADATA_ALIGNMENT_LOW', () => {
    const summary = assessModelSuggestions(
      {
        dataModel: {
          suggestedAttributes: [
            { name: '自定义字段A', nameEn: 'customA', type: 'string', description: 'a' },
            { name: '自定义字段B', nameEn: 'customB', type: 'string', description: 'b' },
          ],
        },
      },
      { metadataNames: ['合同编号', 'ContractNo'] }
    );

    expect(summary.issues.some((issue) => issue.code === 'METADATA_ALIGNMENT_LOW')).toBe(true);
  });

  it('个性化偏好应生成可注入 prompt 的说明', () => {
    const profile = resolvePersonalizationProfile({
      focusAreas: ['data', 'event'],
      preferMetadataMatch: true,
      industryKeywords: ['合同审批', '供应链'],
    });
    const prompt = buildPersonalizationPrompt({
      focusAreas: ['data', 'event'],
      preferMetadataMatch: true,
      industryKeywords: ['合同审批', '供应链'],
    });

    expect(profile.focusAreas).toEqual(['data', 'event']);
    expect(profile.industryKeywords).toEqual(['合同审批', '供应链']);
    expect(prompt).toContain('数据模型');
    expect(prompt).toContain('事件模型');
    expect(prompt).toContain('合同审批');
    expect(prompt).toContain('元数据字典');
  });
});
