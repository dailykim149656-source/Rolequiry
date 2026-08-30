"use client";

import Link from "next/link";
import { useWebMCP } from "use-webmcp-tool";
import { Icon } from "@/components/case-workspace/Icon";
import {
  CompanyMark,
  ProductBar,
} from "@/components/case-workspace/WorkspaceChrome";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export function EmployerApp() {
  const claimsTool = useWebMCP({
    name: "get_employer_claims",
    description:
      "Return official claims for this synthetic Forward Deployed Engineer demo role. Employer-authored testimony, not verified facts.",
    inputSchema: emptySchema,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => ({
      company: ATLAS_FDE.company,
      role: ATLAS_FDE.role,
      source: "employer-published",
      claims: ATLAS_FDE.claims.map((claim) => ({
        id: claim.id,
        dimension: claim.dimension,
        statement: claim.employerStatement,
      })),
    }),
  });
  const policyTool = useWebMCP({
    name: "get_employer_policy",
    description:
      "Return official employer policy statements for compensation and related policy claims.",
    inputSchema: emptySchema,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => ({
      company: ATLAS_FDE.company,
      role: ATLAS_FDE.role,
      policyClaims: ATLAS_FDE.claims
        .filter(
          (claim) =>
            claim.kind === "EMPLOYER_POLICY" || claim.id === "compensation",
        )
        .map((claim) => ({ id: claim.id, statement: claim.employerStatement })),
    }),
  });
  const company = ATLAS_FDE.company.replace(/\s*\(synthetic demo\)$/i, "");
  const webmcpCount = [claimsTool, policyTool].filter(
    (tool) => tool.registered,
  ).length;

  return (
    <main className="min-h-dvh bg-canvas px-4 py-5 text-ink sm:px-6 sm:py-7 xl:px-8">
      <div className="mx-auto max-w-[90rem]">
        <ProductBar total={2} webmcpCount={webmcpCount} />
        <section className="dossier-wash surface-shadow overflow-hidden rounded-[1.5rem] border border-line bg-surface px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <CompanyMark company={company} />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                Employer-published source
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {company}
              </h1>
              <p className="mt-1 text-lg text-secondary sm:text-xl">
                {ATLAS_FDE.role}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary">
                Synthetic employer testimony exposed through two read-only
                WebMCP tools. Rolequiry treats these statements as claims, not
                verified facts.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              href="/case"
            >
              Open candidate case
              <Icon className="size-4" name="arrow" />
            </Link>
          </div>
        </section>

        <section className="surface-shadow mt-5 rounded-[1.35rem] border border-line bg-surface p-3 sm:p-5">
          <div className="border-b border-line px-1 pb-4">
            <div className="flex items-center gap-2">
              <Icon className="size-5" name="building" />
              <h2 className="text-lg font-semibold">Published claims</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              The candidate view adds priorities and evidence without rewriting
              this source testimony.
            </p>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {ATLAS_FDE.claims.map((claim) => (
              <li
                className="rounded-2xl border border-line bg-surface p-4"
                key={claim.id}
              >
                <div className="flex gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon
                      className="size-5"
                      name={
                        claim.kind === "EMPLOYER_POLICY"
                          ? "dollar"
                          : "briefcase"
                      }
                    />
                  </span>
                  <div>
                    <h3 className="font-semibold">{claim.dimension}</h3>
                    <p className="mt-1 text-sm leading-6 text-secondary">
                      “{claim.employerStatement}”
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
