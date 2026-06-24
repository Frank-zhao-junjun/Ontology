// 代码生成器类型定义

import type { DataModel, BehaviorModel, RuleModel, ProcessModel, EventModel, PublishConfig } from '@/types/ontology';

export interface CodePackage {
  name: string;
  version: string;
  files: GeneratedFile[];
  generatedAt: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: 'python' | 'typescript' | 'javascript' | 'sql' | 'yaml' | 'json' | 'markdown' | 'dockerfile' | 'text';
}

export interface GeneratorContext {
  projectName: string;
  projectNameEn: string;
  version: string;
  domain: string;
  dataModel: DataModel | null;
  behaviorModel: BehaviorModel | null;
  ruleModel: RuleModel | null;
  processModel: ProcessModel | null;
  eventModel: EventModel | null;
  config: PublishConfig;
}

export interface SQLAlchemyColumn {
  name: string;
  nameEn: string;
  type: string;
  nullable: boolean;
  unique: boolean;
  default?: string;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface FlaskRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  description: string;
}

export interface ReactComponent {
  name: string;
  type: 'list' | 'form' | 'detail' | 'flowchart' | 'erdiagram';
  entityType: string;
}

// 类型映射：Ontology类型 -> SQLAlchemy类型
export const TYPE_MAPPING: Record<string, string> = {
  'string': 'String(255)',
  'text': 'Text',
  'integer': 'Integer',
  'decimal': 'Numeric(18, 4)',
  'boolean': 'Boolean',
  'date': 'Date',
  'datetime': 'DateTime',
  'enum': 'String(50)',
  'reference': 'Integer',  // 外键引用
  'json': 'JSON',
};

// 类型映射：Ontology类型 -> TypeScript类型
export const TS_TYPE_MAPPING: Record<string, string> = {
  'string': 'string',
  'text': 'string',
  'integer': 'number',
  'decimal': 'number',
  'boolean': 'boolean',
  'date': 'string',
  'datetime': 'string',
  'enum': 'string',
  'reference': 'number',
  'json': 'Record<string, unknown>',
};
