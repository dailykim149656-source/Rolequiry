import {
  AUTHORITY_SCOPE,
  type AuthorityScope,
  CLAIM_KIND,
  type ClaimKind,
  type ClaimStatus,
  type Evidence,
  IMPORTANCE,
  type Importance,
} from "./types";

export { IMPORTANCE };

export const IMPORTANCE_WEIGHT = {
  LOW: 0.25,
  MEDIUM: 0.5,
  HIGH: 0.75,
  CRITICAL: 1,
} as const satisfies Record<Importance, number>;

export const LIVED_EXPERIENCE_WEIGHT = {
  EMPLOYER_STATED: 0.2,
  REPORTED_EXPERIENCE: 0.3,
  CANDIDATE_SPECIFIC_ANSWER: 0.5,
} as const satisfies Record<AuthorityScope, number>;

const POLICY_KEYWORDS = [
  "compensation",
  "benefits",
  "leave",
  "location",
  "remote",
  "visa",
  "contract",
  "policy",
] as const;

export function deriveClaimKind(input: {
  readonly dimension: string;
  readonly employerStatement: string;
  readonly kind?: ClaimKind;
}): ClaimKind {
  if (input.kind) return input.kind;
  const haystack =
    `${input.dimension} ${input.employerStatement}`.toLowerCase();
  return POLICY_KEYWORDS.some((keyword) => haystack.includes(keyword))
    ? CLAIM_KIND.EMPLOYER_POLICY
    : CLAIM_KIND.LIVED_EXPERIENCE;
}

export function requiredScopes(kind: ClaimKind): readonly AuthorityScope[] {
  if (kind === CLAIM_KIND.EMPLOYER_POLICY)
    return [AUTHORITY_SCOPE.EMPLOYER_STATED];
  return [
    AUTHORITY_SCOPE.EMPLOYER_STATED,
    AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
    AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER,
  ];
}

export function reportedCoverage(reportCount: number): number {
  if (reportCount <= 0) return 0;
  if (reportCount === 1) return 0.3;
  if (reportCount === 2) return 0.55;
  if (reportCount === 3) return 0.7;
  return 1;
}

export function reportedChallengeTension(challengingCount: number): number {
  if (challengingCount <= 0) return 0;
  if (challengingCount === 1) return 0.5;
  if (challengingCount === 2) return 0.7;
  return 0.9;
}

export function unresolvednessFor(
  kind: ClaimKind,
  evidence: readonly Evidence[],
): number {
  if (kind === CLAIM_KIND.EMPLOYER_POLICY) {
    const covered = evidence.some(
      (item) => item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED,
    );
    return covered ? 0 : 1;
  }

  const reports = evidence.filter(
    (item) => item.scope === AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
  );
  const hasEmployer = evidence.some(
    (item) => item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED,
  );
  const hasAnswer = evidence.some(
    (item) => item.scope === AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER,
  );
  const covered =
    (hasEmployer ? LIVED_EXPERIENCE_WEIGHT.EMPLOYER_STATED : 0) +
    LIVED_EXPERIENCE_WEIGHT.REPORTED_EXPERIENCE *
      reportedCoverage(reports.length) +
    (hasAnswer ? LIVED_EXPERIENCE_WEIGHT.CANDIDATE_SPECIFIC_ANSWER : 0);
  return 1 - covered;
}

export function tensionFor(evidence: readonly Evidence[]): number {
  const hasChallengingAnswer = evidence.some(
    (item) =>
      item.scope === AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER &&
      item.stance === "CHALLENGES",
  );
  if (hasChallengingAnswer) return 1;
  const challengingReports = evidence.filter(
    (item) =>
      item.scope === AUTHORITY_SCOPE.REPORTED_EXPERIENCE &&
      item.stance === "CHALLENGES",
  ).length;
  return reportedChallengeTension(challengingReports);
}

export function claimStatus(input: {
  readonly importance: Importance;
  readonly unresolvedness: number;
  readonly tension: number;
}): ClaimStatus {
  if (input.unresolvedness <= 0.35 && input.tension < 0.5) return "SUPPORTED";
  if (input.tension >= 0.7) return "CHALLENGED";
  if (
    IMPORTANCE_WEIGHT[input.importance] >= 0.75 &&
    input.unresolvedness >= 0.35
  ) {
    return "MATERIAL_AMBIGUITY";
  }
  return "UNVERIFIED";
}

export function probePriority(input: {
  readonly importance: Importance;
  readonly unresolvedness: number;
  readonly tension: number;
}): { readonly probeEligible: boolean; readonly probePriority: number } {
  const probeEligible = input.unresolvedness >= 0.35;
  if (!probeEligible) return { probeEligible, probePriority: 0 };
  return {
    probeEligible,
    probePriority:
      0.4 * IMPORTANCE_WEIGHT[input.importance] +
      0.3 * input.unresolvedness +
      0.3 * input.tension,
  };
}
