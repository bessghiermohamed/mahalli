import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, withSuffix } from "@/lib/slug";

describe("slugify", () => {
  it("creates slugs from latin names", () => {
    expect(slugify("Flower Shop")).toBe("flower-shop");
    expect(slugify("  Multi   Space  ")).toBe("multi-space");
    expect(slugify("Café & Restaurant")).toBe("caf-restaurant");
  });

  it("keeps Arabic letters", () => {
    expect(slugify("متجر الزهور")).toBe("متجر-الزهور");
    expect(slugify("عطور 2025")).toBe("عطور-2025");
  });

  it("collapses hyphens and trims edges", () => {
    expect(slugify("--a--b--")).toBe("a-b");
    expect(slugify("_a_b_")).toBe("a-b");
  });

  it("returns empty string for symbols-only input", () => {
    expect(slugify("***")).toBe("");
    expect(slugify("###")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("flower-shop")).toBe(true);
    expect(isValidSlug("متجر-الزهور")).toBe(true);
    expect(isValidSlug("ab")).toBe(true);
    expect(isValidSlug("a1-b2")).toBe(true);
  });

  it("rejects malformed slugs", () => {
    expect(isValidSlug("-leading")).toBe(false);
    expect(isValidSlug("trailing-")).toBe(false);
    expect(isValidSlug("double--hyphen")).toBe(false);
    expect(isValidSlug("has space")).toBe(false);
    expect(isValidSlug("Upper")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects reserved route names", () => {
    expect(isValidSlug("login")).toBe(false);
    expect(isValidSlug("dashboard")).toBe(false);
    expect(isValidSlug("api")).toBe(false);
    expect(isValidSlug("cart")).toBe(false);
    expect(isValidSlug("checkout")).toBe(false);
    expect(isValidSlug("admin")).toBe(false);
  });
});

describe("withSuffix", () => {
  it("appends suffix and keeps length bounded", () => {
    const result = withSuffix("a-very-long-store-name-exceeding-limits-here", "x9y8");
    expect(result.length).toBeLessThanOrEqual(40);
    expect(result.endsWith("x9y8")).toBe(true);
    expect(result).toContain("-x9y8");
    // still a valid slug shape
    expect(result).toMatch(/^[a-z0-9\u0600-\u06FF]+(-[a-z0-9\u0600-\u06FF]+)*$/);
  });
});
