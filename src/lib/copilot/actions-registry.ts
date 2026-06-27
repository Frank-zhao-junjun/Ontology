/** Copilot Actions 白名单 — MVP 不含任何 delete* 操作 */
export const ALLOWED_ACTION_NAMES = [
  // 只读上下文
  'getProjectSummary',
  'getModuleDetail',
  'getElementLibrarySummary',
  'getReferenceDocuments',
  'getSelectedNode',
  // 写入
  'createValueDomain',
  'createCapability',
  'createScenario',
  'createEpcProcess',
  'updateModuleDraft',
  'generateEpcStepsFromText',
  'generateElementsFromText',
  'analyzeDocumentAndModel',
  'uploadReferenceDocument',
] as const;

export type AllowedActionName = (typeof ALLOWED_ACTION_NAMES)[number];
