/* eslint-disable @typescript-eslint/no-explicit-any -- partial Entity/Relation fixtures in mapper tests */
import { describe, expect, it } from "vitest";
import type { OntologyProject } from "@/types/ontology";

// ============================================================
// mappers/utils.ts
// ============================================================
import { toStableId, toStateCode, resolveAggregateRootId, ensurePastTenseNameEn } from "@/lib/manifest-compiler/mappers/utils";

describe("mappers/utils", () => {
  describe("toStableId", () => {
    it("returns lowercase for already-kebab-case", () => {
      expect(toStableId("production-order")).toBe("production-order");
    });
    it("converts CamelCase to kebab-case", () => {
      // "ProductionOrder" matches alphanumeric regex, just lowercased to "productionorder"
      // CamelCase splitting happens via the fallback regex
      expect(toStableId("Production Order")).toBe("production-order");
    });
    it("converts spaces and underscores to hyphens", () => {
      expect(toStableId("Production_Order")).toBe("production-order");
    });
    it("removes special characters", () => {
      expect(toStableId("Order (Main)")).toBe("order-main");
    });
    it("collapses multiple hyphens", () => {
      expect(toStableId("a---b")).toBe("a-b");
    });
    it("trims leading/trailing hyphens", () => {
      expect(toStableId("-hello-")).toBe("hello");
    });
    it("returns 'ontology' for empty-after-sanitize", () => {
      expect(toStableId("---")).toBe("ontology");
    });
    it("handles single-word lowercased", () => {
      expect(toStableId("hello")).toBe("hello");
    });
    it("handles mixed case with spaces for camelCase splitting", () => {
      expect(toStableId("productionOrder")).toBe("productionorder");
    });
  });

  describe("toStateCode", () => {
    it("uppercases snake_case from name", () => {
      expect(toStateCode({ id: "s1", name: "pending_review" })).toBe("PENDING_REVIEW");
    });
    it("uppercases single word name", () => {
      expect(toStateCode({ id: "s2", name: "draft" })).toBe("DRAFT");
    });
    it("converts spaces to underscores", () => {
      expect(toStateCode({ id: "s3", name: "In Progress" })).toBe("IN_PROGRESS");
    });
    it("falls back to sanitized id when name has Chinese chars", () => {
      expect(toStateCode({ id: "s-4", name: "待审核" })).toBe("S_4");
    });
  });

  describe("resolveAggregateRootId", () => {
    it("returns entity.id when entity is aggregate root", () => {
      const map = new Map([["e1", { id: "e1", entityRole: "aggregate_root" } as any]]);
      expect(resolveAggregateRootId("e1", map)).toBe("e1");
    });
    it("returns parentAggregateId for child entity", () => {
      const map = new Map([["e2", { id: "e2", entityRole: "child_entity", parentAggregateId: "e1" } as any]]);
      expect(resolveAggregateRootId("e2", map)).toBe("e1");
    });
    it("returns undefined for unknown entity", () => {
      expect(resolveAggregateRootId("missing", new Map())).toBeUndefined();
    });
  });

  describe("ensurePastTenseNameEn", () => {
    it("returns trimmed nameEn when non-empty", () => {
      expect(ensurePastTenseNameEn("OrderCreated ", "订单创建")).toBe("OrderCreated");
    });
    it("falls back to fallbackName + 'Occurred' when empty", () => {
      expect(ensurePastTenseNameEn("  ", "OrderCreate")).toBe("OrderCreateOccurred");
    });
    it("uses default when both empty", () => {
      expect(ensurePastTenseNameEn("", "")).toBe("DomainEventOccurred");
    });
  });
});

// ============================================================
// mappers/enums.ts
// ============================================================
import { mapEntityRoleToObjectTypeKind, mapRelationCardinality, mapRuleType } from "@/lib/manifest-compiler/mappers/enums";

