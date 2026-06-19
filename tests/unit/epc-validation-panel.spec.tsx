import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import { EpcValidationPanel } from "@/components/ontology/epc-validation-panel";
import type { EpcWarning } from "@/lib/business-epc-linter";
import type { CrossConsistencyIssue } from "@/lib/epc-cross-consistency";
import type { EpcCoverageReport } from "@/lib/epc-coverage";
import type { EpcProcess } from "@/types/ontology";

// ── vi.hoisted mock fns (stable references for useMemo) ─────────────
const mocks = vi.hoisted(() => {
  const getBusinessEpcWarnings = vi.fn(() => [] as EpcWarning[]);
  const getEpcCoverage = vi.fn(() => ({
    scenarioId: "c1", totalElements: 0, coveredElements: 0, coveragePercent: 0, byDimension: {},
  } as EpcCoverageReport));
  const getCrossConsistency = vi.fn(() => [] as CrossConsistencyIssue[]);
  const getScenarioChildEpcs = vi.fn(() => [] as EpcProcess[]);
  const getBusinessChainModuleStatus = vi.fn(() => "draft" as string);

  return {
    getBusinessEpcWarnings, getEpcCoverage, getCrossConsistency,
    getScenarioChildEpcs, getBusinessChainModuleStatus,
  };
});

vi.mock("@/store/ontology-store", () => ({
  // Test mock — zustand's generic selector type is impractical to replicate exactly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useOntologyStore: (selector: any): any => {
    const state = {
      project: { id: "proj-1" },
      getBusinessEpcWarnings: mocks.getBusinessEpcWarnings,
      getEpcCoverage: mocks.getEpcCoverage,
      getCrossConsistency: mocks.getCrossConsistency,
      getScenarioChildEpcs: mocks.getScenarioChildEpcs,
      getBusinessChainModuleStatus: mocks.getBusinessChainModuleStatus,
    };
    return selector(state);
  },
}));

vi.mock("@/components/ontology/epc-coverage-panel", () => ({
  EpcCoveragePanel: () =>
    React.createElement("div", { "data-testid": "epc-coverage-panel" }, "Coverage Panel"),
}));

// ── Helpers ──────────────────────────────────────────────────────────
const SCENARIO_ID = "c1";
const EPC_ID = "epc1";

/** Create a W-EPC warning that matches the scenario filter */
function wepc(id: string, ruleId: EpcWarning["ruleId"], message: string): EpcWarning {
  return { id, ruleId, level: "warning", message, moduleKind: "C", moduleId: SCENARIO_ID };
}

function vx(
  code: CrossConsistencyIssue["code"],
  severity: CrossConsistencyIssue["severity"],
  message: string,
): CrossConsistencyIssue {
  return { code, severity, message, scenarioId: SCENARIO_ID };
}

function resetMocks() {
  mocks.getBusinessEpcWarnings.mockReturnValue([]);
  mocks.getEpcCoverage.mockReturnValue({
    scenarioId: SCENARIO_ID, totalElements: 0, coveredElements: 0, coveragePercent: 0, byDimension: {},
  });
  mocks.getCrossConsistency.mockReturnValue([]);
  mocks.getScenarioChildEpcs.mockReturnValue([]);
  mocks.getBusinessChainModuleStatus.mockReturnValue("draft");
}

function setupConfirmed(epcs: EpcProcess[] = [{ id: EPC_ID, name: "流程", parentId: SCENARIO_ID, steps: [] }]) {
  mocks.getBusinessChainModuleStatus.mockReturnValue("confirmed");
  mocks.getScenarioChildEpcs.mockReturnValue(epcs);
}

// ── TC-01: Three tab rendering ──────────────────────────────────────
describe("EpcValidationPanel — TC-01 三Tab渲染", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getBusinessEpcWarnings.mockReturnValue([wepc("w1", "W-EPC-01", "要素未确认")]);
    mocks.getCrossConsistency.mockReturnValue([vx("VX-01", "warning", "test")]);
    mocks.getEpcCoverage.mockReturnValue({
      scenarioId: SCENARIO_ID, totalElements: 10, coveredElements: 8, coveragePercent: 80, byDimension: {},
    });
  });

  it("should render VE / VM / VX tabs with summary bar", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("epc-validation-panel")).toBeInTheDocument();
    expect(screen.getByTestId("vp-tab-ve")).toBeInTheDocument();
    expect(screen.getByTestId("vp-tab-vm")).toBeInTheDocument();
    expect(screen.getByTestId("vp-tab-vx")).toBeInTheDocument();
    expect(screen.getByText("EPC 校验")).toBeInTheDocument();
  });
});

