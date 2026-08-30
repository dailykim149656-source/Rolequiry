import { describe, expect, it } from "vitest";
import {
  decisionPathHint,
  decisionPathNodes,
  publicEvidenceLine,
} from "@/lib/domain/decision-path";
import {
  deriveCase,
  recordInterviewAnswer,
  recordResearchEvidence,
} from "@/lib/domain/derive-case";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";

describe("decision path projection", () => {
  it("explains why ownership is the current question without exposing scores", () => {
    const derived = deriveCase(ATLAS_FDE);
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    if (!ownership) throw new Error("ownership missing");
    const nodes = decisionPathNodes(ownership);
    expect(nodes.map((node) => node.label)).toEqual([
      "Active claim",
      "Evidence",
      "Why unresolved",
      "Need to know",
      "Measure / next",
    ]);
    expect(nodes[0]?.body).toBe("Technical ownership · Critical to you");
    expect(nodes[1]?.body).toBe(
      "Employer claim present · Public 1 support / 1 challenge · Interview —",
    );
    expect(nodes[2]?.body).toBe("Material ambiguity remains");
    expect(nodes.map((node) => node.body).join(" ")).not.toMatch(/0\.\d{2,}/);
  });

  it("does not call a resolved probe still unresolved after evidence lands", () => {
    const derived = deriveCase(
      recordInterviewAnswer(ATLAS_FDE, {
        claimId: "technical-ownership",
        stance: "SUPPORTS",
        text: "Hiring manager said FDEs ship customer-site changes themselves.",
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      }),
    );
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    if (!ownership) throw new Error("ownership missing");
    const nodes = decisionPathNodes(ownership, "EVIDENCE_UPDATED");
    expect(nodes.map((node) => node.label)).toEqual([
      "Case state",
      "What changed",
      "Next",
    ]);
    expect(
      nodes.map((node) => `${node.label} ${node.body}`).join(" "),
    ).not.toMatch(/Why unresolved/i);
  });

  it("points What changed at the last evidence item", () => {
    const afterInterview = recordInterviewAnswer(ATLAS_FDE, {
      claimId: "technical-ownership",
      stance: "SUPPORTS",
      text: "Hiring manager said FDEs ship customer-site changes themselves.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    const afterResearch = recordResearchEvidence(afterInterview, {
      claimId: "technical-ownership",
      stance: "SUPPORTS",
      text: "Official engineering page confirms on-site owners ship changes.",
      sourceKind: "FIRST_PERSON_EXPERIENCE",
      sourceLabel: "Engineering page",
      sourceUrl: "https://example.com/ownership",
    });
    const ownership = deriveCase(afterResearch).claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    if (!ownership) throw new Error("ownership missing");
    const nodes = decisionPathNodes(ownership, "EVIDENCE_UPDATED");
    expect(nodes.find((node) => node.label === "What changed")?.body).toContain(
      "Engineering page",
    );
    expect(
      nodes.find((node) => node.label === "What changed")?.body,
    ).not.toMatch(/Hiring manager/i);
  });

  it("asks to check again after priorities change without re-ranking", () => {
    expect(decisionPathHint("ACTIVE", false)).toMatch(/check again/i);
    expect(decisionPathHint("ACTIVE", true)).toBeNull();
  });

  it("shows the latest source on an unresolved research update", () => {
    const updated = recordResearchEvidence(ATLAS_FDE, {
      claimId: "technical-ownership",
      stance: "CHALLENGES",
      text: "A first-person post says platform review blocked on-site changes.",
      sourceKind: "FIRST_PERSON_EXPERIENCE",
      sourceLabel: "Engineering blog",
      sourceUrl: "https://example.com/ownership-post",
    });
    const ownership = deriveCase(updated).claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    if (!ownership) throw new Error("ownership missing");
    const evidence = decisionPathNodes(ownership, "EVIDENCE_UPDATED").find(
      (node) => node.label === "Evidence",
    );
    expect(ownership.probeEligible).toBe(true);
    expect(evidence?.body).toContain("Latest: Engineering blog · challenges");
    expect(evidence?.href).toBe("https://example.com/ownership-post");
  });

  it("labels employer-official challenges without implying verification", () => {
    const updated = recordResearchEvidence(ATLAS_FDE, {
      claimId: "technical-ownership",
      stance: "CHALLENGES",
      text: "Official engineering page says platform review is required.",
      sourceKind: "EMPLOYER_OFFICIAL",
      sourceLabel: "Engineering page",
      sourceUrl: "https://northwind.example.com/eng",
    });
    const ownership = deriveCase(updated).claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    if (!ownership) throw new Error("ownership missing");
    expect(publicEvidenceLine(ownership)).toContain("Employer-source conflict");
    expect(publicEvidenceLine(ownership)).not.toContain("✓");
  });
});
