import { collectManifestIds, type IdOccurrence } from './collect-ids';
import {
  SUPPORTED_API_VERSIONS,
  ONTOLOGY_MANIFEST_KIND,
  type ManifestValidationIssue,
  type OntologyManifest,
} from './types';
import {
  issue,
  isForbiddenCredentialKey,
  isLikelyPastTenseNameEn,
  isRecord,
  isValidSemver,
  walkObject,
} from './utils';

function aggregateRootIds(manifest: OntologyManifest): Set<string> {
  const ids = new Set<string>();
  for (const ot of manifest.spec?.semantic?.objectTypes ?? []) {
    if (ot.kind === 'aggregate_root') {
      ids.add(ot.id);
    }
  }
  return ids;
}

function ruleIds(manifest: OntologyManifest): Set<string> {
  return new Set((manifest.spec?.behavior?.rules ?? []).map((r) => r.id));
}

function domainEventIds(manifest: OntologyManifest): Set<string> {
  return new Set((manifest.spec?.events?.domainEvents ?? []).map((e) => e.id));
}

export function runManifestValidationRules(manifest: OntologyManifest): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];

  // V01
  if (!SUPPORTED_API_VERSIONS.includes(manifest.apiVersion as (typeof SUPPORTED_API_VERSIONS)[number])) {
    issues.push(
      issue({
        code: 'V01',
        elementType: 'OntologyManifest',
        field: 'apiVersion',
        message: `apiVersion 不受支持：${manifest.apiVersion}`,
      })
    );
  }

  if (manifest.kind !== ONTOLOGY_MANIFEST_KIND) {
    issues.push(
      issue({
        code: 'STRUCTURE',
        elementType: 'OntologyManifest',
        field: 'kind',
        message: `kind 必须为 ${ONTOLOGY_MANIFEST_KIND}`,
      })
    );
  }

  // V02
  const version = manifest.metadata?.version;
  if (typeof version !== 'string' || !isValidSemver(version)) {
    issues.push(
      issue({
        code: 'V02',
        elementType: 'metadata',
        id: manifest.metadata?.id,
        field: 'version',
        message: 'metadata.version 必须符合 semver（如 1.0.0）',
      })
    );
  }

  const roots = aggregateRootIds(manifest);
  const objectTypes = manifest.spec?.semantic?.objectTypes ?? [];

  // V03
  if (roots.size === 0) {
    issues.push(
      issue({
        code: 'V03',
        elementType: 'objectTypes',
        field: 'kind',
        message: '至少需要一个 kind 为 aggregate_root 的对象类型',
      })
    );
  }

  // V04
  for (const ot of objectTypes) {
    if (ot.kind !== 'entity') continue;
    const rootId = ot.aggregateRootId;
    if (!rootId || !roots.has(rootId)) {
      issues.push(
        issue({
          code: 'V04',
          elementType: 'objectType',
          id: ot.id,
          field: 'aggregateRootId',
          message: `entity 必须绑定存在的 aggregateRootId${rootId ? `（无效：${rootId}）` : ''}`,
        })
      );
    }
  }

  // V05
  for (const action of manifest.spec?.behavior?.actions ?? []) {
    if (!roots.has(action.aggregateRootId)) {
      issues.push(
        issue({
          code: 'V05',
          elementType: 'action',
          id: action.id,
          field: 'aggregateRootId',
          message: `action 必须绑定存在的 aggregateRootId（无效：${action.aggregateRootId}）`,
        })
      );
    }
  }

  const rules = ruleIds(manifest);
  const events = domainEventIds(manifest);

  // V06
  for (const action of manifest.spec?.behavior?.actions ?? []) {
    for (const ruleId of action.preRuleIds ?? []) {
      if (!rules.has(ruleId)) {
        issues.push(
          issue({
            code: 'V06',
            elementType: 'action',
            id: action.id,
            field: 'preRuleIds',
            message: `preRuleIds 引用了不存在的 rule：${ruleId}`,
          })
        );
      }
    }
  }

  // V07
  for (const action of manifest.spec?.behavior?.actions ?? []) {
    for (const eventId of action.publishesEventIds ?? []) {
      if (!events.has(eventId)) {
        issues.push(
          issue({
            code: 'V07',
            elementType: 'action',
            id: action.id,
            field: 'publishesEventIds',
            message: `publishesEventIds 引用了不存在的 domainEvent：${eventId}`,
          })
        );
      }
    }
  }

  // V08 (warning)
  for (const evt of manifest.spec?.events?.domainEvents ?? []) {
    if (!isLikelyPastTenseNameEn(evt.nameEn)) {
      issues.push(
        issue({
          code: 'V08',
          severity: 'warning',
          elementType: 'domainEvent',
          id: evt.id,
          field: 'nameEn',
          message: `领域事件 nameEn 建议使用过去式：${evt.nameEn}`,
        })
      );
    }
  }

  // V09
  for (const sm of manifest.spec?.semantic?.stateMachines ?? []) {
    const states = sm.states ?? [];
    const initialCount = states.filter((s) => s.isInitial === true).length;
    if (initialCount !== 1) {
      issues.push(
        issue({
          code: 'V09',
          elementType: 'stateMachine',
          id: sm.id,
          field: 'states.isInitial',
          message: `状态机必须有且仅有 1 个 isInitial: true（当前：${initialCount}）`,
        })
      );
    }
  }

  // V10
  walkObject(manifest, (key, path) => {
    if (!isForbiddenCredentialKey(key)) return;
    const pathStr = path.join('.');
    issues.push(
      issue({
        code: 'V10',
        elementType: 'OntologyManifest',
        field: pathStr ? `${pathStr}.${key}` : key,
        message: `禁止明文凭证字段 "${key}"，请使用 *SecretRef`,
      })
    );
  });

  if (isRecord(manifest.spec?.events?.eventStore)) {
    const store = manifest.spec!.events!.eventStore!;
    for (const key of Object.keys(store)) {
      if (isForbiddenCredentialKey(key)) {
        issues.push(
          issue({
            code: 'V10',
            elementType: 'eventStore',
            field: key,
            message: `eventStore 禁止明文凭证字段 "${key}"`,
          })
        );
      }
    }
  }

  // V11
  const occurrences = collectManifestIds(manifest);
  const seen = new Map<string, IdOccurrence>();
  for (const occ of occurrences) {
    const prev = seen.get(occ.id);
    if (prev) {
      issues.push(
        issue({
          code: 'V11',
          elementType: occ.elementType,
          id: occ.id,
          field: 'id',
          message: `id 重复：${occ.id}（${prev.elementType} 与 ${occ.elementType}）`,
        })
      );
    } else {
      seen.set(occ.id, occ);
    }
  }

  // ── V12: Governance referential integrity ──
  const gov = manifest.spec?.governance;
  if (gov) {
    const roleIds = new Set((gov.roles ?? []).map((r) => r.id));
    const actionIds = new Set((manifest.spec?.behavior?.actions ?? []).map((a) => a.id));

    // V12a: fieldPermission allowedRoleIds must reference existing roles
    for (const fp of gov.fieldPermissions ?? []) {
      for (const roleId of fp.allowedRoleIds ?? []) {
        if (!roleIds.has(roleId)) {
          issues.push(
            issue({
              code: 'V12',
              severity: 'warning',
              elementType: 'fieldPermission',
              field: 'allowedRoleIds',
              message: `fieldPermission 引用了不存在的 roleId：${roleId}`,
            })
          );
        }
      }
    }

    // V12b: agentPolicy roleId must reference existing role
    for (const ap of gov.agentPolicies ?? []) {
      if (ap.roleId && !roleIds.has(ap.roleId)) {
        issues.push(
          issue({
            code: 'V12',
            elementType: 'agentPolicy',
            id: ap.id,
            field: 'roleId',
            message: `agentPolicy 引用了不存在的 roleId：${ap.roleId}`,
          })
        );
      }
      // V12c: agentPolicy allowedActionIds must reference existing actions
      for (const actId of ap.allowedActionIds ?? []) {
        if (!actionIds.has(actId)) {
          issues.push(
            issue({
              code: 'V12',
              severity: 'warning',
              elementType: 'agentPolicy',
              id: ap.id,
              field: 'allowedActionIds',
              message: `agentPolicy 引用了不存在的 actionId：${actId}`,
            })
          );
        }
      }
    }
  }

  // ── V13: Event referential integrity ──
  const allActionIds = new Set((manifest.spec?.behavior?.actions ?? []).map((a) => a.id));
  for (const handler of manifest.spec?.events?.handlers ?? []) {
    // V13a: handler eventId must reference existing domainEvent
    if (handler.eventId && !events.has(handler.eventId)) {
      issues.push(
        issue({
          code: 'V13',
          elementType: 'handler',
          id: handler.id,
          field: 'eventId',
          message: `handler 引用了不存在的 domainEvent：${handler.eventId}`,
        })
      );
    }
    // V13b: handler actionRef must reference existing action
    if (handler.actionRef && !allActionIds.has(handler.actionRef)) {
      issues.push(
        issue({
          code: 'V13',
          severity: 'warning',
          elementType: 'handler',
          id: handler.id,
          field: 'actionRef',
          message: `handler 引用了不存在的 action：${handler.actionRef}`,
        })
      );
    }
  }
  // V13c: domainEvent aggregateRootId must reference existing aggregate root
  for (const evt of manifest.spec?.events?.domainEvents ?? []) {
    if (evt.aggregateRootId && !roots.has(evt.aggregateRootId)) {
      issues.push(
        issue({
          code: 'V13',
          elementType: 'domainEvent',
          id: evt.id,
          field: 'aggregateRootId',
          message: `domainEvent 引用了不存在的 aggregateRootId：${evt.aggregateRootId}`,
        })
      );
    }
  }

  // ── V14: Data source constraints ──
  const objectTypeIds = new Set(objectTypes.map((ot) => ot.id));
  for (const ds of manifest.spec?.dataSources ?? []) {
    if (!isRecord(ds)) continue;
    // V14a: boundObjectTypeId must reference existing objectType
    if (ds.boundObjectTypeId && !objectTypeIds.has(ds.boundObjectTypeId as string)) {
      issues.push(
        issue({
          code: 'V14',
          severity: 'warning',
          elementType: 'dataSource',
          field: 'boundObjectTypeId',
          message: `dataSource 引用了不存在的 boundObjectTypeId：${String(ds.boundObjectTypeId)}`,
        })
      );
    }
    // V14b: API-type sources must have authSecretRef
    if (ds.type === 'api' && isRecord(ds.api) && !ds.api.authSecretRef) {
      issues.push(
        issue({
          code: 'V14',
          elementType: 'dataSource',
          field: 'api.authSecretRef',
          message: `API 类型 dataSource 必须配置 authSecretRef`,
        })
      );
    }
  }

  return issues;
}
