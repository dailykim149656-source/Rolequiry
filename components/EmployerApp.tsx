"use client";

import Link from "next/link";
import { useWebMCP } from "use-webmcp-tool";
import { ATLAS_FDE } from "@/lib/fixtures/atlas-fde";

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export function EmployerApp() {
  useWebMCP({
    name: "get_employer_claims",
    description:
      "Return Atlas Robotics official claims for the Forward Deployed Engineer role. Employer-authored testimony, not verified facts.",
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
  useWebMCP({
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm tracking-[0.2em] text-zinc-500">
        ASKTHEJOB · EMPLOYER
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{ATLAS_FDE.company}</h1>
      <p className="mt-2 text-zinc-600">
        {ATLAS_FDE.role}. This is what the employer officially publishes to the
        agent.{" "}
        <Link className="underline" href="/case">
          Open candidate case
        </Link>
      </p>
      <ul className="mt-8 space-y-4">
        {ATLAS_FDE.claims.map((claim) => (
          <li key={claim.id} className="rounded-2xl border border-zinc-200 p-4">
            <h2 className="font-medium">{claim.dimension}</h2>
            <p className="text-sm text-zinc-600">{claim.employerStatement}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
