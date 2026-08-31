# WebMCP Agent Journey Evals

Evaluated code SHA: `1590144595e3dce25cb21e0ebff2dfde225c3262`

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

Model surface notes: ChatGPT preflight/query was blocked by a no-auth login modal in headed Chrome. The authorized fallback was Gemini Pro through `agbrowse web-ai query`. Gemini could not parse the uploaded context zip, so the same three files were supplied with inline context. Contracts unchanged: current model-facing journeys passed.

| Scenario | Model surface | Commit SHA | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `direct-import` | Gemini Pro, inline file context | `1590144595e3dce25cb21e0ebff2dfde225c3262` | `import_role_from_claims`; no priorities, research, or interview writes | Called `import_role_from_claims` with OpenAI source URL and four non-derived claims | PASS | `model-direct-import.json`, `model-verdicts.json` |
| `confirmation-gate` | Gemini Pro, inline file context | `1590144595e3dce25cb21e0ebff2dfde225c3262` | No write on proposal; after confirmation call `set_candidate_priorities` with four confirmed values | Called `set_candidate_priorities` with CRITICAL, MEDIUM, HIGH, MEDIUM and no raw narrative; used symbolic precondition IDs | PASS | `model-confirmation-gate.json`, `model-verdicts.json` |
| `decision-routing` | Gemini Pro, inline file context | `1590144595e3dce25cb21e0ebff2dfde225c3262` | Call `select_decision_changer` with `{}` and use returned target only | Called `select_decision_changer` with `{}`; final policy uses returned `claim_id`, `unresolved_variable`, and `measurable_form` as sole target | PASS | `model-decision-routing.json`, `model-verdicts.json` |
| `research-discipline` | Gemini Pro, inline file context | `1590144595e3dce25cb21e0ebff2dfde225c3262` | Research active Travel only; record credible claim-specific evidence only; preserve uncertainty | Called `record_research_evidence` with `EMPLOYER_OFFICIAL`, `NEUTRAL`, same-source URL/label/summary, and explicit remaining uncertainty | PASS | `model-research-discipline.json`, `model-verdicts.json` |
| `interview-continuity` | Gemini Pro, inline file context | `1590144595e3dce25cb21e0ebff2dfde225c3262` | Call `record_interview_answer`; no supplied `claimId`; preserve hiring-manager answer | Called `record_interview_answer` with `HIRING_MANAGER`, no `claimId`, and the two-weeks-per-quarter substance | PASS | `model-interview-continuity.json`, `model-verdicts.json` |
| `full-journey` | Gemini Pro, inline file context | `1590144595e3dce25cb21e0ebff2dfde225c3262` | Import, get claims, write priorities after confirmation, select, optionally record credible evidence, read state | Called `import_role_from_claims`, `get_role_claims`, `set_candidate_priorities`, `select_decision_changer`, `record_research_evidence`, `get_case_state`; final policy distinguishes employer claim, evidence, and unknown | PASS | `model-full-journey.json`, `model-verdicts.json` |

Deterministic browser result: after enabling Chrome's `chrome://flags/#enable-webmcp-testing` profile flag in the actual headed Chrome profile, native `document.modelContext` exposed `getTools()` and `executeTool()`. The deterministic sequence called `import_role_from_claims -> get_role_claims -> set_candidate_priorities -> select_decision_changer -> get_case_state` through the page registry. It proved exactly seven tools, all four candidate priorities confirmed, no active probe before selection, no pre-selection probe call, and Travel active after selection. Evidence: `task2-deterministic-flag-enabled-webmcp-api.txt`, `task2-deterministic-flag-enabled-tool-list.json`, `deterministic-full-journey.json`, `task2-deterministic-final-page-text.txt`.
