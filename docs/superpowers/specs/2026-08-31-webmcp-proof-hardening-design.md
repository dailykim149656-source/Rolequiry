# WebMCP Proof Hardening Design

## Goal

Make the current Rolequiry product demonstrably WebMCP-native before code
freeze. This release does not add another product surface. It proves that a
connected agent can interpret a candidate's context, operate the existing
seven-tool case workflow in the right order, and leave an auditable decision
state that remains useful in the human UI.

The product thesis used throughout the demo and documentation is:

> Most job tools ask, "Can I get hired?" Rolequiry asks, "If I get the offer,
> should I join?"

Repository publication, Devpost submission, and public video publication are
explicitly deferred until after code freeze.

## Scope

This hardening release contains four changes:

1. Make the browser surface satisfy WebMCP's origin-isolation requirements.
2. Add model-facing journey evaluations for tool choice, ordering, arguments,
   and output reuse.
3. Turn the current real-job demo into one complete investigation plus a
   same-JD, two-candidate comparison.
4. Align the README and tracked project documentation with the implemented
   product boundary.

The existing state model, ranking algorithm, evidence authority rules, and
seven WebMCP tools remain the product. Any tool-description or input-schema
change must be the smallest correction justified by an observed evaluation
failure; no eighth tool or new domain model is introduced.

## Product Boundary

The connected agent owns raw resume and conversation context, candidate-specific
interpretation, research, counterevidence attempts, and explanatory prose.
Rolequiry owns candidate-confirmed priorities, employer claims, evidence and
provenance, active-probe state, deterministic ranking, unresolvedness, and the
verification trail.

The manual UI remains a supported progressive-enhancement path. It is not a
second product and is not removed to make the agent path look more important.
The proof is that WebMCP turns a conversational investigation into shared,
inspectable application state; without the agent, the candidate-specific
interpretation and research loop are absent.

## Runtime Compatibility

`next.config.ts` will apply these response headers to every application route:

