import { describe, expect, it } from "vitest";
import { decisionPathNodes } from "@/lib/domain/decision-path";
import { deriveCase, recordInterviewAnswer } from "@/lib/domain/derive-case";
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
      "Employer ✓ · Public 1 support / 1 challenge · Interview —",
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
});
