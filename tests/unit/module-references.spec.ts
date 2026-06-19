import { describe, expect, it } from "vitest";
import type { OntologyProject } from "@/types/ontology";
import { listIncomingModuleReferences, listOutgoingModuleReferences } from "@/lib/module-version/module-references";

function project(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    valueDomains: [
      { id: "a1", name: "生产域", parentId: undefined },
    ],
    capabilities: [
      { id: "b1", name: "计划能力", parentId: "a1" },
      { id: "b2", name: "执行能力", parentId: "a1" },
      { id: "b3", name: "无父能力", parentId: undefined },
    ],
    scenarios: [
      { id: "c1", name: "排产场景", parentId: "b1" },
      { id: "c2", name: "报工场景", parentId: "b2" },
    ],
    epcProcesses: [
      { id: "epc1", name: "排产流程", parentId: "c1", steps: [
        { elementRef: { elementId: "el1", dimension: "E1" } },
        { elementRef: { elementId: "el2", dimension: "E2" } },
      ] },
      { id: "epc2", name: "报工流程", parentId: "c2", steps: [] },
    ],
    metaElements: [
      { id: "el1", name: "订单", dimension: "E1", usageRefs: [{ epcId: "epc1" }] },
      { id: "el2", name: "物料", dimension: "E2", usageRefs: [{ epcId: "epc1" }] },
      { id: "el3", name: "未引用要素", dimension: "E3", usageRefs: [] },
    ],
    ...overrides,
  } as any;
}

describe("module-references", () => {
  describe("listIncomingModuleReferences", () => {
    it("lists child capabilities for A", () => {
      const refs = listIncomingModuleReferences(project(), "A", "a1");
      expect(refs).toHaveLength(2);
      expect(refs.map((r) => r.id)).toEqual(["b1", "b2"]);
      expect(refs[0].relation).toBe("子能力");
    });
    it("lists child scenarios for B", () => {
      const refs = listIncomingModuleReferences(project(), "B", "b1");
      expect(refs).toHaveLength(1);
      expect(refs[0].id).toBe("c1");
      expect(refs[0].relation).toBe("子场景");
    });
    it("lists child EPC processes for C", () => {
      const refs = listIncomingModuleReferences(project(), "C", "c1");
      expect(refs).toHaveLength(1);
      expect(refs[0].id).toBe("epc1");
      expect(refs[0].relation).toBe("子流程");
    });
    it("lists meta elements referencing an EPC", () => {
      const refs = listIncomingModuleReferences(project(), "EPC", "epc1");
      expect(refs).toHaveLength(2);
      expect(refs.map((r) => r.id)).toEqual(["el1", "el2"]);
      expect(refs[0].relation).toBe("流程引用要素");
    });
    it("returns empty when no children", () => {
      expect(listIncomingModuleReferences(project(), "B", "b3")).toEqual([]);
    });
  });

  describe("listOutgoingModuleReferences", () => {
    it("lists parent value domain for B", () => {
      const refs = listOutgoingModuleReferences(project(), "B", "b1");
      expect(refs).toHaveLength(1);
      expect(refs[0].kind).toBe("A");
      expect(refs[0].id).toBe("a1");
      expect(refs[0].relation).toBe("所属价值域");
    });
    it("lists parent capability for C", () => {
      const refs = listOutgoingModuleReferences(project(), "C", "c1");
      expect(refs).toHaveLength(1);
      expect(refs[0].kind).toBe("B");
      expect(refs[0].id).toBe("b1");
      expect(refs[0].relation).toBe("所属能力");
    });
    it("lists parent scenario + step element refs for EPC", () => {
      const refs = listOutgoingModuleReferences(project(), "EPC", "epc1");
      // parent scenario: 1 + step element refs: 2
      expect(refs.length).toBeGreaterThanOrEqual(3);
      expect(refs.find((r) => r.relation === "所属场景")?.id).toBe("c1");
      const stepRefs = refs.filter((r) => r.relation === "步骤引用要素");
      expect(stepRefs).toHaveLength(2);
      expect(stepRefs.map((r) => r.id)).toEqual(["el1", "el2"]);
    });
    it("returns empty for A (no outgoing)", () => {
      expect(listOutgoingModuleReferences(project(), "A", "a1")).toEqual([]);
    });
    it("returns empty for EPC without steps", () => {
      const refs = listOutgoingModuleReferences(project(), "EPC", "epc2");
      expect(refs).toHaveLength(1); // only parent scenario
    });
    it("resolves element name from metaElements", () => {
      const refs = listOutgoingModuleReferences(project(), "EPC", "epc1");
      const el1Ref = refs.find((r) => r.id === "el1");
      expect(el1Ref?.name).toBe("订单");
    });
  });
});
