import { describe, it, expect } from "vitest";
import { errorMessageForCode, ERROR_MESSAGES_ZH } from "./errorCodes";

describe("errorCodes", () => {
  it("maps known codes to zh", () => {
    expect(errorMessageForCode("P4031")).toBe(ERROR_MESSAGES_ZH.P4031);
  });
  it("returns null for unknown", () => {
    expect(errorMessageForCode("UNKNOWN_X")).toBeNull();
  });
});
