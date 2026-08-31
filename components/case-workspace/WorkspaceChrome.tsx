import Link from "next/link";
import type { CaseSnapshot, FixtureId } from "@/lib/case-store";
import type { WebMCPToolDiagnostic } from "@/lib/webmcp/diagnostics";
import { Icon } from "./Icon";

export function ProductBar({
  webmcpCount,
  diagnostics = [],
  total = 7,
}: {
  readonly webmcpCount: number;
  readonly diagnostics?: readonly WebMCPToolDiagnostic[];
  readonly total?: number;
}) {
  const hasFailure = diagnostics.some((item) => item.status === "FAILED");
  const isPending = diagnostics.some((item) => item.status === "PENDING");
  const isLive = webmcpCount === total;
  const status = isLive
    ? `WebMCP ${total}/${total} live`
    : `WebMCP ${webmcpCount}/${total}`;
  return (
    <header className="mb-5 flex items-center justify-between gap-4 px-1">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white">
          <Icon className="size-5" name="compass" />
        </span>
        <div className="min-w-0 sm:flex sm:items-baseline sm:gap-4">
          <p className="font-display text-2xl font-semibold tracking-tight">
            Rolequiry
          </p>
          <p className="hidden text-sm text-muted sm:block">
            Interview the job before it interviews you.
          </p>
        </div>
      </div>
      <output
        aria-atomic="true"
        aria-live="polite"
        className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-secondary"
      >
        <span
          className={`size-2 rounded-full ${
            hasFailure
              ? "bg-challenged"
              : isLive
                ? "bg-supported"
                : "bg-unverified"
          }`}
        />
        {hasFailure ? (
          <>
            <span className="sm:hidden">Registration failed</span>
            <span className="hidden sm:inline">WebMCP registration failed</span>
          </>
        ) : isPending ? (
          <>
            <span className="sm:hidden">WebMCP registering</span>
            <span className="hidden sm:inline">{status} · registering</span>
          </>
        ) : webmcpCount === 0 ? (
          <>
            <span className="sm:hidden">WebMCP required</span>
            <span className="hidden sm:inline">Open in a WebMCP browser</span>
          </>
        ) : (
          status
        )}
      </output>
    </header>
  );
}