| Header | Value |
| --- | --- |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Embedder-Policy` | `require-corp` |
| `Permissions-Policy` | `tools=(self)` |

The global rule is smaller and safer than maintaining separate exceptions for
`/case`, imported-case routes, and framework assets. The current app loads its
runtime assets from the same origin; external job and evidence URLs are links,
not embedded resources.

The change is accepted only if the built application reports
`crossOriginIsolated === true`, all pages and assets still load without console
or network errors, and both ChatGPT's WebMCP-capable browser and Chrome with the
WebMCP flag discover all seven tools. If either agent surface stops working, the
header configuration must be revised before merge rather than documented as a
known limitation.

## Agent Journey Evaluations

Add one portable JSON scenario set and one human-readable result ledger under
`docs/evals/`. Do not add an evaluation framework or npm dependency. The JSON
is the reusable source for an official browser evaluator or a manual agent run;
the Markdown ledger records the environment, date, prompt, observed calls, and
pass/fail result.

The scenarios cover these behavioral boundaries:

1. **Direct import:** a JD-analysis request calls `import_role_from_claims` with
   employer claims and retains the official source URL.
2. **Confirmation gate:** resume or preference context alone must not call
   `set_candidate_priorities`; an explicit candidate confirmation must call it
   with the confirmed claim-ID mapping.
3. **Decision routing:** after priorities are confirmed, the agent calls
   `select_decision_changer` and uses its returned active probe instead of
   inventing a separate research target.
4. **Research discipline:** the agent researches only the active probe, records
   credible claim-specific findings with `record_research_evidence`, and leaves
   weak or non-resolving material neutral or unrecorded rather than forcing a
   supporting or challenging conclusion.
5. **Interview continuity:** `record_interview_answer` attaches testimony to the
   active claim; a wrong claim or invalid order is corrected without mutating a
   different claim.
6. **Full journey:** one conversation completes import, explicit candidate
   confirmation, priority write, deterministic selection, research evidence,
   state re-read, and next-verification guidance using actual tool outputs in
   subsequent calls.

Each scenario specifies allowed and forbidden calls, expected order, required
argument fields, and the observable UI/state result. Deterministic repository
tests continue to protect contracts and state transitions; the model-facing
ledger protects tool usability. A failure blocks the demo. Only the smallest
affected tool description or property description is changed, then the failed
scenario and full journey are rerun.

## Real-Job Demonstration

The primary role remains the official OpenAI Forward Deployed Engineer, Seoul
posting. Before recording, the source links and claim-relevant public evidence
are rehearsed. If no available source can honestly exercise the existing
research-evidence path, the demo keeps the result unknown rather than inventing
evidence; Palantir's official Seoul Forward Deployed Software Engineer posting
is the fallback only if the OpenAI posting itself becomes unavailable.

The existing demo document will contain:

- one full end-to-end run for **Candidate A**, whose travel ceiling is 20% and
  whose coding mix is flexible;
- one short same-JD comparison for **Candidate B**, who accepts frequent travel
  but treats sustained hands-on coding as critical;
- the exact candidate-confirmation checkpoints and expected tool sequence;
- a source-availability preflight checklist;
- a sub-three-minute recording storyboard that is prepared but not published.

Both candidates are synthetic and clearly labeled. Their raw profiles remain in
the agent conversation, never in Rolequiry storage. The comparison must show
that the same employer claims produce different confirmed priorities and a
different next probe without adding a fit score. Candidate B overwrites the
complete relevant priority mapping before selection so Candidate A's settings
cannot leak into the comparison.

Unknown is a valid demo outcome. The agent must distinguish employer wording,
credible public evidence, and unresolved lived experience, then turn the
remaining uncertainty into an interview or offer-stage verification question.

## Documentation Alignment

`README.md` becomes the single public-facing source of truth. It will lead with
the decision-quality thesis, show the conversation-first seven-tool workflow,
explain the manual UI as progressive enhancement, and state the raw-resume and
standard-MCP boundaries.

The prior tracked implementation plan receives a short historical-status note
instead of a mechanical checkbox rewrite. The untracked v1.3 DOCX and image are
user-owned artifacts and remain untouched and uncommitted.

## Expected Files

The implementation is intentionally limited to:

- `next.config.ts`
- `README.md`
- `docs/demo/openai-fde-seoul.md`
- `docs/evals/webmcp-agent-journeys.json`
- `docs/evals/webmcp-agent-journeys.md`
- `docs/superpowers/plans/2026-08-30-agentic-candidate-due-diligence.md`

Existing WebMCP contract or tool files may change only when an observed journey
failure identifies an ambiguous description or property. No other application
surface is planned.

## Acceptance Criteria

Automated verification must pass the existing test suite, typecheck, lint, and
the production webpack build. A clean default Turbopack build is rerun from a
fresh local cache; an external-volume persistence failure is recorded separately
only if the webpack production build and deployed artifact remain green.

Runtime verification must prove:

- the three response headers have the exact configured values;
- `crossOriginIsolated` is `true` in the built and deployed application;
- desktop and narrow layouts have no regression;
- there are no blocked application assets or new console errors;
- normal-browser fallback copy remains accurate;
- ChatGPT and flag-enabled Chrome each discover all seven tools;
- an agent priority write updates the shared UI;
- the full journey follows the confirmation and active-probe boundaries; and
- the same JD selects different decision-changing probes for Candidates A and B.

The evaluation ledger records the current full commit SHA so the evidence cannot
be mistaken for coverage of a later build.

## Deferred Until After Code Freeze

- changing the GitHub repository from private to public;
- creating or updating the Devpost submission;
- publishing a YouTube or other public demo video;
- final public-submission metadata and link checks.

## Non-Goals

- No Candidate Lens database, resume upload, or raw CV persistence.
- No fit score, hiring-probability score, or automated join recommendation.
- No accounts, server database, cross-device sync, or server-side model.
- No standard remote MCP adapter.
- No B2B dashboard or employer analytics.
- No new evidence category, ranking rule, or tool proliferation.
- No onboarding UI unless an actual judge-session evaluation demonstrates a
  blocking comprehension failure; documentation is the default correction.
