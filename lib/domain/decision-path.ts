import {
  coverageBreakdownFor,
  uniqueChallengingReportCount,
  uniqueSupportingReportCount,
} from "./policy";
import type { DerivedClaim, Evidence } from "./types";

export type DecisionPathMode =
  | "IDLE"
  | "ACTIVE"
  | "EVIDENCE_UPDATED"
  | "NO_PROBE_NEEDED"
  | "PRIORITIES_REQUIRED";

export type DecisionPathNode = {
  readonly label: string;
  readonly body: string;
  readonly href?: string;
};

const STATUS_REASON = {
  SUPPORTED: "Supported",
  UNVERIFIED: "Needs evidence",
  MATERIAL_AMBIGUITY: "Material ambiguity remains",
  CHALLENGED: "Conflicting evidence",
} as const;

const IMPORTANCE_REASON = {
  LOW: "Low for you",
  MEDIUM: "Medium for you",
  HIGH: "High for you",
  CRITICAL: "Critical to you",
} as const;

function counted(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function latestSourcedEvidence(
  evidence: readonly Evidence[],
): Evidence | undefined {
  return [...evidence].reverse().find((item) => Boolean(item.sourceUrl));
}

export function publicEvidenceLine(claim: DerivedClaim): string {
  const coverage = coverageBreakdownFor(claim.kind, claim.evidence);
  const supports = uniqueSupportingReportCount(claim.evidence);
  const challenges = uniqueChallengingReportCount(claim.evidence);
  const interview = coverage.candidateSpecificAnswer.resolving
    ? "resolving"
    : coverage.candidateSpecificAnswer.present
      ? "non-resolving"
      : "—";
  return `Employer ${coverage.employerStated.present ? "✓" : "—"} · Public ${counted(supports, "support", "supports")} / ${counted(challenges, "challenge", "challenges")} · Interview ${interview}`;
}

export function decisionPathNodes(
  claim: DerivedClaim,
  mode: DecisionPathMode = "ACTIVE",
): readonly DecisionPathNode[] {
  const interview = [...claim.evidence]
    .reverse()
    .find((item) => item.scope === "CANDIDATE_SPECIFIC_ANSWER");
  const sourced = latestSourcedEvidence(claim.evidence);
  if (mode === "EVIDENCE_UPDATED" && !claim.probeEligible) {
    const changed = interview
      ? `${interview.speakerRole ?? "Interviewer"}: ${interview.text}`
      : (sourced?.sourceLabel ?? sourced?.text ?? "New evidence recorded");
    const resolved: DecisionPathNode = {
      label: "What changed",
      body: changed,
      ...(sourced?.sourceUrl ? { href: sourced.sourceUrl } : {}),
    };
    return [
      { label: "Case state", body: "Evidence now resolves this probe" },
      resolved,
      { label: "Next", body: "Check again to find what still matters" },
    ];
  }
  return [
    {
      label: "Active claim",
      body: `${claim.dimension} · ${IMPORTANCE_REASON[claim.importance]}`,
    },
    { label: "Evidence", body: publicEvidenceLine(claim) },
    {
      label: "Why unresolved",
      body: STATUS_REASON[claim.status],
    },
    { label: "Need to know", body: claim.unresolvedVariable },
    {
      label: "Measure / next",
      body:
        mode === "EVIDENCE_UPDATED"
          ? `${claim.measurableForm} · Evidence updated — check again.`
          : `${claim.measurableForm} · Research this or ask the interviewer`,
    },
  ];
}
