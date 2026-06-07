import { describe, it, expectTypeOf } from 'vitest';
import type { DataMaskingPolicy, ComplianceRule, GovernanceModel } from '@/types/ontology';

describe('G03 DataMaskingPolicy types', () => {
  it('DataMaskingPolicy has required fields', () => {
    const policy: DataMaskingPolicy = {
      id: 'dmp-1',
      name: '手机号脱敏',
      strategy: 'mask',
      fieldPaths: ['user.phone', 'order.contactPhone'],
      allowedRoleIds: ['role-admin'],
    };
    expectTypeOf(policy.id).toBeString();
    expectTypeOf(policy.strategy).toMatchTypeOf<'hash' | 'mask' | 'redact' | 'tokenize'>();
    expectTypeOf(policy.fieldPaths).toMatchTypeOf<string[]>();
    expectTypeOf(policy.allowedRoleIds).toMatchTypeOf<string[]>();
  });

  it('DataMaskingPolicy strategy is restricted union', () => {
    expectTypeOf<DataMaskingPolicy['strategy']>().toMatchTypeOf<'hash' | 'mask' | 'redact' | 'tokenize'>();
    // @ts-expect-error — 'blur' is not a valid strategy
    const _: DataMaskingPolicy['strategy'] = 'blur';
  });

  it('DataMaskingPolicy nameEn and description are optional', () => {
    const policy: DataMaskingPolicy = {
      id: 'dmp-2',
      name: '身份证脱敏',
      nameEn: 'id-card-masking',
      strategy: 'redact',
      fieldPaths: ['user.idCard'],
      allowedRoleIds: [],
      description: '对身份证号进行完全遮蔽',
    };
    expectTypeOf(policy.nameEn).toMatchTypeOf<string | undefined>();
    expectTypeOf(policy.description).toMatchTypeOf<string | undefined>();
  });
});

describe('G05 ComplianceRule types', () => {
  it('ComplianceRule has required fields', () => {
    const rule: ComplianceRule = {
      id: 'cr-1',
      name: '数据删除权',
      standard: 'GDPR',
      ruleRef: 'GDPR Art.17',
      affectedObjectTypeIds: ['user', 'order'],
      enforcement: 'mandatory',
    };
    expectTypeOf(rule.id).toBeString();
    expectTypeOf(rule.standard).toMatchTypeOf<'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI-DSS' | 'GB/T35273' | 'custom'>();
    expectTypeOf(rule.enforcement).toMatchTypeOf<'mandatory' | 'advisory'>();
    expectTypeOf(rule.affectedObjectTypeIds).toMatchTypeOf<string[]>();
  });

  it('ComplianceRule standard is restricted union', () => {
    expectTypeOf<ComplianceRule['standard']>().toMatchTypeOf<'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI-DSS' | 'GB/T35273' | 'custom'>();
    // @ts-expect-error — 'SOX' is not a valid standard
    const _: ComplianceRule['standard'] = 'SOX';
  });

  it('ComplianceRule nameEn and description are optional', () => {
    const rule: ComplianceRule = {
      id: 'cr-2',
      name: '数据可移植',
      nameEn: 'data-portability',
      standard: 'GDPR',
      ruleRef: 'GDPR Art.20',
      affectedObjectTypeIds: ['user'],
      enforcement: 'advisory',
      description: '允许用户导出其数据',
    };
    expectTypeOf(rule.nameEn).toMatchTypeOf<string | undefined>();
    expectTypeOf(rule.description).toMatchTypeOf<string | undefined>();
  });
});

describe('G03+G05 GovernanceModel extended fields', () => {
  it('GovernanceModel includes dataMaskingPolicies', () => {
    expectTypeOf<GovernanceModel['dataMaskingPolicies']>().toMatchTypeOf<DataMaskingPolicy[]>();
  });

  it('GovernanceModel includes complianceRules', () => {
    expectTypeOf<GovernanceModel['complianceRules']>().toMatchTypeOf<ComplianceRule[]>();
  });
});
