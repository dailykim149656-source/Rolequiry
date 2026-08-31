# WebMCP Agent Journey Evals

Deterministic browser base SHA: `afd5a0d946ad7d1a7f5ee9a58c99769c2205cbb8`

Current natural-language contract: working-tree changes, bound to the runtime tool-description digest in [`head-deterministic-summary.json`](head-deterministic-summary.json).

Current model-facing verdict: **NOT RUN**. The available ChatGPT browser preflight opened `about:blank` without a composer, so no current model-routing PASS is claimed. The historical Gemini rows below apply only to `175e697d15f61503b651a79295df3a109538fa9a`; their raw artifacts are not tracked in this repository and are not current acceptance evidence.

Source rationale: Chrome's WebMCP eval guidance treats browser-tool checks as contract evidence: deterministic browser runs prove that the page exposes the intended tools and that those tools mutate shared state correctly; model-facing runs are probabilistic evidence that a model chooses the right tools, arguments, output reuse, and final-answer policy. One model run is evidence, not a statistical guarantee.

## Reproduce the deterministic browser proof

From the repository root, build and start the production app:

```bash
bun run build -- --webpack
bun run start -- --port 3210
```

In another terminal, start an isolated Chrome with native WebMCP enabled:

```bash
export CHROME_PROFILE="$(mktemp -d)"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --user-data-dir="$CHROME_PROFILE" \
  --remote-debugging-port=9334 \
  --enable-blink-features=WebMCP \
  --no-first-run \
  --no-default-browser-check \
  about:blank
```

In a third terminal, connect to that Chrome, wait for all seven tools, and execute the checked-in journey. The final object must contain `"pass": true`; its `toolContractsSha256` binds the receipt to the descriptions exposed by that browser run.

```bash
export CDP_PORT=9334
agbrowse navigate http://127.0.0.1:3210/case
agbrowse wait-for-text "WebMCP 7/7 live" --timeout 30000
SCRIPT="$(<docs/evals/head-deterministic-execute.js)"
agbrowse evaluate "$SCRIPT" | jq -r . | jq .
```

Model preflight:

```bash
agbrowse web-ai status --vendor chatgpt --json
```

Boundary rules covered by these evals:

- The import schema has no resume/profile field and rejects extra properties. Keeping resume prose out of employer-claim text is an agent contract, not semantic data-loss prevention.
- `set_candidate_priorities` is used only after explicit candidate confirmation.
- Interview and research evidence bind to the active probe; the agent does not supply an interview `claimId`.
- Neutral or unknown evidence remains unresolved; the model must not force support/challenge.
- Public research evidence must be agent-reported as employer-official or first-person, not arbitrary commentary; Rolequiry records that declaration but does not authenticate the source.

Model surface notes: the 2026-08-31 refresh checked `agbrowse web-ai status --vendor chatgpt`; the isolated WebMCP Chrome was on `/case`, while the provider surface had no usable composer. That is an environment blocker, not a product PASS or RED. The older Gemini run used fresh sessions and inline context. It predates the natural-language confirmation routing introduced here.

### Historical model-routing results, not current acceptance evidence

| Scenario | Model surface | Commit SHA | Expected | Observed | Status | Raw evidence in this repo |
| --- | --- | --- | --- | --- | --- | --- |
| `direct-import` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | `import_role_from_claims`; no priorities, research, or interview writes | Called `import_role_from_claims` with the official source URL and non-derived claims only | Historical pass | No |
| `confirmation-gate` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | No write on proposal; write confirmed priorities on turn 2 | Called `set_candidate_priorities` on turn 2 with returned IDs and no raw career narrative | Historical pass | No |
| `decision-routing` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | Call `select_decision_changer` and use its target only | Called `select_decision_changer` with `{}` and did no research before selection | Historical pass | No |
| `research-discipline` | Gemini Pro plus bounded official excerpt | `175e697d15f61503b651a79295df3a109538fa9a` | Research active Travel only and preserve uncertainty | Recorded an official, claim-specific source with stance relative to the employer claim | Historical pass | No |
| `interview-continuity` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | Record the supplied answer without a `claimId` | Recorded the hiring-manager answer without a `claimId` | Historical pass | No |
| `full-journey` | Gemini Pro plus bounded official excerpt | `175e697d15f61503b651a79295df3a109538fa9a` | Import, read, confirm, select, research, read state | Followed the older six-call journey and reused tool outputs | Historical pass | No |

Deterministic browser result for the current working tree based on `afd5a0d946ad7d1a7f5ee9a58c99769c2205cbb8`: isolated headless Chrome with `--enable-blink-features=WebMCP` on a production `next start` build. Native `document.modelContext` exposed `getTools()` and `executeTool()`. The Candidate A sequence called `import_role_from_claims -> get_role_claims`, then represented the explicit-confirmation boundary with `get_role_claims -> set_candidate_priorities -> select_decision_changer`. It next exercised `record_research_evidence -> get_case_state` with a separate official OpenAI FDE posting recorded as `NEUTRAL`: that posting repeats an up-to-50% travel requirement but provides no Seoul cadence or concentration data. The PASS predicate requires that the agent-reported evidence is attached to the active probe and that the claim remains unresolved and probe-eligible. This proves native mechanics and unknown preservation; it does not prove that a live model or human performed the confirmation, counterevidence search, or source authentication. Travel (`imported-1`) became active for Candidate A. The same imported case then overwrote priorities to Candidate B and immediately called `select_decision_changer`; Hands-on coding (`imported-2`) became active. After the Candidate B write and before reselection, `activeProbeId` remained Travel, matching the documented ranking-visible=false hold. `get_case_state` contained no resume, profile, or fit-score field. The receipt includes the runtime tool descriptions used to recompute `toolContractsSha256`. Evidence: [`head-deterministic-summary.json`](head-deterministic-summary.json), [`head-deterministic-execute.js`](head-deterministic-execute.js).

Earlier v2 deterministic result at `175e697d15f61503b651a79295df3a109538fa9a`: headed Chrome with WebMCP testing enabled ran the Candidate A sequence only and selected Travel. Its raw artifacts are not tracked here and are not used as current acceptance evidence.
