import { describe, expect, it } from "vitest";
import { decisionPathNodes } from "@/lib/domain/decision-path";
import { deriveCase } from "@/lib/domain/derive-case";
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
      "Claim",
      "Candidate importance",
      "Employer claim",
      "Public evidence",
      "Candidate interview",
      "Why this is unresolved",
      "Still unknown",
      "Measure",
      "Next step",
    ]);
    expect(nodes[0]?.body).toBe("Technical ownership");
    expect(nodes[1]?.body).toBe("Critical to you");
    expect(nodes[3]?.body).toBe("1 support · 1 challenge");
    expect(nodes[4]?.body).toBe("Missing");
    expect(nodes[5]?.body).toBe("Material ambiguity remains");
    expect(nodes.map((node) => node.body).join(" ")).not.toMatch(/0\.\d{2,}/);
  });
});