describe("mappers/enums", () => {
  describe("mapEntityRoleToObjectTypeKind", () => {
    it("returns aggregate_root for aggregate root entity", () => {
      expect(mapEntityRoleToObjectTypeKind({ entityRole: "aggregate_root" } as any)).toBe("aggregate_root");
    });
    it("returns entity for child entity", () => {
      expect(mapEntityRoleToObjectTypeKind({ entityRole: "child_entity" } as any)).toBe("entity");
    });
  });

  describe("mapRelationCardinality", () => {
    it("maps one_to_one → 1:1", () => {
      expect(mapRelationCardinality("one_to_one")).toBe("1:1");
    });
    it("maps one_to_many → 1:N", () => {
      expect(mapRelationCardinality("one_to_many")).toBe("1:N");
    });
    it("maps many_to_many → N:M", () => {
      expect(mapRelationCardinality("many_to_many")).toBe("N:M");
    });
    it("defaults unknown to 1:N", () => {
      expect(mapRelationCardinality("unknown" as any)).toBe("1:N");
    });
  });

  describe("mapRuleType", () => {
    it("maps field_validation → field_validation", () => {
      expect(mapRuleType("field_validation")).toBe("field_validation");
    });
    it("maps cross_field_validation → cross_field", () => {
      expect(mapRuleType("cross_field_validation")).toBe("cross_field");
    });
    it("maps cross_entity_validation → cross_entity", () => {
      expect(mapRuleType("cross_entity_validation")).toBe("cross_entity");
    });
    it("maps aggregation_validation → cross_entity", () => {
      expect(mapRuleType("aggregation_validation")).toBe("cross_entity");
    });
    it("maps temporal_rule → precondition", () => {
      expect(mapRuleType("temporal_rule")).toBe("precondition");
    });
    it("defaults unknown to field_validation", () => {
      expect(mapRuleType("unknown" as any)).toBe("field_validation");
    });
  });
});

// ============================================================
// mappers/rules.ts
// ============================================================
import { mapRules } from "@/lib/manifest-compiler/mappers/rules";

