# Project status

Last updated: 2026-09-02. Commit at time of writing: `d4c5d0d`.

This file records where the project actually stands — what is deployed, what has been
verified and by which method, and what is still open. The README explains what Rolequiry
is and how it works; this file is the current position, and it is the one to distrust
first if the two ever disagree.

## Deployed

| | |
| :--- | :--- |
| Judging surface | [`https://rolequiry.com/case`](https://rolequiry.com/case) — responded `200` on 2026-09-02 |
| Employer surface | [`https://rolequiry.com/employer/atlas-fde`](https://rolequiry.com/employer/atlas-fde) |
| Branch | `main`, in sync with `origin/main` |
| WebMCP tools on `/case` | 8, registered on `document.modelContext` after hydration |

## Verification position

Two kinds of evidence, kept apart on purpose. Deterministic browser runs prove the page
exposes the intended tools and that those tools mutate shared state correctly. Model-facing
runs are probabilistic evidence that a model picks the right tools and respects the
contract. One model run is evidence, not a statistical guarantee.

### Deterministic browser receipt — PASS

Checked in at [`docs/evals/head-deterministic-summary.json`](evals/head-deterministic-summary.json).

- Base SHA `b6897cf`, run 2026-09-01, verdict `PASS`
- 8 tools, 8 tool contracts, a 13-step journey
- `tests/eval-receipt-freshness.test.ts` compares the receipt against `lib/webmcp/contracts.ts`,
  so changing a tool contract without re-running the receipt fails `bun run test`

### Model-facing run — PASS, 1/1

Recorded in [`docs/evals/webmcp-agent-journeys.md`](evals/webmcp-agent-journeys.md).
Run 2026-09-02 at HEAD `d4c5d0d`, on the live site.

| Routing question | Result |
| :--- | :--- |
| After the candidate confirms, is the order `set_candidate_priorities` → `select_decision_changer`? | PASS |
| Does the model investigate the probe the app returned, without re-ranking it? | PASS |
| Does "Where does the decision stand?" route to `get_decision_dossier`, relayed as-is? | PASS |

Shared-state behaviour was exercised in the same session: changing one claim's candidate
priority in the page UI moved the app's own selection from `technical-ownership` to `travel`,
and the agent reported the new probe on the next turn without being told what had changed.

**The run diverged from the documented Candidate A scenario, and the cause is worth keeping.**
[`docs/demo/openai-fde-seoul.md`](demo/openai-fde-seoul.md) specifies that with Travel `CRITICAL`
and Technical decision authority `HIGH`, `select_decision_changer` should make **Travel** the
active probe: the published `50% travel is expected.` settles the posting-level percentage, but
the lived cadence behind it stays unresolved. In this run the app selected Technical decision
authority instead.

The application behaved as written. The divergence came from the import. For the Travel
dimension the agent quoted a whole paragraph:

> "This role is based in Seoul. We use a **hybrid work** model of 3 days in the office per week
> and offer **relocation assistance** to new employees. 50% travel is expected."

`deriveClaimKind` in [`lib/domain/policy.ts`](../lib/domain/policy.ts) matches
`hybrid work` and `relocation assistance` as explicit policy statements, so the claim was typed
`EMPLOYER_POLICY`. Policy claims require only `EMPLOYER_STATED` authority, so the claim came out
`coverage 1.0`, `unresolvedness 0`, `probeEligible: false` — correctly, for that text. Import the
bounded fact the demo doc calls for, `50% travel is expected.`, and the same function returns
`LIVED_EXPERIENCE` and Travel is eligible again.

Two things follow. The classifier is doing its job; nothing here argues for changing it. But
`import_role_from_claims` does not currently ask the agent to quote only the sentences that bear
on the dimension being imported, and a claim's derived kind is sensitive to that scoping. Until
it does, a real-role import can silently reclassify a lived-experience question as settled
policy by quoting one sentence too many.

## Local checks

Run on 2026-09-02 at `d4c5d0d`:

| Command | Result |
| :--- | :--- |
| `bun run typecheck` | clean |
| `bun run test` | 163 tests across 24 files, all passing |

## Client surfaces

| Surface | State |
| :--- | :--- |
| Chrome 152 stable, `--enable-blink-features=WebMCP` | Working. `document.modelContext.getTools()` returns all 8 tools; `executeTool` mutates case state as specified. |
| ChatGPT desktop built-in browser | Not exercised in this round. The attempt failed on an account credential error local to the test machine, which says nothing about the page. |

Two notes for anyone reproducing the model-facing run:

- Chrome's **testing** shim (`navigator.modelContextTesting`) is not present in stable Chrome.
  Generic WebMCP-to-MCP bridges that probe for it will report zero tools even though the page
  has registered eight. `document.modelContext` itself works on stable Chrome behind the flag.
- The 2026-09-02 run reached the page tools over the DevTools Protocol, forwarding `tools/list`
  to `document.modelContext.getTools()` and `tools/call` to `document.modelContext.executeTool()`.
  No tools other than the page's own were exposed to the model, and no DOM access was given.

## Open

- **Model-facing evidence is a single run.** It is recorded as 1/1, not as a rate. Repeating it
  across clients would strengthen the claim; nothing here should be read as a distribution.
- **Provenance is agent-reported.** Rolequiry structures and domain-checks what an agent declares;
  it does not authenticate authorship or page contents. See *Known limitations* in the README.
- **Employee and workplace signals in the fixtures are synthetic** and labelled as such in the UI.

## Submission

Entered in The WebMCP Challenge. The entry deadline is **2026-09-03 13:00 PDT
(2026-09-04 05:00 KST)**. After it passes, the repository, the live site, and the submitted
entry should be treated as frozen until results are published; judging runs to 9/23.
