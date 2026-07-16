import type { OntologyProject } from '@/types/ontology';
import type { OntologyJson, SkillExportScope } from './types';
import { resolveProjectStatus, annotateArrayStatus } from './annotate-status';

export interface BuildOntologyJsonOptions {
  scope: SkillExportScope;
  includeSemanticLayer: boolean;
  exportedAt: string;
  version: string;
}

export function buildOntologyJson(
  project: OntologyProject,
  options: BuildOntologyJsonOptions
): OntologyJson {
  const { scope, includeSemanticLayer, exportedAt, version } = options;
  const projectStatus = resolveProjectStatus(project);

  const statusAnnotation =
    projectStatus === 'confirmed'
      ? '本 Skill 从 confirmed 状态项目导出，对象已确认可放心使用'
      : `本 Skill 由 ${projectStatus} 状态项目导出，部分对象可能尚未确认`;

  const metadata: OntologyJson['metadata'] = {
    projectId: project.id,
    projectName: project.name,
    domain: typeof project.domain === 'string' ? project.domain : project.domain?.name || '',
    description: project.description || '',
    exportedAt,
    scope,
    projectStatus,
    version,
    statusAnnotation,
  };

  const result: OntologyJson = { metadata };

  if (scope === 'all' || scope === 'data') {
    const dataModel = project.dataModel;
    if (dataModel) {
      result.dataModel = {
        ...dataModel,
        entities: annotateArrayStatus(dataModel.entities).map((entity) => ({
          ...entity,
          attributes: annotateArrayStatus(entity.attributes),
          relations: annotateArrayStatus(entity.relations),
        })),
      };
    }
  }

  if (scope === 'all' || scope === 'behavior') {
    const behaviorModel = project.behaviorModel;
    if (behaviorModel) {
      result.behaviorModel = {
        ...behaviorModel,
        stateMachines: annotateArrayStatus(behaviorModel.stateMachines),
        actions: annotateArrayStatus(behaviorModel.actions),
        functions: annotateArrayStatus(behaviorModel.functions),
        transactionBoundaries: annotateArrayStatus(behaviorModel.transactionBoundaries),
      };
    }
  }

  if (scope === 'all' || scope === 'rule') {
    const ruleModel = project.ruleModel;
    if (ruleModel) {
      result.ruleModel = {
        ...ruleModel,
        rules: annotateArrayStatus(ruleModel.rules),
      };
    }
  }

  if (scope === 'all' || scope === 'process') {
    const processModel = project.processModel;
    if (processModel) {
      result.processModel = {
        ...processModel,
        orchestrations: annotateArrayStatus(processModel.orchestrations),
      };
    }
  }

  if (scope === 'all' || scope === 'event') {
    const eventModel = project.eventModel;
    if (eventModel) {
      result.eventModel = {
        ...eventModel,
        events: annotateArrayStatus(eventModel.events),
        subscriptions: annotateArrayStatus(eventModel.subscriptions),
      };
    }
  }

  if (scope === 'all' && project.organizationModel) {
    result.organization = {
      departments: annotateArrayStatus(project.organizationModel.departments),
      positions: annotateArrayStatus(project.organizationModel.positions),
    };
  }

  if (scope === 'all' && includeSemanticLayer && project.agentSemanticLayer) {
    result.agentSemanticLayer = project.agentSemanticLayer;
  }

  return result;
}

export function isEmptyScope(ontologyJson: OntologyJson): boolean {
  const modelKeys: (keyof OntologyJson)[] = [
    'dataModel',
    'behaviorModel',
    'ruleModel',
    'processModel',
    'eventModel',
    'organization',
    'agentSemanticLayer',
  ];
  return modelKeys.every((key) => {
    const value = ontologyJson[key];
    if (!value || typeof value !== 'object') return true;
    return Object.keys(value).length === 0;
  });
}
