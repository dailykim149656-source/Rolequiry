# Agentic Candidate Due-Diligence Design

## Goal

Complete Rolequiry's missing agentic front half without turning the application
into a resume parser or a generic career-intelligence SaaS. A connected agent
understands the candidate's raw career context and performs research; Rolequiry
owns the candidate-confirmed priorities, employer claims, evidence provenance,
explicit uncertainty, active verification target, and deterministic state
transitions.

The product promise is:

> Your agent investigates. Rolequiry keeps the case.

## Product Boundary

| Connected agent owns | Rolequiry owns |
| --- | --- |
| Raw resume and conversation context | Candidate-confirmed claim importance |
| Values and career-narrative interpretation | Employer claims from the imported JD |
| Nontraditional-path, synergy, and risk hypotheses | Evidence, source category, and provenance |
| Web search and counterevidence attempts | Coverage, tension, unresolvedness, and status |
| Contextual explanations and final prose | Active probe and verification target |

Rolequiry does not store the raw resume, generate an opaque fit score, host a
server-side model, or duplicate the connected agent's semantic reasoning.

## Canonical Workflow

1. The candidate gives a WebMCP-capable agent a resume or career summary, their
   values and constraints, and a real JD URL.
2. The agent interprets the career context and imports employer claims with
   `import_role_from_claims`.
3. The agent proposes the claims that appear decision-relevant and asks the
   candidate to confirm or revise the importance values.
4. Only after explicit confirmation, the agent calls
   `set_candidate_priorities` with claim IDs and importance values.
5. Rolequiry updates the shared UI and deterministic case state but does not
   automatically choose the next probe.
6. The agent calls `select_decision_changer`. Rolequiry chooses the highest
   candidate-confirmed, unresolved lived-experience claim.
7. The agent researches only that active probe, attempts to find credible
   counterevidence, and records findings with `record_research_evidence`.
8. Rolequiry preserves supported, challenged, mixed, neutral, and unknown state.
   It produces the next verification target rather than forcing a conclusion.
9. Interview answers are attached to the same claim, keeping the case alive from
   public research through interview and offer evaluation.

## New WebMCP Contract

Add one write tool:

```text
set_candidate_priorities
```

Input:

```ts
type SetCandidatePrioritiesInput = {
  readonly priorities: readonly {
    readonly claimId: string;
    readonly importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }[];
};
```

The JSON Schema requires one to eight entries, disallows additional properties,
and limits importance to the existing four values. The execution boundary also
rejects duplicate or unknown claim IDs before any state mutation.

The contract description must tell the agent to call the tool only after the
candidate explicitly confirms the proposed mapping. It must also state that the
tool records priorities but does not select the next probe. No raw resume text,
career narrative, fit hypothesis, or model-generated rationale is accepted.

The successful result returns the updated priority list plus the normalized case
state. Each updated claim has `candidatePrioritySet: true`. Claims omitted from
the call retain their previous state, including imported claims that remain
unset.

## State Semantics

Priority updates are atomic: validate the complete batch, update the case once,
derive once, and emit once. Existing UI selection remains a valid alternative
and uses the same transition rules.

Updating priorities does not auto-run research or auto-select a probe. The
agent must explicitly call `select_decision_changer` after the user asks to
continue. This separation keeps candidate confirmation, deterministic ranking,
and external research auditable.

Imported-case persistence remains tab-local `sessionStorage`. The raw resume is
never written to Rolequiry storage.

## Trust-Boundary Corrections

Two existing semantic edges ship in the same release:

1. Evidence signal tone distinguishes no evidence from non-resolving evidence:
   `0 items -> empty`; neutral-only items -> `neutral`; support-only ->
   `supported`; challenge-only -> `challenged`; support plus challenge ->
   `mixed`. Neutral remains gray and does not reduce uncertainty.
2. `get_role_claims.sourceSnippets` returns only employer-stated evidence whose
   provenance is `CASE_INPUT`. Legacy fixture evidence with omitted provenance
   is treated as `CASE_INPUT`. Agent-reported official-source summaries remain
   evidence and never re-enter the raw-source channel.

## UI and Documentation

No new candidate-profile screen is added. Existing priority controls update when
the WebMCP tool writes the case, preserving one shared state between agent and
human UI. The case surface reports seven registered WebMCP tools instead of six.

`DESIGN.md` documents the neutral evidence signal. `README.md` replaces the
UI-only real-role walkthrough with the canonical conversation-first flow and
documents all seven tools.

A separate real-job demo script uses the currently public OpenAI Forward
Deployed Engineer - Seoul posting and a clearly synthetic candidate history. It
stores only prompts, expected tool calls, and verification checkpoints, not a
copied JD or a built-in real-company fixture.

## Non-Goals

- No Candidate Lens database or raw CV persistence.
- No deterministic fit score or automated hiring recommendation.
- No schema for every synergy, risk, or nontraditional-career hypothesis.
- No new evidence authority categories in this release.
- No standard remote MCP server adapter; the competition surface remains WebMCP.
- No account system, database, cross-tab sync, or server-side model call.
- No repository-publication, Devpost, or video-production work in this release.

## Verification

Automated coverage must prove:

- neutral-only evidence is labeled `neutral`, not `empty`;
- agent-reported employer research cannot leak into raw role snippets;
- a valid priority batch updates only named claims and emits one final state;
- duplicate and unknown claim IDs fail before mutation;
- all seven tools register through `document.modelContext`;
- the registered import -> candidate confirmation -> priority write -> probe
  selection path works through real tool execute closures;
- existing interview, research, persistence, ranking, and trust-boundary tests
  remain green.

Manual QA must cover desktop and narrow layouts, normal-browser fallback copy,
seven-tool WebMCP registration, UI updates after an agent priority write, a
neutral evidence chip, the raw-source boundary, imported-case reload survival,
and one full current-SHA ChatGPT built-in-browser run using the real-job demo.
