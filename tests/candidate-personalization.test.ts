import { describe, expect, it } from "vitest";
import { createCaseStore } from "@/lib/case-store";
import {
  importRoleFromClaimsTool,
  selectDecisionChanger,
  setCandidatePrioritiesTool,
} from "@/lib/webmcp/tools";

function importSharedRole(store: ReturnType<typeof createCaseStore>) {
  importRoleFromClaimsTool(store, {
    company: "Example Corp",
    role: "Forward Deployed Engineer",
    claims: [
      {
        dimension: "Hands-on coding share",
        employerStatement: "Most delivery work is hands-on coding",
        unresolvedVariable:
          "How much of the week is spent coding versus coordinating delivery?",
        measurableForm:
          "Typical weekly split between coding and delivery coordination",
      },
      {
        dimension: "Travel concentration",
        employerStatement: "Frequent customer-site travel is expected",
        unresolvedVariable:
          "How concentrated is customer-site travel during launches?",
        measurableForm:
          "Median and maximum travel days per quarter for this team",
      },
    ],
  });
}

describe("candidate-specific ranking", () => {
  it("selects different first probes for the same role after different candidate confirmations", () => {
    const builder = createCaseStore();
    const travelConstrained = createCaseStore();
    importSharedRole(builder);
    importSharedRole(travelConstrained);

    setCandidatePrioritiesTool(builder, {
      priorities: [
        { claimId: "imported-1", importance: "CRITICAL" },
        { claimId: "imported-2", importance: "LOW" },
      ],
    });
    setCandidatePrioritiesTool(travelConstrained, {
      priorities: [
        { claimId: "imported-1", importance: "MEDIUM" },
        { claimId: "imported-2", importance: "CRITICAL" },
      ],
    });

    expect(selectDecisionChanger(builder).claim_id).toBe("imported-1");
    expect(selectDecisionChanger(travelConstrained).claim_id).toBe(
      "imported-2",
    );
  });
});
