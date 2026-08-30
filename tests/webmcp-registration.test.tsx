// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import * as React from "react";
import { useWebMCP } from "use-webmcp-tool";
import { afterEach, describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { IMPORTANCE } from "@/lib/domain/policy";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { getCaseState, selectDecisionChanger } from "@/lib/webmcp/tools";
import { useCaseWebMCPTools } from "@/lib/webmcp/use-case-tools";

type RegisteredTool = {
  name: string;
  execute?: (args?: Record<string, unknown>) => Promise<{
    isError?: boolean;
    content: Array<{ text: string }>;
  }>;
};

function installFakeModelContext() {
  const tools = new Map<string, RegisteredTool>();
  const registerTool = (
    tool: RegisteredTool,
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

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
});

describe("WebMCP registration wrapper", () => {
  it("registers exactly one live tool under StrictMode", () => {
    const tools = installFakeModelContext();
    renderHook(
      () =>
        useWebMCP({
          name: "get_case_state",
          description: "Return current case state",
          execute: () => ({ ok: true }),
        }),
      { wrapper: React.StrictMode },
    );
    expect(tools.size).toBe(1);
    expect([...tools.keys()]).toEqual(["get_case_state"]);
  });

  it("marks an unknown interview claim as an agent-visible tool error", async () => {
    const registered = installFakeModelContext();
    const store = createCaseStore();
    renderHook(() => useCaseWebMCPTools(store), {
      wrapper: React.StrictMode,
    });

    const record = registered.get("record_interview_answer");
    expect(record?.execute).toBeTypeOf("function");
    if (!record?.execute) {
      throw new Error("record_interview_answer was not registered");
    }
    const result = await record.execute({
      claimId: "does-not-exist",
      stance: "CHALLENGES",
      text: "should not land",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });

    expect(result?.isError).toBe(true);
    expect(result?.content[0]?.text).toContain("Unknown claim id");
    expect(
      store
        .getState()
        .source.claims.every((claim) =>
          claim.evidence.every(
            (item) => !item.text.includes("should not land"),
          ),
        ),
    ).toBe(true);
  });
});

describe("CaseStore shared state", () => {
  it("returns fresh priorities from get_case_state after a UI importance change", () => {
    const store = createCaseStore();
    store.setImportance("travel", IMPORTANCE.CRITICAL);
    const state = getCaseState(store);
    const travel = state.claims.find((claim) => claim.id === "travel");
    expect(travel?.importance).toBe("CRITICAL");
    expect(state.claims.every((claim) => !("probePriority" in claim))).toBe(
      true,
    );
  });

  it("reveals ranking only after select_decision_changer", () => {
    const store = createCaseStore();
    const before = getCaseState(store);
    expect(before.rankingVisible).toBe(false);
    const selected = selectDecisionChanger(store);
    expect(selected.ok).toBe(true);
    if (selected.ok) expect(selected.claim_id).toBe("technical-ownership");
    const after = store.getState();
    expect(after.rankingVisible).toBe(true);
    expect(after.activeProbeId).toBe("technical-ownership");
  });
});
