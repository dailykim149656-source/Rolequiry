import type { CaseSnapshot } from "@/lib/case-store";
import {
  CLAIM_KIND,
  type DerivedClaim,
  IMPORTANCE,
  type Importance,
} from "@/lib/domain/types";
import { EvidenceList, EvidenceSignals } from "./Evidence";
import { Icon, type IconName } from "./Icon";

const IMPORTANCE_OPTIONS = [
  IMPORTANCE.LOW,
  IMPORTANCE.MEDIUM,
  IMPORTANCE.HIGH,
  IMPORTANCE.CRITICAL,
] as const;

export function ClaimBoard({
  snapshot,
  onImportanceChange,
  className = "",
}: {
  readonly snapshot: CaseSnapshot;
  readonly className?: string;
  readonly onImportanceChange: (
    claimId: string,
    importance: Importance,
  ) => void;
}) {
  return (
    <section
      aria-labelledby="claim-board-title"
      className={`surface-shadow rounded-[1.35rem] border border-line bg-surface p-3 sm:p-5 ${className}`}
      id="claim-board"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-1 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="size-5" name="briefcase" />
            <h2 className="text-lg font-semibold" id="claim-board-title">
              Claim Board
            </h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Employer claims, your priorities, and the evidence behind each one.
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
          {
            snapshot.derived.claims.filter(
              (claim) => claim.candidatePrioritySet,
            ).length
          }{" "}
          prioritized
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {snapshot.derived.claims.map((claim) => (
          <ClaimCard
            active={claim.id === snapshot.activeProbeId}
            claim={claim}
            key={claim.id}
            onImportanceChange={onImportanceChange}
          />
        ))}
      </div>
    </section>
  );
}

function ClaimCard({
  active,
  claim,
  onImportanceChange,
}: {
  readonly active: boolean;
  readonly claim: DerivedClaim;
  readonly onImportanceChange: (
    claimId: string,
    importance: Importance,
  ) => void;
}) {
  const isSet = claim.candidatePrioritySet;
  const rankingNote = !isSet
    ? "Not in ranking yet"
    : claim.kind === CLAIM_KIND.EMPLOYER_POLICY
      ? "Written policy · tracked outside probe ranking"
      : claim.probeEligible
        ? "Included in the next-question ranking"
        : "Evidence currently lowers the need to probe";

  return (
    <article
      className={`group rounded-2xl border p-4 transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-brand/50 focus-within:shadow-sm hover:border-strong ${
        active
          ? "border-ink bg-quiet shadow-sm ring-1 ring-ink/10"
          : isSet
            ? "border-line bg-surface"
            : "border-dashed border-strong bg-quiet/45"
      }`}
      data-active={String(active)}
      data-priority-set={String(isSet)}
      data-testid={`claim-${claim.id}`}
    >
      <div className="flex gap-3 sm:gap-4">
        <ClaimGlyph claim={claim} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1">
              {active ? (
                <p className="mb-1 inline-flex rounded-full bg-ink px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-white">
                  Active probe
                </p>
              ) : null}
              <h3 className="font-semibold text-ink">{claim.dimension}</h3>
              <blockquote className="mt-1 text-sm leading-6 text-secondary">
                “{claim.employerStatement}”
              </blockquote>
            </div>
            <StatusBadge status={claim.status} />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line/80 pt-3">
            <PriorityControl
              claim={claim}
              onImportanceChange={onImportanceChange}
            />
            <EvidenceSignals claim={claim} />
          </div>
          <p className="mt-2 text-xs text-muted">{rankingNote}</p>
        </div>
      </div>
      <EvidenceList claim={claim} />
    </article>
  );
}

function PriorityControl({
  claim,
  onImportanceChange,
}: {
  readonly claim: DerivedClaim;
  readonly onImportanceChange: (
    claimId: string,
    importance: Importance,
  ) => void;
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      <span className="mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3.5" name="flag" />
        Candidate priority
      </span>
      <select
        aria-label={`Candidate priority for ${claim.dimension}`}
        className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          claim.candidatePrioritySet
            ? "border-brand/30 bg-brand-soft text-brand"
            : "border-strong bg-surface text-secondary"
        }`}
        onChange={(event) =>
          onImportanceChange(claim.id, event.target.value as Importance)
        }
        value={claim.candidatePrioritySet ? claim.importance : ""}
      >
        <option disabled value="">
          Set priority
        </option>
        {IMPORTANCE_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {`${value[0]}${value.slice(1).toLowerCase()}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { readonly status: DerivedClaim["status"] }) {
  const configs: Record<
    DerivedClaim["status"],
    readonly [IconName, string, string]
  > = {
    SUPPORTED: ["check", "Supported", "bg-supported-soft text-supported"],
    CHALLENGED: ["tension", "Challenged", "bg-challenged-soft text-challenged"],
    MATERIAL_AMBIGUITY: [
      "scales",
      "Material ambiguity",
      "bg-brand-soft text-brand",
    ],
    UNVERIFIED: [
      "question",
      "Unverified",
      "bg-unverified-soft text-unverified",
    ],
  };
  const config = configs[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config[2]}`}
    >
      <Icon className="size-3.5" name={config[0]} />
      {config[1]}
    </span>
  );
}

function ClaimGlyph({ claim }: { readonly claim: DerivedClaim }) {
  const name = claimIcon(claim.dimension);
  const tones: Record<IconName, string> = {
    arrow: "bg-brand-soft text-brand",
    bell: "bg-amber-soft text-amber",
    briefcase: "bg-brand-soft text-brand",
    building: "bg-supported-soft text-supported",
    check: "bg-supported-soft text-supported",
    code: "bg-brand-soft text-brand",
    compass: "bg-brand-soft text-brand",
    dollar: "bg-supported-soft text-supported",
    flag: "bg-brand-soft text-brand",
    lightbulb: "bg-brand-soft text-brand",
    message: "bg-brand-soft text-brand",
    path: "bg-brand-soft text-brand",
    people: "bg-blue-soft text-blue",
    plane: "bg-challenged-soft text-challenged",
    question: "bg-unverified-soft text-unverified",
    scales: "bg-brand-soft text-brand",
    spark: "bg-brand-soft text-brand",
    tension: "bg-challenged-soft text-challenged",
  };
  return (
    <span
      aria-hidden="true"
      className={`grid size-12 shrink-0 place-items-center rounded-xl sm:size-14 ${tones[name]}`}
    >
      <Icon className="size-6 sm:size-7" name={name} />
    </span>
  );
}

function claimIcon(dimension: string): IconName {
  const value = dimension.toLowerCase();
  if (/travel|trip|onsite|on-site/.test(value)) return "plane";
  if (/compensation|salary|pay|bonus|equity/.test(value)) return "dollar";
  if (/on-call|pager|incident/.test(value)) return "bell";
  if (/customer|client|collaboration|team/.test(value)) return "people";
  if (/ownership|technical|coding|architecture|engineering/.test(value))
    return "code";
  return "compass";
}
