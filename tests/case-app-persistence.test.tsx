// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseApp } from "@/components/CaseApp";
import {
  CASE_STORAGE_KEY,
  serializePersistedCase,
} from "@/lib/case-persistence";
import { createCaseStore } from "@/lib/case-store";
import { importRoleFromClaimsTool } from "@/lib/webmcp/tools";

function savedCase(company: string) {
  const store = createCaseStore();
  importRoleFromClaimsTool(store, {
    company,
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
  return serializePersistedCase(store.getState());
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("CaseApp persistence", () => {
  it("restores the current tab session instead of browser-local state", async () => {
    window.sessionStorage.setItem(CASE_STORAGE_KEY, savedCase("Session Corp"));
    window.localStorage.setItem(CASE_STORAGE_KEY, savedCase("Local Corp"));

    render(<CaseApp />);

    expect(await screen.findByText("Session Corp")).toBeTruthy();
  });

  it("starts from the canonical fixture when a modified demo was saved", () => {
    const demo = createCaseStore();
    demo.setImportance("travel", "CRITICAL");
    window.sessionStorage.setItem(
      CASE_STORAGE_KEY,
      serializePersistedCase(demo.getState()),
    );

    render(<CaseApp />);

    expect(
      screen.getByRole<HTMLSelectElement>("combobox", {
        name: "Candidate priority for Travel",
      }).value,
    ).toBe("LOW");
  });

  it("does not retain the demo fixture in tab storage", () => {
    render(<CaseApp />);

    expect(window.sessionStorage.getItem(CASE_STORAGE_KEY)).toBeNull();
  });
});
