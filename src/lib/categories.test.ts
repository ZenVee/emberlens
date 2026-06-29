import { describe, expect, it } from "vitest";

import {
  DEFAULT_SESSION_TYPES,
  categorySelectOptions,
  isAllowedCategory,
  normalizeCategoryList,
} from "./categories";

describe("normalizeCategoryList", () => {
  it("returns fallback for non-arrays", () => {
    expect(normalizeCategoryList(null, DEFAULT_SESSION_TYPES)).toEqual([...DEFAULT_SESSION_TYPES]);
  });

  it("trims, dedupes, and drops empty entries", () => {
    expect(
      normalizeCategoryList([" Portrait ", "Portrait", "", "Event"], DEFAULT_SESSION_TYPES),
    ).toEqual(["Portrait", "Event"]);
  });

  it("returns fallback when all entries are invalid", () => {
    expect(normalizeCategoryList(["", 1, null], DEFAULT_SESSION_TYPES)).toEqual([
      ...DEFAULT_SESSION_TYPES,
    ]);
  });
});

describe("isAllowedCategory", () => {
  it("accepts trimmed values in the allow list", () => {
    expect(isAllowedCategory(" Portrait ", ["Portrait"])).toBe(true);
  });

  it("rejects unknown or blank values", () => {
    expect(isAllowedCategory("Wedding", ["Portrait"])).toBe(false);
    expect(isAllowedCategory("   ", ["Portrait"])).toBe(false);
  });
});

describe("categorySelectOptions", () => {
  it("includes the current value even if not in the base list", () => {
    expect(categorySelectOptions(["Portrait"], "Legacy")).toEqual([
      { value: "Portrait", label: "Portrait" },
      { value: "Legacy", label: "Legacy" },
    ]);
  });
});
