import { IMPORTANCE_WEIGHT } from "./policy";
import type {
  ClaimStatus,
  DerivedCase,
  DerivedClaim,
  Importance,
  SpeakerRole,
} from "./types";
import { CLAIM_KIND, IMPORTANCE, SPEAKER_ROLE } from "./types";

export const DOSSIER_RESOLUTION = {
  SUFFICIENTLY_RESOLVED: "SUFFICIENTLY_RESOLVED",
  CONTRADICTED: "CONTRADICTED",
  AWAITING_PRIORITY: "AWAITING_PRIORITY",
  ASK_IN_INTERVIEW: "ASK_IN_INTERVIEW",
} as const;
export type DossierResolution =
  (typeof DOSSIER_RESOLUTION)[keyof typeof DOSSIER_RESOLUTION];

export type DossierEntry = {
  readonly claimId: string;
  readonly dimension: string;
  readonly status: ClaimStatus;
  readonly resolution: DossierResolution;
  readonly unresolvedness: number;
};

export type DossierTier = {
  readonly importance: Importance;
  readonly entries: readonly DossierEntry[];
};

export type InterviewQuestion = {
  readonly claimId: string;
  readonly dimension: string;
  readonly importance: Importance;
  readonly askWho: SpeakerRole;
  readonly question: string;
  readonly context: string;
};

export type DecisionDossier = {
  readonly remainingDecisionBlockers: number;
  readonly tiers: readonly DossierTier[];
  readonly interviewPack: readonly InterviewQuestion[];
};

const IMPORTANCE_ORDER: readonly Importance[] = [
  IMPORTANCE.CRITICAL,
  IMPORTANCE.HIGH,
  IMPORTANCE.MEDIUM,
  IMPORTANCE.LOW,
];

// Decision-rights questions belong to the hiring manager; day-to-day cadence
// belongs to the people living it. Policy claims are employer-official.
const MANAGER_SCOPE =
  /authority|decision|ownership|approval|sign-?off|architecture/i;

export function dossierResolution(claim: DerivedClaim): DossierResolution {
  if (claim.status === "SUPPORTED") {
    return DOSSIER_RESOLUTION.SUFFICIENTLY_RESOLVED;
  }
  if (claim.status === "CHALLENGED") return DOSSIER_RESOLUTION.CONTRADICTED;
  if (!claim.candidatePrioritySet) return DOSSIER_RESOLUTION.AWAITING_PRIORITY;
  return DOSSIER_RESOLUTION.ASK_IN_INTERVIEW;
}

export function interviewAskWho(
  claim: Pick<DerivedClaim, "kind" | "dimension" | "unresolvedVariable">,
): SpeakerRole {
  if (claim.kind === CLAIM_KIND.EMPLOYER_POLICY) return SPEAKER_ROLE.RECRUITER;
  return MANAGER_SCOPE.test(`${claim.dimension} ${claim.unresolvedVariable}`)
    ? SPEAKER_ROLE.HIRING_MANAGER
    : SPEAKER_ROLE.TEAM_MEMBER;
}

function stableTextCompare(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function rankingOrder(left: DerivedClaim, right: DerivedClaim): number {
  if (left.probePriority !== right.probePriority) {
    return right.probePriority - left.probePriority;
  }
  const dimensionOrder = stableTextCompare(left.dimension, right.dimension);
  if (dimensionOrder !== 0) return dimensionOrder;
  return stableTextCompare(left.id, right.id);
}

function toEntry(claim: DerivedClaim): DossierEntry {
  return {
    claimId: claim.id,
    dimension: claim.dimension,
    status: claim.status,
    resolution: dossierResolution(claim),
    unresolvedness: Number(claim.unresolvedness.toFixed(3)),
  };
}

export function deriveDossier(derived: DerivedCase): DecisionDossier {
  const remainingDecisionBlockers = derived.claims.filter(
    (claim) =>
      IMPORTANCE_WEIGHT[claim.importance] >= IMPORTANCE_WEIGHT.HIGH &&
      claim.status !== "SUPPORTED",
  ).length;
  const tiers = IMPORTANCE_ORDER.map((importance) => ({
    importance,
    entries: derived.claims
      .filter((claim) => claim.importance === importance)
      .sort(rankingOrder)
      .map(toEntry),
  })).filter((tier) => tier.entries.length > 0);
  const interviewPack = derived.claims
    .filter(
      (claim) =>
        dossierResolution(claim) === DOSSIER_RESOLUTION.ASK_IN_INTERVIEW,
    )
    .sort(
      (left, right) =>
        IMPORTANCE_WEIGHT[right.importance] -
          IMPORTANCE_WEIGHT[left.importance] || rankingOrder(left, right),
    )
    .map((claim) => ({
      claimId: claim.id,
      dimension: claim.dimension,
      importance: claim.importance,
      askWho: interviewAskWho(claim),
      question: claim.measurableForm,
      context: claim.unresolvedVariable,
    }));
  return { remainingDecisionBlockers, tiers, interviewPack };
}
