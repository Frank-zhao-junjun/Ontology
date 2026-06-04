export type ModelSuggestionFocusArea = 'data' | 'behavior' | 'rule' | 'event';

export interface ModelSuggestionPersonalization {
  focusAreas?: ModelSuggestionFocusArea[];
  preferMetadataMatch?: boolean;
  industryKeywords?: string[];
}

export interface ModelSuggestionQualityIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ModelSuggestionQualitySummary {
  isValid: boolean;
  score: number;
  issues: ModelSuggestionQualityIssue[];
  validatedAt: string;
  suggestionCounts: {
    attributes: number;
    relations: number;
    states: number;
    transitions: number;
    rules: number;
    events: number;
    subscriptions: number;
  };
}

export interface ModelSuggestionPersonalizationProfile {
  focusAreas: ModelSuggestionFocusArea[];
  preferMetadataMatch: boolean;
  industryKeywords: string[];
  promptAddendum: string;
}

export interface ModelSuggestionsPayload {
  dataModel?: {
    suggestedAttributes?: Array<{ name?: string; nameEn?: string; type?: string; description?: string }>;
    suggestedRelations?: Array<{ name?: string }>;
  };
  behaviorModel?: {
    suggestedStates?: Array<{ name?: string; isInitial?: boolean; isFinal?: boolean }>;
    suggestedTransitions?: Array<{ name?: string }>;
  };
  ruleModel?: {
    suggestedRules?: Array<{ name?: string }>;
  };
  eventModel?: {
    suggestedEvents?: Array<{ name?: string; nameEn?: string; trigger?: string }>;
    suggestedSubscriptions?: Array<{ name?: string }>;
  };
}

const FOCUS_LABELS: Record<ModelSuggestionFocusArea, string> = {
  data: '数据模型（属性与关系）',
  behavior: '行为模型（状态机与转换）',
  rule: '规则模型（字段与业务约束）',
  event: '事件模型（领域事件与订阅）',
};

const PAST_TENSE_SUFFIXES = ['已', '完成', 'ed', 'Created', 'Updated', 'Deleted', 'Changed'];

function countSuggestions(data: ModelSuggestionsPayload): ModelSuggestionQualitySummary['suggestionCounts'] {
  return {
    attributes: data.dataModel?.suggestedAttributes?.length ?? 0,
    relations: data.dataModel?.suggestedRelations?.length ?? 0,
    states: data.behaviorModel?.suggestedStates?.length ?? 0,
    transitions: data.behaviorModel?.suggestedTransitions?.length ?? 0,
    rules: data.ruleModel?.suggestedRules?.length ?? 0,
    events: data.eventModel?.suggestedEvents?.length ?? 0,
    subscriptions: data.eventModel?.suggestedSubscriptions?.length ?? 0,
  };
}

function totalSuggestionCount(counts: ModelSuggestionQualitySummary['suggestionCounts']): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function isPastTenseEventName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  return PAST_TENSE_SUFFIXES.some((suffix) => trimmed.endsWith(suffix));
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function buildPersonalizationPrompt(
  personalization?: ModelSuggestionPersonalization | null
): string {
  const profile = resolvePersonalizationProfile(personalization);
  return profile.promptAddendum;
}

export function resolvePersonalizationProfile(
  personalization?: ModelSuggestionPersonalization | null
): ModelSuggestionPersonalizationProfile {
  const focusAreas =
    personalization?.focusAreas?.length
      ? [...new Set(personalization.focusAreas)]
      : (['data', 'behavior', 'rule', 'event'] as ModelSuggestionFocusArea[]);

  const preferMetadataMatch = personalization?.preferMetadataMatch ?? true;
  const industryKeywords = (personalization?.industryKeywords ?? [])
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const sections: string[] = [
    '## 个性化生成偏好',
    `请优先完善以下模型维度：${focusAreas.map((area) => FOCUS_LABELS[area]).join('、')}。`,
  ];

  if (preferMetadataMatch) {
    sections.push('属性命名与类型请尽量对齐可用元数据字典，减少同义异名字段。');
  }

  if (industryKeywords.length > 0) {
    sections.push(`结合以下业务关键词组织建议：${industryKeywords.join('、')}。`);
  }

  return {
    focusAreas,
    preferMetadataMatch,
    industryKeywords,
    promptAddendum: sections.join('\n'),
  };
}

