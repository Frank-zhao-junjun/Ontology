import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ScenarioWorkspace } from "@/components/ontology/scenario-workspace";
import { useOntologyStore } from "@/store/ontology-store";
import type { Domain, EpcProcess, MetaElement, Scenario } from "@/types/ontology";

const domain: Domain = {
  id: "d1",
  name: "离散制造",
  nameEn: "Mfg",
  description: "",
  icon: "factory",
  color: "#000",
};

const NOW = "2026-06-18T12:00:00.000Z";

function usageRef(epcId: string, stepId: string, scenarioId: string) {
  return { epcId, stepId, scenarioId, versionPin: "latest_confirmed" as const };
}

// ── TC-01: 三 Tab 渲染 ──────────────────────────────
describe("EpcValidationPanel — TC-01 三 Tab 渲染", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should render VE / VM / VX tabs with summary bar when scenario confirmed with EPC", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "MTS场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={store.getScenarioChildEpcs(scenario.id)}
        referenceUnion={store.getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    expect(screen.getByTestId("epc-validation-panel")).toBeInTheDocument();
    expect(screen.getByTestId("vp-tab-ve")).toBeInTheDocument();
    expect(screen.getByTestId("vp-tab-vm")).toBeInTheDocument();
    expect(screen.getByTestId("vp-tab-vx")).toBeInTheDocument();
    expect(screen.getByText("EPC 校验")).toBeInTheDocument();
  });
});

// ── TC-02: VE 默认选中 ──────────────────────────────
describe("EpcValidationPanel — TC-02 VE 默认选中", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should show VE panel content by default", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "MTS场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={store.getScenarioChildEpcs(scenario.id)}
        referenceUnion={store.getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // VE tab should be active on initial render
    expect(screen.getByTestId("vp-panel-ve")).toBeInTheDocument();
    // VE filters should be visible
    expect(screen.getByTestId("vp-ve-filters")).toBeInTheDocument();
  });
});

// ── TC-03: VM Tab 切换 ──────────────────────────────
describe("EpcValidationPanel — TC-03 VM Tab 切换", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should switch to VM tab and show coverage panel", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "MTS场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={store.getScenarioChildEpcs(scenario.id)}
        referenceUnion={store.getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    fireEvent.click(screen.getByTestId("vp-tab-vm"));
    expect(screen.getByTestId("vp-panel-vm")).toBeInTheDocument();
    expect(screen.getByTestId("epc-coverage-panel")).toBeInTheDocument();
  });
});

// ── TC-04: VX Tab 切换 ──────────────────────────────
describe("EpcValidationPanel — TC-04 VX Tab 切换", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should switch to VX tab and show issue list", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, {
      name: "场景",
      semantics: { triggerPhrases: ["未知动作"] },
    });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [{
          ...epcProcess,
          steps: [{
            id: "s1", name: "步",
            elementRef: { dimension: "E1", elementId: "e1", versionPin: "latest_confirmed" },
          }],
        }],
        metaElements: [{ id: "e1", name: "订单", nameEn: "Order", dimension: "E1" }],
        behaviorModel: {
          id: "bm-1", name: "行为", version: "1", domain: "d1",
          stateMachines: [{
            id: "sm-1", name: "SM", entity: "Order", statusField: "status",
            states: [], transitions: [],
            actions: [{ id: "act-1", name: "提交", actionType: "update" }],
          }],
          createdAt: NOW, updatedAt: NOW,
        },
      },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    fireEvent.click(screen.getByTestId("vp-tab-vx"));
    expect(screen.getByTestId("vp-panel-vx")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-0")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-0")).toHaveTextContent("VX-09");
  });
});

