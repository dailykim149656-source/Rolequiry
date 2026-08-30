// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { createCaseStore } from "@/lib/case-store";
import {
  importRoleFromClaimsTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

afterEach(cleanup);

function renderWorkspace(store = createCaseStore(), webmcpCount = 0) {
  render(
    <CaseWorkspace
      cannedAnswerLabel={undefined}
      onImportanceChange={() => undefined}
      onLoadFixture={() => undefined}
      onRank={() => undefined}
      onRecordAnswer={undefined}
      onReset={() => undefined}
      snapshot={store.getState()}
      webmcpCount={webmcpCount}
    />,
  );
}

describe("case workspace status", () => {
  it("does not claim WebMCP is live when no tools registered", () => {
    renderWorkspace();

    expect(screen.getByText("Open in a WebMCP browser")).toBeTruthy();
    expect(screen.queryByText("WebMCP live")).toBeNull();
  });

  it("puts the Decision Path before the Claim Board for narrow screens", () => {
    renderWorkspace();

    const decision = screen.getByRole("region", { name: "Decision Path" });
    const board = screen.getByRole("region", { name: "Claim Board" });
    expect(
      decision.compareDocumentPosition(board) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("marks the active probe on its matching claim card", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    renderWorkspace(store, 6);

    const active = screen.getByTestId("claim-technical-ownership");
    expect(active.getAttribute("data-active")).toBe("true");
    expect(active.textContent).toContain("Active probe");
    expect(screen.getByTestId("claim-travel").getAttribute("data-active")).toBe(
      "false",
    );
  });

  it("does not tell a fully prioritized demo case to set priorities", () => {
    renderWorkspace();

    expect(screen.getByText("Priorities ready")).toBeTruthy();
    expect(screen.queryByText(/Set your priorities, then/)).toBeNull();
  });

  it("shows one priority instruction for a fresh imported case", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
      ],
    });
    renderWorkspace(store);

    expect(
      screen.getAllByText(/Your judgment activates the ranking/),
    ).toHaveLength(1);
  });
});
