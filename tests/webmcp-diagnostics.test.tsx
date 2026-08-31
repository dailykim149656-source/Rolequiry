// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseApp } from "@/components/CaseApp";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  Reflect.deleteProperty(document, "modelContext");
});

describe("WebMCP diagnostics", () => {
  it("identifies a failed registration without reflecting the browser error", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: { name: string }) {
          if (tool.name === "get_case_state") {
            throw new DOMException(
              "sensitive browser policy detail",
              "NotAllowedError",
            );
          }
        },
      },
    });

    render(<CaseApp />);

    const diagnostics = await screen.findByTestId("webmcp-diagnostics");
    expect(diagnostics.textContent).toContain("get_case_state");
    expect(diagnostics.textContent).toContain("Registration failed");
    expect(diagnostics.textContent).not.toContain(
      "sensitive browser policy detail",
    );
  });
});