// ── TC-02: VE selected by default ───────────────────────────────────
describe("EpcValidationPanel — TC-02 VE默认选中", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getBusinessEpcWarnings.mockReturnValue([wepc("w1", "W-EPC-01", "要素未��认")]);
  });

  it("should show VE panel content by default", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-panel-ve")).toBeInTheDocument();
    expect(screen.getByTestId("vp-ve-filters")).toBeInTheDocument();
  });
});

// ── TC-03: VM tab switch ────────────────────────────────────────────
describe("EpcValidationPanel — TC-03 VM Tab切换", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
  });

  it("should switch to VM tab and show coverage panel", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    fireEvent.click(screen.getByTestId("vp-tab-vm"));
    expect(screen.getByTestId("vp-panel-vm")).toBeInTheDocument();
    expect(screen.getByTestId("epc-coverage-panel")).toBeInTheDocument();
  });
});

// ── TC-04: VX tab switch ────────────────────────────────────────────
describe("EpcValidationPanel — TC-04 VX Tab切换", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getCrossConsistency.mockReturnValue([
      vx("VX-02", "error", "Event不匹配"),
      vx("VX-01", "warning", "行为要素未绑定"),
    ]);
  });

  it("should switch to VX tab and show issues", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    fireEvent.click(screen.getByTestId("vp-tab-vx"));
    expect(screen.getByTestId("vp-panel-vx")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-filters")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-list")).toBeInTheDocument();
    // Each severity group has idx=0
    expect(screen.getAllByTestId("vp-vx-0").length).toBeGreaterThanOrEqual(2);
  });
});

// ── TC-05: Summary counts ───────────────────────────────────────────
describe("EpcValidationPanel — TC-05 汇总计数", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getBusinessEpcWarnings.mockReturnValue([
      wepc("w1", "W-EPC-01", "a"),
      wepc("w2", "W-EPC-02", "b"),
      wepc("w3", "W-EPC-03", "c"),
    ]);
    mocks.getCrossConsistency.mockReturnValue([
      vx("VX-02", "error", "e"),
      vx("VX-01", "warning", "w"),
    ]);
  });

  it("should display correct error/warning/info counts", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    // errors = 1 (VX-02 error)
    expect(screen.getByTestId("vp-summary-errors").textContent).toBe("1");
    // warnings = 3 (W-EPC) + 1 (VX-01) = 4
    expect(screen.getByTestId("vp-summary-warnings").textContent).toBe("4");
    expect(screen.getByTestId("vp-summary-infos").textContent).toBe("0");
  });
});

// ── TC-06: Coverage percentage ──────────────────────────────────────
describe("EpcValidationPanel — TC-06 覆盖率百分比", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getEpcCoverage.mockReturnValue({
      scenarioId: SCENARIO_ID, totalElements: 10, coveredElements: 5, coveragePercent: 50, byDimension: {},
    });
  });

  it("should display coverage percentage in summary bar", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-summary-coverage").textContent).toBe("50%");
  });
});

// ── TC-07: VX severity coloring ───────────���─────────────────────────
describe("EpcValidationPanel — TC-07 VX严重度着色", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getCrossConsistency.mockReturnValue([
      vx("VX-02", "error", "err"),
      vx("VX-01", "warning", "warn"),
      vx("VX-06", "info", "info"),
    ]);
  });

  it("should render 3 severity groups with color badges", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    fireEvent.click(screen.getByTestId("vp-tab-vx"));

    // Check groups exist
    expect(screen.getByTestId("vp-vx-group-error")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-group-warning")).toBeInTheDocument();
    expect(screen.getByTestId("vp-vx-group-info")).toBeInTheDocument();

    // Verify items within each group by data-severity
    const errorGroup = screen.getByTestId("vp-vx-group-error");
    expect(within(errorGroup).getByTestId("vp-vx-0")).toHaveAttribute("data-severity", "error");

    const warningGroup = screen.getByTestId("vp-vx-group-warning");
    expect(within(warningGroup).getByTestId("vp-vx-0")).toHaveAttribute("data-severity", "warning");

    const infoGroup = screen.getByTestId("vp-vx-group-info");
    expect(within(infoGroup).getByTestId("vp-vx-0")).toHaveAttribute("data-severity", "info");
  });
});

