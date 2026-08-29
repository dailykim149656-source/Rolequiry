import { describe, expect, it } from "vitest";
import { deriveCase } from "@/lib/domain/derive-case";
import { KESTREL_SOLUTIONS } from "@/lib/fixtures/kestrel-solutions";

describe("Fixture B generalization", () => {
  it("makes HIGH hands-on coding outrank CRITICAL on-call under the same policy", () => {
    const derived = deriveCase(KESTREL_SOLUTIONS);
    const onCall = derived.claims.find((claim) => claim.id === "on-call-load");
    const coding = derived.claims.find(
      (claim) => claim.id === "hands-on-coding",
    );

    expect(onCall?.unresolvedness).toBeCloseTo(0.8, 3);
    expect(onCall?.tension).toBeCloseTo(0, 3);
    expect(onCall?.probePriority).toBeCloseTo(0.64, 3);
    expect(coding?.unresolvedness).toBeCloseTo(0.59, 3);
    expect(coding?.tension).toBeCloseTo(0.9, 3);
    expect(coding?.probePriority).toBeCloseTo(0.747, 3);
    expect(derived.topProbeId).toBe("hands-on-coding");
    expect((coding?.probePriority ?? 0) > (onCall?.probePriority ?? 1)).toBe(
      true,
    );
  });
});
