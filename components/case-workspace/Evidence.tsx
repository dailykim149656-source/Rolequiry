import {
  AUTHORITY_SCOPE,
  type DerivedClaim,
  EVIDENCE_PROVENANCE,
  EVIDENCE_STANCE,
  type Evidence,
} from "@/lib/domain/types";
import { Icon, type IconName } from "./Icon";

type EvidenceTone = "challenged" | "empty" | "mixed" | "neutral" | "supported";

function evidenceTone(items: readonly Evidence[]): EvidenceTone {
  const supports = items.some(
    (item) => item.stance === EVIDENCE_STANCE.SUPPORTS,
  );
  const challenges = items.some(
    (item) => item.stance === EVIDENCE_STANCE.CHALLENGES,
  );
  if (supports && challenges) return "mixed";
  if (supports) return "supported";
  if (challenges) return "challenged";
  if (items.length > 0) return "neutral";
  return "empty";
}

export function EvidenceSignals({ claim }: { readonly claim: DerivedClaim }) {
  const employer = claim.evidence.filter(
    (item) => item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED,
  );
  const reports = claim.evidence.filter(
    (item) => item.scope === AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
  );
  const interview = claim.evidence.filter(
    (item) => item.scope === AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER,
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <EvidenceSignal
        count={employer.length}
        icon="building"
        label="Employer source"
        tone={evidenceTone(employer)}
      />
      <EvidenceSignal
        count={reports.length}
        icon="people"
        label="Public"
        tone={evidenceTone(reports)}
      />
      <EvidenceSignal
        count={interview.length}
        icon="message"
        label="Interview"
        tone={evidenceTone(interview)}
      />
    </div>
  );
}

function EvidenceSignal({
  count,
  icon,
  label,
  tone,
}: {
  readonly count: number;
  readonly icon: IconName;
  readonly label: string;
  readonly tone: EvidenceTone;
}) {
  const toneClass = {
    challenged: "bg-challenged-soft text-challenged",
    empty: "bg-unverified-soft text-unverified",
    mixed: "bg-amber-soft text-amber",
    neutral: "bg-unverified-soft text-unverified",
    supported: "bg-supported-soft text-supported",
  }[tone];
  const summary = `${label}: ${count} evidence ${count === 1 ? "item" : "items"}, ${tone}`;
  return (
    <span
      aria-label={summary}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ${toneClass}`}
      role="img"
      title={summary}
    >
      <Icon className="size-4" name={icon} />
      <span className="hidden sm:inline">{label}</span>
      <span className="rounded-full bg-surface/70 px-1.5 py-0.5 tabular-nums">
        {count}
      </span>
    </span>
  );
}

export function EvidenceList({ claim }: { readonly claim: DerivedClaim }) {
  const groups = [
    {
      key: AUTHORITY_SCOPE.EMPLOYER_STATED,
      label: "Employer-source evidence",
      icon: "building" as const,
    },
    {
      key: AUTHORITY_SCOPE.REPORTED_EXPERIENCE,
      label: "Public evidence",
      icon: "people" as const,
    },
    {
      key: AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER,
      label: "Interview evidence",
      icon: "message" as const,
    },
  ];

  return (
    <details className="mt-3 border-t border-line pt-3 text-sm">
      <summary className="min-h-11 cursor-pointer rounded-lg px-1 py-2 font-medium text-secondary outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30">
        View evidence ({claim.evidence.length})
      </summary>
      <div className="mt-2 grid gap-3">
        {groups.map((group) => {
          const items = claim.evidence.filter(
            (item) => item.scope === group.key,
          );
          if (items.length === 0) return null;
          return (
            <section
              aria-label={group.label}
              className="overflow-hidden rounded-xl border border-line bg-quiet"
              key={group.key}
            >
              <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs font-semibold text-secondary">
                <Icon className="size-4" name={group.icon} />
                {group.label}
                <span className="ml-auto tabular-nums text-muted">
                  {items.length}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <EvidenceRow item={item} key={item.id} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </details>
  );
}

function EvidenceRow({ item }: { readonly item: Evidence }) {
  const sourceUrl = safeHttpUrl(item.sourceUrl);
  const synthetic =
    item.synthetic || item.text.toLowerCase().includes("synthetic");
  const source = item.sourceLabel ?? evidenceSourceLabel(item);
  const provenance = evidenceProvenanceLabel(item);
  return (
    <li className="bg-surface/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-ink">{source}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stanceClass(item.stance)}`}
        >
          {stanceLabel(item.stance)}
        </span>
        {synthetic ? (
          <span className="text-xs font-medium text-muted">Synthetic</span>
        ) : null}
        <span className="text-xs font-medium text-muted">{provenance}</span>
      </div>
      <p className="mt-1.5 leading-6 text-secondary">{item.text}</p>
      {sourceUrl ? (
        <a
          aria-label={`Open ${source} source in a new tab`}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 py-2 text-xs font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
          href={sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          View source
          <Icon className="size-3.5" name="arrow" />
        </a>
      ) : null}
    </li>
  );
}

function evidenceSourceLabel(item: Evidence): string {
  if (item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED)
    return "Employer-published claim";
  if (item.scope === AUTHORITY_SCOPE.CANDIDATE_SPECIFIC_ANSWER)
    return item.speakerRole
      ? `Interview · ${titleCase(item.speakerRole)}`
      : "Candidate interview";
  return "Reported experience";
}

function evidenceProvenanceLabel(item: Evidence): string {
  const provenance = item.provenance ?? EVIDENCE_PROVENANCE.CASE_INPUT;
  if (provenance === EVIDENCE_PROVENANCE.AGENT_REPORTED) {
    return item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED
      ? "Employer-published · agent-reported"
      : "Public source · agent-reported";
  }
  if (provenance === EVIDENCE_PROVENANCE.CANDIDATE_REPORTED)
    return "Candidate-reported";
  return "Case input";
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function stanceLabel(stance: Evidence["stance"]): string {
  if (stance === "SUPPORTS") return "Supports";
  if (stance === "CHALLENGES") return "Challenges";
  return "Neutral";
}

function stanceClass(stance: Evidence["stance"]): string {
  if (stance === "SUPPORTS") return "bg-supported-soft text-supported";
  if (stance === "CHALLENGES") return "bg-challenged-soft text-challenged";
  return "bg-unverified-soft text-unverified";
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
