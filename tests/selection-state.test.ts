import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import {
  importRoleFromClaimsTool,
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("selection state", () => {
  it("applies a candidate-confirmed priority batch in one state emission", () => {
    // Given
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "Technical ownership",
          employerStatement: "Own delivery end to end",
          unresolvedVariable: "Where does final architecture authority sit?",
          measurableForm: "Last decision shipped without platform review",
        },
        {
          dimension: "Travel",
          employerStatement: "Travel is expected",
          unresolvedVariable: "How concentrated is travel?",
          measurableForm: "Median and maximum travel days per quarter",
        },
      ],
    });
    let emissions = 0;
    store.subscribe(() => {
      emissions += 1;
    });

    // When
    store.setPriorities([
      { claimId: "imported-1", importance: "HIGH" },
      { claimId: "imported-2", importance: "CRITICAL" },
    ]);

    // Then
    expect(emissions).toBe(1);
    expect(
      store.getState().derived.claims.map((claim) => ({
        id: claim.id,
        importance: claim.importance,
        candidatePrioritySet: claim.candidatePrioritySet,
      })),
    ).toEqual([
      {
        id: "imported-1",
        importance: "HIGH",
        candidatePrioritySet: true,
      },
      {
        id: "imported-2",
        importance: "CRITICAL",
        candidatePrioritySet: true,
      },
    ]);
  });

  it("starts idle, becomes active after select, then no-probe-needed after every claim is resolved", () => {
    const store = createCaseStore();
    expect(store.getState().selectionState).toBe("IDLE");
    expect(selectDecisionChanger(store).outcome).toBe("PROBE_SELECTED");
    expect(store.getState().selectionState).toBe("ACTIVE");
    recordInterviewAnswerTool(store, {
      stance: "CHALLENGES",
      text: "Hiring manager said ownership is split with a central platform team after design review.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    expect(store.getState().selectionState).toBe("EVIDENCE_UPDATED");
    expect(store.getState().activeProbeId).toBe("technical-ownership");
    expect(selectDecisionChanger(store).claim_id).toBe("travel");
    recordInterviewAnswerTool(store, {
      stance: "CHALLENGES",
      text: "Hiring manager said travel exceeded 50% during launch windows.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    expect(selectDecisionChanger(store)).toMatchObject({
      outcome: "NO_PROBE_NEEDED",
      claim_id: null,
    });
    expect(store.getState().selectionState).toBe("NO_PROBE_NEEDED");
  });

  it("does not reactivate a resolved probe when importance changes", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    recordInterviewAnswerTool(store, {
      stance: "CHALLENGES",
      text: "Hiring manager said ownership is split with a central platform team after design review.",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    expect(store.getState().selectionState).toBe("EVIDENCE_UPDATED");
    store.setImportance("travel", "CRITICAL");
    expect(store.getState().selectionState).toBe("EVIDENCE_UPDATED");
    expect(store.getState().activeProbeId).toBe("technical-ownership");
    expect(store.getState().rankingVisible).toBe(false);
  });

  it("keeps imported priorities marked as touched when no probe is eligible", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "Base pay",
          employerStatement: "Base salary range: 190,000-220,000 USD",
          unresolvedVariable: "What is the written base band?",
          measurableForm: "Offer letter range",
        },
      ],
    });
    store.setImportance("imported-1", "MEDIUM");

    expect(selectDecisionChanger(store).outcome).toBe("NO_PROBE_NEEDED");
    expect(store.getState().prioritiesTouched).toBe(true);
    expect(store.getState().selectionState).toBe("NO_PROBE_NEEDED");
  });

  it("reports unprioritized lived claims when no prioritized probe is eligible", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "Base pay",
          employerStatement: "Base salary range: 190,000-220,000 USD",
          unresolvedVariable: "What is the written base band?",
          measurableForm: "Offer letter range",
        },
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
      ],
    });
    store.setImportance("imported-1", "CRITICAL");

    expect(selectDecisionChanger(store)).toMatchObject({
      outcome: "NO_PROBE_NEEDED",
      reason: "UNPRIORITIZED_LIVED_CLAIMS_REMAIN",
      unprioritized_lived_claims: 1,
    });
  });
});
