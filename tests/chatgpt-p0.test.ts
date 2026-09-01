import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";
import {
  CASE_TOOL_CONTRACTS,
  getCaseState,
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("ChatGPT P0 contract", () => {
  it("does not put prompt-injection text in the canonical employer fixture", () => {
    const haystack = JSON.stringify(ATLAS_FDE);
    expect(haystack).not.toMatch(/AGENT NOTE/i);
    expect(haystack).not.toMatch(/skip further checks/i);
  });

  it("reserves check-again routing for select_decision_changer", () => {
    const state = CASE_TOOL_CONTRACTS.find(
      (item) => item.name === "get_case_state",
    );
    const select = CASE_TOOL_CONTRACTS.find(
      (item) => item.name === "select_decision_changer",
    );
    expect(state?.description.toLowerCase()).not.toContain("check again");
    expect(select?.description.toLowerCase()).toContain("check again");
    expect(select?.description.toLowerCase()).toContain("do not re-rank");
    expect(select?.description.toLowerCase()).toContain("authoritative");
    expect(select?.description).toContain("LIVED_EXPERIENCE");
  });

  it("keeps the active probe after an interview answer instead of auto-selecting the next one", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    expect(store.getState().activeProbeId).toBe("technical-ownership");
    recordInterviewAnswerTool(store, {
      stance: "CHALLENGES",
      text: "Hiring manager said ownership is split with a central platform team after design review.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    expect(store.getState().activeProbeId).toBe("technical-ownership");
    expect(store.getState().selectionState).toBe("EVIDENCE_UPDATED");
    expect(store.getState().rankingVisible).toBe(false);
  });

  it("keeps the selected probe visible when candidate importance changes", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    store.setImportance("travel", "CRITICAL");
    expect(store.getState().activeProbeId).toBe("technical-ownership");
    expect(store.getState().selectionState).toBe("ACTIVE");
    expect(store.getState().rankingVisible).toBe(false);
  });

  it("rejects empty interview text", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    expect(() =>
      recordInterviewAnswerTool(store, {
        stance: "CHALLENGES",
        text: "   ",
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      }),
    ).toThrow(/empty/i);
  });

  it("records answers only against the active probe", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    expect(() =>
      recordInterviewAnswerTool(store, {
        claimId: "travel",
        stance: "CHALLENGES",
        text: "Hiring manager said travel exceeded 50%.",
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      }),
    ).toThrow(/active probe/i);
  });

  it("exposes authority coverage and omits raw employer prose from case state", () => {
    const store = createCaseStore();
    const state = getCaseState(store);
    const ownership = state.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    expect(ownership).toBeDefined();
    expect(ownership).not.toHaveProperty("employerStatement");
    expect(ownership?.authorityCoverage).toMatchObject({
      employerStated: { present: true },
      reportedExperience: { count: 2, coverage: 0.55 },
      candidateSpecificAnswer: { present: false, resolving: false },
    });
  });
});
