import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { deriveCase, recordInterviewAnswer } from "@/lib/domain/derive-case";
import { coverageBreakdownFor } from "@/lib/domain/policy";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";
import {
  getCaseState,
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

function answer(stance: "SUPPORTS" | "CHALLENGES" | "NEUTRAL") {
  return recordInterviewAnswer(ATLAS_FDE, {
    claimId: "technical-ownership",
    stance,
    text: "Hiring manager answered the ownership question.",
    speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
  });
}

describe("interview stance coverage", () => {
  it("gives coverage for a SUPPORTS hiring-manager answer and marks the claim SUPPORTED", () => {
    const derived = deriveCase(answer("SUPPORTS"));
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    expect(ownership?.unresolvedness).toBeCloseTo(0.135, 3);
    expect(ownership?.tension).toBeCloseTo(0.5, 3);
    expect(ownership?.status).toBe("SUPPORTED");
    expect(ownership?.probeEligible).toBe(false);
  });

  it("gives coverage for a CHALLENGES hiring-manager answer and marks the claim CHALLENGED", () => {
    const derived = deriveCase(answer("CHALLENGES"));
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    expect(ownership?.unresolvedness).toBeCloseTo(0.135, 3);
    expect(ownership?.status).toBe("CHALLENGED");
    expect(ownership?.probeEligible).toBe(false);
  });

  it("records NEUTRAL testimony without granting candidate-specific coverage", () => {
    const derived = deriveCase(answer("NEUTRAL"));
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    expect(ownership?.unresolvedness).toBeCloseTo(0.635, 3);
    expect(ownership?.status).toBe("MATERIAL_AMBIGUITY");
    expect(ownership?.probeEligible).toBe(true);
    expect(ownership?.evidence.some((item) => item.stance === "NEUTRAL")).toBe(
      true,
    );
  });

  it("returns a counted coverage breakdown from the same policy function", () => {
    const ownership = ATLAS_FDE.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    const travel = ATLAS_FDE.claims.find((claim) => claim.id === "travel");
    expect(
      coverageBreakdownFor("LIVED_EXPERIENCE", ownership?.evidence ?? []),
    ).toMatchObject({
      reportedExperience: { count: 2, coverage: 0.55, contribution: 0.165 },
      candidateSpecificAnswer: {
        present: false,
        resolving: false,
        contribution: 0,
      },
    });
    expect(
      coverageBreakdownFor("LIVED_EXPERIENCE", travel?.evidence ?? [])
        .reportedExperience,
    ).toMatchObject({
      count: 3,
      coverage: 0.7,
      contribution: 0.21,
    });
  });
});

describe("select_decision_changer outcomes", () => {
  it("returns NO_PROBE_NEEDED without throwing when every claim is resolved", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    recordInterviewAnswerTool(store, {
      claimId: "technical-ownership",
      stance: "CHALLENGES",
      text: "Hiring manager said ownership is split with a central platform team after design review.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    store.setImportance("travel", "LOW");
    const travelSelected = selectDecisionChanger(store);
    expect(travelSelected).toMatchObject({
      ok: true,
      outcome: "PROBE_SELECTED",
      claim_id: "travel",
    });
    recordInterviewAnswerTool(store, {
      claimId: "travel",
      stance: "CHALLENGES",
      text: "Hiring manager said travel exceeded 50% during launch windows.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    const result = selectDecisionChanger(store);
    expect(result).toMatchObject({
      ok: true,
      outcome: "NO_PROBE_NEEDED",
      claim_id: null,
    });
    expect(store.getState().activeProbeId).toBeNull();
    expect(store.getState().rankingVisible).toBe(false);
  });

  it("omits an unsorted ranking array from the selected probe payload", () => {
    const store = createCaseStore();
    const result = selectDecisionChanger(store);
    expect(result).not.toHaveProperty("ranking");
    expect("claim_id" in result ? result.claim_id : null).toBe(
      "technical-ownership",
    );
  });

  it("exposes counted authority coverage instead of booleans", () => {
    const store = createCaseStore();
    const ownership = getCaseState(store).claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    expect(ownership?.authorityCoverage).toMatchObject({
      employerStated: { present: true, contribution: 0.2 },
      reportedExperience: { count: 2, coverage: 0.55, contribution: 0.165 },
      candidateSpecificAnswer: {
        present: false,
        resolving: false,
        contribution: 0,
      },
    });
  });
});
