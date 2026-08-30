"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { createCaseStore } from "@/lib/case-store";
import { cannedInterviewAnswer } from "@/lib/demo/canned-answers";
import { IMPORTANCE, type Importance } from "@/lib/domain/types";
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
      <p className="text-sm tracking-[0.2em] text-zinc-500">ASKTHEJOB</p>
      <h1 className="mt-2 text-3xl font-semibold">
        Interview the job before it interviews you.
      </h1>
      <p className="mt-3 max-w-3xl text-zinc-600">
        {snapshot.source.company} / {snapshot.source.role}. Claims are not
        facts. The app ranks the unresolved variable; you set priorities; the
        agent asks; you bring the answer back.
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        <Link className="underline" href="/employer/atlas-fde">
          Employer-published claims
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-500" data-testid="case-origin">
        {snapshot.source.origin === "DEMO_FIXTURE"
          ? "Demo case"
          : "Imported case"}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">What the employer claims</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Set what matters to you. The agent reads this same live case.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
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
                {claim.status}
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
            <p className="mt-3 text-sm">
              Unresolvedness {claim.unresolvedness.toFixed(3)} · Tension{" "}
              {claim.tension.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Evidence: {claim.evidence.length} items. Synthetic workplace
              signals are labeled in source text.
            </p>
            {snapshot.rankingVisible ? (
              <p className="mt-2 text-sm">
                Probe priority {claim.probePriority.toFixed(3)}
              </p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-zinc-950 p-5 text-zinc-50">
        <h2 className="text-lg font-medium">What to ask next</h2>
        {selected ? (
          <div className="mt-3 space-y-2 text-sm">
            <p data-testid="active-probe">Active probe: {selected.dimension}</p>
            <p>Unresolved variable: {selected.unresolvedVariable}</p>
            <p>Measurable form: {selected.measurableForm}</p>
            {canned ? (
              <button
                type="button"
                className="mt-3 rounded-lg bg-white px-3 py-2 text-zinc-950"
                onClick={() => store.recordAnswer(canned)}
              >
                {canned.buttonLabel}
              </button>
            ) : (
              <p className="mt-3 text-zinc-300">
                No scripted answer for this claim. Reset and record the
                ownership answer only after ownership is selected.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-300">
            No probe selected yet. Ask the agent to check what to verify next,
            or use the button above.
          </p>
        )}
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
            Atlas FDE
          </button>
          <button
            type="button"
            className={chip(snapshot.source.id === "kestrel-solutions")}
            onClick={() => store.loadFixture("kestrel-solutions")}
          >
            Kestrel Solutions
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
        </div>
        <p className="mt-3" data-testid="tool-status">
          WebMCP registered:{" "}
          {String(
            [webmcp.claims, webmcp.state, webmcp.select, webmcp.record].filter(
              (item) => item.registered,
            ).length,
          )}
          /4
        </p>
      </details>
    </main>
  );
}

function chip(active: boolean): string {
  return active
    ? "rounded-full bg-zinc-950 px-3 py-1 text-sm text-white"
    : "rounded-full border border-zinc-300 px-3 py-1 text-sm";
}
