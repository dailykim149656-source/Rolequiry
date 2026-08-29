import { describe, expect, it } from "vitest";
import {
  deriveCase,
  recordInterviewAnswer,
  setClaimImportance,
} from "@/lib/domain/derive-case";
import { IMPORTANCE } from "@/lib/domain/policy";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";

describe("Fixture A deriveCase", () => {
  it("selects technical ownership initially even though travel has stronger tension", () => {
    const derived = deriveCase(ATLAS_FDE);

    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    const travel = derived.claims.find((claim) => claim.id === "travel");
    const compensation = derived.claims.find(
      (claim) => claim.id === "compensation",
    );
    const customer = derived.claims.find(
      (claim) => claim.id === "customer-interaction",
    );

    expect(ownership?.unresolvedness).toBeCloseTo(0.635, 3);
    expect(ownership?.tension).toBeCloseTo(0.5, 3);
    expect(ownership?.probePriority).toBeCloseTo(0.741, 3);
    expect(ownership?.status).toBe("MATERIAL_AMBIGUITY");

    expect(travel?.unresolvedness).toBeCloseTo(0.59, 3);
    expect(travel?.tension).toBeCloseTo(0.9, 3);
    expect(travel?.probePriority).toBeCloseTo(0.547, 3);
    expect(travel?.status).toBe("CHALLENGED");

    expect(customer?.status).toBe("SUPPORTED");
    expect(customer?.probeEligible).toBe(false);

    expect(compensation?.status).toBe("SUPPORTED");
    expect(compensation?.probeEligible).toBe(false);
    expect(
      (compensation?.probePriority ?? 1) < (ownership?.probePriority ?? 0),
    ).toBe(true);

    expect(derived.topProbeId).toBe("technical-ownership");
    expect(
      (ownership?.probePriority ?? 0) - (travel?.probePriority ?? 0),
    ).toBeGreaterThanOrEqual(0.15);
  });

  it("flips the selected probe when travel is raised to CRITICAL", () => {
    const raised = setClaimImportance(ATLAS_FDE, "travel", IMPORTANCE.CRITICAL);
    const derived = deriveCase(raised);
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );
    const travel = derived.claims.find((claim) => claim.id === "travel");

    expect(travel?.probePriority).toBeCloseTo(0.847, 3);
    expect(derived.topProbeId).toBe("travel");
    expect(
      (travel?.probePriority ?? 0) - (ownership?.probePriority ?? 0),
    ).toBeGreaterThanOrEqual(0.05);
  });

  it("closes the ownership loop after a challenging interview answer", () => {
    const answered = recordInterviewAnswer(ATLAS_FDE, {
      claimId: "technical-ownership",
      stance: "CHALLENGES",
      text: "Hiring manager said ownership is split with a central platform team after design review.",
      speakerRole: "hiring-manager",
    });
    const derived = deriveCase(answered);
    const ownership = derived.claims.find(
      (claim) => claim.id === "technical-ownership",
    );

    expect(ownership?.unresolvedness).toBeCloseTo(0.135, 3);
    expect(ownership?.status).toBe("CHALLENGED");
    expect(ownership?.probeEligible).toBe(false);
    expect(ownership?.probePriority).toBe(0);
  });
});
