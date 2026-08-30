import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { decisionPathNodes } from "@/lib/domain/decision-path";
import {
  coverageBreakdownFor,
  sourceOrganization,
  uniqueChallengingReportCount,
  uniqueSupportingReportCount,
} from "@/lib/domain/policy";
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
    expect(uniqueSupportingReportCount(after?.evidence ?? [])).toBe(1);
    expect(uniqueChallengingReportCount(after?.evidence ?? [])).toBe(2);
    const path = after ? decisionPathNodes(after) : [];
    expect(path.find((node) => node.label === "Evidence")?.body).toBe(
      "Employer ✓ · Public 1 support / 2 challenges · Interview —",
    );
  });

  it("keeps distinct co.kr companies and hosted blogs as distinct sources", () => {
    expect(sourceOrganization("https://company-a.co.kr/a")).toBe(
      "company-a.co.kr",
    );
    expect(sourceOrganization("https://company-b.co.kr/b")).toBe(
      "company-b.co.kr",
    );
    expect(sourceOrganization("https://a.substack.com/p/1")).toBe(
      "a.substack.com",
    );
    expect(sourceOrganization("https://b.substack.com/p/2")).toBe(
      "b.substack.com",
    );
  });
});
