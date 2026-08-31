import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import {
  importRoleFromClaims,
  recordInterviewAnswer,
} from "@/lib/domain/derive-case";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import {
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("record_interview_answer validation", () => {
  it("rejects an unknown claim id without mutating evidence", () => {
    const store = createCaseStore();
    const before = store
      .getState()
      .source.claims.map((claim) => claim.evidence.length);
    expect(() =>
      recordInterviewAnswerTool(store, {
        stance: "CHALLENGES",
        text: "should not land",
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      }),
    ).toThrow("No active probe");
    const after = store
      .getState()
      .source.claims.map((claim) => claim.evidence.length);
    expect(after).toEqual(before);
  });

  it("rejects oversized interview text without mutating evidence", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    const before = store
      .getState()
      .source.claims.map((claim) => claim.evidence.length);

    expect(() =>
      recordInterviewAnswerTool(store, {
        stance: "SUPPORTS",
        text: "x".repeat(5_001),
        speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
      }),
    ).toThrow("Interview answer exceeds allowed length");
    expect(
      store.getState().source.claims.map((claim) => claim.evidence.length),
    ).toEqual(before);
  });

  it("rejects an invalid stance before mutating evidence", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    const before = store.getState().source;

    expect(() =>
      Reflect.apply(recordInterviewAnswerTool, undefined, [
        store,
        {
          stance: "CONFIRMS",
          text: "This must not be stored.",
          speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
        },
      ]),
    ).toThrow("Invalid evidence stance");
    expect(store.getState().source).toBe(before);
  });

  it("rejects an invalid speaker role before mutating evidence", () => {
    const store = createCaseStore();
    selectDecisionChanger(store);
    const before = store.getState().source;

    expect(() =>
      Reflect.apply(recordInterviewAnswerTool, undefined, [
        store,
        {
          stance: "SUPPORTS",
          text: "This must not be stored.",
          speakerRole: "EMPLOYER",
        },
      ]),
    ).toThrow("Invalid interview speaker role");
    expect(store.getState().source).toBe(before);
  });
});

describe("interview evidence IDs", () => {
  it("skips a restored evidence ID that already uses the next suffix", () => {
    const imported = importRoleFromClaims({
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
    const claim = imported.claims[0];
    if (!claim) throw new Error("imported claim missing");
    const restored = {
      ...imported,
      claims: [
        {
          ...claim,
          evidence: [
            ...claim.evidence,
            {
              id: "imported-1-interview-3",
              scope: "CANDIDATE_SPECIFIC_ANSWER" as const,
              stance: "NEUTRAL" as const,
              text: "Earlier restored answer",
              speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
              sourceKind: "INTERVIEW" as const,
              sourceLabel: SPEAKER_ROLE.HIRING_MANAGER,
              synthetic: false,
              provenance: "CANDIDATE_REPORTED" as const,
            },
          ],
        },
      ],
    };

    const updated = recordInterviewAnswer(restored, {
      claimId: "imported-1",
      stance: "SUPPORTS",
      text: "New answer",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    const ids =
      updated.claims[0]?.evidence.map((evidence) => evidence.id) ?? [];

    expect(ids.at(-1)).toBe("imported-1-interview-4");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps generated evidence IDs within the persistence identifier limit", () => {
    const imported = importRoleFromClaims({
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
    const claim = imported.claims[0];
    if (!claim) throw new Error("imported claim missing");
    const claimId = "x".repeat(300);
    const restored = {
      ...imported,
      claims: [{ ...claim, id: claimId }],
    };

    const updated = recordInterviewAnswer(restored, {
      claimId,
      stance: "SUPPORTS",
      text: "New answer",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    const id = updated.claims[0]?.evidence.at(-1)?.id;

    expect(id?.length).toBeLessThanOrEqual(300);
    expect(id?.endsWith("-interview-2")).toBe(true);
  });
});
