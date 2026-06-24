import { describe, it, expect } from 'vitest';
import { Entity, SourceMapping, ComputedProperty, Attribute, Relation } from '../../src/types/ontology';

describe('Ontology Semantic Model (Phase 1)', () => {
  it('should support semantic enhancements on Entity and Attribute', () => {
    const attr: Attribute = {
      id: 'attr-1',
      name: '客户等级',
      nameEn: 'vipLevel',
      dataType: 'string',
      businessMeaning: '评估客户价值的分类等级',
    };

    const entity: Entity = {
      id: 'ent-1',
      name: '客户',
      nameEn: 'Customer',
      projectId: 'proj-1',
      businessScenarioId: 'scen-1',
      businessMeaning: '产生购买行为并需要系统跟进的个人或企业实例',
      aliases: ['买家', '消费者'],
      attributes: [attr],
      relations: []
    };

    expect(entity.businessMeaning).toBe('产生购买行为并需要系统跟进的个人或企业实例');
    expect(entity.aliases).toContain('消费者');
    expect(entity.attributes[0].businessMeaning).toContain('价值');
  });

  it('should support relation attributes and directionality on Relation', () => {
    const relationAttr: Attribute = {
      id: 'rel-attr-1',
      name: '分配时间',
      nameEn: 'assignTime',
      dataType: 'datetime'
    };

    const relation: Relation = {
      id: 'rel-1',
      name: '分配航班',
      type: 'one_to_many',
      targetEntity: 'ent-flight',
      attributes: [relationAttr],
      directionality: 'directed',
      isRecursive: false
    };

    expect(relation.attributes).toBeDefined();
    expect(relation.attributes![0].name).toBe('分配时间');
    expect(relation.directionality).toBe('directed');
  });

  it('should support computed properties on Entity', () => {
    const computedProp: ComputedProperty = {
      id: 'comp-1',
      name: '总消费金额',
      nameEn: 'totalSpent',
      computationType: 'aggregation',
      aggregationFunction: 'sum',
      expression: 'orders.amount',
      businessMeaning: '该客户历年所有成功订单的总金额'
    };

    const entity: Entity = {
      id: 'ent-customer',
      name: '客户',
      nameEn: 'Customer',
      projectId: 'proj-1',
      businessScenarioId: 'scen-1',
      attributes: [],
      relations: [],
      computedProperties: [computedProp]
    };

    expect(entity.computedProperties![0].computationType).toBe('aggregation');
  });

  it('should support source mappings on Entity', () => {
    const mapping: SourceMapping = {
      id: 'map-1',
      entityId: 'ent-customer',
      attributeId: 'attr-1',
      sourceSystem: 'ERP',
      sourceFieldPath: 'CRM_DB.customer.grade_code',
      transformRule: 'status_code === "01" ? "VIP" : "NORMAL"'
    };

    const entity: Entity = {
      id: 'ent-customer',
      name: '客户',
      nameEn: 'Customer',
      projectId: 'proj-1',
      businessScenarioId: 'scen-1',
      attributes: [],
      relations: [],
      sourceMappings: [mapping]
    };

    expect(entity.sourceMappings![0].sourceSystem).toBe('ERP');
    expect(entity.sourceMappings![0].sourceFieldPath).toContain('grade_code');
  });
});