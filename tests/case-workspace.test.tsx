// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { createCaseStore } from "@/lib/case-store";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import {
  importRoleFromClaimsTool,
  recordInterviewAnswerTool,
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

  it("reports all seven case tools when they are registered", () => {
    renderWorkspace(createCaseStore(), 7);

    expect(screen.getByText("WebMCP 7/7 live")).toBeTruthy();
    expect(screen.getByTestId("tool-status").textContent).toContain("7/7");
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

  it("defers imported claim status until candidate priority is set", () => {
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
      screen
        .getByTestId("claim-imported-1")
        .querySelector("[data-status]")
        ?.getAttribute("data-status"),
    ).toBe("PRIORITY_NOT_SET");
  });

  it("maps evidence stance composition to semantic signal tones", () => {
    renderWorkspace();
    const ownership = within(screen.getByTestId("claim-technical-ownership"));
    const customer = within(screen.getByTestId("claim-customer-interaction"));

    expect(
      ownership.getByRole("img", {
        name: "Public: 2 evidence items, mixed",
      }).className,
    ).toContain("bg-amber-soft");
    expect(
      customer.getByRole("img", {
        name: "Public: 2 evidence items, supported",
      }).className,
    ).toContain("bg-supported-soft");
    expect(
      customer.getByRole("img", {
        name: "Interview: 1 evidence item, supported",
      }).className,
    ).toContain("bg-supported-soft");
  });

  it("labels neutral-only evidence as neutral instead of empty", () => {
    // Given
    const store = createCaseStore();
    selectDecisionChanger(store);

    // When
    recordInterviewAnswerTool(store, {
      stance: "NEUTRAL",
      text: "The interviewer could not quantify the ownership boundary.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    renderWorkspace(store);

    // Then
    const ownership = within(screen.getByTestId("claim-technical-ownership"));
    expect(
      ownership.getByRole("img", {
        name: "Interview: 1 evidence item, neutral",
      }).className,
    ).toContain("bg-unverified-soft");
  });
});
