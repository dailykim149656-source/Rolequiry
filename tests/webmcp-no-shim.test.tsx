// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  Reflect.deleteProperty(window, "__rolequiryTools");
});

describe("production WebMCP authenticity", () => {
  it("does not invent document.modelContext when native WebMCP is absent", async () => {
    expect(document.modelContext).toBeUndefined();
    await import("@/lib/webmcp/local-model-context");
    expect(document.modelContext).toBeUndefined();
  });
});
