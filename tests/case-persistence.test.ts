import { describe, expect, it } from "vitest";
import {
  parsePersistedCase,
  serializePersistedCase,
} from "@/lib/case-persistence";
import { createCaseStore } from "@/lib/case-store";
import {
  importRoleFromClaimsTool,
  selectDecisionChanger,
} from "@/lib/webmcp/tools";

describe("case persistence", () => {
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
});
