import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import { SPEAKER_ROLE } from "@/lib/domain/types";
import {
  recordInterviewAnswerTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("selection state", () => {
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
});
