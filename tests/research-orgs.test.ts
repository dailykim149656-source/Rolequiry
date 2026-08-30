import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { coverageBreakdownFor } from "@/lib/domain/policy";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";
import {
  recordResearchEvidenceTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("independent research orgs", () => {
  it("still counts fixture reports without URLs as separate items", () => {
    const ownership = ATLAS_FDE.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    expect(
      coverageBreakdownFor("LIVED_EXPERIENCE", ownership?.evidence ?? [])
        .reportedExperience,
    ).toMatchObject({ count: 2, coverage: 0.55 });
  });

  it("counts two posts from the same organization as one reported source", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    const before = store
      .getState()
      .derived.claims.find((claim) => claim.id === "technical-ownership");
    recordResearchEvidenceTool(store, {
      stance: "CHALLENGES",
      summary: "First-person post A.",
      sourceUrl: "https://notes.example.com/a",
      sourceLabel: "Post A",
      sourceKind: "FIRST_PERSON_EXPERIENCE",
    });
    selectDecisionChanger(store);
    recordResearchEvidenceTool(store, {
      stance: "CHALLENGES",
      summary: "First-person post B.",
      sourceUrl: "https://notes.example.com/b",
      sourceLabel: "Post B",
      sourceKind: "FIRST_PERSON_EXPERIENCE",
    });
    const after = store
      .getState()
      .derived.claims.find((claim) => claim.id === "technical-ownership");
    expect(after?.evidence.length).toBe((before?.evidence.length ?? 0) + 2);
    expect(
      coverageBreakdownFor("LIVED_EXPERIENCE", after?.evidence ?? [])
        .reportedExperience.count,
    ).toBe(3);
    expect(after?.tension).toBeCloseTo(0.7, 3);
  });
});
