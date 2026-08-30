"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { createCaseStore } from "@/lib/case-store";
import { cannedInterviewAnswer } from "@/lib/demo/canned-answers";
import {
  decisionPathHint,
  decisionPathNodes,
  publicEvidenceLine,
} from "@/lib/domain/decision-path";
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
        The biggest red flag isn&apos;t always the question you should ask. Turn
        a job posting into a live evidence case that you and your agent update
        together.
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

      <section className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="order-2 lg:order-1">
          <section>
            <h2 className="text-lg font-medium">Claim board</h2>
            <p className="mt-1 text-sm text-zinc-500">
              What the employer claims, and what matters to you. The agent reads
              this same live case.
            </p>
          </section>

          {snapshot.source.origin === "AGENT_IMPORTED" &&
          !snapshot.prioritiesTouched ? (
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
          <h2 className="text-lg font-medium">Decision path</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {decisionPathHint(
              snapshot.selectionState,
              snapshot.rankingVisible,
            ) ?? "See why this is the question that matters next."}
          </p>
          {snapshot.source.origin === "AGENT_IMPORTED" &&
          !snapshot.prioritiesTouched ? (
            <p
              className="mt-3 text-sm text-zinc-300"
              data-testid="priorities-required"
            >
              Set what matters to you first.
            </p>
          ) : snapshot.selectionState === "NO_PROBE_NEEDED" ? (
            <p className="mt-3 text-sm text-zinc-300" data-testid="no-probe">
              No unresolved claims currently require another probe.
            </p>
          ) : selected &&
            (snapshot.selectionState === "ACTIVE" ||
              snapshot.selectionState === "EVIDENCE_UPDATED") ? (
            <DecisionPath claim={selected} mode={snapshot.selectionState} />
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
              webmcp.research,
            ].filter((item) => item.registered).length,
          )}
          /6
        </p>
      </details>
    </main>
  );
}

function DecisionPath({
  claim,
  mode,
}: {
  claim: DerivedClaim;
  mode: "ACTIVE" | "EVIDENCE_UPDATED";
}) {
  const nodes = decisionPathNodes(claim, mode);
  return (
    <ol className="mt-4 space-y-3 text-sm" data-testid="decision-path">
      {nodes.map((node, index) => (
        <li key={`${node.label}-${index}`}>
          {index > 0 ? (
            <p className="mb-2 text-center text-zinc-500" aria-hidden="true">
              ↓
            </p>
          ) : null}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
              {node.label}
            </p>
            <p
              className={index === 0 ? "font-medium" : "text-zinc-200"}
              data-testid={index === 0 ? "active-probe" : undefined}
            >
              {index === 0 ? `Active probe: ${node.body}` : node.body}
            </p>
            {node.href ? (
              <a
                className="mt-1 inline-block text-xs text-zinc-300 underline"
                href={node.href}
                rel="noreferrer"
                target="_blank"
              >
                View source ↗
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function EvidenceCoverage({ claim }: { claim: DerivedClaim }) {
  return (
    <div className="mt-4 space-y-2 text-sm">
      <p>{publicEvidenceLine(claim)}</p>
      <details className="mt-2 text-zinc-600">
        <summary className="cursor-pointer">
          View evidence ({claim.evidence.length})
        </summary>
        <ul className="mt-2 space-y-3">
          {claim.evidence.map((item) => {
            const sourceUrl = safeHttpUrl(item.sourceUrl);
            return (
              <li key={item.id}>
                <p>
                  {item.scope === "EMPLOYER_STATED"
                    ? "Employer statement"
                    : item.scope === "REPORTED_EXPERIENCE"
                      ? "Reported experience"
                      : "Candidate interview"}{" "}
                  ·{" "}
                  {item.synthetic ||
                  item.text.toLowerCase().includes("synthetic")
                    ? "synthetic · "
                    : ""}
                  {item.stance.toLowerCase()}
                  {item.sourceLabel ? ` · ${item.sourceLabel}` : ""}
                </p>
                <p>{item.text}</p>
                {sourceUrl ? (
                  <p className="mt-1">
                    <a
                      className="underline"
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View source ↗
                    </a>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

function safeHttpUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function chip(active: boolean): string {
  return active
    ? "rounded-full bg-zinc-950 px-3 py-1 text-sm text-white"
    : "rounded-full border border-zinc-300 px-3 py-1 text-sm";
}
