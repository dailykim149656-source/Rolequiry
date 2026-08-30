import type { CaseSnapshot } from "@/lib/case-store";
import {
  decisionPathHint,
  decisionPathNodes,
} from "@/lib/domain/decision-path";
import type { DerivedClaim } from "@/lib/domain/types";
import { Icon, type IconName } from "./Icon";

export function DecisionPanel({
  snapshot,
}: {
  readonly snapshot: CaseSnapshot;
}) {
  const selected = snapshot.derived.claims.find(
    (claim) => claim.id === snapshot.activeProbeId,
  );
  return (
    <section
      aria-labelledby="decision-path-title"
      className="surface-shadow rounded-[1.35rem] border border-line bg-surface p-4 lg:sticky lg:top-6 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="size-5" name="path" />
            <h2 className="text-lg font-semibold" id="decision-path-title">
              Decision Path
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            {decisionPathHint(
              snapshot.selectionState,
              snapshot.rankingVisible,
            ) ?? "Why this is the question that matters next."}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
          {selected ? "Active claim" : "Live case"}
        </span>
      </div>

      {snapshot.source.origin === "AGENT_IMPORTED" &&
      !snapshot.prioritiesTouched ? (
        <PrioritiesRequired />
      ) : snapshot.selectionState === "NO_PROBE_NEEDED" ? (
        <DecisionNotice
          body="No unresolved candidate-priority claim currently needs another probe."
          testId="no-probe"
          title="No probe needed"
        />
      ) : selected &&
        (snapshot.selectionState === "ACTIVE" ||
          snapshot.selectionState === "EVIDENCE_UPDATED") ? (
        <DecisionPath claim={selected} mode={snapshot.selectionState} />
      ) : (
        <DecisionNotice
          body="Set your priorities, then tell your agent “Check again.”"
          title="Ready when you are"
        />
      )}
    </section>
  );
}

function PrioritiesRequired() {
  const steps = [
    ["briefcase", "Import job"],
    ["flag", "Set priorities"],
    ["spark", "Check again"],
    ["message", "Ask next"],
  ] as const satisfies ReadonlyArray<readonly [IconName, string]>;
  return (
    <div className="mt-4" data-testid="priorities-required">
      <div className="rounded-2xl border border-brand/20 bg-brand-soft/60 p-5">
        <div className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-brand shadow-sm">
            <Icon className="size-6" name="scales" />
          </span>
          <div>
            <h3 className="text-lg font-semibold">
              Your judgment activates the ranking
            </h3>
            <p className="mt-1 text-sm leading-6 text-secondary">
              Unprioritized claims stay outside the decision. Choose only what
              could materially change your view of the role.
            </p>
          </div>
        </div>
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-3 text-sm">
        {steps.map(([icon, label], index) => (
          <li
            className="rounded-xl border border-line bg-quiet p-3"
            key={label}
          >
            <span className="grid size-8 place-items-center rounded-full bg-surface text-brand">
              <Icon className="size-4" name={icon} />
            </span>
            <p className="mt-2 font-semibold text-ink">
              <span className="mr-1 text-brand">{index + 1}.</span> {label}
            </p>
          </li>
        ))}
      </ol>
      <a
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        href="#claim-board"
      >
        Set your priorities
        <Icon className="size-4" name="arrow" />
      </a>
    </div>
  );
}

function DecisionNotice({
  body,
  testId,
  title,
}: {
  readonly body: string;
  readonly testId?: string;
  readonly title: string;
}) {
  return (
    <div
      className="mt-4 flex gap-4 rounded-2xl border border-brand/20 bg-brand-soft/50 p-5"
      data-testid={testId}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-brand shadow-sm">
        <Icon className="size-5" name="spark" />
      </span>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-secondary">{body}</p>
      </div>
    </div>
  );
}

function DecisionPath({
  claim,
  mode,
}: {
  readonly claim: DerivedClaim;
  readonly mode: "ACTIVE" | "EVIDENCE_UPDATED";
}) {
  const nodes = decisionPathNodes(claim, mode);
  return (
    <ol
      className="relative mt-4 space-y-3 before:absolute before:bottom-8 before:left-[1.35rem] before:top-8 before:w-0.5 before:bg-brand/30"
      data-testid="decision-path"
    >
      {nodes.map((node, index) => {
        const isFirst = index === 0;
        const isLast = index === nodes.length - 1;
        const label = isLast && node.label !== "Next" ? "Ask next" : node.label;
        return (
          <li className="relative flex gap-3" key={`${node.label}-${index}`}>
            <span
              className={`z-10 grid size-11 shrink-0 place-items-center rounded-full border ${
                isFirst || isLast
                  ? "border-brand bg-brand text-white shadow-md shadow-brand/20"
                  : "border-brand/20 bg-brand-soft text-brand"
              }`}
            >
              <Icon className="size-5" name={decisionIcon(node.label, index)} />
            </span>
            <div
              className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 ${
                isFirst
                  ? "border-brand/30 bg-brand-soft/60"
                  : isLast
                    ? "border-brand bg-surface shadow-sm shadow-brand/10"
                    : "border-line bg-quiet"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                  {label}
                </p>
                {isLast ? (
                  <Icon className="size-4 text-brand" name="arrow" />
                ) : null}
              </div>
              <p
                className={`mt-1 leading-6 ${isFirst || isLast ? "font-semibold text-ink" : "text-sm text-secondary"}`}
                data-testid={isFirst ? "active-probe" : undefined}
              >
                {isFirst && node.label === "Active claim"
                  ? `Active probe: ${node.body}`
                  : node.body}
              </p>
              {node.href ? (
                <a
                  className="mt-2 inline-flex min-h-11 items-center gap-1.5 py-2 text-xs font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
                  href={node.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  View source
                  <Icon className="size-3.5" name="arrow" />
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function decisionIcon(label: string, index: number): IconName {
  if (index === 0) return "code";
  if (/evidence|changed/i.test(label)) return "scales";
  if (/unresolved|state/i.test(label)) return "question";
  if (/know/i.test(label)) return "lightbulb";
  return "message";
}
