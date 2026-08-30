import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { deriveClaimKind } from "@/lib/domain/policy";
import {
  importRoleFromClaimsTool,
  recordResearchEvidenceTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("policy classification", () => {
  it("does not resolve a vague benefits statement as employer policy", () => {
    expect(
      deriveClaimKind({
        dimension: "Benefits",
        employerStatement: "We offer competitive benefits.",
      }),
    ).toBe("LIVED_EXPERIENCE");
  });

  it("still treats a measurable compensation band as employer policy", () => {
    expect(
      deriveClaimKind({
        dimension: "Base pay",
        employerStatement: "$190k-$220k base",
      }),
    ).toBe("EMPLOYER_POLICY");
  });
});

describe("record_research_evidence", () => {
  it("maps first-person research onto the active probe as reported experience", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    const before = store
      .getState()
      .source.claims.find((claim) => claim.id === "technical-ownership")
      ?.evidence.length;
    const result = recordResearchEvidenceTool(store, {
      stance: "CHALLENGES",
      summary:
        "A first-person post says production changes require central platform approval.",
      sourceUrl: "https://example.com/post",
      sourceLabel: "Engineering blog comment",
      sourceKind: "FIRST_PERSON_EXPERIENCE",
    });
    expect(result.ok).toBe(true);
    const ownership = store
      .getState()
      .source.claims.find((claim) => claim.id === "technical-ownership");
    const added = ownership?.evidence.at(-1);
    expect(ownership?.evidence.length).toBe((before ?? 0) + 1);
    expect(added?.scope).toBe("REPORTED_EXPERIENCE");
    expect(added?.sourceKind).toBe("REPORTED_EXPERIENCE");
    expect(store.getState().selectionState).toBe("IDLE");
  });

  it("rejects news-like sources that the authority model cannot own", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    expect(() =>
      recordResearchEvidenceTool(store, {
        stance: "CHALLENGES",
        summary: "A news article says the team ships slowly.",
        sourceUrl: "https://news.example.com/story",
        sourceLabel: "News site",
        sourceKind: "NEWS_ARTICLE",
      }),
    ).toThrow(/source/i);
  });
});

describe("imported priority banner", () => {
  it("keeps ranking blocked until a human sets importance", () => {
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
    expect(selectDecisionChanger(store).outcome).toBe("PRIORITIES_REQUIRED");
    expect(store.getState().prioritiesTouched).toBe(false);
  });
});
