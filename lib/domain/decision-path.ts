import { coverageBreakdownFor } from "./policy";
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

export function decisionPathNodes(
  claim: DerivedClaim,
  mode: DecisionPathMode = "ACTIVE",
): readonly DecisionPathNode[] {
  const reports = claim.evidence.filter(
    (item) => item.scope === "REPORTED_EXPERIENCE",
  );
  const supports = reports.filter((item) => item.stance === "SUPPORTS").length;
  const challenges = reports.filter(
    (item) => item.stance === "CHALLENGES",
  ).length;
  const coverage = coverageBreakdownFor(claim.kind, claim.evidence);
  const interview = [...claim.evidence]
    .reverse()
    .find((item) => item.scope === "CANDIDATE_SPECIFIC_ANSWER");
  const sourced = latestSourcedEvidence(claim.evidence);
  const interviewBody = !coverage.candidateSpecificAnswer.present
    ? "Missing"
    : coverage.candidateSpecificAnswer.resolving
      ? `${interview?.speakerRole ?? "Interviewer"}: ${interview?.text ?? "Recorded"}`
      : `Non-resolving · ${interview?.stance ?? "NEUTRAL"}`;
  const nodes: DecisionPathNode[] = [
    { label: "Claim", body: claim.dimension },
    {
      label: "Candidate importance",
      body: IMPORTANCE_REASON[claim.importance],
    },
    { label: "Employer claim", body: claim.employerStatement },
    {
      label: "Public evidence",
      body: `${counted(supports, "support", "supports")} · ${counted(challenges, "challenge", "challenges")}`,
    },
  ];
  if (sourced?.sourceUrl) {
    nodes.push({
      label: "Latest research",
      body: sourced.sourceLabel ?? sourced.text,
      href: sourced.sourceUrl,
    });
  }
  nodes.push(
    { label: "Candidate interview", body: interviewBody },
    { label: "Why this is unresolved", body: STATUS_REASON[claim.status] },
    { label: "Still unknown", body: claim.unresolvedVariable },
    { label: "Measure", body: claim.measurableForm },
    {
      label: "Next step",
      body:
        mode === "EVIDENCE_UPDATED"
          ? "Evidence updated — check again."
          : "Research this or ask the interviewer",
    },
  );
  return nodes;
}