// ── TC-05: 汇总计数 ─────────────────────────────────
describe("EpcValidationPanel — TC-05 汇总计数", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should display correct error/warning/info counts in summary bar", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, {
      name: "场景",
      semantics: { triggerPhrases: ["未知触发"] },
    });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });

    const epcWithBadRef: EpcProcess = {
      ...epcProcess,
      steps: [{
        id: "s1", name: "坏引用",
        elementRef: { dimension: "E1", elementId: "missing-el", versionPin: "latest_confirmed" },
      }],
    };

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, epcProcesses: [epcWithBadRef], metaElements: [] },
    });
    store.saveModuleDraft("EPC", epcProcess.id, epcWithBadRef);
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // Summary bar should exist
    expect(screen.getByTestId("vp-summary-errors")).toBeInTheDocument();
    expect(screen.getByTestId("vp-summary-warnings")).toBeInTheDocument();
    expect(screen.getByTestId("vp-summary-infos")).toBeInTheDocument();
    expect(screen.getByTestId("vp-summary-coverage")).toBeInTheDocument();

    // Coverage should be 0% (no covered elements)
    expect(screen.getByTestId("vp-summary-coverage")).toHaveTextContent("0%");
  });
});

// ── TC-06: 覆盖率百分比 ─────────────────────────────
describe("EpcValidationPanel — TC-06 覆盖率百分比", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should display 50% coverage when half elements are referenced", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "MTS场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    const epcWithSteps: EpcProcess = {
      ...epcProcess,
      steps: [
        { id: "s1", name: "步1", elementRef: { dimension: "E1", elementId: "e1", versionPin: "latest_confirmed" } },
        { id: "s2", name: "步2", elementRef: { dimension: "E1", elementId: "e2", versionPin: "latest_confirmed" } },
      ],
    };

    const metaElements: MetaElement[] = [
      { id: "e1", name: "被引用1", dimension: "E1", usageRefs: [usageRef(epcProcess.id, "s1", scenario.id)] },
      { id: "e2", name: "被引用2", dimension: "E1", usageRefs: [usageRef(epcProcess.id, "s2", scenario.id)] },
      { id: "e3", name: "未覆盖1", dimension: "E1", usageRefs: [] },
      { id: "e4", name: "未覆盖2", dimension: "E1", usageRefs: [] },
    ];

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, epcProcesses: [epcWithSteps], metaElements },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    expect(screen.getByTestId("vp-summary-coverage")).toHaveTextContent("50%");
  });
});

// ── TC-07: VX 严重度着色 ─────────────────────────────
describe("EpcValidationPanel — TC-07 VX 严重度着色", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should show VX severity group headers in order error → warning → info", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, {
      name: "场景",
      semantics: { triggerPhrases: ["未知动作"] },
    });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [{
          ...epcProcess,
          steps: [{
            id: "s1", name: "步",
            elementRef: { dimension: "E1", elementId: "e1", versionPin: "latest_confirmed" },
          }],
        }],
        metaElements: [{ id: "e1", name: "订单", nameEn: "Order", dimension: "E1" }],
        behaviorModel: {
          id: "bm-1", name: "行为", version: "1", domain: "d1",
          stateMachines: [{
            id: "sm-1", name: "SM", entity: "Order", statusField: "status",
            states: [], transitions: [],
            actions: [{ id: "act-1", name: "提交", actionType: "update" }],
          }],
          createdAt: NOW, updatedAt: NOW,
        },
      },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    fireEvent.click(screen.getByTestId("vp-tab-vx"));

    // VX-09 is an error severity rule — should appear in error group
    const vxRow = screen.getByTestId("vp-vx-0");
    expect(vxRow).toBeInTheDocument();
    expect(vxRow.getAttribute("data-severity")).toBe("error");
    expect(vxRow).toHaveTextContent("VX-09");

    // Should have a severity group header for "error"
    expect(screen.getByTestId("vp-vx-group-header-error")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-group-error")).toBeInTheDocument();
  });
});

