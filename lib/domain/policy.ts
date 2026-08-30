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

const POLICY_DIMENSIONS = [
  "compensation",
  "base pay",
  "benefits",
  "leave",
  "location",
  "visa",
  "contract",
  "policy",
] as const;

const POLICY_STATEMENT =
  /(\$\d|base pay|benefits|visa sponsorship|remote-first|on-site required|paid time off)/i;

export function deriveClaimKind(input: {
  readonly dimension: string;
  readonly employerStatement: string;
  readonly kind?: ClaimKind;
}): ClaimKind {
  if (input.kind) return input.kind;
  const dimension = input.dimension.toLowerCase();
  if (POLICY_DIMENSIONS.some((keyword) => dimension.includes(keyword))) {
    return CLAIM_KIND.EMPLOYER_POLICY;
  }
  return POLICY_STATEMENT.test(input.employerStatement)
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

export function coverageBreakdownFor(
  kind: ClaimKind,
  evidence: readonly Evidence[],
) {
  const employerPresent = evidence.some(
    (item) => item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED,
  );
  const reports = evidence.filter(
    (item) => item.scope === AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
  );
  const answers = evidence.filter(
    (item) => item.scope === AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER,
  );
  const resolvingAnswer = answers.some((item) => item.stance !== "NEUTRAL");
  const reportCoverage = reportedCoverage(reports.length);
  if (kind === CLAIM_KIND.EMPLOYER_POLICY) {
    return {
      employerStated: {
        present: employerPresent,
        contribution: employerPresent ? 1 : 0,
      },
      reportedExperience: {
        count: reports.length,
        coverage: reportCoverage,
        contribution: 0,
      },
      candidateSpecificAnswer: {
        present: answers.length > 0,
        resolving: resolvingAnswer,
        contribution: 0,
      },
      covered: employerPresent ? 1 : 0,
    } as const;
  }
  const employerContribution = employerPresent
    ? LIVED_EXPERIENCE_WEIGHT.EMPLOYER_STATED
    : 0;
  const reportedContribution =
    LIVED_EXPERIENCE_WEIGHT.REPORTED_EXPERIENCE * reportCoverage;
  const answerContribution = resolvingAnswer
    ? LIVED_EXPERIENCE_WEIGHT.CANDIDATE_SPECIFIC_ANSWER
    : 0;
  return {
    employerStated: {
      present: employerPresent,
      contribution: employerContribution,
    },
    reportedExperience: {
      count: reports.length,
      coverage: reportCoverage,
      contribution: reportedContribution,
    },
    candidateSpecificAnswer: {
      present: answers.length > 0,
      resolving: resolvingAnswer,
      contribution: answerContribution,
    },
    covered: employerContribution + reportedContribution + answerContribution,
  } as const;
}

export function unresolvednessFor(
  kind: ClaimKind,
  evidence: readonly Evidence[],
): number {
  return 1 - coverageBreakdownFor(kind, evidence).covered;
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
  if (input.unresolvedness <= 0.35 && input.tension < 0.7) return "SUPPORTED";
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