// ── TC-08: C not confirmed empty state ────────────────────��─────────
describe("EpcValidationPanel — TC-08 C未确认空状态", () => {
  beforeEach(() => {
    resetMocks();
    mocks.getScenarioChildEpcs.mockReturnValue([{ id: EPC_ID, name: "流程", parentId: SCENARIO_ID, steps: [] }]);
  });

  it("should show inactive message when C is not confirmed", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("vp-empty-state")).toHaveTextContent("场景未确认");
  });
});

// ── TC-09: No EPC children empty state ──────────────────────────────
describe("EpcValidationPanel — TC-09 无EPC空状态", () => {
  beforeEach(() => {
    resetMocks();
    mocks.getBusinessChainModuleStatus.mockReturnValue("confirmed");
    mocks.getScenarioChildEpcs.mockReturnValue([]);
  });

  it("should show empty state when no child EPCs", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("vp-empty-state")).toHaveTextContent("没有 EPC 子流程");
  });
});

// ── TC-10: VE filter ────────────────────────────────────────────────
describe("EpcValidationPanel — TC-10 VE筛选器", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getBusinessEpcWarnings.mockReturnValue([
      wepc("w1", "W-EPC-01", "A"),
      wepc("w2", "W-EPC-06", "B"),
      wepc("w3", "W-EPC-06", "C"),
    ]);
  });

  it("should filter to W-EPC-06 only", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-ve-list").children.length).toBe(3);

    // Click W-EPC-06 filter inside vp-ve-filters
    const filters = screen.getByTestId("vp-ve-filters");
    fireEvent.click(within(filters).getByText("W-EPC-06"));

    expect(screen.getByTestId("vp-ve-list").children.length).toBe(2);
  });
});

// ── TC-11: VX filter ────────────────────────────────────────────────
describe("EpcValidationPanel — TC-11 VX筛选器", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getCrossConsistency.mockReturnValue([
      vx("VX-01", "warning", "A"),
      vx("VX-02", "error", "B"),
    ]);
  });

  it("should filter VX issues by rule", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    fireEvent.click(screen.getByTestId("vp-tab-vx"));

    // Click VX-01 filter inside vp-vx-filters
    const filters = screen.getByTestId("vp-vx-filters");
    fireEvent.click(within(filters).getByText("VX-01"));

    // After filter: only warning group visible, 1 item
    expect(screen.getByTestId("vp-vx-group-warning")).toBeInTheDocument();
    const items = within(screen.getByTestId("vp-vx-group-warning")).getAllByTestId("vp-vx-0");
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain("VX-01");
  });
});

// ── TC-13: VE has warnings but VX is empty ──────────────────────────
describe("EpcValidationPanel — TC-13 VE有警告VX为空", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getBusinessEpcWarnings.mockReturnValue([
      wepc("w1", "W-EPC-01", "A"),
      wepc("w2", "W-EPC-02", "B"),
      wepc("w3", "W-EPC-03", "C"),
    ]);
    mocks.getCrossConsistency.mockReturnValue([]);
  });

  it("should show 3 VE warnings and empty VX state", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-ve-list").children.length).toBe(3);

    fireEvent.click(screen.getByTestId("vp-tab-vx"));
    expect(screen.getByTestId("vp-panel-vx").textContent).toContain("未发现交叉一致性问题");
  });
});

// ── TC-14: 0% coverage doesn"t crash ────────────────────────────────
describe("EpcValidationPanel — TC-14 覆盖率0%不崩溃", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getEpcCoverage.mockReturnValue({
      scenarioId: SCENARIO_ID, totalElements: 10, coveredElements: 0, coveragePercent: 0, byDimension: {},
    });
  });

  it("should display 0% coverage without crash", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-summary-coverage").textContent).toBe("0%");
    expect(screen.getByTestId("epc-validation-panel")).toBeInTheDocument();
  });
});

// ── TC-15: Tab badge counters ───────────────────────────────────────
describe("EpcValidationPanel — TC-15 Tab Badge计数器", () => {
  beforeEach(() => {
    resetMocks();
    setupConfirmed();
    mocks.getBusinessEpcWarnings.mockReturnValue([
      wepc("w1", "W-EPC-01", "A"),
      wepc("w2", "W-EPC-02", "B"),
      wepc("w3", "W-EPC-03", "C"),
    ]);
    mocks.getCrossConsistency.mockReturnValue([
      vx("VX-01", "warning", "x"),
      vx("VX-02", "error", "y"),
    ]);
  });

  it("should show tab labels with correct counts", () => {
    render(<EpcValidationPanel scenarioId={SCENARIO_ID} />);
    expect(screen.getByTestId("vp-tab-ve").textContent).toContain("3");
    expect(screen.getByTestId("vp-tab-vx").textContent).toContain("2");
  });
});