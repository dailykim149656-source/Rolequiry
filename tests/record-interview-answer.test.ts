import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import { recordInterviewAnswerTool } from "@/lib/webmcp/tools";

describe("record_interview_answer validation", () => {
  it("rejects an unknown claim id without mutating evidence", () => {
    const store = createCaseStore();
    const before = store
      .getState()
      .source.claims.map((claim) => claim.evidence.length);
    const result = recordInterviewAnswerTool(store, {
      claimId: "does-not-exist",
      stance: "CHALLENGES",
      text: "should not land",
      speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
    });
    const after = store
      .getState()
      .source.claims.map((claim) => claim.evidence.length);

    expect(result).toEqual({ ok: false, error: "Unknown claim id" });
    expect(after).toEqual(before);
  });
});
