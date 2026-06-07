/**
 * S09/S10 语义层类型形状测试
 *
 * - UT-SEMANTIC-TYPE-01: OntologyEnumDef 字段完整
 * - UT-SEMANTIC-TYPE-02: OntologyEnumValue 字段完整
 * - UT-SEMANTIC-TYPE-03: EnumCombinationPolicy 枚举值正确
 * - UT-SEMANTIC-TYPE-04: EntityRole 包含 value_object
 * - UT-SEMANTIC-TYPE-05: ManifestValueObject 字段完整
 * - UT-SEMANTIC-TYPE-06: ManifestEnumDef 字段完整
 * - UT-SEMANTIC-TYPE-07: ManifestEnumValue 字段完整
 * - UT-SEMANTIC-TYPE-08: OntologyManifestSemantic 包含 enumDefs
 */

import { describe, it, expect } from 'vitest';
import type {
  OntologyEnumDef,
  OntologyEnumValue,
  EnumCombinationPolicy,
  EntityRole,
} from '@/types/ontology';
import type {
  ManifestValueObject,
  ManifestEnumDef,
  ManifestEnumValue,
  OntologyManifestSemantic,
} from '@/lib/manifest-validator';

describe('S09/S10 Semantic Layer Type Shape', () => {
  describe('UT-SEMANTIC-TYPE-01: OntologyEnumDef', () => {
    it('should have all required fields', () => {
      const def: OntologyEnumDef = {
        id: 'enum-1',
        name: '合同状态',
        nameEn: 'ContractStatus',
        combinationPolicy: 'single',
        values: [],
        description: '合同状态枚举',
      };
      expect(def.id).toBe('enum-1');
      expect(def.name).toBe('合同状态');
      expect(def.nameEn).toBe('ContractStatus');
      expect(def.combinationPolicy).toBe('single');
      expect(def.values).toEqual([]);
      expect(def.description).toBe('合同状态枚举');
    });
  });

  describe('UT-SEMANTIC-TYPE-02: OntologyEnumValue', () => {
    it('should have all required fields', () => {
      const val: OntologyEnumValue = {
        code: 'PENDING',
        label: '待处理',
        labelEn: 'Pending',
        description: '等待处理',
        isDefault: true,
      };
      expect(val.code).toBe('PENDING');
      expect(val.label).toBe('待处理');
      expect(val.labelEn).toBe('Pending');
      expect(val.description).toBe('等待处理');
      expect(val.isDefault).toBe(true);
    });
  });

  describe('UT-SEMANTIC-TYPE-03: EnumCombinationPolicy', () => {
    it('should accept valid combination policies', () => {
      const policies: EnumCombinationPolicy[] = ['single', 'multi', 'ordered'];
      policies.forEach((p) => {
        const def: OntologyEnumDef = {
          id: `enum-${p}`,
          name: p,
          nameEn: p,
          combinationPolicy: p,
          values: [],
        };
        expect(def.combinationPolicy).toBe(p);
      });
    });
  });

  describe('UT-SEMANTIC-TYPE-04: EntityRole includes value_object', () => {
    it('should accept value_object as a valid EntityRole', () => {
      const roles: EntityRole[] = ['aggregate_root', 'child_entity', 'value_object'];
      expect(roles).toContain('value_object');
      expect(roles).toHaveLength(3);
    });
  });

  describe('UT-SEMANTIC-TYPE-05: ManifestValueObject', () => {
    it('should have all required fields', () => {
      const vo: ManifestValueObject = {
        id: 'vo-1',
        name: '地址',
        nameEn: 'Address',
        properties: [
          {
            id: 'vo-1-street',
            nameEn: 'street',
            dataType: 'string',
          },
        ],
      };
      expect(vo.id).toBe('vo-1');
      expect(vo.name).toBe('地址');
      expect(vo.nameEn).toBe('Address');
      expect(vo.properties).toHaveLength(1);
    });
  });

  describe('UT-SEMANTIC-TYPE-06: ManifestEnumDef', () => {
    it('should have all required fields', () => {
      const def: ManifestEnumDef = {
        id: 'enum-1',
        name: '合同状态',
        nameEn: 'ContractStatus',
        combinationPolicy: 'single',
        values: [
          {
            id: 'PENDING',
            name: '待处理',
            nameEn: 'Pending',
          },
        ],
        description: '合同状态枚举',
      };
      expect(def.id).toBe('enum-1');
      expect(def.combinationPolicy).toBe('single');
      expect(def.values).toHaveLength(1);
      expect(def.values[0].id).toBe('PENDING');
    });
  });

  describe('UT-SEMANTIC-TYPE-07: ManifestEnumValue', () => {
    it('should have all required fields', () => {
      const val: ManifestEnumValue = {
        id: 'ACTIVE',
        name: '生效',
        nameEn: 'Active',
        description: '已生效',
      };
      expect(val.id).toBe('ACTIVE');
      expect(val.name).toBe('生效');
      expect(val.nameEn).toBe('Active');
      expect(val.description).toBe('已生效');
    });
  });

  describe('UT-SEMANTIC-TYPE-08: OntologyManifestSemantic includes enumDefs', () => {
    it('should accept enumDefs array', () => {
      const semantic: OntologyManifestSemantic = {
        valueObjects: [],
        enumDefs: [],
        objectTypes: [],
      };
      expect(semantic.enumDefs).toBeDefined();
      expect(semantic.enumDefs).toEqual([]);
    });
  });
});
