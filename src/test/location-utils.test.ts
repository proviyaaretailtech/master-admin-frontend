import { describe, it, expect } from "vitest";
import { generateLocationCode } from "../lib/location-utils";

describe("generateLocationCode utility", () => {
  it("generates code for 'LVS CAFE' with count 1 as 'LOC - LC 001'", () => {
    expect(generateLocationCode("LVS CAFE", 1)).toBe("LOC - LC 001");
  });

  it("generates code for 'Palleturi Dosa' with count 1 as 'LOC - PD 001'", () => {
    expect(generateLocationCode("Palleturi Dosa", 1)).toBe("LOC - PD 001");
  });

  it("generates incremental count codes for 'Palleturi Dosa' (e.g. 002, 003)", () => {
    expect(generateLocationCode("Palleturi Dosa", 2)).toBe("LOC - PD 002");
    expect(generateLocationCode("Palleturi Dosa", 3)).toBe("LOC - PD 003");
    expect(generateLocationCode("Palleturi Dosa", 12)).toBe("LOC - PD 012");
    expect(generateLocationCode("Palleturi Dosa", 100)).toBe("LOC - PD 100");
  });

  it("generates initials for single-word business names using first two letters", () => {
    expect(generateLocationCode("Starbucks", 1)).toBe("LOC - ST 001");
    expect(generateLocationCode("Cafe", 1)).toBe("LOC - CA 001");
  });

  it("generates initials for multi-word business names with 3+ words", () => {
    expect(generateLocationCode("Spice Route Kitchen", 1)).toBe("LOC - SRK 001");
    expect(generateLocationCode("Grand Royal Palace Hotel", 4)).toBe("LOC - GRPH 004");
  });

  it("handles empty or special character business names gracefully", () => {
    expect(generateLocationCode("", 1)).toBe("LOC - LOC 001");
    expect(generateLocationCode("   ", 1)).toBe("LOC - LOC 001");
  });
});
