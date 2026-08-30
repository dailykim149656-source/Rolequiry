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
      <p className="text-sm font-medium tracking-[0.18em] text-zinc-500">
        Rolequiry
      </p>
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
            <EvidenceCoverage claim={claim} />
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
            <p className="mt-3 text-zinc-300">
              Waiting for interview evidence. Tell your agent what the
              interviewer said.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-300">
            No probe selected yet. Ask the agent what to investigate next.
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

function EvidenceCoverage({
  claim,
}: {
  claim: {
    readonly evidence: readonly {
      readonly scope: string;
      readonly stance: string;
    }[];
  };
}) {
  const reports = claim.evidence.filter(
    (item) => item.scope === "REPORTED_EXPERIENCE",
  );
  const hasEmployer = claim.evidence.some(
    (item) => item.scope === "EMPLOYER_STATED",
  );
  const hasAnswer = claim.evidence.some(
    (item) => item.scope === "CANDIDATE_SPECIFIC_ANSWER",
  );
  const supports = claim.evidence.filter(
    (item) => item.stance === "SUPPORTS",
  ).length;
  const challenges = claim.evidence.filter(
    (item) => item.stance === "CHALLENGES",
  ).length;
  return (
    <div className="mt-4 space-y-2 text-sm">
      <p className="font-medium">Evidence coverage</p>
      <p>
        {hasEmployer ? "Employer statement" : "Employer statement — missing"}
      </p>
      <p>
        {reports.length} reported experience{reports.length === 1 ? "" : "s"}
      </p>
      <p>
        {hasAnswer ? "Candidate interview" : "Candidate interview — missing"}
      </p>
      <p className="text-zinc-500">
        Direction: {supports} support{supports === 1 ? "" : "s"} · {challenges}{" "}
        challenge{challenges === 1 ? "" : "s"}
      </p>
    </div>
  );
}
function chip(active: boolean): string {
  return active
    ? "rounded-full bg-zinc-950 px-3 py-1 text-sm text-white"
    : "rounded-full border border-zinc-300 px-3 py-1 text-sm";
}
