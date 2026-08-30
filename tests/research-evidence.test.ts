import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import {
  deriveCase,
  importRoleFromClaims,
  recordInterviewAnswer,
  recordResearchEvidence,
} from "@/lib/domain/derive-case";
import { deriveClaimKind } from "@/lib/domain/policy";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";
import {
  CASE_TOOL_CONTRACTS,
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
    expect(added?.sourceUrl).toBe("https://example.com/post");
    expect(added).toMatchObject({ provenance: "AGENT_REPORTED" });
    expect(store.getState().selectionState).toBe("EVIDENCE_UPDATED");
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

  it("rejects non-http research URLs", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    expect(() =>
      recordResearchEvidenceTool(store, {
        stance: "SUPPORTS",
        summary: "A first-person post describes broad ownership.",
        sourceUrl: "javascript:alert(1)",
        sourceLabel: "Engineering post",
        sourceKind: "FIRST_PERSON_EXPERIENCE",
      }),
    ).toThrow(/http/i);
  });

  it("marks official employer contradictions as challenged", () => {
    const updated = recordResearchEvidence(ATLAS_FDE, {
      claimId: "compensation",
      stance: "CHALLENGES",
      text: "Official compensation page lists $150k-$180k for this level.",
      sourceKind: "EMPLOYER_OFFICIAL",
      sourceLabel: "Compensation page",
      sourceUrl: "https://northwind.example.com/comp",
    });
    const compensation = deriveCase(updated).claims.find(
      (claim) => claim.id === "compensation",
    );
    expect(compensation?.tension).toBe(1);
    expect(compensation?.status).toBe("CHALLENGED");
  });

  it("keeps research scoped to the current decision-changing probe", () => {
    const research = CASE_TOOL_CONTRACTS.find(
      (tool) => tool.name === "record_research_evidence",
    );
    expect(research?.description).toMatch(/currently active probe/i);
    expect(research?.description).toMatch(/counterevidence/i);
    expect(research?.description).toMatch(/decision-directed/i);
  });
});

describe("evidence provenance", () => {
  it("records who supplied each evidence item without trusting source prose", () => {
    const imported = importRoleFromClaims({
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
    expect(imported.claims[0]?.evidence[0]).toMatchObject({
      provenance: "CASE_INPUT",
    });

    const interviewed = recordInterviewAnswer(ATLAS_FDE, {
      claimId: "technical-ownership",
      stance: "SUPPORTS",
      text: "The hiring manager described a recent independently shipped change.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    expect(interviewed.claims[0]?.evidence.at(-1)).toMatchObject({
      provenance: "CANDIDATE_REPORTED",
    });

    const researched = recordResearchEvidence(ATLAS_FDE, {
      claimId: "technical-ownership",
      stance: "SUPPORTS",
      text: "An employer page describes end-to-end ownership.",
      sourceKind: "EMPLOYER_OFFICIAL",
      sourceLabel: "Engineering page",
      sourceUrl: "https://northwind.example.com/engineering",
    });
    expect(researched.claims[0]?.evidence.at(-1)).toMatchObject({
      provenance: "AGENT_REPORTED",
    });
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
