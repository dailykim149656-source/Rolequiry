import type { CaseStore } from "@/lib/case-store";
import { coverageBreakdownFor } from "@/lib/domain/policy";
import { noProbeDetails } from "@/lib/domain/probe-outcome";
import {
  AUTHORITY_SCOPE,
  type DerivedClaim,
  EVIDENCE_PROVENANCE,
  RESEARCH_SOURCE_KIND,
  type ResearchSourceKind,
  type SpeakerRole,
} from "@/lib/domain/types";
import { normalizeHttpUrl } from "@/lib/webmcp/http-url";

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

export function getRoleClaims(store: CaseStore) {
  const { source } = store.getState();
  return {
    company: source.company,
    role: source.role,
    origin: source.origin,
    sourceUrl: source.sourceUrl ?? null,
    untrustedContentHint: true,
    claims: source.claims.map((claim) => ({
      id: claim.id,
      dimension: claim.dimension,
      employerStatement: claim.employerStatement,
      sourceSnippets: claim.evidence
        .filter(
          (item) =>
            item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED &&
            (item.provenance ?? EVIDENCE_PROVENANCE.CASE_INPUT) ===
              EVIDENCE_PROVENANCE.CASE_INPUT,
        )
        .map((item) => item.text),
    })),
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

export function selectDecisionChanger(store: CaseStore) {
  const snapshot = store.getState();
  if (
    snapshot.source.origin === "AGENT_IMPORTED" &&
    !snapshot.prioritiesTouched
  ) {
    return {
      ok: true as const,
      outcome: "PRIORITIES_REQUIRED" as const,
      claim_id: null,
      unresolved_variable: null,
      measurable_form: null,
    };
  }
  const derived = store.peekDecision();
  const selected = derived.claims.find(
    (claim) => claim.id === derived.topProbeId,
  );
  if (!selected) {
    const noProbe = noProbeDetails(derived);
    store.clearSelection();
    return {
      ok: true as const,
      outcome: "NO_PROBE_NEEDED" as const,
      reason: noProbe.reason,
      unprioritized_lived_claims: noProbe.unprioritizedLivedClaimCount,
      claim_id: null,
      unresolved_variable: null,
      measurable_form: null,
    };
  }
  store.selectDecisionChanger();
  return {
    ok: true as const,
    outcome: "PROBE_SELECTED" as const,
    claim_id: selected.id,
    unresolved_variable: selected.unresolvedVariable,
    measurable_form: selected.measurableForm,
    rationale: {
      importance: selected.importance,
      unresolvedness: Number(selected.unresolvedness.toFixed(3)),
      tension: Number(selected.tension.toFixed(3)),
      probe_priority: Number(selected.probePriority.toFixed(3)),
    },
  };
}

export function recordInterviewAnswerTool(
  store: CaseStore,
  input: {
    claimId?: string;
    stance: "SUPPORTS" | "CHALLENGES" | "NEUTRAL";
    text: string;
    speakerRole: SpeakerRole;
  },
) {
  const snapshot = store.getState();
  if (!snapshot.activeProbeId) {
    throw new Error("No active probe");
  }
  const claimId = snapshot.activeProbeId;
  if (input.claimId && input.claimId !== claimId) {
    throw new Error("Answers can only be recorded against the active probe");
  }
  if (!input.text.trim()) {
    throw new Error("Interview answer text is empty");
  }
  store.recordAnswer({
    claimId,
    stance: input.stance,
    text: input.text.trim(),
    speakerRole: input.speakerRole,
  });
  return { ok: true as const, ...getCaseState(store) };
}

export function recordResearchEvidenceTool(
  store: CaseStore,
  input: {
    stance: "SUPPORTS" | "CHALLENGES" | "NEUTRAL";
    summary: string;
    sourceUrl: string;
    sourceLabel: string;
    sourceKind: string;
  },
) {
  const snapshot = store.getState();
  if (!snapshot.activeProbeId) {
    throw new Error("No active probe");
  }
  if (!input.summary.trim() || !input.sourceLabel.trim()) {
    throw new Error(
      "Research evidence requires summary, sourceUrl, and sourceLabel",
    );
  }
  if (
    input.sourceKind !== RESEARCH_SOURCE_KIND.EMPLOYER_OFFICIAL &&
    input.sourceKind !== RESEARCH_SOURCE_KIND.FIRST_PERSON_EXPERIENCE
  ) {
    throw new Error("Unsupported research source");
  }
  const sourceUrl = normalizeHttpUrl(input.sourceUrl, "Research source URL");
  const duplicate = snapshot.source.claims
    .find((claim) => claim.id === snapshot.activeProbeId)
    ?.evidence.some((item) => item.sourceUrl === sourceUrl);
  if (duplicate) {
    throw new Error("Duplicate research source URL");
  }
  store.recordResearch({
    claimId: snapshot.activeProbeId,
    stance: input.stance,
    text: input.summary.trim(),
    sourceKind: input.sourceKind as ResearchSourceKind,
    sourceLabel: input.sourceLabel.trim(),
    sourceUrl,
  });
  return { ok: true as const, ...getCaseState(store) };
}

export function importRoleFromClaimsTool(
  store: CaseStore,
  input: {
    company: string;
    role: string;
    sourceUrl?: string;
    claims: Array<{
      dimension: string;
      employerStatement: string;
      unresolvedVariable: string;
      measurableForm: string;
    }>;
  },
) {
  const claims = input.claims.map((claim) => ({
    dimension: claim.dimension.trim(),
    employerStatement: claim.employerStatement.trim(),
    unresolvedVariable: claim.unresolvedVariable.trim(),
    measurableForm: claim.measurableForm.trim(),
  }));
  const sourceUrl = input.sourceUrl?.trim()
    ? normalizeHttpUrl(input.sourceUrl, "Job posting URL")
    : undefined;
  if (
    !input.company.trim() ||
    !input.role.trim() ||
    claims.length === 0 ||
    claims.length > 8 ||
    claims.some((claim) =>
      Object.values(claim).some((value) => value.length === 0),
    )
  ) {
    throw new Error(
      "Imported role requires company, role, and 1 to 8 non-empty claims",
    );
  }
  store.importRole({
    company: input.company.trim(),
    role: input.role.trim(),
    ...(sourceUrl ? { sourceUrl } : {}),
    claims,
  });
  const snapshot = store.getState();
  return {
    ok: true as const,
    origin: snapshot.source.origin,
    company: snapshot.source.company,
    role: snapshot.source.role,
    sourceUrl: snapshot.source.sourceUrl ?? null,
    claimCount: snapshot.source.claims.length,
  };
}

export { CASE_TOOL_CONTRACTS } from "@/lib/webmcp/contracts";
