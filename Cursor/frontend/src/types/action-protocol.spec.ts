import { describe, it, expect } from "vitest";
import { normalizeAction, ACTION_PROTOCOL_VERSION } from "./action-protocol";

describe("action-protocol", () => {
  it("normalizes v1 NAVIGATE", () => {
    const a = normalizeAction({ type: "NAVIGATE", path: "/contracts", version: 1 });
    expect(a?.type).toBe("NAVIGATE");
    expect((a as { path?: string }).path).toBe("/contracts");
    expect(ACTION_PROTOCOL_VERSION).toBe(1);
  });

  it("normalizes v1 RENDER_CHART", () => {
    const a = normalizeAction({
      type: "RENDER_CHART",
      version: 1,
      chart: {
        type: "bar",
        title: "t",
        labels: ["a"],
        values: [1],
      },
    });
    expect(a?.type).toBe("RENDER_CHART");
    expect((a as { chart?: { labels?: string[] } }).chart?.labels).toEqual(["a"]);
  });
});