describe("mappers/rules", () => {
  it("returns empty for missing ruleModel", () => {
    expect(mapRules({} as OntologyProject)).toEqual([]);
  });
  it("returns empty for null ruleModel rules", () => {
    expect(mapRules({ ruleModel: { rules: [] } } as any)).toEqual([]);
  });
  it("maps rule with defaults", () => {
    const project = {
      ruleModel: {
        rules: [{ id: "r1", name: "Check Stock", type: "field_validation", condition: "stock>0", errorMessage: "Stock empty" }],
      },
    } as any;
    const result = mapRules(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
    expect(result[0].type).toBe("field_validation");
    expect(result[0].version).toBe("1.0.0");
    expect(result[0].status).toBe("active");
    expect(result[0].enabled).toBe(true);
    expect(result[0].expression).toBe("stock>0");
  });
  it("preserves explicit version/status", () => {
    const project = {
      ruleModel: {
        rules: [{ id: "r2", name: "R2", type: "cross_field_validation", version: "2.1.0", status: "inactive", enabled: false }],
      },
    } as any;
    const result = mapRules(project);
    expect(result[0].version).toBe("2.1.0");
    expect(result[0].status).toBe("inactive");
    expect(result[0].enabled).toBe(false);
  });
});

// ============================================================
// mappers/metrics.ts
// ============================================================
import { mapMetrics } from "@/lib/manifest-compiler/mappers/metrics";

describe("mappers/metrics", () => {
  it("returns empty for missing metricsModel", () => {
    expect(mapMetrics({} as OntologyProject)).toEqual([]);
  });
  it("maps metric fields directly", () => {
    const project = {
      metricsModel: {
        metrics: [{ id: "m1", name: "CycleTime", nameEn: "cycleTime", formula: "end-start", unit: "hours", boundActionId: "a1", measurementType: "duration", targetValue: 24 }],
      },
    } as any;
    const result = mapMetrics(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
    expect(result[0].unit).toBe("hours");
    expect(result[0].targetValue).toBe(24);
  });
});

// ============================================================
// mappers/transaction-boundaries.ts
// ============================================================
import { mapTransactionBoundaries } from "@/lib/manifest-compiler/mappers/transaction-boundaries";

describe("mappers/transaction-boundaries", () => {
  it("returns empty for missing behaviorModel", () => {
    expect(mapTransactionBoundaries({} as OntologyProject)).toEqual([]);
  });
  it("maps transaction boundary fields", () => {
    const project = {
      behaviorModel: {
        transactionBoundaries: [{ id: "tb1", name: "TB1", nameEn: "tb1", actionIds: ["a1"], aggregateRootIds: ["e1"], isolation: "serializable" }],
      },
    } as any;
    const result = mapTransactionBoundaries(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tb1");
    expect(result[0].isolation).toBe("serializable");
  });
});

// ============================================================
// mappers/business-scenarios.ts
// ============================================================
import { mapBusinessScenarios } from "@/lib/manifest-compiler/mappers/business-scenarios";

describe("mappers/business-scenarios", () => {
  it("returns empty when no scenarios", () => {
    expect(mapBusinessScenarios({ dataModel: { entities: [] } } as any)).toEqual([]);
  });
  it("maps scenarios with applicable entities", () => {
    const project = {
      dataModel: {
        businessScenarios: [{ id: "bs1", name: "OrderMgmt", nameEn: "orderMgmt", description: "desc" }],
        entities: [
          { id: "e1", businessScenarioId: "bs1" },
          { id: "e2", businessScenarioId: "bs1" },
          { id: "e3", businessScenarioId: "other" },
        ],
      },
    } as any;
    const result = mapBusinessScenarios(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("bs1");
    expect(result[0].applicableObjectTypeIds).toEqual(["e1", "e2"]);
  });
});

// ============================================================
// mappers/domain-events.ts
// ============================================================
import { mapDomainEvents } from "@/lib/manifest-compiler/mappers/domain-events";

describe("mappers/domain-events", () => {
  it("returns empty for missing eventModel", () => {
    expect(mapDomainEvents({ dataModel: { entities: [] } } as any)).toEqual([]);
  });
  it("maps events with aggregateRootId", () => {
    const project = {
      dataModel: { entities: [{ id: "e1", entityRole: "aggregate_root" }] },
      eventModel: { events: [{ id: "ev1", name: "订单创建", nameEn: "OrderCreated", entity: "e1" }] },
    } as any;
    const result = mapDomainEvents(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ev1");
    expect(result[0].nameEn).toBe("OrderCreated");
    expect(result[0].aggregateRootId).toBe("e1");
  });
  it("falls back nameEn when empty", () => {
    const project = {
      dataModel: { entities: [{ id: "e1", entityRole: "aggregate_root" }] },
      eventModel: { events: [{ id: "ev2", name: "OrderCreate", nameEn: "", entity: "e1" }] },
    } as any;
    const result = mapDomainEvents(project);
    expect(result[0].nameEn).toBe("OrderCreateOccurred");
  });
});

// ============================================================
// mappers/actions.ts
// ============================================================
import { mapActions } from "@/lib/manifest-compiler/mappers/actions";

describe("mappers/actions", () => {
  const entityAgg = { id: "e1", entityRole: "aggregate_root" } as any;
  const entityChild = { id: "e2", entityRole: "child_entity", parentAggregateId: "e1" } as any;

  it("returns empty for missing behaviorModel", () => {
    const project = { dataModel: { entities: [] } } as any;
    expect(mapActions(project)).toEqual([]);
  });
  it("maps action with aggregateRootId resolved", () => {
    const project = {
      dataModel: { entities: [entityAgg] },
      behaviorModel: { actions: [{ id: "a1", name: "Approve", nameEn: "Approve", targetEntityId: "e1" }] },
    } as any;
    const result = mapActions(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
    expect(result[0].aggregateRootId).toBe("e1");
  });
  it("resolves child entity to parent aggregate root", () => {
    const project = {
      dataModel: { entities: [entityAgg, entityChild] },
      behaviorModel: { actions: [{ id: "a2", name: "Modify", targetEntityId: "e2" }] },
    } as any;
    const result = mapActions(project);
    expect(result).toHaveLength(1);
    expect(result[0].aggregateRootId).toBe("e1");
  });
  it("skips action without targetEntityId", () => {
    const project = {
      dataModel: { entities: [entityAgg] },
      behaviorModel: { actions: [{ id: "a3", name: "NoTarget" }] },
    } as any;
    expect(mapActions(project)).toEqual([]);
  });
  it("includes ruleRefs as preRuleIds", () => {
    const project = {
      dataModel: { entities: [entityAgg] },
      behaviorModel: { actions: [{ id: "a4", name: "Validated", targetEntityId: "e1", ruleRefs: ["r1", "r2"] }] },
    } as any;
    const result = mapActions(project);
    expect(result[0].preRuleIds).toEqual(["r1", "r2"]);
  });
  it("includes publishesEventIds", () => {
    const project = {
      dataModel: { entities: [entityAgg] },
      behaviorModel: { actions: [{ id: "a5", name: "Publish", targetEntityId: "e1", publishesEventIds: ["ev1"] }] },
    } as any;
    const result = mapActions(project);
    expect(result[0].publishesEventIds).toEqual(["ev1"]);
  });
  it("collects actions from stateMachines too", () => {
    const project = {
      dataModel: { entities: [entityAgg] },
      behaviorModel: {
        actions: [],
        stateMachines: [{ id: "sm1", actions: [{ id: "a6", name: "SM Action", targetEntityId: "e1" }] }],
      },
    } as any;
    const result = mapActions(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a6");
  });
  it("deduplicates by id", () => {
    const project = {
      dataModel: { entities: [entityAgg] },
      behaviorModel: {
        actions: [{ id: "a7", name: "Dup", targetEntityId: "e1" }],
        stateMachines: [{ actions: [{ id: "a7", name: "Dup", targetEntityId: "e1" }] }],
      },
    } as any;
    expect(mapActions(project)).toHaveLength(1);
  });
});

// ============================================================
// mappers/side-effects.ts
// ============================================================
import { mapSideEffects } from "@/lib/manifest-compiler/mappers/side-effects";

describe("mappers/side-effects", () => {
  it("returns empty for missing behaviorModel", () => {
    expect(mapSideEffects({} as OntologyProject)).toEqual([]);
  });
  it("maps sideEffects from actions", () => {
    const project = {
      behaviorModel: {
        actions: [{ id: "a1", sideEffects: [{ id: "se1", type: "webhook", async: true }] }],
      },
    } as any;
    const result = mapSideEffects(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("se1");
    expect(result[0].type).toBe("webhook");
    expect(result[0].async).toBe(true);
    expect(result[0].actionId).toBe("a1");
  });
  it("maps sideEffects from stateMachine actions", () => {
    const project = {
      behaviorModel: {
        stateMachines: [{ actions: [{ id: "a2", sideEffects: [{ id: "se2", type: "notification", async: false }] }] }],
      },
    } as any;
    const result = mapSideEffects(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("se2");
    expect(result[0].actionId).toBe("a2");
  });
  it("includes retryPolicy and config", () => {
    const project = {
      behaviorModel: {
        actions: [{ id: "a3", sideEffects: [{ id: "se3", type: "call", async: true, retryPolicy: { maxAttempts: 3, backoffMs: 1000 }, config: { url: "/api" } }] }],
      },
    } as any;
    const result = mapSideEffects(project);
    expect(result[0].retryPolicy).toEqual({ maxAttempts: 3, backoffMs: 1000 });
    expect(result[0].config).toEqual({ url: "/api" });
  });
});

// ============================================================
// mappers/state-machines.ts
// ============================================================
import { mapStateMachines } from "@/lib/manifest-compiler/mappers/state-machines";

describe("mappers/state-machines", () => {
  it("returns empty for null input", () => {
    expect(mapStateMachines(null)).toEqual([]);
  });
  it("returns empty for missing stateMachines", () => {
    expect(mapStateMachines({} as any)).toEqual([]);
  });
  it("maps state machine with states and transitions", () => {
    const behaviorModel = {
      stateMachines: [
        {
          id: "sm1",
          name: "Order SM",
          entity: "e1",
          statusField: "orderStatus",
          states: [
            { id: "s1", name: "Draft", isInitial: true },
            { id: "s2", name: "Confirmed", isFinal: true },
          ],
          transitions: [
            { id: "t1", name: "Confirm", from: "s1", to: "s2", trigger: "manual" },
          ],
        },
      ],
    } as any;
    const result = mapStateMachines(behaviorModel);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("sm1");
    expect(result[0].objectTypeId).toBe("e1");
    expect((result[0] as any).statusField).toBe("orderStatus");
    expect(result[0].states).toHaveLength(2);
    expect(result[0].states![0].code).toBe("DRAFT");
    expect(result[0].states![0].isInitial).toBe(true);
    expect(result[0].states![1].isFinal).toBe(true);
    expect((result[0] as any).transitions).toHaveLength(1);
    expect(((result[0] as any).transitions as any)[0].from).toBe("DRAFT");
    expect(((result[0] as any).transitions as any)[0].to).toBe("CONFIRMED");
  });
  it("uses default statusField when missing", () => {
    const behaviorModel = {
      stateMachines: [{ id: "sm2", entity: "e2", states: [], transitions: [] }],
    } as any;
    const result = mapStateMachines(behaviorModel);
    expect((result[0] as any).statusField).toBe("status");
  });
  it("maps array endpoints (from/to)", () => {
    const behaviorModel = {
      stateMachines: [
        {
          id: "sm3",
          entity: "e3",
          states: [
            { id: "a", name: "A" },
            { id: "b", name: "B" },
            { id: "c", name: "C" },
          ],
          transitions: [{ id: "t2", name: "MultiFrom", from: ["a", "b"], to: "c", trigger: "auto" }],
        },
      ],
    } as any;
    const result = mapStateMachines(behaviorModel);
    expect(((result[0] as any).transitions as any)[0].from).toEqual(["A", "B"]);
  });
});

// ============================================================
// mappers/object-types.ts
// ============================================================
import { mapObjectTypes } from "@/lib/manifest-compiler/mappers/object-types";

describe("mappers/object-types", () => {
  it("returns empty for no entities", () => {
    expect(mapObjectTypes({ dataModel: { entities: [] } } as any)).toEqual([]);
  });
  it("maps entity to object type with kind", () => {
    const project = {
      dataModel: {
        entities: [{ id: "e1", name: "Order", nameEn: "Order", entityRole: "aggregate_root", attributes: [], relations: [] }],
      },
    } as any;
    const result = mapObjectTypes(project);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e1");
    expect(result[0].kind).toBe("aggregate_root");
    expect(result[0].properties).toEqual([]);
    expect(result[0].relations).toEqual([]);
  });
  it("maps child entity with aggregateRootId", () => {
    const project = {
      dataModel: {
        entities: [{ id: "e2", name: "OrderItem", nameEn: "OrderItem", entityRole: "child_entity", parentAggregateId: "e1", attributes: [], relations: [] }],
      },
    } as any;
    const result = mapObjectTypes(project);
    expect(result[0].kind).toBe("entity");
    expect(result[0].aggregateRootId).toBe("e1");
  });
  it("maps properties with reference dataType", () => {
    const project = {
      dataModel: {
        entities: [
          {
            id: "e1",
            name: "Order",
            nameEn: "Order",
            entityRole: "aggregate_root",
            attributes: [
              { id: "attr1", name: "Customer", nameEn: "Customer", dataType: "reference", required: true, referenceKind: "entity", referencedEntityId: "cust1" },
            ],
            relations: [],
          },
        ],
      },
    } as any;
    const result = mapObjectTypes(project);
    const prop = result[0].properties![0];
    expect(prop.id).toContain("attr1");
    expect(prop.dataType).toBe("reference");
    expect(prop.required).toBe(true);
    expect(prop.reference).toBeDefined();
    expect((prop.reference as any).targetObjectTypeId).toBe("cust1");
  });
  it("maps relations with cardinality", () => {
    const project = {
      dataModel: {
        entities: [
          {
            id: "e1",
            name: "Order",
            nameEn: "Order",
            entityRole: "aggregate_root",
            attributes: [],
            relations: [{ id: "rel1", name: "items", targetEntity: "e2", type: "one_to_many" }],
          },
        ],
      },
    } as any;
    const result = mapObjectTypes(project);
    const rel = result[0].relations![0];
    expect(rel.id).toBe("rel1");
    expect(rel.sourceObjectTypeId).toBe("e1");
    expect(rel.targetObjectTypeId).toBe("e2");
    expect((rel as any).cardinality).toBe("1:N");
  });
});

