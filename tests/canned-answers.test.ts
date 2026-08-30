import { describe, expect, it } from "vitest";
import { cannedInterviewAnswer } from "@/lib/demo/canned-answers";
import { IMPORTANCE } from "@/lib/domain/types";

describe("canned interview answers", () => {
  it("does not offer the ownership hiring-manager answer when Travel is selected", () => {
    const travel = cannedInterviewAnswer("travel");
    expect(travel).toBeNull();
  });

  it("offers the ownership split answer only for technical ownership", () => {
    const ownership = cannedInterviewAnswer("technical-ownership");
    expect(ownership?.text).toContain("ownership is split");
    expect(ownership?.claimId).toBe("technical-ownership");
    expect(IMPORTANCE.CRITICAL).toBe("CRITICAL");
  });
});