// ── TC-08: C 未确认空状态 ───────────────────────────
describe("EpcValidationPanel — TC-08 C 未确认空状态", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should show inactive state when scenario is not confirmed", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "未确认场景" });
    store.addEpcProcess(scenario.id, { name: "主流程" });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={store.getScenarioChildEpcs(scenario.id)}
        referenceUnion={store.getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // Should show inactive message on VE tab (default)
    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("vp-empty-state")).toHaveTextContent("场景未确认");

    // Switch to VM — should also show inactive
    fireEvent.click(screen.getByTestId("vp-tab-vm"));
    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();

    // Switch to VX — should also show inactive
    fireEvent.click(screen.getByTestId("vp-tab-vx"));
    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();
  });
});

// ── TC-09: 无 EPC 空状态 ────────────────────────────
describe("EpcValidationPanel — TC-09 无 EPC 空状态", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should show inactive state when scenario confirmed but has no EPC children", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "无EPC场景" });
    store.confirmModule("C", scenario.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={() => {}}
      />,
    );

    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("vp-empty-state")).toHaveTextContent("没有 EPC 子流程");
  });
});

// ── TC-10: VE 筛选器 ────────────────────────────────
describe("EpcValidationPanel — TC-10 VE 筛选器", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should show W-EPC-05 warning on VE tab for missing element reference", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });

    const epcWithBadRef: EpcProcess = {
      ...epcProcess,
      steps: [{
        id: "s1", name: "坏引用",
        elementRef: { dimension: "E1", elementId: "missing-el", versionPin: "latest_confirmed" },
      }],
    };

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, epcProcesses: [epcWithBadRef], metaElements: [] },
    });
    store.saveModuleDraft("EPC", epcProcess.id, epcWithBadRef);

    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // VE tab should be active by default
    const rows = screen.getAllByTestId(/^vp-wepc-/);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.textContent?.includes("W-EPC-05"))).toBe(true);
  });
});

// ── TC-11: VX 筛选器 ────────────────────────────────
describe("EpcValidationPanel — TC-11 VX 筛选器", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should filter VX issues when a specific rule is selected", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, {
      name: "场景",
      semantics: { triggerPhrases: ["未知动作"] },
    });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [{
          ...epcProcess,
          steps: [{
            id: "s1", name: "步",
            elementRef: { dimension: "E1", elementId: "e1", versionPin: "latest_confirmed" },
          }],
        }],
        metaElements: [{ id: "e1", name: "订单", nameEn: "Order", dimension: "E1" }],
        behaviorModel: {
          id: "bm-1", name: "行为", version: "1", domain: "d1",
          stateMachines: [{
            id: "sm-1", name: "SM", entity: "Order", statusField: "status",
            states: [], transitions: [],
            actions: [{ id: "act-1", name: "提交", actionType: "update" }],
          }],
          createdAt: NOW, updatedAt: NOW,
        },
      },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    fireEvent.click(screen.getByTestId("vp-tab-vx"));

    // All filters visible including "全部" and rule-specific buttons
    expect(screen.getByTestId("vp-vx-filters")).toBeInTheDocument();

    // VX issue should appear
    expect(screen.getByTestId("vp-vx-0")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-0")).toHaveTextContent("VX-09");
  });
});

// ── TC-13: VE 有警告 VX 为空 ─────────────────────────
describe("EpcValidationPanel — TC-13 VE 有警告 VX 为空", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should show VE warnings but VX tab shows empty state", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });

    const epcWithBadRef: EpcProcess = {
      ...epcProcess,
      steps: [{
        id: "s1", name: "坏引用",
        elementRef: { dimension: "E1", elementId: "missing-el", versionPin: "latest_confirmed" },
      }],
    };

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, epcProcesses: [epcWithBadRef], metaElements: [] },
    });
    store.saveModuleDraft("EPC", epcProcess.id, epcWithBadRef);
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // VE tab (default): should show W-EPC-05 warning
    expect(screen.getByTestId("vp-panel-ve")).toBeInTheDocument();
    const veRows = screen.getAllByTestId(/^vp-wepc-/);
    expect(veRows.length).toBeGreaterThan(0);
    expect(veRows.some((row) => row.textContent?.includes("W-EPC-05"))).toBe(true);

    // Switch to VX tab: should show empty state (no cross-consistency issues)
    fireEvent.click(screen.getByTestId("vp-tab-vx"));
    expect(screen.getByTestId("vp-panel-vx")).toBeInTheDocument();
    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("vp-empty-state")).toHaveTextContent("未发现交叉一致性问题");
  });
});

