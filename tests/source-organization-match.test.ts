import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { employerSourceOrganizationMatch } from "@/lib/domain/policy";
import {
  AUTHORITY_SCOPE,
  EVIDENCE_PROVENANCE,
  type Evidence,
} from "@/lib/domain/types";
import {
  getCaseState,
  importRoleFromClaimsTool,
  recordResearchEvidenceTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

function agentEmployerEvidence(sourceUrl: string): Evidence {
  return {
    id: "imported-1-research-2",
    scope: AUTHORITY_SCOPE.EMPLOYER_STATED,
    stance: "NEUTRAL",
    text: "Another official posting repeats the travel requirement.",
    sourceUrl,
    sourceLabel: "Official posting",
    synthetic: false,
    provenance: EVIDENCE_PROVENANCE.AGENT_REPORTED,
  };
}

describe("employer source organization match", () => {
  it("confirms an agent-declared employer source on the posting's organization", () => {
    expect(
      employerSourceOrganizationMatch(
        agentEmployerEvidence("https://openai.com/careers/fde-sf/"),
        "openai.com",
      ),
    ).toBe(true);
  });

  it("flags an agent-declared employer source on a different organization", () => {
    expect(
      employerSourceOrganizationMatch(
        agentEmployerEvidence("https://example-jobs.com/openai-fde"),
        "openai.com",
      ),
    ).toBe(false);
  });

  it("does not apply to first-person reports or missing URLs", () => {
    expect(
      employerSourceOrganizationMatch(
        {
          ...agentEmployerEvidence("https://blog.example.com/my-fde-year"),
          scope: AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
        },
        "openai.com",
      ),
    ).toBeNull();
    expect(
      employerSourceOrganizationMatch(
        agentEmployerEvidence("https://openai.com/careers/fde-sf/"),
        "",
      ),
    ).toBeNull();
    expect(
      employerSourceOrganizationMatch(
        {
          ...agentEmployerEvidence("https://openai.com/careers/fde-sf/"),
          provenance: EVIDENCE_PROVENANCE.CASE_INPUT,
        },
        "openai.com",
      ),
    ).toBeNull();
  });
});

describe("evidence authority integrity", () => {
  function importedTravelCase() {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "OpenAI",
      role: "Forward Deployed Engineer, Seoul",
      sourceUrl:
        "https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/",
      claims: [
        {
          dimension: "Travel concentration",
          employerStatement: "50% travel is expected.",
          unresolvedVariable: "How the stated 50% is distributed",
          measurableForm: "Median travel days per quarter",
        },
        {
          dimension: "Technical decision authority",
          employerStatement: "Set technical direction with customers.",
          unresolvedVariable: "Who owns architecture decisions",
          measurableForm: "Named decisions owned by the role per launch",
        },
      ],
    });
    store.setPriorities([
      { claimId: "imported-1", importance: "CRITICAL" },
      { claimId: "imported-2", importance: "HIGH" },
    ]);
    selectDecisionChanger(store);
    return store;
  }

  it("quarantines a cross-domain employer-official challenge from decision math", () => {
    const store = importedTravelCase();
    recordResearchEvidenceTool(store, {
      stance: "CHALLENGES",
      summary:
        "A third-party job board claims Seoul travel runs far above 50%.",
      sourceUrl: "https://jobs.example-board.com/openai-fde-seoul",
      sourceLabel: "Job board mirror",
      sourceKind: "EMPLOYER_OFFICIAL",
    });

    const travel = getCaseState(store).claims.find(
      (claim) => claim.id === "imported-1",
    );
    expect(
      travel?.evidenceSummary.some(
        (item) => item.sourceOrganizationMatch === false,
      ),
    ).toBe(true);
    expect(travel?.tension).toBe(0);
    expect(travel?.status).toBe("MATERIAL_AMBIGUITY");
    expect(travel?.authorityCoverage.covered).toBe(0.2);

    const reselect = selectDecisionChanger(store);
    expect(reselect).toMatchObject({
      outcome: "PROBE_SELECTED",
      claim_id: "imported-1",
      status: "MATERIAL_AMBIGUITY",
      rationale: { tension: 0 },
    });
  });

  it("still counts a matching-domain employer challenge as real tension", () => {
    const store = importedTravelCase();
    recordResearchEvidenceTool(store, {
      stance: "CHALLENGES",
      summary:
        "An official engineering blog post describes sustained onsite stretches well above the posted cadence.",
      sourceUrl: "https://openai.com/blog/fde-life-in-seoul",
      sourceLabel: "Official engineering blog",
      sourceKind: "EMPLOYER_OFFICIAL",
    });

    const travel = getCaseState(store).claims.find(
      (claim) => claim.id === "imported-1",
    );
    expect(
      travel?.evidenceSummary.some(
        (item) => item.sourceOrganizationMatch === true,
      ),
    ).toBe(true);
    expect(travel?.tension).toBe(1);
    expect(travel?.status).toBe("CHALLENGED");
  });
});

describe("get_case_state organization check", () => {
  it("surfaces the app-owned domain check on agent-reported employer evidence", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "OpenAI",
      role: "Forward Deployed Engineer, Seoul",
      sourceUrl:
        "https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/",
      claims: [
        {
          dimension: "Travel concentration",
          employerStatement: "50% travel is expected.",
          unresolvedVariable: "How the stated 50% is distributed",
          measurableForm: "Median travel days per quarter",
        },
      ],
    });
    store.setPriorities([{ claimId: "imported-1", importance: "CRITICAL" }]);
    selectDecisionChanger(store);
    recordResearchEvidenceTool(store, {
      stance: "NEUTRAL",
      summary: "A separate official posting repeats the requirement.",
      sourceUrl: "https://openai.com/careers/forward-deployed-engineer-sf/",
      sourceLabel: "OpenAI FDE, San Francisco",
      sourceKind: "EMPLOYER_OFFICIAL",
    });
    recordResearchEvidenceTool(store, {
      stance: "NEUTRAL",
      summary: "A job board mirrors the posting text.",
      sourceUrl: "https://jobs.example-board.com/openai-fde-seoul",
      sourceLabel: "Job board mirror",
      sourceKind: "EMPLOYER_OFFICIAL",
    });

    const travel = getCaseState(store).claims.find(
      (claim) => claim.id === "imported-1",
    );
    const matches = travel?.evidenceSummary.map(
      (item) => item.sourceOrganizationMatch,
    );

    expect(matches).toEqual([null, true, false]);
  });
});
