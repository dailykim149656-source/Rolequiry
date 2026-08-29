# RoleProbe

Interview the job before it interviews you.

RoleProbe is an agent-native candidate due-diligence app for the OpenAI WebMCP Challenge. Job postings are treated as claims, not facts. Deterministic application code ranks the unresolved variable worth probing. The candidate sets priorities. The agent phrases the question. The human brings the answer back.

## Live Demo URL

https://roleprobe-five.vercel.app/case

Employer reference surface: https://roleprobe-five.vercel.app/employer/atlas-fde

## One URL to test

- Canonical judging surface: `/case`
- Employer reference surface: `/employer/atlas-fde`
- Local: `bun run dev -- --port 3100` then open `http://127.0.0.1:3100/case`

Supported test environment: ChatGPT built-in browser / Chrome with WebMCP. The page registers tools on `document.modelContext` after hydration via `use-webmcp-tool`. Production never installs a fake `modelContext`.

## Why WebMCP

Most agent demos operate on cooperative pages. A job posting is mixed-incentive: useful to the candidate, written by the employer. WebMCP lets the page expose typed reads and writes against live application state instead of scraping. RoleProbe keeps provenance and decision authority in the app; the agent only phrases questions.

## WebMCP Tools

On `/case`:

- `get_role_claims` (read): employer testimony, not verified facts
- `get_case_state` (read): live coverage, unresolvedness, tension, priorities; no ranking
- `select_decision_changer` (write): compute ranking, set the active probe, return unresolved variable + measurable form
- `record_interview_answer` (write): record a human-obtained answer; unknown claim ids are rejected

On `/employer/atlas-fde`: `get_employer_claims`, `get_employer_policy` (read-only).

## Architecture

Human UI and WebMCP tools share one in-memory `CaseStore`. `deriveCase` is a pure function: coverage, unresolvedness, tension, status, probe eligibility. The model does not decide whether a claim matters. State is per page; Reset Demo restores the fixture.

## Testing in ChatGPT/Chrome

1. Open the live `/case` URL in ChatGPT's browser.
2. Ask what to verify next. `select_decision_changer` should pick technical ownership on Atlas.
3. Change Travel to CRITICAL in the UI, then say "Check again".
4. Record a hiring-manager answer. Ownership can become CHALLENGED and leave the probe queue.
5. Open Demo controls and switch to Kestrel. HIGH hands-on coding outranks CRITICAL on-call.

## What a judge can do

1. Open Fixture A (Atlas Robotics / Forward Deployed Engineer).
2. Ask the agent what to verify next. `select_decision_changer` should pick technical ownership, not the louder travel red flag.
3. Change Travel from LOW to CRITICAL in the UI, then say "Check again".
4. Record a hiring-manager answer. Coverage updates; the claim can become CHALLENGED and leave the probe queue.
5. Switch to Fixture B. The same policy makes HIGH hands-on coding outrank CRITICAL on-call.

Reset Demo restores the known fixture. State is in-memory per page; reload does not leak between judges.

## Known limitations

- Employee/workplace signals in the fixtures are synthetic and labeled as such.
- No server-side model calls. The user's existing agent does language work.
- `import_role_from_claims` is a swing feature and is not in this core submission.
- Closing the employer page cannot break `/case`.

## Tests

```bash
bun test
bunx tsc --noEmit
```
