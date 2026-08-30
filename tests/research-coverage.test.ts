import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { coverageBreakdownFor } from "@/lib/domain/policy";
import {
  recordResearchEvidenceTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

function record(
  store: ReturnType<typeof createCaseStore>,
  stance: "SUPPORTS" | "CHALLENGES" | "NEUTRAL",
  url = "https://example.com/post",
) {
  return recordResearchEvidenceTool(store, {
    stance,
    summary: "A first-person post about ownership.",
    sourceUrl: url,
    sourceLabel: "Engineering post",
    sourceKind: "FIRST_PERSON_EXPERIENCE",
  });
}

describe("research coverage", () => {
  it("does not let NEUTRAL reported evidence reduce unresolvedness", () => {
    const store = createCaseStore();
    const before = store
      .getState()
      .derived.claims.find((claim) => claim.id === "technical-ownership");
    selectDecisionChanger(store);
    record(store, "NEUTRAL");
    const after = store
      .getState()
      .derived.claims.find((claim) => claim.id === "technical-ownership");
    expect(after?.unresolvedness).toBeCloseTo(before?.unresolvedness ?? 0, 3);
    expect(
      coverageBreakdownFor("LIVED_EXPERIENCE", after?.evidence ?? [])
        .reportedExperience.count,
    ).toBe(2);
  });

  it("rejects a duplicate research URL on the same claim", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    record(store, "CHALLENGES");
    selectDecisionChanger(store);
    expect(() => record(store, "CHALLENGES")).toThrow(/duplicate/i);
  });

  it("treats a hashed URL as the same research source", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    record(store, "CHALLENGES", "https://example.com/post#comments");
    selectDecisionChanger(store);
    expect(() => record(store, "SUPPORTS", "https://example.com/post")).toThrow(
      /duplicate/i,
    );
  });

  it("rejects a non-http research URL", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    expect(() => record(store, "CHALLENGES", "ftp://example.com/post")).toThrow(
      /http/i,
    );
  });
});
