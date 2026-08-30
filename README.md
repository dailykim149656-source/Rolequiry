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

Most agent demos operate on cooperative pages. A job posting is mixed-incentive: useful to the candidate, written by the employer. WebMCP lets the page expose typed reads and writes against live application state instead of scraping. The agent translates natural-language testimony into structured evidence and phrases the next question. The application deterministically owns coverage, state transitions, and ranking.

## WebMCP Tools

On `/case`:

- `get_role_claims` (read): employer testimony, not verified facts
- `get_case_state` (read): live coverage, unresolvedness, tension, priorities; no ranking
- `select_decision_changer` (write): compute ranking, set the active probe, return unresolved variable + measurable form
- `record_interview_answer` (write): record a human-obtained answer; unknown claim ids are rejected

On `/employer/atlas-fde`: `get_employer_claims`, `get_employer_policy` (read-only). The employer page and `/case` share the Northwind fixture and link to each other; they do not require both tabs to stay open.

## Architecture

Human UI and WebMCP tools share one in-memory `CaseStore`. `deriveCase` is a pure function: coverage, unresolvedness, tension, status, probe eligibility. The model does not decide whether a claim matters. State is per page; Reset Demo restores the fixture.

## Testing in ChatGPT/Chrome

Run three short loops. Do not record an ownership answer while Travel is selected.

Loop 1 — shared state

1. Open `/case` (Northwind). Optionally open employer-published claims, then return.
2. Ask what to verify next. `select_decision_changer` picks technical ownership.
3. Change Travel to CRITICAL, then say "Check again". Selection flips to Travel.
4. Stop. Reset demo.

Loop 2 — interview evidence

1. Ask what to verify next again. Ownership is selected.
2. Record the ownership hiring-manager answer. Ownership becomes CHALLENGED and leaves the probe queue.

Loop 3 — generalization

1. Open Demo controls and switch to Harborline.
2. Say "Same question here." `select_decision_changer` picks hands-on coding, not CRITICAL on-call.

## Known limitations

- Employee/workplace signals in the fixtures are synthetic and labeled as such.
- No server-side model calls. The user's existing agent does language work.
- `import_role_from_claims` is a swing feature and is not in this core submission.
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
