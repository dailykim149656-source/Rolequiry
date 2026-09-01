import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import {
  DOSSIER_RESOLUTION,
  deriveDossier,
  interviewAskWho,
} from "@/lib/domain/dossier";
import { CLAIM_KIND, SPEAKER_ROLE } from "@/lib/domain/types";
import {
  getDecisionDossier,
  importRoleFromClaimsTool,
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

function importCandidateACase() {
  const store = createCaseStore();
  importRoleFromClaimsTool(store, {
    company: "OpenAI",
    role: "Forward Deployed Engineer, Seoul",
    claims: [
      {
        dimension: "Travel concentration",
        employerStatement: "50% travel is expected.",
        unresolvedVariable:
          "How that stated 50% is distributed across cadence and concentration",
        measurableForm:
          "Median and maximum travel days per FDE across the last two quarters",
      },
      {
        dimension: "Hands-on coding share",
        employerStatement:
          "Build production systems and prototypes with customers.",
        unresolvedVariable: "How much time remains hands-on versus advisory",
        measurableForm:
          "Percent of weekly hours spent writing or reviewing production code",
      },
      {
        dimension: "Technical decision authority",
        employerStatement:
          "Set technical direction with customers and internal teams.",
        unresolvedVariable:
          "Degree of architecture ownership and decision rights",
        measurableForm:
          "Named technical decisions owned by the role per launch",
      },
      {
        dimension: "Concurrent deployment load",
        employerStatement: "Support multiple strategic customer deployments.",
        unresolvedVariable:
          "How many simultaneous launch workstreams are typical",
        measurableForm: "Concurrent customer deployments assigned per engineer",
      },
    ],
  });
  return store;
}

describe("get_decision_dossier", () => {
  it("gates the dossier until priorities are confirmed", () => {
    const store = importCandidateACase();

    const result = getDecisionDossier(store);

    expect(result).toMatchObject({
      ok: true,
      outcome: "PRIORITIES_REQUIRED",
      remainingDecisionBlockers: null,
      tiers: [],
      interviewPack: [],
    });
  });

  it("rolls the case into blockers, tiers, and an interview pack", () => {
    const store = importCandidateACase();
    store.setPriorities([
      { claimId: "imported-1", importance: "CRITICAL" },
      { claimId: "imported-2", importance: "MEDIUM" },
      { claimId: "imported-3", importance: "HIGH" },
      { claimId: "imported-4", importance: "MEDIUM" },
    ]);

    const result = getDecisionDossier(store);

    expect(result.outcome).toBe("DOSSIER");
    if (result.outcome !== "DOSSIER") return;
    expect(result.remainingDecisionBlockers).toBe(2);
    expect(
      result.tiers.map((tier) => [
        tier.importance,
        tier.entries.map((entry) => entry.claimId),
      ]),
    ).toEqual([
      ["CRITICAL", ["imported-1"]],
      ["HIGH", ["imported-3"]],
      ["MEDIUM", ["imported-4", "imported-2"]],
    ]);
    expect(result.tiers[0]?.entries[0]).toMatchObject({
      claimId: "imported-1",
      status: "MATERIAL_AMBIGUITY",
      resolution: DOSSIER_RESOLUTION.ASK_IN_INTERVIEW,
      unresolvedness: 0.8,
    });
    expect(
      result.interviewPack.map((question) => [
        question.claimId,
        question.askWho,
      ]),
    ).toEqual([
      ["imported-1", SPEAKER_ROLE.TEAM_MEMBER],
      ["imported-3", SPEAKER_ROLE.HIRING_MANAGER],
      ["imported-4", SPEAKER_ROLE.TEAM_MEMBER],
      ["imported-2", SPEAKER_ROLE.TEAM_MEMBER],
    ]);
    expect(result.interviewPack[0]?.question).toBe(
      "Median and maximum travel days per FDE across the last two quarters",
    );
    expect(result.interviewPack[0]?.context).toBe(
      "How that stated 50% is distributed across cadence and concentration",
    );
  });

  it("marks challenged claims as contradicted and keeps them out of the pack", () => {
    const store = importCandidateACase();
    store.setPriorities([
      { claimId: "imported-1", importance: "CRITICAL" },
      { claimId: "imported-2", importance: "MEDIUM" },
      { claimId: "imported-3", importance: "HIGH" },
      { claimId: "imported-4", importance: "MEDIUM" },
    ]);
    selectDecisionChanger(store);
    recordInterviewAnswerTool(store, {
      stance: "CHALLENGES",
      text: "A current FDE said Seoul travel ran well above the posted 50%.",
      speakerRole: SPEAKER_ROLE.TEAM_MEMBER,
    });

    const result = getDecisionDossier(store);

    expect(result.outcome).toBe("DOSSIER");
    if (result.outcome !== "DOSSIER") return;
    const travel = result.tiers
      .flatMap((tier) => tier.entries)
      .find((entry) => entry.claimId === "imported-1");
    expect(travel?.status).toBe("CHALLENGED");
    expect(travel?.resolution).toBe(DOSSIER_RESOLUTION.CONTRADICTED);
    expect(result.remainingDecisionBlockers).toBe(2);
    expect(
      result.interviewPack.some(
        (question) => question.claimId === "imported-1",
      ),
    ).toBe(false);
  });

  it("routes interview questions by claim kind and decision scope", () => {
    expect(
      interviewAskWho({
        kind: CLAIM_KIND.EMPLOYER_POLICY,
        dimension: "Visa support",
        unresolvedVariable: "Which visa classes the employer sponsors",
      }),
    ).toBe(SPEAKER_ROLE.RECRUITER);
    expect(
      interviewAskWho({
        kind: CLAIM_KIND.LIVED_EXPERIENCE,
        dimension: "Technical decision authority",
        unresolvedVariable: "Who owns architecture decisions",
      }),
    ).toBe(SPEAKER_ROLE.HIRING_MANAGER);
    expect(
      interviewAskWho({
        kind: CLAIM_KIND.LIVED_EXPERIENCE,
        dimension: "Travel concentration",
        unresolvedVariable: "How travel is distributed across weeks",
      }),
    ).toBe(SPEAKER_ROLE.TEAM_MEMBER);
  });

  it("keeps the demo fixture dossier consistent with derived state", () => {
    const store = createCaseStore();
    const dossier = deriveDossier(store.getState().derived);

    const entries = dossier.tiers.flatMap((tier) => tier.entries);
    expect(entries.length).toBe(store.getState().derived.claims.length);
    const ownership = dossier.interviewPack.find(
      (question) => question.claimId === "technical-ownership",
    );
    expect(ownership?.askWho).toBe(SPEAKER_ROLE.HIRING_MANAGER);
    expect(dossier.remainingDecisionBlockers).toBe(
      store
        .getState()
        .derived.claims.filter(
          (claim) =>
            (claim.importance === "CRITICAL" || claim.importance === "HIGH") &&
            claim.status !== "SUPPORTED",
        ).length,
    );
  });
});
