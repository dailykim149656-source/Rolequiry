import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CASE_TOOL_CONTRACTS } from "@/lib/webmcp/contracts";

type ReceiptToolContract = {
  readonly name: string;
  readonly description: string;
  readonly annotations?: {
    readonly readOnlyHint?: boolean;
    readonly untrustedContentHint?: boolean;
  };
};

type Receipt = {
  readonly verdict: string;
  readonly pass: boolean;
  readonly evaluatedBaseSha: string;
  readonly toolContracts: readonly ReceiptToolContract[];
  readonly checks: {
    readonly travelSelectionAuthoritative?: boolean;
    readonly authoritativeSelectionA?: {
      readonly claim_kind: string | null;
      readonly status: string | null;
      readonly authorityCoverage: { readonly covered: number } | null;
    };
  };
};

const receipt = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "docs",
      "evals",
      "head-deterministic-summary.json",
    ),
    "utf8",
  ),
) as Receipt;

describe("checked-in deterministic browser receipt freshness", () => {
  it("is a passing receipt bound to a full commit SHA", () => {
    expect(receipt.verdict).toBe("PASS");
    expect(receipt.pass).toBe(true);
    expect(receipt.evaluatedBaseSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it("matches the current tool contracts, so changing a contract without re-running the browser receipt fails", () => {
    const receiptByName = new Map(
      receipt.toolContracts.map((tool) => [tool.name, tool]),
    );
    expect([...receiptByName.keys()].sort()).toEqual(
      CASE_TOOL_CONTRACTS.map((contract) => contract.name).sort(),
    );
    for (const contract of CASE_TOOL_CONTRACTS) {
      const exposed = receiptByName.get(contract.name);
      const annotations = contract.annotations as {
        readonly readOnlyHint?: boolean;
        readonly untrustedContentHint?: boolean;
      };
      expect(exposed?.description, contract.name).toBe(contract.description);
      expect(exposed?.annotations?.readOnlyHint ?? false, contract.name).toBe(
        annotations.readOnlyHint ?? false,
      );
      expect(
        exposed?.annotations?.untrustedContentHint ?? false,
        contract.name,
      ).toBe(annotations.untrustedContentHint ?? false);
    }
  });

  it("pins the authoritative lived-experience selection at the browser surface", () => {
    expect(receipt.checks.travelSelectionAuthoritative).toBe(true);
    expect(receipt.checks.authoritativeSelectionA).toMatchObject({
      claim_kind: "LIVED_EXPERIENCE",
      status: "MATERIAL_AMBIGUITY",
      authorityCoverage: { covered: 0.2 },
    });
  });
});
