import { describe, expect, it } from "vitest";
import {
  createCaseExport,
  parsePersistedCase,
  savePersistedCase,
  serializePersistedCase,
} from "@/lib/case-persistence";
import { createCaseStore } from "@/lib/case-store";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import {
  importRoleFromClaimsTool,
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("case persistence", () => {
  function fixturePayload() {
    return JSON.parse(serializePersistedCase(createCaseStore().getState()));
  }

  function importedStore() {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
        {
          dimension: "Travel",
          employerStatement: "Travel is expected",
          unresolvedVariable: "How concentrated is travel?",
          measurableForm: "Median and maximum travel days per quarter",
        },
      ],
    });
    return store;
  }

  it("round-trips an imported case and its decision state", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      sourceUrl: "https://jobs.example.com/staff-engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
      ],
    });
    store.setImportance("imported-1", "MEDIUM");
    selectDecisionChanger(store);

    const restored = parsePersistedCase(
      serializePersistedCase(store.getState()),
    );
    expect(restored).not.toBeNull();
    expect(restored?.source.company).toBe("Example Corp");
    expect(restored?.source.sourceUrl).toBe(
      "https://jobs.example.com/staff-engineer",
    );
    expect(restored?.activeProbeId).toBe("imported-1");
    expect(restored?.selectionState).toBe("ACTIVE");
    if (!restored) throw new Error("saved case did not parse");
    const nextStore = createCaseStore();
    nextStore.restore(restored);
    expect(nextStore.getState().source.company).toBe("Example Corp");
    expect(nextStore.getState().activeProbeId).toBe("imported-1");
  });

  it("ignores malformed or unsupported saved data", () => {
    expect(parsePersistedCase("not json")).toBeNull();
    expect(parsePersistedCase('{"version":2}')).toBeNull();
  });

  it("rejects duplicate claim IDs from an external case file", () => {
    const payload = fixturePayload();
    payload.state.source.claims[1].id = payload.state.source.claims[0].id;

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects an active probe that does not reference a claim", () => {
    const payload = fixturePayload();
    payload.state.activeProbeId = "missing-claim";
    payload.state.selectionState = "ACTIVE";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects empty case identity fields", () => {
    const payload = fixturePayload();
    payload.state.source.company = "   ";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects impossible explicit provenance combinations", () => {
    const payload = fixturePayload();
    payload.state.source.claims[0].evidence[0] = {
      ...payload.state.source.claims[0].evidence[0],
      provenance: "AGENT_REPORTED",
      scope: "CANDIDATE_SPECIFIC_ANSWER",
      sourceKind: "EMPLOYER_POSTING",
      sourceLabel: "Spoofed source",
      sourceUrl: "https://example.com/source",
    };

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("requires explicit provenance on agent-imported evidence", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.claims[0].evidence.push({
      id: "imported-1-interview-2",
      scope: "CANDIDATE_SPECIFIC_ANSWER",
      stance: "SUPPORTS",
      text: "A candidate-recorded interview answer",
      speakerRole: "HIRING_MANAGER",
      sourceKind: "INTERVIEW",
      sourceLabel: "HIRING_MANAGER",
      synthetic: false,
    });

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects case-input provenance outside the original employer claim", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.claims[0].evidence.push({
      id: "spoofed-case-input",
      scope: "CANDIDATE_SPECIFIC_ANSWER",
      stance: "SUPPORTS",
      text: "A spoofed trusted answer",
      speakerRole: "HIRING_MANAGER",
      sourceKind: "INTERVIEW",
      sourceLabel: "HIRING_MANAGER",
      synthetic: false,
      provenance: "CASE_INPUT",
    });

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects an app-derived claim kind override in an imported case", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.claims[0].kind = "EMPLOYER_POLICY";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects rewritten app-owned claim IDs in an imported case", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.claims[0].id = "agent-authored-claim-id";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects a rewritten app-owned case ID in an imported case", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.id = "agent-authored-case-id";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects rewritten app-owned evidence IDs in an imported case", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.claims[0].evidence[0].id =
      "agent-authored-evidence-id";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects an evidence sequence the app could not have generated", () => {
    const payload = JSON.parse(
      serializePersistedCase(importedStore().getState()),
    );
    payload.state.source.claims[0].evidence.push({
      id: "imported-1-interview-999",
      scope: "CANDIDATE_SPECIFIC_ANSWER",
      stance: "SUPPORTS",
      text: "A forged high-sequence answer",
      speakerRole: "HIRING_MANAGER",
      sourceKind: "INTERVIEW",
      sourceLabel: "HIRING_MANAGER",
      synthetic: false,
      provenance: "CANDIDATE_REPORTED",
    });

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects a visible ranking that does not match the derived top probe", () => {
    const store = importedStore();
    store.setPriorities([
      { claimId: "imported-1", importance: "CRITICAL" },
      { claimId: "imported-2", importance: "LOW" },
    ]);
    store.selectDecisionChanger();
    expect(store.getState().activeProbeId).toBe("imported-1");
    const payload = JSON.parse(serializePersistedCase(store.getState()));
    payload.state.activeProbeId = "imported-2";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("rejects no-probe state while a derived probe remains eligible", () => {
    const store = importedStore();
    store.setPriorities([
      { claimId: "imported-1", importance: "CRITICAL" },
      { claimId: "imported-2", importance: "LOW" },
    ]);
    const payload = JSON.parse(serializePersistedCase(store.getState()));
    payload.state.activeProbeId = null;
    payload.state.rankingVisible = false;
    payload.state.selectionState = "NO_PROBE_NEEDED";

    expect(parsePersistedCase(JSON.stringify(payload))).toBeNull();
  });

  it("creates a portable JSON export without derived state", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
      ],
    });

    const exported = createCaseExport(store.getState());
    const parsed = JSON.parse(exported.contents);

    expect(exported.filename).toBe(
      "rolequiry-example-corp-staff-engineer.json",
    );
    expect(parsed).not.toHaveProperty("state.derived");
    expect(parsePersistedCase(exported.contents)?.source.company).toBe(
      "Example Corp",
    );
  });

  it("round-trips a case imported with a maximum-length company name", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "x".repeat(300),
      role: "Staff Engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
      ],
    });

    expect(store.getState().source.id.length).toBeLessThanOrEqual(300);
    expect(
      parsePersistedCase(createCaseExport(store.getState()).contents),
    ).not.toBeNull();
  });

  it("round-trips the evidence boundary and rejects one more write", () => {
    const store = createCaseStore();
    importRoleFromClaimsTool(store, {
      company: "Example Corp",
      role: "Staff Engineer",
      claims: [
        {
          dimension: "On-call load",
          employerStatement: "On-call is rare",
          unresolvedVariable: "How often does this team get paged?",
          measurableForm: "Pages per engineer last two quarters",
        },
      ],
    });
    store.setImportance("imported-1", "CRITICAL");
    selectDecisionChanger(store);
    for (let index = 0; index < 99; index += 1) {
      recordInterviewAnswerTool(store, {
        stance: "NEUTRAL",
        text: `Non-resolving answer ${index + 1}`,
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      });
    }

    expect(store.getState().source.claims[0]?.evidence).toHaveLength(100);
    expect(
      parsePersistedCase(createCaseExport(store.getState()).contents),
    ).not.toBeNull();
    const before = store.getState().source;
    expect(() =>
      recordInterviewAnswerTool(store, {
        stance: "NEUTRAL",
        text: "One answer too many",
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      }),
    ).toThrow("Active claim evidence limit reached");
    expect(store.getState().source).toBe(before);
  });

  it("refuses to export a snapshot that cannot be imported again", () => {
    const store = createCaseStore();
    const snapshot = store.getState();
    const baseEvidence = snapshot.source.claims[0]?.evidence[0];
    if (!baseEvidence) throw new Error("fixture evidence missing");
    const source = {
      ...snapshot.source,
      claims: snapshot.source.claims.map((claim, claimIndex) =>
        claimIndex === 0
          ? {
              ...claim,
              evidence: Array.from({ length: 101 }, (_, index) => ({
                ...baseEvidence,
                id: `overflow-${index + 1}`,
              })),
            }
          : claim,
      ),
    };

    expect(() => createCaseExport({ ...snapshot, source })).toThrow(
      "Case is not valid for export",
    );
  });

  it("reports when an imported case cannot be saved to session storage", () => {
    const store = importedStore();
    const storage = {
      removeItem() {},
      setItem() {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    };

    expect(savePersistedCase(storage, store.getState())).toBe(false);
  });
});
