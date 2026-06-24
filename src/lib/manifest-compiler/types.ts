import type { OntologyManifestMetadata } from '@/lib/manifest-validator';

export interface CompileManifestOptions {
  /** 覆盖 metadata.id（默认由 project.id 派生） */
  metadataId?: string;
  /** 覆盖 metadata.version（默认 dataModel.version 或 1.0.0） */
  version?: string;
  /** 固定编译时间（测试用） */
  compiledAt?: string;
  compiledBy?: string;
}

export type { OntologyManifestMetadata };
