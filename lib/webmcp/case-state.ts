import type { CaseStore } from "@/lib/case-store";
import {
  coverageBreakdownFor,
  employerSourceOrganizationMatch,
  sourceOrganization,
} from "@/lib/domain/policy";
import { type DerivedClaim, EVIDENCE_PROVENANCE } from "@/lib/domain/types";

function publicClaim(claim: DerivedClaim, caseOrganization: string) {
  return {
    id: claim.id,
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
      sourceOrganizationMatch: employerSourceOrganizationMatch(
        item,
        caseOrganization,
      ),
    })),
  };
}

export function getCaseState(store: CaseStore) {
  const snapshot = store.getState();
  const caseOrganization = sourceOrganization(snapshot.source.sourceUrl);
  return {
    origin: snapshot.source.origin,
    activeProbeId: snapshot.activeProbeId,
    rankingVisible: snapshot.rankingVisible,
    selectionState: snapshot.selectionState,
    claims: snapshot.derived.claims.map((claim) =>
      publicClaim(claim, caseOrganization),
    ),
  };
}
