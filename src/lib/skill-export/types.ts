import type { OntologyProject } from '@/types/ontology';

export type SkillExportScope = 'all' | 'data' | 'behavior' | 'rule' | 'process' | 'event';

export interface SkillExportOptions {
  scope?: SkillExportScope;
  includeExamples?: boolean;
  includeSemanticLayer?: boolean;
}

export interface SkillZipEntry {
  name: string;
  content: string;
}

export interface SkillJson {
  name: string;
  nameEn: string;
  version: string;
  description: string;
  domain: string;
  exportedAt: string;
  source: {
    tool: string;
    url: string;
    projectId: string;
  };
  format: {
    type: 'ontology-model-skill';
    version: string;
  };
  files: {
    skill: string;
    ontology: string;
    intents: string;
    readme: string;
  };
  capabilities: string[];
}

export interface OntologyJson {
  metadata: {
    projectId: string;
    projectName: string;
    domain: string;
    description: string;
    exportedAt: string;
    scope: SkillExportScope;
    projectStatus: string;
    version: string;
    statusAnnotation: string;
  };
  dataModel?: unknown;
  behaviorModel?: unknown;
  ruleModel?: unknown;
  processModel?: unknown;
  eventModel?: unknown;
  organization?: unknown;
  agentSemanticLayer?: unknown;
}

export interface SkillExportContext {
  project: OntologyProject;
  options: Required<SkillExportOptions>;
  exportedAt: string;
  projectStatus: string;
  scopeLabel: string;
}
