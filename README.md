# Rolequiry

Interview the job before it interviews you.

Rolequiry is an agent-native candidate due-diligence app for the OpenAI WebMCP Challenge. Job postings are treated as claims, not facts. You decide what matters. Your agent investigates the active uncertainty. Rolequiry shows the next unresolved question on a live decision path, and owns evidence authority, coverage, and state.

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

Most agent demos operate on cooperative pages. A job posting is mixed-incentive: useful to the candidate, written by the employer. WebMCP lets the page expose typed reads and writes against live application state instead of scraping. The agent extracts employer claims, translates them into testable variables, and can research the currently active uncertainty with its own browsing capabilities. Rolequiry—not the model—derives claim kind, evidence authority, coverage, state, and ranking.

### Decision-directed research

Rolequiry is not a general deep-research engine. Comprehensive research systems search until they understand a topic; Rolequiry asks the agent to research only the uncertainty that can change this candidate's decision next.

- `select_decision_changer` defines the active research target.
- The agent can use its own browser, search, or deep-research capabilities outside Rolequiry.
- `record_research_evidence` writes one sourced employer-official or first-person finding back into the active probe.
- Provenance stays attached to the evidence and is visible in the UI.
- Duplicate source URLs are rejected, and `NEUTRAL` research is stored without reducing uncertainty.
- The research tool asks the agent to make a reasonable counterevidence check before assigning a strong `SUPPORTS` or `CHALLENGES` stance.

Research changes application state; it does not let the model decide whether the job is good.

## WebMCP Tools

On `/case`:

- `get_role_claims` (read): employer testimony, not verified facts
- `get_case_state` (read): live coverage, unresolvedness, tension, priorities; no ranking
- `select_decision_changer` (write): compute ranking, set the active probe, return unresolved variable + measurable form
- `record_interview_answer` (write): record a human-obtained answer against the active probe
- `import_role_from_claims` (write): create an in-memory case from extracted employer statements
- `record_research_evidence` (write): record sourced public evidence the agent found for the active probe

On `/employer/atlas-fde`: `get_employer_claims`, `get_employer_policy` (read-only). The employer page and `/case` share the Northwind fixture and link to each other; they do not require both tabs to stay open.

## Architecture

Human UI and WebMCP tools share one in-memory `CaseStore`. `deriveCase` is a pure function: coverage, unresolvedness, tension, status, probe eligibility. The model does not decide whether a claim matters. State is per page; Reset Demo restores the fixture.

## Try it in 60 seconds

Open https://rolequiry.com/case in ChatGPT's built-in browser or Chrome with WebMCP.

1. Ask only: `What should I investigate next?` Ownership is selected even though Travel has more negative signals.
2. In the UI only, set Travel to CRITICAL. Do not tell the agent that Travel matters.
3. Ask only: `Check again.` The decision path flips from Ownership to Travel.
4. Reset, ask again, then tell the agent: `The hiring manager said ownership is split with a central platform team after design review.` Ownership becomes CHALLENGED.
5. Optional real-role path: paste a real job description and say `Put this role into Rolequiry.` Set at least one priority, then ask what to investigate.
6. Optional research path: with a real role and an active probe, say `Research this active question using public employer-official or first-person sources. Record only what you can source.` Then inspect `View evidence` and ask `Check again.`

## Known limitations

- Employee/workplace signals in the fixtures are synthetic and labeled as such.
- No server-side model calls. The user's existing agent does language work and external research.
- Imported cases start with employer testimony only. The agent may add supported employer-official or first-person research evidence, and the human may later add interview evidence.
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
