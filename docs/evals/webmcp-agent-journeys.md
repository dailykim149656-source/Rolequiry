# WebMCP Agent Journey Evals

Deterministic browser base SHA: `b6897cf709515b151fb84d37e7d8d15e9e1bb792`

Current natural-language contract: committed at the base SHA above and bound to the runtime tool-description digest in [`head-deterministic-summary.json`](head-deterministic-summary.json). `tests/eval-receipt-freshness.test.ts` compares the checked-in receipt against `lib/webmcp/contracts.ts`, so changing a tool contract without re-running the browser receipt fails `bun run test`.

Current model-facing verdict: **PASS, 1/1 run** at `d4c5d0d72e877b6b842fbd6fb609b170e77bc26d` (2026-09-02). One run is evidence, not a statistical guarantee; see the run record below. The historical Gemini rows further down apply only to `175e697d15f61503b651a79295df3a109538fa9a`; their raw artifacts are not tracked in this repository and are not current acceptance evidence.

### Model-facing run — 2026-09-02, HEAD `d4c5d0d`

Surface: Chrome 152 stable launched with `--enable-blink-features=WebMCP`, serving `https://rolequiry.com/case`. The page's eight `document.modelContext` tools were exposed to the agent over a stdio MCP shim that forwards `tools/list` to `document.modelContext.getTools()` and `tools/call` to `document.modelContext.executeTool()` via CDP. The shim registers no tools of its own and provides no DOM access, so every tool the model saw was one the page registered. Client: OpenCode 1.18.3. Model: Grok 4.6 (`opencode-go/grok-4.6`).

| # | Routing question | Result |
|---|---|---|
| 1 | After the candidate confirms priorities, is the tool order `set_candidate_priorities` → `select_decision_changer`? | **PASS** — observed `get_role_claims`, `set_candidate_priorities`, `select_decision_changer`, in that order. |
| 2 | Does the model investigate the probe the app returned, without re-ranking it? | **PASS** — the app returned `technical decision authority`; the model researched that probe only and recorded one public source through `record_research_evidence`. It did not substitute a probe of its own. |
| 3 | Does "Where does the decision stand?" route to `get_decision_dossier`, and is the rollup relayed as-is? | **PASS** — single `get_decision_dossier` call; the reply carried the remaining blocker, the resolved claim, and the interview questions with their `askWho` routing. |

Also observed in the same session, as shared-state evidence: changing one claim's candidate priority in the page UI (Travel `LOW` → `CRITICAL`, via a real key event on the select) moved the app's own selection from `technical-ownership` to `travel`, and the model reported the new probe on the next turn without being told what had changed.

Note on expected values: the checked-in browser receipt records the deterministic fixture path. This live run imported a real posting and recorded its own research evidence, so its dossier totals (1 remaining blocker) reflect that run's evidence set rather than the fixture's.

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

In a third terminal, connect to that Chrome, wait for all eight tools, and execute the checked-in journey. The final object must contain `"pass": true`; its `toolContractsSha256` binds the receipt to the descriptions exposed by that browser run.

```bash
export CDP_PORT=9334
agbrowse navigate http://127.0.0.1:3210/case
agbrowse wait-for-text "WebMCP 8/8 live" --timeout 30000
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

Deterministic browser result at `b6897cf709515b151fb84d37e7d8d15e9e1bb792`: isolated headless Chrome with `--enable-blink-features=WebMCP` on a production `next start` build. Native `document.modelContext` exposed `getTools()` and `executeTool()` for all eight tools. The Candidate A sequence called `import_role_from_claims -> get_role_claims`, then represented the explicit-confirmation boundary with `get_role_claims -> set_candidate_priorities -> select_decision_changer`. The Candidate A selection returned Travel with `claim_kind` `LIVED_EXPERIENCE`, `status` `MATERIAL_AMBIGUITY`, and employer-stated authority coverage `0.2`, and the PASS predicate requires those exact fields: this pins, at the browser surface, the live-model failure where the agent re-ranked Travel because the posting already states a 50% number. It next exercised `record_research_evidence -> get_case_state` with a separate official OpenAI FDE posting recorded as `NEUTRAL`: that posting repeats an up-to-50% travel requirement but provides no Seoul cadence or concentration data. The PASS predicate requires that the agent-reported evidence is attached to the active probe, that the claim remains unresolved and probe-eligible, and that the app-owned domain check marked the declared employer-official source as matching the job posting's organization (`sourceOrganizationMatch: true`). A `get_decision_dossier` read then returned the app-owned rollup, and the PASS predicate requires it: outcome `DOSSIER`, two remaining decision blockers, and an interview pack whose first question targets Travel (`imported-1`) with `TEAM_MEMBER` routing and the claim's measurable form as the question text. The journey then recorded a poisoned write — a cross-domain source declared `EMPLOYER_OFFICIAL` with a `CHALLENGES` stance — and the PASS predicate requires the quarantine: the evidence is stored and flagged (`sourceOrganizationMatch: false`) but Travel's tension stays `0`, its status stays `MATERIAL_AMBIGUITY`, and employer authority coverage stays `0.2`, so a wrong or malicious employer-official declaration cannot settle or challenge a claim. This proves native mechanics and unknown preservation; it does not prove that a live model or human performed the confirmation, counterevidence search, or source authentication. Travel (`imported-1`) became active for Candidate A. The same imported case then overwrote priorities to Candidate B and immediately called `select_decision_changer`; Hands-on coding (`imported-2`) became active. After the Candidate B write and before reselection, `activeProbeId` remained Travel, matching the documented ranking-visible=false hold. `get_case_state` contained no resume, profile, or fit-score field. The receipt includes the runtime tool descriptions used to recompute `toolContractsSha256`. Evidence: [`head-deterministic-summary.json`](head-deterministic-summary.json), [`head-deterministic-execute.js`](head-deterministic-execute.js).

Earlier deterministic receipts are superseded and their raw artifacts are not current acceptance evidence: the `eb5827b1a1616132f2029de7d3c5df6e2ee5c739` receipt flagged cross-domain employer sources without yet excluding them from authority math, the `1325d8fad057048a5e47efa1d72a070cf3356500` receipt predated the employer-source domain check, the seven-tool `2a679f33231bd2239839e3c8dd1e13a7d9b2e82a` receipt predated `get_decision_dossier` and durable local persistence, the `afd5a0d946ad7d1a7f5ee9a58c99769c2205cbb8` receipt predated the authoritative `select_decision_changer` contract, and the v2 result at `175e697d15f61503b651a79295df3a109538fa9a` (headed Chrome, Candidate A only, Travel selected) is untracked history.
