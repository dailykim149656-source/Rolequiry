// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { deriveClaimKind } from "@/lib/domain/policy";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { importRoleFromClaimsTool } from "@/lib/webmcp/tools";
import { useCaseWebMCPTools } from "@/lib/webmcp/use-case-tools";

function installFakeModelContext() {
  const tools = new Map<
    string,
    {
      name: string;
      execute?: (
        args?: Record<string, unknown>,
      ) => Promise<{ isError?: boolean; content: Array<{ text: string }> }>;
    }
  >();
  const registerTool = (
    tool: { name: string },
    options: { signal?: AbortSignal } = {},
  ) => {
    tools.set(tool.name, tool);
    options.signal?.addEventListener("abort", () => {
      if (tools.get(tool.name) === tool) tools.delete(tool.name);
    });
  };
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool },
  });
  return tools;
}

describe("import_role_from_claims", () => {
  it("materializes an imported case without letting the agent set derived fields", () => {
    const store = createCaseStore();
    const result = importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
        {
          dimension: "Base pay",
          employerStatement: "$190k-$220k base",
          unresolvedVariable: "What is the written base band?",
          measurableForm: "Offer letter range",
        },
      ],
    });
    expect(result.origin).toBe("AGENT_IMPORTED");
    expect(store.getState().source.origin).toBe("AGENT_IMPORTED");
    expect(store.getState().source.company).toBe("Example Corp");
    expect(
      store
        .getState()
        .derived.claims.some((claim) => claim.kind === "EMPLOYER_POLICY"),
    ).toBe(true);
    expect(store.getState().selectionState).toBe("IDLE");
  });

  it("does not treat incidental remote wording as employer policy", () => {
    expect(
      deriveClaimKind({
        dimension: "Customer debugging",
        employerStatement: "Engineers remotely debug customer systems.",
      }),
    ).toBe("LIVED_EXPERIENCE");
  });
});

describe("registered write loop", () => {
  it("selects then records through the live WebMCP execute closures", async () => {
    const registered = installFakeModelContext();
    const store = createCaseStore();
    renderHook(() => useCaseWebMCPTools(store), { wrapper: React.StrictMode });
    expect([...registered.keys()].sort()).toEqual(
      [
        "get_case_state",
        "get_role_claims",
        "import_role_from_claims",
        "record_interview_answer",
        "record_research_evidence",
        "select_decision_changer",
      ].sort(),
    );
    const select = registered.get("select_decision_changer");
    const record = registered.get("record_interview_answer");
    if (!select?.execute || !record?.execute) throw new Error("tools missing");
    const selectedRaw = await select.execute({});
    const selected = JSON.parse(selectedRaw?.content[0]?.text ?? "{}");
    expect(selected.claim_id).toBe("technical-ownership");
    const recordedRaw = await record.execute({
      stance: "CHALLENGES",
      text: "Hiring manager said ownership is split with a central platform team after design review.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    const recorded = JSON.parse(recordedRaw?.content[0]?.text ?? "{}");
    expect(recorded.selectionState).toBe("EVIDENCE_UPDATED");
    const ownership = store
      .getState()
      .source.claims.find((claim) => claim.id === "technical-ownership");
    expect(
      ownership?.evidence.some(
        (item) => item.scope === "CANDIDATE_SPECIFIC_ANSWER",
      ),
    ).toBe(true);
  });
});