export function assessModelSuggestions(
  data: ModelSuggestionsPayload,
  context?: {
    metadataNames?: string[];
    existingAttributeCount?: number;
  }
): ModelSuggestionQualitySummary {
  const issues: ModelSuggestionQualityIssue[] = [];
  const counts = countSuggestions(data);

  if (totalSuggestionCount(counts) === 0) {
    issues.push({
      code: 'SUGGESTION_EMPTY',
      severity: 'error',
      message: '未生成任何模型建议，请调整实体描述或个性化偏好后重试。',
    });
  }

  const attributes = data.dataModel?.suggestedAttributes ?? [];
  if (attributes.length > 0) {
    const missingNameEn = attributes.filter((attr) => !attr.nameEn?.trim());
    if (missingNameEn.length > 0) {
      issues.push({
        code: 'ATTR_MISSING_NAME_EN',
        severity: 'warning',
        message: `有 ${missingNameEn.length} 个建议属性缺少英文名。`,
      });
    }

    const missingDescription = attributes.filter((attr) => !attr.description?.trim());
    if (missingDescription.length > 0) {
      issues.push({
        code: 'ATTR_NO_DESCRIPTION',
        severity: 'info',
        message: `有 ${missingDescription.length} 个建议属性缺少说明，应用前建议补充业务语义。`,
      });
    }

    const seen = new Set<string>();
    for (const attr of attributes) {
      const key = normalizeToken(attr.name || '');
      if (!key) continue;
      if (seen.has(key)) {
        issues.push({
          code: 'ATTR_DUPLICATE_NAME',
          severity: 'warning',
          message: `建议属性存在重复名称「${attr.name}」。`,
        });
        break;
      }
      seen.add(key);
    }
  } else if ((context?.existingAttributeCount ?? 0) === 0) {
    issues.push({
      code: 'ATTR_SUGGESTION_MISSING',
      severity: 'warning',
      message: '实体尚无属性，建议至少生成 1 个核心属性。',
    });
  }

  const metadataNames = (context?.metadataNames ?? []).map(normalizeToken).filter(Boolean);
  if (metadataNames.length > 0 && attributes.length > 0) {
    const matched = attributes.filter((attr) =>
      metadataNames.includes(normalizeToken(attr.name || ''))
        || metadataNames.includes(normalizeToken(attr.nameEn || ''))
    ).length;
    const ratio = matched / attributes.length;
    if (ratio < 0.5) {
      issues.push({
        code: 'METADATA_ALIGNMENT_LOW',
        severity: 'warning',
        message: `仅 ${Math.round(ratio * 100)}% 的建议属性与元数据字典对齐，建议开启「优先匹配元数据」。`,
      });
    }
  }

  const states = data.behaviorModel?.suggestedStates ?? [];
  if (states.length > 0 && !states.some((state) => state.isInitial)) {
    issues.push({
      code: 'BEHAVIOR_NO_INITIAL_STATE',
      severity: 'warning',
      message: '建议状态机缺少初始态，请补充 isInitial=true 的状态。',
    });
  }

  const events = data.eventModel?.suggestedEvents ?? [];
  for (const event of events) {
    const label = event.nameEn || event.name || '';
    if (label && !isPastTenseEventName(label)) {
      issues.push({
        code: 'EVENT_NOT_PAST_TENSE',
        severity: 'warning',
        message: `事件「${label}」建议使用过去式命名（如 ContractCreated）。`,
      });
      break;
    }
  }

  return {
    isValid: issues.every((issue) => issue.severity !== 'error'),
    score: Math.max(0, 100 - issues.length * 10),
    issues,
    validatedAt: new Date().toISOString(),
    suggestionCounts: counts,
  };
}
