import type { CaseStore } from "@/lib/case-store";
import { type CandidatePriorityInput, IMPORTANCE } from "@/lib/domain/types";
import { getCaseState } from "@/lib/webmcp/case-state";

export function setCandidatePrioritiesTool(
  store: CaseStore,
  input: { readonly priorities: readonly CandidatePriorityInput[] },
) {
  if (input.priorities.length === 0) {
    throw new Error("At least one candidate priority is required");
  }
  if (input.priorities.length > 8) {
    throw new Error("At most eight candidate priorities are allowed");
  }
  const invalidImportance = input.priorities.find(
    (priority) => !Object.values(IMPORTANCE).includes(priority.importance),
  );
  if (invalidImportance) {
    throw new Error("Invalid importance value");
  }
  const claimIds = input.priorities.map((priority) => priority.claimId);
  if (new Set(claimIds).size !== claimIds.length) {
    throw new Error("Candidate priorities contain duplicate claim IDs");
  }
  const knownClaimIds = new Set(
    store.getState().source.claims.map((claim) => claim.id),
  );
  const unknownClaimId = claimIds.find(
    (claimId) => !knownClaimIds.has(claimId),
  );
  if (unknownClaimId) {
    throw new Error("Unknown claim ID in priorities");
  }

  store.setPriorities(input.priorities);
  return {
    ok: true as const,
    updated_priorities: input.priorities.map((priority) => ({
      claim_id: priority.claimId,
      importance: priority.importance,
    })),
    ...getCaseState(store),
  };
}