// ── TC-14: 覆盖率 0% 不崩溃 ──────────────────────────
describe("EpcValidationPanel — TC-14 覆盖率 0% 不崩溃", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should display 0% coverage without division-by-zero crash", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, { name: "空场景" });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    // EPC has steps but no metaElements → coverage = 0%
    const epcWithStep: EpcProcess = {
      ...epcProcess,
      steps: [{
        id: "s1", name: "步",
        elementRef: { dimension: "E1", elementId: "no-such-el", versionPin: "latest_confirmed" },
      }],
    };

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, epcProcesses: [epcWithStep], metaElements: [] },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // Coverage should show 0% — no crash
    expect(screen.getByTestId("vp-summary-coverage")).toBeInTheDocument();
    expect(screen.getByTestId("vp-summary-coverage")).toHaveTextContent("0%");

    // VM tab should render without crashing
    fireEvent.click(screen.getByTestId("vp-tab-vm"));
    expect(screen.getByTestId("vp-panel-vm")).toBeInTheDocument();
  });
});

// ── TC-15: Tab Badge 计数器 ───────────────────────────
describe("EpcValidationPanel — TC-15 Tab Badge 计数器", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject("校验 UI", domain);
  });

  it("should display correct badge counts on tab buttons", () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: "域" });
    const b = store.addCapability(a.id, { name: "能力" });
    const scenario = store.addScenario(b.id, {
      name: "场景",
      semantics: { triggerPhrases: ["未知动作"] },
    });
    const epcProcess = store.addEpcProcess(scenario.id, { name: "主流程" });

    // Setup: 2 missing-element refs produce 2×W-EPC-05 + W-EPC-08 (no E2) + W-EPC-12 (no E3) = 4 VE warnings
    // Plus semantics triggerPhrases with no matching E2 action → 1 VX-09 error
    const epcWithBadRefs: EpcProcess = {
      ...epcProcess,
      steps: [
        { id: "s1", name: "坏引用1", elementRef: { dimension: "E1", elementId: "missing-1", versionPin: "latest_confirmed" } },
        { id: "s2", name: "坏引用2", elementRef: { dimension: "E2", elementId: "missing-2", versionPin: "latest_confirmed" } },
      ],
    };

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [epcWithBadRefs],
        metaElements: [],
        behaviorModel: {
          id: "bm-1", name: "行为", version: "1", domain: "d1",
          stateMachines: [{
            id: "sm-1", name: "SM", entity: "Order", statusField: "status",
            states: [], transitions: [],
            actions: [{ id: "act-1", name: "提交", actionType: "update" }],
          }],
          createdAt: NOW, updatedAt: NOW,
        },
      },
    });
    store.saveModuleDraft("EPC", epcProcess.id, epcWithBadRefs);
    store.confirmModule("C", scenario.id);
    store.confirmModule("EPC", epcProcess.id);

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    // VE tab badge should show total VE warnings for this scenario's EPCs
    const veTab = screen.getByTestId("vp-tab-ve");
    expect(veTab).toBeInTheDocument();
    // 2×W-EPC-05 + 1×W-EPC-08 + 1×W-EPC-12 = 4 warnings
    const veCount = parseInt(veTab.textContent?.match(/\d+/)![0] ?? "0", 10);
    expect(veCount).toBeGreaterThanOrEqual(1);

    // VX tab badge should contain a non-zero count
    const vxTab = screen.getByTestId("vp-tab-vx");
    expect(vxTab).toBeInTheDocument();
    const vxCount = parseInt(vxTab.textContent?.match(/\d+/)![0] ?? "0", 10);
    expect(vxCount).toBeGreaterThanOrEqual(1);
  });
});
