import { describe, expect, it, vi, afterEach } from 'vitest';
import type { Entity, OntologyProject } from '@/types/ontology';
import { projectToOwlOntology } from '@/lib/owl/convert';

function makeEntity(partial: Partial<Entity> & { id: string; name: string; nameEn: string }): Entity {
  return {
    projectId: 'p1',
    businessScenarioId: 'bs1',
    attributes: [],
    relations: [],
    ...partial,
  };
}

function makeProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'proj-1',
    name: '测试项目',
    version: 'v1.0.0',
    dataModel: null,
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as OntologyProject;
}

function makeProjectWithEntities(entities: Entity[], overrides: Partial<OntologyProject> = {}) {
  return makeProject({
    dataModel: {
      id: 'dm1',
      name: '数据模型',
      version: 'v1',
      domain: 'discrete-manufacturing',
      projects: [],
      businessScenarios: [],
      entities,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('projectToOwlOntology', () => {
  it('应使用默认 baseUri 并携带项目 label/versionInfo', () => {
    const owl = projectToOwlOntology(makeProject());
    expect(owl.baseUri).toBe('http://ontology.local/proj-1/');
    expect(owl.ontologyIri).toBe(owl.baseUri);
    expect(owl.label).toBe('测试项目');
    expect(owl.versionInfo).toBe('v1.0.0');
    expect(owl.classes).toEqual([]);
  });

  it('应支持自定义 baseUri', () => {
    const owl = projectToOwlOntology(makeProject(), { baseUri: 'http://example.com/erp/' });
    expect(owl.baseUri).toBe('http://example.com/erp/');
  });

  it('E1 聚合根实体 → owl:Class', () => {
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({ id: 'e1', name: '采购订单', nameEn: 'PurchaseOrder', entityRole: 'aggregate_root' }),
      ]),
    );
    expect(owl.classes).toHaveLength(1);
    expect(owl.classes[0]).toMatchObject({
      id: 'PurchaseOrder',
      label: '采购订单',
      labelEn: 'PurchaseOrder',
      sourceMetaElementId: 'e1',
    });
    expect(owl.classes[0].subClassOf).toBeUndefined();
  });

  it('E1 子实体 → rdfs:subClassOf 父聚合根', () => {
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({ id: 'e1', name: '采购订单', nameEn: 'PurchaseOrder', entityRole: 'aggregate_root' }),
        makeEntity({
          id: 'e2',
          name: '订单行',
          nameEn: 'OrderLine',
          entityRole: 'child_entity',
          parentAggregateId: 'e1',
        }),
      ]),
    );
    const child = owl.classes.find((c) => c.id === 'OrderLine');
    expect(child?.subClassOf).toEqual(['PurchaseOrder']);
  });

  it('子实体父聚合无法解析时跳过并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({
          id: 'e2',
          name: '订单行',
          nameEn: 'OrderLine',
          entityRole: 'child_entity',
          parentAggregateId: 'missing',
        }),
      ]),
    );
    expect(owl.classes[0].subClassOf).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('属性 → owl:DatatypeProperty，dataType 映射到 xsd 类型', () => {
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({
          id: 'e1',
          name: '采购订单',
          nameEn: 'PurchaseOrder',
          attributes: [
            { id: 'a1', name: '金额', nameEn: 'amount', dataType: 'decimal' },
            { id: 'a2', name: '创建时间', nameEn: 'createdAt', dataType: 'datetime' },
            { id: 'a3', name: '状态', nameEn: 'status', dataType: 'enum' },
            { id: 'a4', name: '备注', nameEn: 'remark', dataType: 'text' },
          ],
        }),
      ]),
    );
    expect(owl.datatypeProperties).toHaveLength(4);
    const rangeByPropId = Object.fromEntries(owl.datatypeProperties.map((p) => [p.id, p.range]));
    expect(rangeByPropId).toMatchObject({
      PurchaseOrder_amount: 'xsd:decimal',
      PurchaseOrder_createdAt: 'xsd:dateTime',
      PurchaseOrder_status: 'xsd:string',
      PurchaseOrder_remark: 'xsd:string',
    });
    expect(owl.datatypeProperties.every((p) => p.domain === 'PurchaseOrder')).toBe(true);
  });

  it('reference 属性 → owl:ObjectProperty，range 由 referencedEntityId 解析', () => {
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({ id: 'e1', name: '采购订单', nameEn: 'PurchaseOrder' }),
        makeEntity({ id: 'e2', name: '供应商', nameEn: 'Supplier' }),
        makeEntity({
          id: 'e3',
          name: '订单',
          nameEn: 'Order',
          attributes: [
            { id: 'a1', name: '供应商', nameEn: 'supplier', dataType: 'reference', referencedEntityId: 'e2' },
          ],
        }),
      ]),
    );
    const prop = owl.objectProperties.find((p) => p.id === 'Order_supplier');
    expect(prop).toMatchObject({ domain: 'Order', range: 'Supplier' });
  });

  it('reference 属性目标实体无法解析时跳过并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({
          id: 'e1',
          name: '订单',
          nameEn: 'Order',
          attributes: [
            { id: 'a1', name: '供应商', nameEn: 'supplier', dataType: 'reference', referencedEntityId: 'missing' },
          ],
        }),
      ]),
    );
    expect(owl.objectProperties).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });

  it('实体关系 → owl:ObjectProperty，range 由 targetEntity 解析', () => {
    const owl = projectToOwlOntology(
      makeProjectWithEntities([
        makeEntity({
          id: 'e1',
          name: '采购订单',
          nameEn: 'PurchaseOrder',
          relations: [{ id: 'r1', name: '包含', type: 'one_to_many', targetEntity: 'e2' }],
        }),
        makeEntity({ id: 'e2', name: '订单行', nameEn: 'OrderLine' }),
      ]),
    );
    expect(owl.objectProperties).toHaveLength(1);
    expect(owl.objectProperties[0]).toMatchObject({
      label: '包含',
      domain: 'PurchaseOrder',
      range: 'OrderLine',
    });
  });

  it('E4 事件 / E5 部门与岗位 → owl:Class', () => {
    const owl = projectToOwlOntology(
      makeProject({
        eventModel: {
          id: 'evm1',
          name: '事件模型',
          version: 'v1',
          domain: 'd',
          events: [
            { id: 'ev1', name: '订单已创建', nameEn: 'OrderCreated', entity: 'e1', trigger: 'create', payload: [] },
          ],
          subscriptions: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        organizationModel: {
          id: 'om1',
          departments: [
            { id: 'd1', name: '采购部', nameEn: 'ProcurementDept', type: 'department', status: 'active' },
          ],
          positions: [
            { id: 'p1', name: '采购专员', nameEn: 'Buyer', departmentId: 'd1', roleIds: [], responsibilities: [], status: 'active' },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      } as Partial<OntologyProject>),
    );
    const ids = owl.classes.map((c) => c.id);
    expect(ids).toContain('Event_OrderCreated');
    expect(ids).toContain('Department_ProcurementDept');
    expect(ids).toContain('Position_Buyer');
  });

  it('is_a 语义关系（metaElement ID）解析为 rdfs:subClassOf', () => {
    const owl = projectToOwlOntology(
      makeProjectWithEntities(
        [
          makeEntity({ id: 'e1', name: '订单', nameEn: 'Order' }),
          makeEntity({ id: 'e2', name: '采购订单', nameEn: 'PurchaseOrder' }),
        ],
        {
          metaElements: [
            { id: 'me-order', name: '订单', dimension: 'E1' },
            { id: 'me-po', name: '采购订单', dimension: 'E1' },
          ],
          agentSemanticLayer: {
            semanticRelations: [
              {
                id: 'sr1',
                type: 'is_a',
                sourceEntityId: 'me-po',
                targetEntityId: 'me-order',
                name: '采购订单是一种订单',
                weight: 1,
                transitive: true,
                symmetric: false,
              },
            ],
          } as OntologyProject['agentSemanticLayer'],
        },
      ),
    );
    const po = owl.classes.find((c) => c.id === 'PurchaseOrder');
    expect(po?.subClassOf).toEqual(['Order']);
  });

  it('equivalent_to 语义关系解析为 owl:equivalentClass；无法解析时跳过不生成悬空 URI', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const owl = projectToOwlOntology(
      makeProjectWithEntities(
        [makeEntity({ id: 'e1', name: '订单', nameEn: 'Order' })],
        {
          agentSemanticLayer: {
            semanticRelations: [
              {
                id: 'sr1',
                type: 'equivalent_to',
                sourceEntityId: 'e1',
                targetEntityId: 'ghost',
                name: '悬空关系',
                weight: 1,
                transitive: false,
                symmetric: true,
              },
            ],
          } as OntologyProject['agentSemanticLayer'],
        },
      ),
    );
    expect(owl.classes[0].equivalentTo).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('空项目返回空本体', () => {
    const owl = projectToOwlOntology(makeProject());
    expect(owl.classes).toEqual([]);
    expect(owl.objectProperties).toEqual([]);
    expect(owl.datatypeProperties).toEqual([]);
  });
});
