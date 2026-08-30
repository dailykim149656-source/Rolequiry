# Agentic Candidate Due-Diligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the conversation-to-case WebMCP loop so an agent can turn a candidate's confirmed career priorities into deterministic Rolequiry state, while fixing the remaining neutral-evidence and raw-source trust edges.

**Architecture:** The connected agent keeps raw resume and career reasoning in conversation context. Rolequiry adds one narrowly scoped `set_candidate_priorities` write tool and an atomic store transition; the existing engine continues to own claim state, evidence, uncertainty, and next-probe selection. No candidate-profile database, fit score, server model, or new evidence ontology is introduced.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5 strict mode, `use-webmcp-tool`, Vitest, Testing Library, Bun, Biome, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-08-30-agentic-candidate-due-diligence-design.md`

## Global Constraints

- Preserve the existing white/black dossier design and responsive layout.
- Raw resume and career narrative remain in the connected agent conversation; never persist them in Rolequiry.
- Only candidate-confirmed importance values cross the new WebMCP write boundary.
- Priority writes do not auto-select a probe or start research.
- Unknown and neutral evidence remain explicitly unresolved.
- `get_case_state` stays normalized and free of raw employer or resume prose.
- `get_role_claims` is the only raw employer channel and returns only `CASE_INPUT` employer snippets.
- Imported cases remain tab-local in `sessionStorage`; demo fixtures remain canonical after reload.
- Add no dependencies, database, account system, server-side model call, standard MCP adapter, or real-company fixture.
- Keep the repository private until the user separately authorizes publication.
- Never stage or modify `ChatGPT Image 2026년 8월 30일 오후 05_32_53 (1).png` or `RoleProbe_PRD_WebMCP_Challenge_v1.3.docx`.

---

### Task 1: Close the two evidence-semantics edges

**Files:**
- Modify: `components/case-workspace/Evidence.tsx:10-76`
- Modify: `lib/webmcp/tools.ts:45-61`
- Modify: `tests/case-workspace.test.tsx:90-132`
- Modify: `tests/trust-boundary.test.ts:30-64`
- Modify: `DESIGN.md:44-58`

**Interfaces:**
- Consumes: existing `Evidence`, `EVIDENCE_STANCE`, `EVIDENCE_PROVENANCE`, and `AUTHORITY_SCOPE` constants.
- Produces: an internal `EvidenceTone` union containing `neutral`, and a `getRoleClaims()` raw channel limited to case-input employer snippets.

- [ ] **Step 1: Add the failing neutral-evidence UI regression**

Add imports for `recordInterviewAnswerTool` and `SPEAKER_ROLE`, then add this test to `tests/case-workspace.test.tsx`:

```tsx
it("labels neutral-only evidence as neutral instead of empty", () => {
  const store = createCaseStore();
  selectDecisionChanger(store);
  recordInterviewAnswerTool(store, {
    stance: "NEUTRAL",
    text: "The interviewer could not quantify the ownership boundary.",
    speakerRole: SPEAKER_ROLE.HIRING_MANAGER,
  });
  renderWorkspace(store);

  const ownership = within(screen.getByTestId("claim-technical-ownership"));
  expect(
    ownership.getByRole("img", {
      name: "Interview: 1 evidence item, neutral",
    }).className,
  ).toContain("bg-unverified-soft");
});
```

This catches the realistic regression where a non-resolving evidence item is present but the accessible signal calls the source empty.

- [ ] **Step 2: Run the neutral regression and confirm RED**

Run:

```bash
bun run test tests/case-workspace.test.tsx
```

Expected: FAIL because the rendered accessible name is `Interview: 1 evidence item, empty`.

- [ ] **Step 3: Add the failing raw-source trust regression**

Add a test to `tests/trust-boundary.test.ts` that records employer-official research against the active ownership probe and compares the raw snippets to the hand-checked fixture source:

```ts
it("keeps agent-reported employer research out of raw source snippets", () => {
  const store = createCaseStore();
  selectDecisionChanger(store);
  recordResearchEvidenceTool(store, {
    stance: "SUPPORTS",
    summary: "An official engineering page describes end-to-end ownership.",
    sourceUrl: "https://example.com/official-engineering",
    sourceLabel: "Official engineering page",
    sourceKind: "EMPLOYER_OFFICIAL",
  });

  const ownership = getRoleClaims(store).claims.find(
    (claim) => claim.id === "technical-ownership",
  );
  expect(ownership?.sourceSnippets).toEqual([
    "FDEs have high technical ownership from design through deployment.",
  ]);
});
```

- [ ] **Step 4: Run the trust regression and confirm RED**

Run:

```bash
bun run test tests/trust-boundary.test.ts
```

Expected: FAIL because the agent-authored official-source summary is currently appended to `sourceSnippets`.

- [ ] **Step 5: Implement the minimum neutral tone**

Change `EvidenceTone` and `evidenceTone()` in `Evidence.tsx`:

```ts
type EvidenceTone =
  | "challenged"
  | "empty"
  | "mixed"
  | "neutral"
  | "supported";

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
  return items.length > 0 ? "neutral" : "empty";
}
```

Map `neutral` to the existing non-resolving gray treatment rather than adding a new color token:

```ts
neutral: "bg-unverified-soft text-unverified",
```

- [ ] **Step 6: Limit raw snippets to case input**

Use constants rather than string literals in `getRoleClaims()`:

```ts
sourceSnippets: claim.evidence
  .filter(
    (item) =>
      item.scope === AUTHORITY_SCOPE.EMPLOYER_STATED &&
      (item.provenance ?? EVIDENCE_PROVENANCE.CASE_INPUT) ===
        EVIDENCE_PROVENANCE.CASE_INPUT,
  )
  .map((item) => item.text),