export function DossierHeader({
  snapshot,
}: {
  readonly snapshot: CaseSnapshot;
}) {
  const claims = snapshot.derived.claims;
  const unresolved = claims.filter(
    (claim) =>
      claim.status === "UNVERIFIED" || claim.status === "MATERIAL_AMBIGUITY",
  ).length;
  const challenged = claims.filter(
    (claim) => claim.status === "CHALLENGED",
  ).length;
  const company = snapshot.source.company.replace(
    /\s*\(synthetic demo\)$/i,
    "",
  );
  const origin =
    snapshot.source.origin === "DEMO_FIXTURE" ? "Demo case" : "Imported case";

  return (
    <section className="dossier-wash surface-shadow overflow-hidden rounded-[1.5rem] border border-line bg-surface px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <CompanyMark company={company} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Candidate due diligence
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {company}
          </h1>
          <p className="mt-1 text-lg text-secondary sm:text-xl">
            {snapshot.source.role}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-secondary">
            <span
              className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand"
              data-testid="case-origin"
            >
              {origin}
            </span>
            <Metric value={claims.length} label="claims" />
            <Metric value={unresolved} label="unresolved" />
            <Metric value={challenged} label="challenged" />
            {snapshot.source.id === "atlas-fde" ? (
              <Link
                className="inline-flex min-h-11 items-center py-2 font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                href="/employer/atlas-fde"
              >
                Employer claims
              </Link>
            ) : null}
            {snapshot.source.sourceUrl ? (
              <a
                aria-label="Open agent-reported job source in a new tab"
                className="inline-flex min-h-11 items-center gap-1.5 py-2 font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
                href={snapshot.source.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Job source · agent-reported
                <Icon className="size-3.5" name="arrow" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CaseFileControls({
  canExport,
  error,
  message,
  onExport,
  onImport,
}: {
  readonly canExport: boolean;
  readonly error: boolean;
  readonly message: string | null;
  readonly onExport: () => void;
  readonly onImport: (file: File) => void;
}) {
  return (
    <section
      aria-label="Case file"
      className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-semibold text-ink">Local case backup</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">
          The JSON is created and read on this device; it is never uploaded.
        </p>
        {message ? (
          <p
            className={`mt-1 text-xs font-medium ${error ? "text-challenged" : "text-supported"}`}
            role={error ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {canExport ? (
          <button
            className={controlChip(false)}
            onClick={onExport}
            type="button"
          >
            Export case JSON
          </button>
        ) : null}
        <label
          className={`${controlChip(false)} relative inline-flex cursor-pointer items-center overflow-hidden focus-within:ring-2 focus-within:ring-brand/30`}
        >
          Import case JSON
          <input
            accept=".json,application/json"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
      </div>
    </section>
  );
}

export function CompanyMark({ company }: { readonly company: string }) {
  const words = company
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/gi, ""))
    .filter(Boolean);
  const initials =
    words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
      : (words[0]?.slice(0, 2) ?? "R");

  return (
    <div
      aria-label={`${company} monogram`}
      className="grid size-24 shrink-0 place-items-center rounded-[1.35rem] bg-ink font-display text-4xl font-semibold uppercase text-white shadow-lg shadow-ink/15 sm:size-28 sm:text-5xl"
      role="img"
    >
      {initials}
    </div>
  );
}

function Metric({
  value,
  label,
}: {
  readonly value: number;
  readonly label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-semibold text-ink">{value}</span>
      {label}
    </span>
  );
}

export function DemoControls({
  activeFixture,
  cannedAnswerLabel,
  onLoadFixture,
  onRank,
  onRecordAnswer,
  onReset,
  webmcpCount,
  webmcpDiagnostics,
}: {
  readonly activeFixture: string;
  readonly cannedAnswerLabel: string | undefined;
  readonly onLoadFixture: (id: FixtureId) => void;
  readonly onRank: () => void;
  readonly onRecordAnswer: (() => void) | undefined;
  readonly onReset: () => void;
  readonly webmcpCount: number;
  readonly webmcpDiagnostics: readonly WebMCPToolDiagnostic[];
}) {
  return (
    <details className="mt-5 rounded-2xl border border-dashed border-strong bg-surface/60 p-4 text-sm text-secondary">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
        Demo controls
      </summary>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-4">
        <button
          className={controlChip(activeFixture === "atlas-fde")}
          onClick={() => onLoadFixture("atlas-fde")}
          type="button"
        >
          Northwind FDE
        </button>
        <button
          className={controlChip(activeFixture === "kestrel-solutions")}
          onClick={() => onLoadFixture("kestrel-solutions")}
          type="button"
        >
          Harborline SE
        </button>
        <button className={controlChip(false)} onClick={onReset} type="button">
          Reset demo
        </button>
        <button className={controlChip(false)} onClick={onRank} type="button">
          Rank next question
        </button>
        {cannedAnswerLabel && onRecordAnswer ? (
          <button
            className={controlChip(false)}
            onClick={onRecordAnswer}
            type="button"
          >
            {cannedAnswerLabel}
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted" data-testid="tool-status">
        WebMCP registered: {webmcpCount}/7
      </p>
      <ToolDiagnostics diagnostics={webmcpDiagnostics} />
    </details>
  );
}

function ToolDiagnostics({
  diagnostics,
}: {
  readonly diagnostics: readonly WebMCPToolDiagnostic[];
}) {
  const allUnavailable = diagnostics.every(
    (item) => item.status === "UNAVAILABLE",
  );
  return (
    <div
      className="mt-3 border-t border-line pt-3"
      data-testid="webmcp-diagnostics"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
        Tool diagnostics
      </p>
      {allUnavailable ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          This browser does not expose document.modelContext. Open the same page
          in ChatGPT&apos;s browser or WebMCP-enabled Chrome.
        </p>
      ) : (
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {diagnostics.map((item) => (
            <li
              className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-quiet px-2.5 py-2 text-xs"
              key={item.name}
            >
              <code className="truncate text-ink">{item.name}</code>
              <span
                className={`shrink-0 font-semibold ${diagnosticTone(item.status)}`}
              >
                {diagnosticLabel(item.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function diagnosticLabel(status: WebMCPToolDiagnostic["status"]): string {
  if (status === "LIVE") return "Live";
  if (status === "FAILED") return "Registration failed";
  if (status === "PENDING") return "Registration pending";
  return "Browser unavailable";
}

function diagnosticTone(status: WebMCPToolDiagnostic["status"]): string {
  if (status === "LIVE") return "text-supported";
  if (status === "FAILED") return "text-challenged";
  return "text-unverified";
}

function controlChip(active: boolean): string {
  return `min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
    active
      ? "border-ink bg-ink text-white"
      : "border-line bg-surface text-secondary hover:border-strong hover:text-ink"
  }`;
}
