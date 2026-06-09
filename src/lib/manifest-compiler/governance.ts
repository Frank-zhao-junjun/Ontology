import type { OntologyManifestGovernance } from '@/lib/manifest-validator';
import { ensureGovernanceModel } from '@/lib/ontology-layer-defaults';
import type { OntologyProject } from '@/types/ontology';

export function compileGovernance(project: OntologyProject): OntologyManifestGovernance {
  const governance = ensureGovernanceModel(project.governanceModel);

  return {
    roles: governance.roles.map((role) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions.map((permission) => ({
        objectTypeId: permission.objectTypeId,
        ops: permission.ops,
        denyActionIds: permission.denyActionIds ?? [],
      })),
    })),
    fieldPermissions: governance.fieldPermissions.map((fp) => ({
      objectTypeId: fp.objectTypeId,
      propertyNameEn: fp.propertyNameEn,
      allowedRoleIds: fp.allowedRoleIds,
    })),
    agentPolicies: governance.agentPolicies.map((policy) => ({
      id: policy.id,
      roleId: policy.roleId,
      manifestVersion: policy.manifestVersion,
      allowedMcpTools: policy.allowedMcpTools,
      allowedAggregateRootIds: policy.allowedAggregateRootIds,
      allowedActionIds: policy.allowedActionIds,
      defaultDeny: policy.defaultDeny,
    })),
    // G03: Data Masking Policies
    dataMaskingPolicies: (governance.dataMaskingPolicies || []).map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      strategy: p.strategy,
      fieldPaths: p.fieldPaths,
      allowedRoleIds: p.allowedRoleIds,
      description: p.description,
    })),
    // G05: Compliance Rules
    complianceRules: (governance.complianceRules || []).map((r) => ({
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      standard: r.standard,
      ruleRef: r.ruleRef,
      affectedObjectTypeIds: r.affectedObjectTypeIds,
      enforcement: r.enforcement,
      description: r.description,
    })),
  };
}
