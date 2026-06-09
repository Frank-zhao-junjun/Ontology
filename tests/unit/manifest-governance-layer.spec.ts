import { describe, it, expect } from 'vitest';
import { compileGovernance } from '@/lib/manifest-compiler/governance';
import type { OntologyProject } from '@/types/ontology';

const baseGovernanceProject: OntologyProject = {
  id: 'p-gov',
  name: 'governance-golden-test',
  domain: { id: 'd1', name: '金融域', nameEn: 'finance', description: '金融领域' },
  dataModel: null as any,
  behaviorModel: null as any,
  ruleModel: null as any,
  processModel: null as any,
  eventModel: null as any,
  governanceModel: null as any,
  dataSourcesModel: null as any,
  metricsModel: null as any,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('compileGovernance golden test — G03/G05 layers', () => {
  describe('G03 — DataMaskingPolicies', () => {
    it('should map data masking policies to manifest format', () => {
      const project: OntologyProject = {
        ...baseGovernanceProject,
        governanceModel: {
          id: 'gov-1',
          roles: [],
          fieldPermissions: [],
          agentPolicies: [],
          dataMaskingPolicies: [
            {
              id: 'dmp-1',
              name: '手机号脱敏',
              nameEn: 'phone-masking',
              strategy: 'mask',
              fieldPaths: ['user.phone', 'customer.mobile'],
              allowedRoleIds: ['role-admin', 'role-compliance'],
              description: '对手机号进行部分遮蔽',
            },
            {
              id: 'dmp-2',
              name: '银行卡号哈希',
              strategy: 'hash',
              fieldPaths: ['payment.cardNumber'],
              allowedRoleIds: [],
            },
          ],
          complianceRules: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileGovernance(project);
      expect(result.dataMaskingPolicies).toHaveLength(2);
      expect(result.dataMaskingPolicies![0]).toMatchObject({
        id: 'dmp-1',
        name: '手机号脱敏',
        nameEn: 'phone-masking',
        strategy: 'mask',
        fieldPaths: ['user.phone', 'customer.mobile'],
        allowedRoleIds: ['role-admin', 'role-compliance'],
      });
      expect(result.dataMaskingPolicies![1]).toMatchObject({
        id: 'dmp-2',
        strategy: 'hash',
        fieldPaths: ['payment.cardNumber'],
      });
    });

    it('should return empty array when no masking policies', () => {
      const project: OntologyProject = {
        ...baseGovernanceProject,
        governanceModel: {
          id: 'gov-1',
          roles: [],
          fieldPermissions: [],
          agentPolicies: [],
          dataMaskingPolicies: [],
          complianceRules: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileGovernance(project);
      expect(result.dataMaskingPolicies).toEqual([]);
    });
  });

  describe('G05 — ComplianceRules', () => {
    it('should map compliance rules to manifest format', () => {
      const project: OntologyProject = {
        ...baseGovernanceProject,
        governanceModel: {
          id: 'gov-1',
          roles: [],
          fieldPermissions: [],
          agentPolicies: [],
          dataMaskingPolicies: [],
          complianceRules: [
            {
              id: 'cr-1',
              name: '数据删除权',
              nameEn: 'right-to-erasure',
              standard: 'GDPR',
              ruleRef: 'GDPR Art.17',
              affectedObjectTypeIds: ['user', 'order'],
              enforcement: 'mandatory',
              description: '用户有权要求删除其个人数据',
            },
            {
              id: 'cr-2',
              name: '金融数据保留',
              standard: 'PCI-DSS',
              ruleRef: 'PCI-DSS Req.3.4',
              affectedObjectTypeIds: ['payment'],
              enforcement: 'mandatory',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileGovernance(project);
      expect(result.complianceRules).toHaveLength(2);
      expect(result.complianceRules![0]).toMatchObject({
        id: 'cr-1',
        name: '数据删除权',
        standard: 'GDPR',
        ruleRef: 'GDPR Art.17',
        affectedObjectTypeIds: ['user', 'order'],
        enforcement: 'mandatory',
      });
      expect(result.complianceRules![1]).toMatchObject({
        id: 'cr-2',
        standard: 'PCI-DSS',
        enforcement: 'mandatory',
      });
    });
  });

  describe('Full golden — existing G01/G02/G04 + new G03/G05', () => {
    it('should produce complete governance manifest with all layers', () => {
      const project: OntologyProject = {
        ...baseGovernanceProject,
        governanceModel: {
          id: 'gov-1',
          roles: [{ id: 'role-admin', name: '管理员', permissions: [] }],
          fieldPermissions: [
            { objectTypeId: 'user', propertyNameEn: 'email', allowedRoleIds: ['role-admin'] },
          ],
          agentPolicies: [
            {
              id: 'policy-1',
              roleId: 'role-admin',
              defaultDeny: false,
            },
          ],
          dataMaskingPolicies: [
            {
              id: 'dmp-1',
              name: '个人信息脱敏',
              strategy: 'mask',
              fieldPaths: ['user.phone'],
              allowedRoleIds: ['role-admin'],
            },
          ],
          complianceRules: [
            {
              id: 'cr-1',
              name: '个保法数据保护',
              standard: 'GB/T35273',
              ruleRef: 'GB/T 35273-2020 第6条',
              affectedObjectTypeIds: ['user'],
              enforcement: 'mandatory',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileGovernance(project);

      // G01: roles
      expect(result.roles).toHaveLength(1);
      expect(result.roles![0].name).toBe('管理员');

      // G02: fieldPermissions
      expect(result.fieldPermissions).toHaveLength(1);

      // G04: agentPolicies
      expect(result.agentPolicies).toHaveLength(1);

      // G03: dataMaskingPolicies
      expect(result.dataMaskingPolicies![0].strategy).toBe('mask');

      // G05: complianceRules
      expect(result.complianceRules![0].standard).toBe('GB/T35273');
      expect(result.complianceRules![0].enforcement).toBe('mandatory');
    });
  });
});
