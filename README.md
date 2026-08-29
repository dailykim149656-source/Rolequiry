# RoleProbe

Interview the job before it interviews you.

RoleProbe is an agent-native candidate due-diligence app for the OpenAI WebMCP Challenge. Job postings are treated as claims, not facts. Deterministic application code ranks the unresolved variable worth probing. The candidate sets priorities. The agent phrases the question. The human brings the answer back.

## One URL to test

- Live demo: https://roleprobe-five.vercel.app/case
- Canonical judging surface: `/case`
- Employer reference surface: `/employer/atlas-fde`
- Local: `bun run dev -- --port 3100` then open `http://127.0.0.1:3100/case`

Supported test environment: ChatGPT built-in browser / Chrome with WebMCP. The page registers tools on `document.modelContext` after hydration via `use-webmcp-tool`.

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
