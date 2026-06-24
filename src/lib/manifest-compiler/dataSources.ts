import { ensureDataSourcesModel } from '@/lib/ontology-layer-defaults';
import type { OntologyProject } from '@/types/ontology';

/** 编译 spec.dataSources；仅输出 authSecretRef，不写明文凭证（V10） */
export function compileDataSources(project: OntologyProject): Array<Record<string, unknown>> {
  const model = ensureDataSourcesModel(project.dataSourcesModel);

  return model.sources.map((source) => {
    const entry: Record<string, unknown> = {
      id: source.id,
      name: source.name,
      type: source.type,
    };

    if (source.boundObjectTypeId) {
      entry.boundObjectTypeId = source.boundObjectTypeId;
    }

    if (source.api?.authSecretRef?.trim()) {
      entry.api = {
        ...(source.api.baseUrl ? { baseUrl: source.api.baseUrl } : {}),
        ...(source.api.entitySet ? { entitySet: source.api.entitySet } : {}),
        authSecretRef: source.api.authSecretRef.trim(),
      };
    }

    return entry;
  });
}
