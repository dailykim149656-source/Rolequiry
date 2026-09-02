# Project status

Last updated: 2026-09-03. Model-facing runtime SHA: `d15ab03`.

This file records where the project actually stands — what is deployed, what has been
verified and by which method, and what is still open. The README explains what Rolequiry
is and how it works; this file is the current position, and it is the one to distrust
first if the two ever disagree.

## Deployed

| | |
| :--- | :--- |
| Judging surface | [`https://rolequiry.com/case`](https://rolequiry.com/case) — responded `200` on 2026-09-03, exposing the hardened contracts (verified via `document.modelContext.getTools()` on headless Chrome 152) |
| Employer surface | [`https://rolequiry.com/employer/atlas-fde`](https://rolequiry.com/employer/atlas-fde) |
| Branch | `main`, in sync with `origin/main` |
| WebMCP tools on `/case` | 8, registered on `document.modelContext` after hydration |

## Verification position

Two kinds of evidence, kept apart on purpose. Deterministic browser runs prove the page
exposes the intended tools and that those tools mutate shared state correctly. Model-facing
runs are probabilistic evidence that a model picks the right tools and respects the
contract. A handful of model runs is evidence, not a statistical guarantee.

### Deterministic browser receipt — PASS

Checked in at [`docs/evals/head-deterministic-summary.json`](evals/head-deterministic-summary.json).

- Base SHA `7aa670e`, run 2026-09-02 UTC, verdict `PASS`
- 8 tools, 8 tool contracts, a 13-step journey
- `tests/eval-receipt-freshness.test.ts` compares the receipt against `lib/webmcp/contracts.ts`,
  so changing a tool contract without re-running the receipt fails `bun run test`

### Model-facing runs — PASS: 2/2 on current contracts, 4/4 pre-hardening

Recorded in [`docs/evals/webmcp-agent-journeys.md`](evals/webmcp-agent-journeys.md).

**Current contracts:** two runs on 2026-09-03 at runtime SHA `d15ab03` (`xai/grok-4.6`, live site),
scored on the three routing questions plus a new scoping question. The operator prompt
deliberately omitted the quotation-scoping line the earlier runs had needed; both runs still
imported the travel claim as exactly `50% travel is expected.` — leaving out the adjacent
`hybrid work` and `relocation assistance` prose in the same posting paragraph — so the
hardened import contract carried the scoping on its own. Both runs also exercised the opt-in
employer-authority path (`sourceOrganizationMatch: true` on a same-organization official
source, recorded `NEUTRAL`, tension `0`) and matched the documented Candidate A scenario:
Travel active, 2 remaining decision blockers, Travel question routed to `TEAM_MEMBER`.

| Question (2026-09-03 runs) | Result |
| :--- | :--- |
| No scoping line in the prompt: does the agent quote only the minimal employer sentences per claim? | 2/2 |
| After the candidate confirms, is the order `set_candidate_priorities` → `select_decision_changer`? | 2/2 |
| Does the model investigate the probe the app returned, without re-ranking it? | 2/2 |
| Does "Where does the decision stand?" route to `get_decision_dossier`, relayed as-is? | 2/2 |

**Pre-hardening:** five runs on 2026-09-02 at HEAD `d4c5d0d`, against the live site. Four were
scored on the three routing questions and all four passed; the fifth is reported unscored
because its research turn never returned — a stall in the agent harness, not in a page tool.

| Routing question (2026-09-02 runs) | Result |
| :--- | :--- |
| After the candidate confirms, is the order `set_candidate_priorities` → `select_decision_changer`? | 4/4 |
| Does the model investigate the probe the app returned, without re-ranking it? | 4/4 |
| Does "Where does the decision stand?" route to `get_decision_dossier`, relayed as-is? | 4/4 |

Shared-state behaviour held on every 2026-09-02 run: changing one claim's candidate priority in
the page UI moved the app's own selection from `technical-ownership` to `travel`, and the agent
reported the new probe on its next turn without being told what had changed.

Three of the four scored 2026-09-02 runs also matched the documented Candidate A scenario in
[`docs/demo/openai-fde-seoul.md`](demo/openai-fde-seoul.md): Travel as the active probe,
2 remaining decision blockers, and the Travel question routed to `TEAM_MEMBER`.

**The one that did not is worth keeping in the record.** For the Travel dimension that run's
agent quoted a whole paragraph, which happened to contain `hybrid work` and
`relocation assistance`. `deriveClaimKind` in [`lib/domain/policy.ts`](../lib/domain/policy.ts)
matches both as explicit policy language, so the claim was typed `EMPLOYER_POLICY`, required
only `EMPLOYER_STATED` authority, and came out `coverage 1.0`, `unresolvedness 0`,
`probeEligible: false` — correctly, for that text. Quoting the bounded fact the demo doc calls
for, `50% travel is expected.`, returns `LIVED_EXPERIENCE` and Travel is eligible again; both
directions were checked against `deriveClaimKind` directly. The later runs added one line to the
operator prompt — quote only the sentences bearing on the dimension being imported — and
conformed.

Nothing here argues for changing the classifier. It did surface that
`import_role_from_claims` never asked the agent to scope its quotation that way, and that a
claim's derived kind is sensitive to it. **Fixed at `601f76f`:** the import contract and
input schema now require quoting only the minimal employer sentences bearing on the one
decision variable each claim models, and both directions of this exact failure — the broad
paragraph and the bounded `50% travel is expected.` — are pinned in
`tests/import-and-evidence.test.ts`, at `deriveClaimKind` and end to end through the import
tool. The 2026-09-02 runs predate that contract change and stand as evidence at their own SHA;
the 2026-09-03 runs above verify, with no operator-prompt scoping line, that the hardened
contract alone now produces the bounded quote.

Provider note: the first four 2026-09-02 runs used `opencode-go/grok-4.6`. That provider's
credits ran out, so the last 2026-09-02 run and both 2026-09-03 runs drove the identical
scenario through `xai/grok-4.6`. Nothing about the page or the bridge changed — the tools are
page-native, so the client path is interchangeable.

## Local checks

Run on 2026-09-03 at `7aa670e`:

| Command | Result |
| :--- | :--- |
| `bun run typecheck` | clean |
| `bun run test` | 169 tests across 24 files, all passing |

## Client surfaces

| Surface | State |
| :--- | :--- |
| Chrome 152 stable, `--enable-blink-features=WebMCP` | Working. `document.modelContext.getTools()` returns all 8 tools; `executeTool` mutates case state as specified. |
| ChatGPT desktop built-in browser | Not exercised in this round. The attempt failed on an account credential error local to the test machine, which says nothing about the page. |

Two notes for anyone reproducing the model-facing runs:

- Chrome's **testing** shim (`navigator.modelContextTesting`) is not present in stable Chrome.
  Generic WebMCP-to-MCP bridges that probe for it will report zero tools even though the page
  has registered eight. `document.modelContext` itself works on stable Chrome behind the flag.
- These runs reached the page tools over the DevTools Protocol, forwarding `tools/list`
  to `document.modelContext.getTools()` and `tools/call` to `document.modelContext.executeTool()`.
  No tools other than the page's own were exposed to the model, and no DOM access was given.

## Fixed since the 2026-09-02 model-facing runs

Both fixes below landed after the 2026-09-02 runs, so those runs are evidence for the
pre-fix contracts at `d4c5d0d`. The deterministic receipt has been re-run at `7aa670e`,
and the 2026-09-03 model-facing runs verify both fixes against a live model.

- **Import quotation scoping** (`601f76f`): the live-run failure documented above is now a
  contract requirement plus a pinned regression, not an open gap.
- **Employer authority is opt-in by verified domain match** (`7aa670e`): agent-declared
  employer-official evidence previously entered authority math whenever the domain check
  returned `null` — in particular on a case imported without a posting URL, where there is
  no organization to check against, an unverifiable `CHALLENGES` declaration could flip a
  claim to `CHALLENGED`. Authority now requires `match === true`; mismatched and uncheckable
  sources stay recorded and are labelled in the evidence list, but never enter coverage or
  tension. The demo fixtures gained synthetic posting URLs so their baseline exists.

## Open

- **Model-facing evidence is seven runs over two days, six of them scored.** It is recorded
  as 4/4 pre-hardening plus 2/2 on the current contracts, not as a rate. All runs used one
  model family (`grok-4.6`) through one client; other model families have not been scored
  against the current contracts.
- **Provenance is agent-reported.** Rolequiry structures and domain-checks what an agent declares;
  it does not authenticate authorship or page contents. See *Known limitations* in the README.
- **Employee and workplace signals in the fixtures are synthetic** and labelled as such in the UI.

## Submission

Entered in The WebMCP Challenge. The entry deadline is **2026-09-03 13:00 PDT
(2026-09-04 05:00 KST)**. After it passes, the repository, the live site, and the submitted
entry should be treated as frozen until results are published; judging runs to 9/23.
Judge-only testing and client fields were re-submitted on 2026-09-03 to include
the current 2/2 hardened-contract evidence.
