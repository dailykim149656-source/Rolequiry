// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { createCaseStore } from "@/lib/case-store";

describe("case workspace status", () => {
  it("does not claim WebMCP is live when no tools registered", () => {
    render(
      <CaseWorkspace
        cannedAnswerLabel={undefined}
        onImportanceChange={() => undefined}
        onLoadFixture={() => undefined}
        onRank={() => undefined}
        onRecordAnswer={undefined}
        onReset={() => undefined}
        snapshot={createCaseStore().getState()}
        webmcpCount={0}
      />,
    );

    expect(screen.getByText("WebMCP unavailable")).toBeTruthy();
    expect(screen.queryByText("WebMCP live")).toBeNull();
  });
});
