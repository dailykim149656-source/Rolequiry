import { describe, expect, it } from "vitest";
import { hasOversizedInput } from "@/lib/webmcp/input-limits";

describe("WebMCP input length limits", () => {
  it("counts Unicode code points like JSON Schema maxLength", () => {
    expect(hasOversizedInput([["😀".repeat(300), 300]])).toBe(false);
    expect(hasOversizedInput([["😀".repeat(301), 300]])).toBe(true);
  });

  it("counts surrounding whitespace included by JSON Schema maxLength", () => {
    expect(hasOversizedInput([[`${"x".repeat(300)} `, 300]])).toBe(true);
  });
});
