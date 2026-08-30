# Rolequiry

Interview the job before it interviews you.

Rolequiry is an agent-native candidate due-diligence app for the OpenAI WebMCP Challenge. Job postings are treated as claims, not facts. Deterministic application code ranks the unresolved variable worth probing. The candidate sets priorities. The agent phrases the question. The human brings the answer back.

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

Most agent demos operate on cooperative pages. A job posting is mixed-incentive: useful to the candidate, written by the employer. WebMCP lets the page expose typed reads and writes against live application state instead of scraping. The agent extracts employer claims and translates them into testable variables. Rolequiry—not the model—derives claim kind, evidence coverage, state, and ranking.

## WebMCP Tools

On `/case`:

- `get_role_claims` (read): employer testimony, not verified facts
- `get_case_state` (read): live coverage, unresolvedness, tension, priorities; no ranking
- `select_decision_changer` (write): compute ranking, set the active probe, return unresolved variable + measurable form
- `record_interview_answer` (write): record a human-obtained answer against the active probe
- `import_role_from_claims` (write): create an in-memory case from extracted employer statements

On `/employer/atlas-fde`: `get_employer_claims`, `get_employer_policy` (read-only). The employer page and `/case` share the Northwind fixture and link to each other; they do not require both tabs to stay open.

## Architecture

Human UI and WebMCP tools share one in-memory `CaseStore`. `deriveCase` is a pure function: coverage, unresolvedness, tension, status, probe eligibility. The model does not decide whether a claim matters. State is per page; Reset Demo restores the fixture.

## Try it in 60 seconds

Open https://rolequiry.com/case in ChatGPT's built-in browser or Chrome with WebMCP.

1. Ask only: `What should I investigate next?` Ownership is selected even though Travel has more negative signals.
2. In the UI only, set Travel to CRITICAL. Do not tell the agent that Travel matters.
3. Ask only: `Check again.` The current question flips to Travel.
4. Reset, ask again, then tell the agent what the hiring manager said. Ownership becomes CHALLENGED.
5. Optional: paste a real job description and say `Put this role into Rolequiry.` Then set priorities before asking what to investigate.

## Known limitations

- Employee/workplace signals in the fixtures are synthetic and labeled as such.
- No server-side model calls. The user's existing agent does language work.
- Imported cases start with employer evidence only until interview or reported evidence is added.
- Closing the employer page cannot break `/case`.
- GitHub repository: https://github.com/dailykim149656-source/Rolequiry

## Tests

```bash
bun install
bun test
bun run typecheck
bun run build
bun run dev -- --port 3100
```
