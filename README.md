# Rolequiry

Interview the job before it interviews you.

Rolequiry is an agent-native candidate due-diligence app for the OpenAI WebMCP Challenge. Your agent understands your career and investigates the role. Rolequiry keeps what the employer claims, what the evidence supports, what matters to you, and what is still worth asking as application-owned case state.

The agent can interpret a resume or career summary, values, constraints, and a non-linear career path in conversation; propose where the role may fit or create leverage; and research the active uncertainty. Rolequiry does not store that raw career narrative or produce a fit score. It records only candidate-confirmed importance, typed claims, evidence provenance, and the deterministic next verification target. Source identity and page contents are not independently authenticated.

## Live Demo URL

https://rolequiry.com/case

Employer reference surface: https://rolequiry.com/employer/atlas-fde

`www.rolequiry.com` also serves the same production deployment. Cloudflare stays as DNS; records are DNS-only to Vercel.

## One URL to test

- Canonical judging surface: `/case`
- Employer reference surface: `/employer/atlas-fde`
- Local: `bun run dev -- --port 3100` then open `http://127.0.0.1:3100/case`

Supported test environment: ChatGPT built-in browser / Chrome with WebMCP. The page registers tools on `document.modelContext` after hydration via `use-webmcp-tool`. Production never installs a fake `modelContext`.

## Why WebMCP

Most agent demos operate on cooperative pages. A job posting is mixed-incentive: useful to the candidate, written by the employer. WebMCP lets the page expose typed reads and writes against live application state instead of scraping. The agent extracts employer claims, relates them to the candidate's career context, asks the candidate to confirm the proposed priorities, and researches the currently active uncertainty with its own browsing capabilities. Rolequiry—not the model—derives claim kind, maps declared source categories to authority weight, and computes coverage, state, and ranking. It does not authenticate agent-reported URLs.

### Decision-directed research

Rolequiry is not a general deep-research engine. Comprehensive research systems search until they understand a topic; Rolequiry asks the agent to research only the uncertainty that can change this candidate's decision next.

- `select_decision_changer` defines the active research target.
- The agent can use its own browser, search, or deep-research capabilities outside Rolequiry.
- `record_research_evidence` writes one agent-reported employer-published or first-person finding back into the active probe.
- App-owned capture provenance stays attached to the evidence and is visible in the UI; it identifies who supplied the record, not who independently verified it.
- Duplicate source URLs are rejected, and `NEUTRAL` research is stored without reducing uncertainty.
- The research tool asks the agent to make a reasonable counterevidence check before assigning a strong `SUPPORTS` or `CHALLENGES` stance.

Research changes application state; it does not let the model decide whether the job is good.

## WebMCP Tools

On `/case`:

- `get_role_claims` (read): employer testimony, not verified facts
- `get_case_state` (read): app-owned coverage, unresolvedness, tension and priorities keyed by claim ID; no role prose or ranking
- `select_decision_changer` (write): compute ranking, set the active probe, return an untrusted agent-authored unresolved variable + measurable form
- `record_interview_answer` (write): record a human-obtained answer against the active probe
- `import_role_from_claims` (write): create a tab-local case from extracted employer statements and an optional job-posting `sourceUrl`
- `record_research_evidence` (write): record sourced public evidence the agent found for the active probe
- `set_candidate_priorities` (write): record one to eight importance values only after the candidate explicitly confirms them; this never auto-selects a probe

On `/employer/atlas-fde`: `get_employer_claims`, `get_employer_policy` (read-only). The employer page and `/case` share the Northwind fixture and link to each other; they do not require both tabs to stay open.

## Architecture

Human UI and all seven WebMCP tools share one in-memory `CaseStore`. `deriveCase` is a pure function: coverage, unresolvedness, tension, status, probe eligibility. The raw resume stays in agent conversation context; only importance values the candidate explicitly confirms enter Rolequiry. A versioned snapshot is saved in browser `sessionStorage` only for agent-imported cases, so real-role evidence survives reloads in the current tab without carrying into a new tab. Demo fixtures always reload from their canonical state.

## Try the agentic real-role loop

Open https://rolequiry.com/case in ChatGPT's built-in browser or Chrome with WebMCP.

1. Give the agent a career summary, values and constraints, plus a real JD URL.
2. Ask it to import the employer's claims and propose which decision variables matter specifically to you.
3. Confirm or revise those priorities in conversation. The agent must not infer confirmation from the resume alone.
4. The agent calls `get_role_claims` for untrusted labels and claim IDs, then `set_candidate_priorities`; the shared UI updates, but no probe is selected yet.
5. Ask what to investigate. `select_decision_changer` deterministically activates the highest-priority unresolved lived-experience claim.
6. Ask the agent to research only that active question and record one sourced finding. Inspect its provenance and what remains unknown in the Decision Path.
7. Use the measurable form as a falsifiable interview question, then record the answer against the same claim.

The priority dropdowns are the equivalent manual path. For a repeatable real-job rehearsal with a clearly synthetic candidate, use [`docs/demo/openai-fde-seoul.md`](docs/demo/openai-fde-seoul.md).

For the built-in fixture smoke test: ask `What should I investigate next?`, set Travel to CRITICAL in the UI, then ask `Check again.` The active probe should move from Ownership to Travel without the agent being told about the UI change.

## Known limitations

- Employee/workplace signals in the fixtures are synthetic and labeled as such.
- No server-side model calls. The user's existing agent does language work and external research.
- No resume upload or candidate-profile database. Raw career context remains in the connected agent's conversation.
- No deterministic fit score. Career fit and synergy remain hypotheses for the agent and candidate to test against Rolequiry's evidence state.
- Imported case data stays in the current tab's session storage; demo fixtures reset on reload, and there is no cross-tab sync, account sync, or server backup.
- Imported cases start with employer testimony only. The agent may add sourced first-person or employer-official research; Rolequiry stores agent-reported provenance, it does not independently verify the page.
- Rolequiry ranks lived-experience uncertainty, not written employer policy. Compensation bands and similar employer-owned statements are recorded, but they are not the next research probe.
- Rolequiry deliberately does not ingest arbitrary news or analyst commentary into its current authority model.
- Closing the employer page cannot break `/case`.
- GitHub repository: https://github.com/dailykim149656-source/Rolequiry

## Tests

```bash
bun install
bun run test
bun run typecheck
bun run build
bun run dev -- --port 3100
```
