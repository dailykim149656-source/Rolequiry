import type { CaseStore } from "@/lib/case-store";
import { coverageBreakdownFor } from "@/lib/domain/policy";
import { type DerivedClaim, EVIDENCE_PROVENANCE } from "@/lib/domain/types";

function publicClaim(claim: DerivedClaim, rankingVisible: boolean) {
  return {
    id: claim.id,
    dimension: claim.dimension,
    importance: claim.importance,
    candidatePrioritySet: claim.candidatePrioritySet,
    kind: claim.kind,
    status: claim.status,
    unresolvedness: Number(claim.unresolvedness.toFixed(3)),
    tension: Number(claim.tension.toFixed(3)),
    probeEligible: claim.probeEligible,
    authorityCoverage: coverageBreakdownFor(claim.kind, claim.evidence),
    evidenceSummary: claim.evidence.map((item) => ({
      id: item.id,
      scope: item.scope,
      stance: item.stance,
      speakerRole: item.speakerRole ?? null,
      sourceKind: item.sourceKind ?? null,
      provenance: item.provenance ?? EVIDENCE_PROVENANCE.CASE_INPUT,
      synthetic:
        item.synthetic ?? item.text.toLowerCase().includes("synthetic"),
    })),
    ...(rankingVisible
      ? {
          probePriority: Number(claim.probePriority.toFixed(3)),
          unresolvedVariable: claim.unresolvedVariable,
          measurableForm: claim.measurableForm,
        }
      : {}),
  };
}

export function getCaseState(store: CaseStore) {
  const snapshot = store.getState();
  return {
    company: snapshot.source.company,
    role: snapshot.source.role,
    origin: snapshot.source.origin,
    sourceUrl: snapshot.source.sourceUrl ?? null,
    activeProbeId: snapshot.activeProbeId,
    rankingVisible: snapshot.rankingVisible,
    selectionState: snapshot.selectionState,
    claims: snapshot.derived.claims.map((claim) => publicClaim(claim, false)),
  };
}
