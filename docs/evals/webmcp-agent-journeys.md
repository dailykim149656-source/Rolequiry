# WebMCP Agent Journey Evals

Evaluated code SHA: `175e697d15f61503b651a79295df3a109538fa9a`

Source rationale: Chrome's WebMCP eval guidance treats browser-tool checks as contract evidence: deterministic browser runs prove that the page exposes the intended tools and that those tools mutate shared state correctly; model-facing runs are probabilistic evidence that a model chooses the right tools, arguments, output reuse, and final-answer policy. One model run is evidence, not a statistical guarantee.

Deterministic discovery command:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --user-data-dir="$CHROME_PROFILE" \
  --remote-debugging-port=9334 \
  --enable-blink-features=WebMCP \
  --no-first-run \
  --no-default-browser-check \
  about:blank
```

Discovery check:

```js
document.modelContext.getTools()
```

Model preflight:

```bash
agbrowse web-ai status --vendor chatgpt --json
```

Boundary rules covered by these evals:

- Raw resumes and career narratives stay in the agent conversation and are not persisted.
- `set_candidate_priorities` is used only after explicit candidate confirmation.
- Interview and research evidence bind to the active probe; the agent does not supply an interview `claimId`.
- Neutral or unknown evidence remains unresolved; the model must not force support/challenge.
- Public research evidence must use authentic employer-official or first-person provenance, not arbitrary commentary.

Model surface notes: retained ChatGPT status evidence shows `about:blank` and no visible ChatGPT composer, so the required ChatGPT query could not start. Gemini Pro was used as the authorized fallback through `agbrowse web-ai query`, with fresh `--parallel` sessions and inline context. The second review justified a minimal production contract correction: `record_research_evidence` now states that stance is relative to the active employer claim, never the candidate's preference or constraint. The v2 rerun added bounded official OpenAI source context only for the research-grounded scenarios, including the claim-specific travel excerpt: `50% travel is expected`.

| Scenario | Model surface | Commit SHA | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `direct-import` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | `import_role_from_claims`; no priorities, research, or interview writes | v2 returned strict JSON; called `import_role_from_claims` with the official OpenAI source URL and non-derived claims only | PASS | `model-v2-direct-import.json`, `model-v2-direct-import.prompt.txt`, `model-v2-direct-import.context-render.txt`, `model-v2-verdicts.json`, `model-verdicts.json` |
| `confirmation-gate` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | No write on proposal; after confirmation call `set_candidate_priorities` with four confirmed values | v2 returned strict JSON; called `set_candidate_priorities` on turn 2 with returned claim IDs and CRITICAL, MEDIUM, HIGH, MEDIUM, with no raw career narrative | PASS | `model-v2-confirmation-gate.json`, `model-v2-confirmation-gate.prompt.txt`, `model-v2-confirmation-gate.context-render.txt`, `model-v2-verdicts.json`, `model-verdicts.json` |
| `decision-routing` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | Call `select_decision_changer` with `{}` and use returned target only | v2 returned strict JSON starting with `{` and ending with `}`; called `select_decision_changer` with `{}` and no research before selection | PASS | `model-v2-decision-routing.json`, `model-v2-decision-routing.prompt.txt`, `model-v2-decision-routing.context-render.txt`, `model-v2-verdicts.json`, `model-verdicts.json` |
| `research-discipline` | Gemini Pro, inline file context plus bounded official source excerpt | `175e697d15f61503b651a79295df3a109538fa9a` | Research active Travel only; record credible claim-specific evidence only; preserve uncertainty when non-resolving | v2 returned strict JSON; called `record_research_evidence` with `EMPLOYER_OFFICIAL`, `SUPPORTS` relative to the active employer travel claim, official OpenAI URL, and a summary grounded in `50% travel is expected`; final policy separately notes conflict with the candidate's 20% ceiling | PASS | `openai-fde-official-source-excerpts.json`, `model-v2-research-discipline.json`, `model-v2-research-discipline.prompt.txt`, `model-v2-research-discipline.context-render.txt`, `model-v2-verdicts.json`, `model-verdicts.json` |
| `interview-continuity` | Gemini Pro, inline file context | `175e697d15f61503b651a79295df3a109538fa9a` | Call `record_interview_answer`; no supplied `claimId`; preserve hiring-manager answer | v2 retry returned strict JSON; called `record_interview_answer` with `SUPPORTS`, `HIRING_MANAGER`, no `claimId`, and the two-weeks-per-quarter substance. The original v2 neutral-stance output is retained as failed retry evidence. | PASS | `model-v2-interview-continuity.json`, `model-v2-interview-continuity-retry1.json`, `model-v2-interview-continuity-retry1.prompt.txt`, `model-v2-interview-continuity-retry1.context-render.txt`, `model-v2-verdicts.json`, `model-verdicts.json` |
| `full-journey` | Gemini Pro, inline file context plus bounded official source excerpt | `175e697d15f61503b651a79295df3a109538fa9a` | Import, get claims, write priorities after confirmation, select, optionally record credible evidence, read state | v2 returned strict JSON; called `import_role_from_claims -> get_role_claims -> set_candidate_priorities -> select_decision_changer -> record_research_evidence -> get_case_state`; priority ID used `$get_role_claims.claims[0].id` and `reusedOutputs` named that dependency; research used `SUPPORTS` relative to the employer claim and final policy separately explains the 20% ceiling conflict | PASS | `openai-fde-official-source-excerpts.json`, `model-v2-full-journey.json`, `model-v2-full-journey.prompt.txt`, `model-v2-full-journey.context-render.txt`, `model-v2-verdicts.json`, `model-verdicts.json` |

Deterministic browser result: in the actual headed Chrome profile with WebMCP testing enabled, native `document.modelContext` exposed `getTools()` and `executeTool()`. The v2 deterministic sequence at `175e697d15f61503b651a79295df3a109538fa9a` called `import_role_from_claims -> get_role_claims -> set_candidate_priorities -> select_decision_changer -> get_case_state` through the page registry. It proved exactly seven tools, four confirmed priority writes, no pre-selection probe call, and Travel active after selection. Evidence: `v2-deterministic-tool-list.txt`, `v2-deterministic-full-journey.json`, `v2-deterministic-full-journey-summary.txt`, `v2-deterministic-final-page-text.txt`, `v2-deterministic-final-screenshot.png`.