```

Import `AUTHORITY_SCOPE` from the existing domain constants. The provenance fallback preserves legacy fixture behavior.

- [ ] **Step 7: Update the design contract**

In `DESIGN.md`, define the signal states exactly:

```text
Evidence signal tone distinguishes empty (zero items) from neutral
(non-resolving items present). Neutral and empty share the unverified gray
palette, but their visible/accessible labels remain distinct.
```

- [ ] **Step 8: Run targeted tests and confirm GREEN**

Run:

```bash
bun run test tests/case-workspace.test.tsx tests/trust-boundary.test.ts
```

Expected: both files pass; the existing support/challenge/mixed assertions remain green.

- [ ] **Step 9: Commit the semantic fixes**

```bash
git add DESIGN.md components/case-workspace/Evidence.tsx lib/webmcp/tools.ts tests/case-workspace.test.tsx tests/trust-boundary.test.ts
git commit -m "fix: preserve neutral and raw evidence semantics"
```

---

### Task 2: Add one atomic candidate-priority state transition

**Files:**
- Modify: `lib/domain/types.ts:92-145`
- Modify: `lib/case-store.ts:43-115`
- Modify: `tests/selection-state.test.ts`

**Interfaces:**
- Produces: `CandidatePriorityInput` and `CaseStore.setPriorities(priorities)`.
- Consumed by: Task 3's `setCandidatePrioritiesTool()`.

- [ ] **Step 1: Add the failing atomic-batch regression**

Add this test to `tests/selection-state.test.ts`:

```ts
it("applies a candidate-confirmed priority batch in one state emission", () => {
  const store = createCaseStore();
  importRoleFromClaimsTool(store, {
    company: "Example Corp",
    role: "Staff Engineer",
    claims: [
      {
        dimension: "Technical ownership",
        employerStatement: "Own delivery end to end",
        unresolvedVariable: "Where does final architecture authority sit?",
        measurableForm: "Last decision shipped without platform review",
      },
      {
        dimension: "Travel",
        employerStatement: "Travel is expected",
        unresolvedVariable: "How concentrated is travel?",
        measurableForm: "Median and maximum travel days per quarter",
      },
    ],
  });
  let emissions = 0;
  store.subscribe(() => {
    emissions += 1;
  });

  store.setPriorities([
    { claimId: "imported-1", importance: "HIGH" },
    { claimId: "imported-2", importance: "CRITICAL" },
  ]);

  expect(emissions).toBe(1);
  expect(
    store.getState().derived.claims.map((claim) => ({
      id: claim.id,
      importance: claim.importance,
      candidatePrioritySet: claim.candidatePrioritySet,
    })),
  ).toEqual([
    {
      id: "imported-1",
      importance: "HIGH",
      candidatePrioritySet: true,
    },
    {
      id: "imported-2",
      importance: "CRITICAL",
      candidatePrioritySet: true,
    },
  ]);
});
```

- [ ] **Step 2: Run the store regression and confirm RED**

Run:

```bash
bun run test tests/selection-state.test.ts
```

Expected: typecheck/test collection fails because `setPriorities` does not exist.

- [ ] **Step 3: Add the typed batch input**

Add to `lib/domain/types.ts`:

```ts
export type CandidatePriorityInput = {
  readonly claimId: string;
  readonly importance: Importance;
};
```

- [ ] **Step 4: Share the existing priority transition logic**

In `createCaseStore()`, extract the body of the current single-priority method into a local function with two callers:

```ts
function setPriorities(priorities: readonly CandidatePriorityInput[]) {
  let source = state.source;
  for (const priority of priorities) {
    source = setClaimImportance(
      source,
      priority.claimId,
      priority.importance,
    );
  }
  const derived = deriveCase(source);
  const selected = derived.claims.find(
    (claim) => claim.id === state.activeProbeId,
  );
  const keepUpdated =
    state.selectionState === SELECTION_STATE.EVIDENCE_UPDATED &&
    Boolean(selected);
  state = {
    source,
    derived,
    activeProbeId: selected ? state.activeProbeId : null,
    rankingVisible: false,
    selectionState: keepUpdated
      ? SELECTION_STATE.EVIDENCE_UPDATED
      : selected?.probeEligible
        ? SELECTION_STATE.ACTIVE
        : SELECTION_STATE.IDLE,
    prioritiesTouched: true,
  };
  emit();
}
```

Expose both paths from the returned store object:

```ts
setImportance(claimId: string, importance: Importance) {
  setPriorities([{ claimId, importance }]);
},
setPriorities,
```

Import `CandidatePriorityInput` as a type. Do not add a second ranking formula or a second state-transition implementation.

- [ ] **Step 5: Run the store regression and existing selection tests**

Run:

```bash
bun run test tests/selection-state.test.ts tests/chatgpt-p0.test.ts
```

Expected: PASS, including preservation of the selected probe after a single UI priority change.

- [ ] **Step 6: Commit the atomic store transition**

```bash
git add lib/domain/types.ts lib/case-store.ts tests/selection-state.test.ts
git commit -m "feat: batch candidate priority updates"
```

---

### Task 3: Register `set_candidate_priorities` as the seventh WebMCP tool

**Files:**
- Modify: `lib/webmcp/contracts.ts:1-38`
- Modify: `lib/webmcp/tools.ts`
- Modify: `lib/webmcp/use-case-tools.ts:15-155`
- Modify: `components/CaseApp.tsx:8-38`
- Modify: `components/case-workspace/WorkspaceChrome.tsx:5-15,211-213`
- Modify: `tests/import-and-evidence.test.ts:271-308`
- Modify: `tests/webmcp-registration.test.tsx`
- Modify: `tests/case-workspace.test.tsx`

**Interfaces:**
- Consumes: `CaseStore.setPriorities()` and `CandidatePriorityInput` from Task 2.
- Produces: `setCandidatePrioritiesTool()` and registered tool name `set_candidate_priorities`.

- [ ] **Step 1: Add failing direct-tool tests**

Create a new `describe("set_candidate_priorities")` block in `tests/import-and-evidence.test.ts`.

The successful case imports two claims, writes only one confirmed priority, and asserts the untouched claim remains unset:

```ts
it("records only the priorities the candidate confirmed", () => {
  const store = createCaseStore();
  importRoleFromClaimsTool(store, {
    company: "Example Corp",
    role: "Staff Engineer",
    claims: [
      {
        dimension: "Technical ownership",
        employerStatement: "Own delivery end to end",
        unresolvedVariable: "Where does final architecture authority sit?",
        measurableForm: "Last decision shipped without platform review",
      },
      {
        dimension: "Travel",
        employerStatement: "Travel is expected",
        unresolvedVariable: "How concentrated is travel?",
        measurableForm: "Median and maximum travel days per quarter",
      },
    ],
  });

  const result = setCandidatePrioritiesTool(store, {
    priorities: [{ claimId: "imported-2", importance: "CRITICAL" }],
  });

  expect(result.updated_priorities).toEqual([
    { claim_id: "imported-2", importance: "CRITICAL" },
  ]);
  expect(result.claims[0]?.candidatePrioritySet).toBe(false);
  expect(result.claims[1]).toMatchObject({
    importance: "CRITICAL",
    candidatePrioritySet: true,
  });
  expect(store.getState().activeProbeId).toBeNull();
});
```

Add one mutation-safety test that snapshots the source, attempts duplicate IDs,
expects an error matching `/duplicate/i`, and expects the source object to remain
the same reference. Add an equivalent unknown-ID case matching `/unknown/i`.

- [ ] **Step 2: Run direct-tool tests and confirm RED**

Run:

```bash
bun run test tests/import-and-evidence.test.ts
```

Expected: FAIL because `setCandidatePrioritiesTool` is not exported.

- [ ] **Step 3: Implement the boundary function**

Add this shape to `lib/webmcp/tools.ts`:

```ts
export function setCandidatePrioritiesTool(
  store: CaseStore,
  input: { readonly priorities: readonly CandidatePriorityInput[] },
) {
  if (input.priorities.length === 0) {
    throw new Error("At least one candidate priority is required");
  }
  const claimIds = input.priorities.map((priority) => priority.claimId);
  if (new Set(claimIds).size !== claimIds.length) {
    throw new Error("Candidate priorities contain duplicate claim IDs");
  }
  const knownClaimIds = new Set(
    store.getState().source.claims.map((claim) => claim.id),
  );
  const unknownClaimId = claimIds.find((claimId) => !knownClaimIds.has(claimId));
  if (unknownClaimId) {
    throw new Error(`Unknown claim ID: ${unknownClaimId}`);
  }

  store.setPriorities(input.priorities);
  return {
    ok: true as const,
    updated_priorities: input.priorities.map((priority) => ({
      claim_id: priority.claimId,
      importance: priority.importance,
    })),
    ...getCaseState(store),
  };
}
```

The JSON Schema in the next step parses `importance`; the internal function therefore consumes the existing `Importance` union and does not re-implement enum validation.

- [ ] **Step 4: Add the tool contract and input schema**

Append this entry to `CASE_TOOL_CONTRACTS` so the existing six positions stay stable:

```ts
{
  name: "set_candidate_priorities",
  description:
    "Record claim importance values only after the candidate explicitly confirms the agent's proposed mapping from their career context. Never write inferred priorities from a resume alone. This updates shared case state but does not choose the next probe.",
  annotations: { readOnlyHint: false },
},
```

Add this schema to `use-case-tools.ts`:

```ts
const prioritiesSchema = {
  type: "object",
  properties: {
    priorities: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          claimId: { type: "string", minLength: 1 },
          importance: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          },
        },
        required: ["claimId", "importance"],
        additionalProperties: false,
      },
    },
  },
  required: ["priorities"],
  additionalProperties: false,
} as const;
```

Destructure `prioritiesContract` as the seventh contract, register it with
`useWebMCP`, and return it as `priorities`. Use the exact execute signature:

```ts
execute: (args: {
  priorities: Array<{
    claimId: string;
    importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>;
}) => setCandidatePrioritiesTool(store, args),
```

- [ ] **Step 5: Add the registered conversation-to-case regression**

Extend the fake-model-context test to expect seven registered names, including
`set_candidate_priorities`. Add a separate test that invokes the real registered
closures in this order:

```text
import_role_from_claims
set_candidate_priorities
select_decision_changer
```

Use a two-claim imported fixture, set Travel to `CRITICAL`, and assert:

```ts
expect(prioritized.claims[1]).toMatchObject({
  importance: "CRITICAL",
  candidatePrioritySet: true,
});
expect(selected.claim_id).toBe("imported-2");
```

Do not assert the full contract description. If a routing guard is tested, pin
only the machine-consumed fragments `explicitly confirms` and `does not choose`
because those determine safe tool selection.

- [ ] **Step 6: Update the seven-tool UI projection**

Add `webmcp.priorities` to the count array in `CaseApp.tsx`. Change the default
`ProductBar` total and demo-control status from six to seven in
`WorkspaceChrome.tsx`.

Add a UI regression:

```tsx
it("reports all seven case tools when they are registered", () => {
  renderWorkspace(createCaseStore(), 7);
  expect(screen.getByText("WebMCP 7/7 live")).toBeTruthy();
  expect(screen.getByTestId("tool-status").textContent).toContain("7/7");
});
```

- [ ] **Step 7: Run the WebMCP and UI tests**

Run:

```bash
bun run test tests/import-and-evidence.test.ts tests/webmcp-registration.test.tsx tests/case-workspace.test.tsx tests/chatgpt-p0.test.ts
```

Expected: PASS with seven tools, atomic priority mutation, no auto-selected probe, and unchanged existing tool behavior.

- [ ] **Step 8: Commit the seventh tool**

```bash
git add components/CaseApp.tsx components/case-workspace/WorkspaceChrome.tsx lib/webmcp/contracts.ts lib/webmcp/tools.ts lib/webmcp/use-case-tools.ts tests/case-workspace.test.tsx tests/chatgpt-p0.test.ts tests/import-and-evidence.test.ts tests/webmcp-registration.test.tsx
git commit -m "feat: add candidate priority WebMCP tool"
```

---

### Task 4: Document and rehearse the real agentic workflow

**Files:**
- Modify: `README.md:1-90`
- Create: `docs/demo/openai-fde-seoul.md`
- Verify: `docs/superpowers/specs/2026-08-30-agentic-candidate-due-diligence-design.md`

**Interfaces:**
- Consumes: all seven WebMCP tools from Task 3.
- Produces: the public product explanation and an exact current real-role judge flow.

- [ ] **Step 1: Update the README product boundary**

Make the first paragraph state this division without claiming Rolequiry performs
model inference:

```text
Your agent understands your career and investigates the role. Rolequiry keeps
what the employer claims, what the evidence supports, what matters to you, and
what is still worth asking as application-owned case state.
```

Add `set_candidate_priorities` to the WebMCP tool list and change six-tool counts
to seven. Document that the raw resume stays in agent context and only
candidate-confirmed importance enters Rolequiry.

- [ ] **Step 2: Replace the UI-only real-role walkthrough**

The canonical README flow must use this sequence:

```text
1. Candidate gives the agent a career summary plus a real JD URL.
2. Agent imports claims and proposes candidate-specific priorities.
3. Candidate confirms or revises them in conversation.
4. Agent calls set_candidate_priorities.
5. Agent calls select_decision_changer.
6. Agent researches only the active probe and records sourced evidence.
7. Candidate inspects the Decision Path and receives a falsifiable interview question.
```

Keep UI dropdowns documented as an equivalent manual path, not the primary agentic path.

- [ ] **Step 3: Create the OpenAI Seoul demo script**

Create `docs/demo/openai-fde-seoul.md` with:

- source: `https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/`;
- a clearly labeled synthetic candidate: six years across backend and AI product engineering, some enterprise delivery, no sustained high-travel role, prefers hands-on engineering, maximum comfortable travel below the JD's stated level;
- opening prompt: `Here is my career context and this JD. Put the role into Rolequiry, identify the decision variables that matter specifically to me, and ask me to confirm priorities before writing them.`;
- confirmation: `Travel is CRITICAL. Hands-on coding and technical authority are HIGH. Concurrent deployments are MEDIUM.`;
- expected tool order: `import_role_from_claims -> set_candidate_priorities -> select_decision_changer -> record_research_evidence -> select_decision_changer`;
- expected UI checkpoints: seven tools live, imported source link, confirmed priority controls, active Travel card, provenance-bearing evidence, `Check again`, and a verification question about actual travel concentration;
- safety note: do not treat agent-generated source labels as verified identity and do not copy the full JD into the repository.

- [ ] **Step 4: Review docs against non-goals**

Confirm the README and demo script do not promise:

- raw resume storage;
- deterministic fit scoring;
- independent source authentication;
- general company deep research outside the active probe;
- a remote standard MCP server;
- compatibility with a client that does not expose the page's WebMCP tools.

- [ ] **Step 5: Commit the product narrative and demo**

```bash
git add README.md docs/demo/openai-fde-seoul.md docs/superpowers/specs/2026-08-30-agentic-candidate-due-diligence-design.md docs/superpowers/plans/2026-08-30-agentic-candidate-due-diligence.md
git commit -m "docs: define the agentic real-role workflow"
```

---

### Task 5: Run release gates, production QA, and Git-triggered deployment

**Files:**
- Verify only: all changed source, test, and documentation files.
- Preserve: the two user-owned untracked files named in Global Constraints.

**Interfaces:**
- Consumes: the complete seven-tool release.
- Produces: exact-SHA automated and manual evidence for the deployed production surface.

- [ ] **Step 1: Run all automated gates once on final inputs**

Run:

```bash
bun run test
bun run typecheck
bun run lint
bun run build -- --webpack
git diff --check
```

Expected: every command exits 0. Record the final Vitest test count. Treat the
existing Vitest ESM/CommonJS warning and external-volume AppleDouble Git warnings
as pre-existing only if they remain non-fatal and unchanged.

- [ ] **Step 2: Run the TypeScript post-write audit**

Measure pure LOC for every changed `.ts` and `.tsx` file. Files above 250 pure
LOC must be split before commit; files in the 200-250 warning band are reported
and must not receive another line-adding feature without a planned split.

Run the skill-provided no-excuse checker when compatible with the repository's
installed TypeScript. If it still requires TypeScript 7 while the project uses
TypeScript 5, record that tooling mismatch and rely on Biome plus `tsc --noEmit`.

- [ ] **Step 3: Run local browser QA through the real surface**

Build and start production locally, then use `agbrowse` at desktop and a narrow
viewport. Verify:

1. ordinary Chrome shows `Open in a WebMCP browser`;
2. a test-only `document.modelContext` harness registers exactly seven tools;
3. importing a two-claim role shows both claims as `Priority not set`;
4. invoking `set_candidate_priorities` updates the native selects without a page reload;
5. `select_decision_changer` chooses the expected confirmed claim;
6. neutral-only evidence is announced as `neutral`, never `empty`;
7. `get_role_claims` excludes an agent-reported official-source summary;
8. imported state survives same-tab reload and does not cross into a new tab;
9. Decision Path precedes Claim Board on narrow screens with no horizontal overflow;
10. the browser console has no runtime errors.

Save fresh screenshots under a new ignored `.omo/evidence/<timestamp>/` directory.

- [ ] **Step 4: Run the actual ChatGPT built-in-browser flow**

Use `docs/demo/openai-fde-seoul.md` against the final local or production SHA.
Do not click priority dropdowns during the primary path. The successful observable
sequence is:

```text
7/7 tools registered
candidate history interpreted by ChatGPT
real JD imported
candidate confirmation requested
set_candidate_priorities invoked
UI priorities update
select_decision_changer chooses Travel
one sourced active-probe research item recorded
Rolequiry preserves what remains unknown
agent returns a falsifiable interview question
```

Capture the tool results and final UI. If the current ChatGPT client cannot see
the seventh tool, stop release and diagnose registration rather than substituting
the local harness as proof.

- [ ] **Step 5: Review and push only intended files**

Run:

```bash
git status --short
git diff --check
git log --oneline -4
```

Confirm the concept image and legacy PRD remain untracked. Push the completed
commits to `origin/main` only after all gates and the actual ChatGPT flow pass:

```bash
git push origin main
```

- [ ] **Step 6: Verify the Git-triggered Vercel deployment**

Wait for the new production deployment to become Ready. Confirm all of these
against the same full commit SHA:

- local `HEAD`;
- `origin/main`;
- Vercel deployment `gitSource.sha`;
- GitHub Actions `ci` success;
- aliases `rolequiry.com` and `www.rolequiry.com`;
- no production error logs.

Repeat the seven-tool smoke test on `https://rolequiry.com/case` and verify the
employer reference page still registers its separate two read-only tools.

- [ ] **Step 7: Stop at the release boundary**

Report the commit SHA, deployment ID, URLs, test count, browser evidence, actual
ChatGPT 7/7 result, and any pre-existing warnings. Leave repository publication,
public video, and Devpost submission untouched for the later authorized phase.
