import { CLAIM_KIND, type DerivedCase } from "./types";

export const NO_PROBE_REASON = {
  NO_ELIGIBLE_PRIORITIZED_PROBE: "NO_ELIGIBLE_PRIORITIZED_PROBE",
  UNPRIORITIZED_LIVED_CLAIMS_REMAIN: "UNPRIORITIZED_LIVED_CLAIMS_REMAIN",
} as const;

export function noProbeDetails(derived: DerivedCase) {
  const unprioritizedLivedClaimCount = derived.claims.filter(
    (claim) =>
      claim.kind === CLAIM_KIND.LIVED_EXPERIENCE && !claim.candidatePrioritySet,
  ).length;
  return {
    reason:
      unprioritizedLivedClaimCount > 0
        ? NO_PROBE_REASON.UNPRIORITIZED_LIVED_CLAIMS_REMAIN
        : NO_PROBE_REASON.NO_ELIGIBLE_PRIORITIZED_PROBE,
    unprioritizedLivedClaimCount,
  } as const;
}
