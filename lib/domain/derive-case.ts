import {
  claimStatus,
  deriveClaimKind,
  probePriority,
  tensionFor,
  unresolvednessFor,
} from "./policy";
import type {
  DerivedCase,
  DerivedClaim,
  Importance,
  InterviewAnswerInput,
  RoleCase,
  SourceClaim,
} from "./types";
import { AUTHORITY_SCOPE } from "./types";

function deriveClaim(claim: SourceClaim): DerivedClaim {
  const kind = deriveClaimKind(claim);
  const unresolvedness = unresolvednessFor(kind, claim.evidence);
  const tension = tensionFor(claim.evidence);
  const ranking = probePriority({
    importance: claim.importance,
    unresolvedness,
    tension,
  });
  return {
    id: claim.id,
    dimension: claim.dimension,
    employerStatement: claim.employerStatement,
    importance: claim.importance,
    kind,
    unresolvedVariable: claim.unresolvedVariable,
    measurableForm: claim.measurableForm,
    evidence: claim.evidence,
    unresolvedness,
    tension,
    probeEligible: ranking.probeEligible,
    probePriority: ranking.probePriority,
    status: claimStatus({
      importance: claim.importance,
      unresolvedness,
      tension,
    }),
  };
}

export function deriveCase(roleCase: RoleCase): DerivedCase {
  const claims = roleCase.claims.map(deriveClaim);
  const eligible = claims.filter((claim) => claim.probeEligible);
  const top = eligible.reduce<DerivedClaim | null>((best, claim) => {
    if (!best || claim.probePriority > best.probePriority) return claim;
    return best;
  }, null);
  return {
    id: roleCase.id,
    company: roleCase.company,
    role: roleCase.role,
    origin: roleCase.origin,
    claims,
    topProbeId: top?.id ?? null,
  };
}

export function setClaimImportance(
  roleCase: RoleCase,
  claimId: string,
  importance: Importance,
): RoleCase {
  return {
    ...roleCase,
    claims: roleCase.claims.map((claim) =>
      claim.id === claimId ? { ...claim, importance } : claim,
    ),
  };
}

export function recordInterviewAnswer(
  roleCase: RoleCase,
  input: InterviewAnswerInput,
): RoleCase {
  return {
    ...roleCase,
    claims: roleCase.claims.map((claim) => {
      if (claim.id !== input.claimId) return claim;
      const nextEvidence = [
        ...claim.evidence,
        {
          id: `${claim.id}-interview-${claim.evidence.length + 1}`,
          scope: AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER,
          stance: input.stance,
          text: input.text,
          speakerRole: input.speakerRole,
        },
      ];
      return { ...claim, evidence: nextEvidence };
    }),
  };
}
