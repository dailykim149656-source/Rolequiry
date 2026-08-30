"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { createCaseStore } from "@/lib/case-store";
import { cannedInterviewAnswer } from "@/lib/demo/canned-answers";
import { coverageBreakdownFor } from "@/lib/domain/policy";
import {
  type DerivedClaim,
  IMPORTANCE,
  type Importance,
} from "@/lib/domain/types";
import { useCaseWebMCPTools } from "@/lib/webmcp/use-case-tools";

const IMPORTANCE_OPTIONS = [
  IMPORTANCE.LOW,
  IMPORTANCE.MEDIUM,
  IMPORTANCE.HIGH,
  IMPORTANCE.CRITICAL,
] as const;

export function CaseApp() {
  const store = useMemo(() => createCaseStore(), []);
  const webmcp = useCaseWebMCPTools(store);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
  const selected = snapshot.derived.claims.find(
    (claim) => claim.id === snapshot.activeProbeId,
  );
  const canned = selected ? cannedInterviewAnswer(selected.id) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <p className="text-sm font-medium tracking-[0.18em] text-zinc-500">
        Rolequiry
      </p>
      <h1 className="mt-2 text-3xl font-semibold">
        Interview the job before it interviews you.
      </h1>
      <p className="mt-3 max-w-3xl text-zinc-600">
        The biggest red flag isn&apos;t always the question you should ask.
        Rolequiry keeps a live evidence case—not a chat transcript—of what
        matters to you and what still needs an answer.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-zinc-500">
        {snapshot.source.company} / {snapshot.source.role}. Change a priority
        here, then tell the agent only &quot;Check again.&quot;
      </p>

      {snapshot.source.id === "atlas-fde" ? (
        <p className="mt-2 text-sm text-zinc-500">
          <Link className="underline" href="/employer/atlas-fde">
            Employer-published claims
          </Link>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-zinc-500" data-testid="case-origin">
        {snapshot.source.origin === "DEMO_FIXTURE"
          ? "Demo case"
          : "Imported case"}
      </p>

      <section className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
        <div className="order-2 lg:order-1">
          <section>
            <h2 className="text-lg font-medium">What the employer claims</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Set what matters to you. The agent reads this same live case.
            </p>
          </section>

          {snapshot.source.origin === "AGENT_IMPORTED" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Employer statements imported. Set what matters to you before
              asking what to investigate.
            </p>
          ) : null}

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {snapshot.derived.claims.map((claim) => (
              <article
                key={claim.id}
                className="rounded-2xl border border-zinc-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium">{claim.dimension}</h2>
                    <p className="text-sm text-zinc-500">
                      {claim.employerStatement}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">
                    {claim.status === "CHALLENGED"
                      ? "CHALLENGED · conflicting evidence"
                      : claim.status}
                  </span>
                </div>
                <label className="mt-4 block text-sm">
                  Candidate importance
                  <select
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1"
                    value={claim.importance}
                    onChange={(event) =>
                      store.setImportance(
                        claim.id,
                        event.target.value as Importance,
                      )
                    }
                  >
                    {IMPORTANCE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <EvidenceCoverage claim={claim} />
              </article>
            ))}
          </section>
        </div>
        <section className="order-1 mt-8 rounded-2xl bg-zinc-950 p-5 text-zinc-50 lg:sticky lg:top-6 lg:order-2 lg:mt-0">
          <h2 className="text-lg font-medium">Current question</h2>
          {snapshot.selectionState === "ACTIVE" && selected ? (
            <div className="mt-3 space-y-2 text-sm">
              <p data-testid="active-probe">
                Active probe: {selected.dimension}
              </p>
              <p>Unresolved variable: {selected.unresolvedVariable}</p>
              <p>Measurable form: {selected.measurableForm}</p>
              <p className="mt-3 text-zinc-300">
                Waiting for interview evidence. Tell your agent what the
                interviewer said.
              </p>
            </div>
          ) : snapshot.selectionState === "NO_PROBE_NEEDED" ? (
            <p className="mt-3 text-sm text-zinc-300" data-testid="no-probe">
              No unresolved claims currently require another probe.
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-300">
              Ask your agent what to investigate next.
            </p>
          )}
        </section>
      </section>

      <details className="mt-10 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
        <summary className="cursor-pointer font-medium text-zinc-800">
          Demo controls
        </summary>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className={chip(snapshot.source.id === "atlas-fde")}
            onClick={() => store.loadFixture("atlas-fde")}
          >
            Northwind FDE
          </button>
          <button
            type="button"
            className={chip(snapshot.source.id === "kestrel-solutions")}
            onClick={() => store.loadFixture("kestrel-solutions")}
          >
            Harborline SE
          </button>
          <button
            type="button"
            className={chip(false)}
            onClick={() => store.reset()}
          >
            Reset demo
          </button>
          <button
            type="button"
            className={chip(false)}
            onClick={() => store.selectDecisionChanger()}
          >
            Rank next question
          </button>
          {canned ? (
            <button
              type="button"
              className={chip(false)}
              onClick={() => store.recordAnswer(canned)}
            >
              {canned.buttonLabel}
            </button>
          ) : null}
        </div>
        <p className="mt-3" data-testid="tool-status">
          WebMCP registered:{" "}
          {String(
            [
              webmcp.claims,
              webmcp.state,
              webmcp.select,
              webmcp.record,
              webmcp.imported,
            ].filter((item) => item.registered).length,
          )}
          /5
        </p>
      </details>
    </main>
  );
}

function EvidenceCoverage({ claim }: { claim: DerivedClaim }) {
  const coverage = coverageBreakdownFor(claim.kind, claim.evidence);
  const external = claim.evidence.filter(
    (item) => item.scope === "REPORTED_EXPERIENCE",
  );
  const supports = external.filter((item) => item.stance === "SUPPORTS").length;
  const challenges = external.filter(
    (item) => item.stance === "CHALLENGES",
  ).length;
  const interview = claim.evidence.find(
    (item) => item.scope === "CANDIDATE_SPECIFIC_ANSWER",
  );
  const interviewLabel = coverage.candidateSpecificAnswer.resolving
    ? `Candidate interview — resolving · ${interview?.stance ?? "SUPPORTS"}`
    : coverage.candidateSpecificAnswer.present
      ? `Candidate interview — non-resolving · ${interview?.stance ?? "NEUTRAL"}`
      : "Candidate interview — missing";
  return (
    <div className="mt-4 space-y-2 text-sm">
      <p className="font-medium">Evidence coverage</p>
      <p>
        {coverage.employerStated.present
          ? "Employer statement · present"
          : "Employer statement — missing"}
      </p>
      <p>
        External signals: {supports} support{supports === 1 ? "" : "s"} ·{" "}
        {challenges} challenge{challenges === 1 ? "" : "s"}
      </p>
      <p>{interviewLabel}</p>
      <details className="mt-2 text-zinc-600">
        <summary className="cursor-pointer">
          View evidence ({claim.evidence.length})
        </summary>
        <ul className="mt-2 space-y-2">
          {claim.evidence.map((item) => (
            <li key={item.id}>
              <p>
                {item.scope === "EMPLOYER_STATED"
                  ? "Employer statement"
                  : item.scope === "REPORTED_EXPERIENCE"
                    ? "Reported experience"
                    : "Candidate interview"}{" "}
                ·{" "}
                {item.synthetic || item.text.toLowerCase().includes("synthetic")
                  ? "synthetic · "
                  : ""}
                {item.stance.toLowerCase()}
              </p>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
function chip(active: boolean): string {
  return active
    ? "rounded-full bg-zinc-950 px-3 py-1 text-sm text-white"
    : "rounded-full border border-zinc-300 px-3 py-1 text-sm";
}
