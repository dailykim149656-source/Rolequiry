(async () => {
  const out = {
    startedAt: new Date().toISOString(),
    url: location.href,
    evaluatedBaseSha: "eb5827b1a1616132f2029de7d3c5df6e2ee5c739",
    steps: [],
    checks: {},
  };
  const stable = (value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };
  const parseContent = (value) => {
    const v = stable(value);
    if (
      v &&
      Array.isArray(v.content) &&
      v.content[0] &&
      typeof v.content[0].text === "string"
    ) {
      try {
        return JSON.parse(v.content[0].text);
      } catch {
        return v.content[0].text;
      }
    }
    return v;
  };
  const forbiddenStateKeys = [
    "resume",
    "profile",
    "careerNarrative",
    "fitScore",
    "joinRecommendation",
  ];
  const stateHasNoIdentityFields = (state) => {
    const keys = JSON.stringify(state);
    return !forbiddenStateKeys.some((key) =>
      new RegExp(`"${key}"`, "i").test(keys),
    );
  };

  if (typeof document.modelContext !== "object" || !document.modelContext) {
    out.error = "document.modelContext is missing";
    return JSON.stringify(out);
  }

  const tools = await document.modelContext.getTools();
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  out.tools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    annotations: t.annotations,
  }));
  out.checks.toolCountIsEight = out.tools.length === 8;
  out.checks.toolNames = out.tools.map((t) => t.name).sort();
  const toolContractsDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(out.tools)),
  );
  const toolContractsSha256 = Array.from(new Uint8Array(toolContractsDigest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  async function exec(name, args) {
    const payload = args ?? {};
    const tool = byName[name];
    if (!tool) {
      throw new Error(`Missing WebMCP tool: ${name}`);
    }
    const raw = await document.modelContext.executeTool(
      tool,
      JSON.stringify(payload),
    );
    const parsed = parseContent(raw);
    out.steps.push({ name, args: payload, parsed });
    return parsed;
  }

  const importResult = await exec("import_role_from_claims", {
    company: "OpenAI",
    role: "Forward Deployed Engineer, Seoul",
    sourceUrl:
      "https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/",
    claims: [
      {
        dimension: "Travel concentration",
        employerStatement: "50% travel is expected.",
        unresolvedVariable:
          "How that stated 50% is distributed across cadence, concentration, duration, launch spikes, and consecutive onsite stretches",
        measurableForm:
          "Median and maximum travel days per FDE across the last two quarters, and how concentrated those days were across weeks",
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

  await exec("get_role_claims", {});
  const claimsResult = await exec("get_role_claims", {});
  const ids = Object.fromEntries(
    (claimsResult.claims || []).map((claim) => [claim.dimension, claim.id]),
  );
  out.claimIds = ids;

  const candidateA = await exec("set_candidate_priorities", {
    priorities: [
      { claimId: ids["Travel concentration"], importance: "CRITICAL" },
      { claimId: ids["Hands-on coding share"], importance: "MEDIUM" },
      { claimId: ids["Technical decision authority"], importance: "HIGH" },
      { claimId: ids["Concurrent deployment load"], importance: "MEDIUM" },
    ],
  });

  const selectA = await exec("select_decision_changer", {});
  const researchA = await exec("record_research_evidence", {
    stance: "NEUTRAL",
    summary:
      "A separate official OpenAI FDE posting also requires up to 50% travel, but it gives no Seoul cadence or concentration data.",
    sourceUrl:
      "https://openai.com/careers/forward-deployed-engineer-%28fde%29-sf-san-francisco/",
    sourceLabel: "OpenAI — Forward Deployed Engineer, San Francisco",
    sourceKind: "EMPLOYER_OFFICIAL",
  });
  const stateA = await exec("get_case_state", {});
  const dossierA = await exec("get_decision_dossier", {});

  const candidateB = await exec("set_candidate_priorities", {
    priorities: [
      { claimId: ids["Travel concentration"], importance: "LOW" },
      { claimId: ids["Hands-on coding share"], importance: "CRITICAL" },
      { claimId: ids["Technical decision authority"], importance: "MEDIUM" },
      { claimId: ids["Concurrent deployment load"], importance: "MEDIUM" },
    ],
  });
  out.checks.activeProbeAfterCandidateBWrite = candidateB.activeProbeId;

  const selectB = await exec("select_decision_changer", {});
  const stateB = await exec("get_case_state", {});

  out.finishedAt = new Date().toISOString();
  out.checks.sequence = out.steps.map((step) => step.name);
  out.checks.candidateASequence = out.steps
    .slice(0, 8)
    .map((step) => step.name);
  out.checks.confirmationRouting = out.steps
    .slice(2, 5)
    .map((step) => step.name);
  out.checks.confirmationRoutingPass =
    JSON.stringify(out.checks.confirmationRouting) ===
    JSON.stringify([
      "get_role_claims",
      "set_candidate_priorities",
      "select_decision_changer",
    ]);
  out.checks.researchRouting = out.steps.slice(5, 7).map((step) => step.name);
  out.checks.researchRoutingPass =
    JSON.stringify(out.checks.researchRouting) ===
    JSON.stringify(["record_research_evidence", "get_case_state"]);
  out.checks.noPreSelectionProbe =
    candidateA.activeProbeId == null && candidateA.rankingVisible === false;
  out.checks.fourPriorityWrites =
    Array.isArray(candidateA.claims) &&
    candidateA.claims.filter((claim) => claim.candidatePrioritySet).length ===
      4;
  const travelAfterResearch = stateA.claims.find(
    (claim) => claim.id === ids["Travel concentration"],
  );
  out.checks.neutralResearchEvidenceRecorded =
    researchA.selectionState === "EVIDENCE_UPDATED" &&
    travelAfterResearch?.evidenceSummary.some(
      (evidence) =>
        evidence.provenance === "AGENT_REPORTED" &&
        evidence.stance === "NEUTRAL",
    ) === true;
  out.checks.researchUnknownPreserved =
    travelAfterResearch?.probeEligible === true &&
    travelAfterResearch.status === "MATERIAL_AMBIGUITY" &&
    travelAfterResearch.unresolvedness === 0.8 &&
    stateA.selectionState === "EVIDENCE_UPDATED";
  out.checks.researchState = {
    selectionState: stateA.selectionState,
    status: travelAfterResearch?.status,
    unresolvedness: travelAfterResearch?.unresolvedness,
    probeEligible: travelAfterResearch?.probeEligible,
  };
  out.checks.researchOrganizationMatch =
    travelAfterResearch?.evidenceSummary.some(
      (evidence) =>
        evidence.provenance === "AGENT_REPORTED" &&
        evidence.sourceOrganizationMatch === true,
    ) === true;
  out.checks.travelActiveAfterCandidateA =
    selectA.claim_id === ids["Travel concentration"] &&
    stateA.activeProbeId === ids["Travel concentration"];
  out.checks.authoritativeSelectionA = {
    claim_kind: selectA.claim_kind,
    status: selectA.status,
    authorityCoverage: selectA.authorityCoverage,
  };
  out.checks.travelSelectionAuthoritative =
    selectA.claim_kind === "LIVED_EXPERIENCE" &&
    selectA.status === "MATERIAL_AMBIGUITY" &&
    selectA.authorityCoverage?.employerStated?.present === true &&
    selectA.authorityCoverage?.employerStated?.contribution === 0.2 &&
    selectA.authorityCoverage?.covered === 0.2;
  out.checks.dossierRollup = {
    outcome: dossierA.outcome,
    remainingDecisionBlockers: dossierA.remainingDecisionBlockers,
    firstAsk: dossierA.interviewPack?.[0] ?? null,
  };
  out.checks.dossierRollupPass =
    dossierA.outcome === "DOSSIER" &&
    dossierA.remainingDecisionBlockers === 2 &&
    dossierA.interviewPack?.[0]?.claimId === ids["Travel concentration"] &&
    dossierA.interviewPack?.[0]?.askWho === "TEAM_MEMBER";
  out.checks.codingActiveAfterCandidateB =
    selectB.claim_id === ids["Hands-on coding share"] &&
    stateB.activeProbeId === ids["Hands-on coding share"];
  out.checks.selectedClaimIdsDiffer =
    selectA.claim_id !== selectB.claim_id &&
    Boolean(selectA.claim_id) &&
    Boolean(selectB.claim_id);
  out.checks.selectionOutcomes = {
    candidateA: selectA.outcome,
    candidateB: selectB.outcome,
  };
  out.checks.activeProbeIds = {
    afterAPriorities: candidateA.activeProbeId,
    afterASelect: stateA.activeProbeId,
    afterBPriorities: candidateB.activeProbeId,
    afterBSelect: stateB.activeProbeId,
  };
  out.checks.importOrigin = importResult.origin;
  out.checks.stateHasNoIdentityFields =
    stateHasNoIdentityFields(stateA) && stateHasNoIdentityFields(stateB);
  out.checks.pass =
    out.checks.toolCountIsEight &&
    out.checks.noPreSelectionProbe &&
    out.checks.fourPriorityWrites &&
    out.checks.confirmationRoutingPass &&
    out.checks.researchRoutingPass &&
    out.checks.neutralResearchEvidenceRecorded &&
    out.checks.researchUnknownPreserved &&
    out.checks.researchOrganizationMatch &&
    out.checks.travelActiveAfterCandidateA &&
    out.checks.travelSelectionAuthoritative &&
    out.checks.dossierRollupPass &&
    out.checks.codingActiveAfterCandidateB &&
    out.checks.selectedClaimIdsDiffer &&
    out.checks.stateHasNoIdentityFields &&
    importResult.origin === "AGENT_IMPORTED";
  return JSON.stringify({
    schemaVersion: "rolequiry-webmcp-evals-v1",
    kind: "deterministic-browser-full-journey",
    evaluatedBaseSha: out.evaluatedBaseSha,
    toolContractsSha256,
    ranAt: out.finishedAt,
    surfacePath: location.pathname,
    userAgent: navigator.userAgent,
    verdict: out.checks.pass ? "PASS" : "FAIL",
    pass: out.checks.pass,
    tools: out.checks.toolNames,
    toolContracts: out.tools,
    sequence: out.checks.sequence,
    candidateASequence: out.checks.candidateASequence,
    claimIds: out.claimIds,
    checks: out.checks,
  });
})();
