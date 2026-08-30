import { z } from "zod";
import type { CaseSnapshot, RestorableCaseState } from "@/lib/case-store";
import {
  AUTHORITY_SCOPE,
  CASE_ORIGIN,
  CLAIM_KIND,
  EVIDENCE_PROVENANCE,
  EVIDENCE_STANCE,
  IMPORTANCE,
  type RoleCase,
  SOURCE_KIND,
  SPEAKER_ROLE,
} from "@/lib/domain/types";

export const CASE_STORAGE_KEY = "rolequiry.case.v1";

const httpUrl = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  });
const text = z.string().max(20_000);
const evidenceSchema = z.object({
  id: z.string().min(1).max(300),
  scope: z.enum(AUTHORITY_SCOPE),
  stance: z.enum(EVIDENCE_STANCE),
  text,
  speakerRole: z.enum(SPEAKER_ROLE).optional(),
  sourceKind: z.enum(SOURCE_KIND).optional(),
  sourceLabel: text.optional(),
  synthetic: z.boolean().optional(),
  sourceUrl: httpUrl.optional(),
  provenance: z.enum(EVIDENCE_PROVENANCE).optional(),
});
const claimSchema = z.object({
  id: z.string().min(1).max(300),
  dimension: text,
  employerStatement: text,
  importance: z.enum(IMPORTANCE),
  unresolvedVariable: text,
  measurableForm: text,
  evidence: z.array(evidenceSchema).max(100),
  kind: z.enum(CLAIM_KIND).optional(),
  importanceSetByCandidate: z.boolean().optional(),
});
const persistedSchema = z.object({
  version: z.literal(1),
  state: z.object({
    source: z.object({
      id: z.string().min(1).max(300),
      company: text,
      role: text,
      sourceUrl: httpUrl.optional(),
      origin: z.enum(CASE_ORIGIN),
      claims: z.array(claimSchema).min(1).max(8),
    }),
    activeProbeId: z.string().max(300).nullable(),
    rankingVisible: z.boolean(),
    selectionState: z.enum([
      "IDLE",
      "ACTIVE",
      "EVIDENCE_UPDATED",
      "NO_PROBE_NEEDED",
    ]),
    prioritiesTouched: z.boolean(),
  }),
});

export function serializePersistedCase(snapshot: CaseSnapshot): string {
  return JSON.stringify({
    version: 1,
    state: {
      source: snapshot.source,
      activeProbeId: snapshot.activeProbeId,
      rankingVisible: snapshot.rankingVisible,
      selectionState: snapshot.selectionState,
      prioritiesTouched: snapshot.prioritiesTouched,
    },
  });
}

export function parsePersistedCase(
  value: string | null,
): RestorableCaseState | null {
  if (!value) return null;
  try {
    const result = persistedSchema.safeParse(JSON.parse(value));
    if (!result.success) return null;
    return {
      ...result.data.state,
      source: result.data.state.source as RoleCase,
    };
  } catch {
    return null;
  }
}

export function loadPersistedCase(storage: Pick<Storage, "getItem">) {
  try {
    return parsePersistedCase(storage.getItem(CASE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function savePersistedCase(
  storage: Pick<Storage, "setItem">,
  snapshot: CaseSnapshot,
) {
  try {
    storage.setItem(CASE_STORAGE_KEY, serializePersistedCase(snapshot));
  } catch {
    // Storage can be unavailable or full; the live in-memory case still works.
  }
}
