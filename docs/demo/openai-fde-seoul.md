# OpenAI Seoul FDE same-role candidate comparison

This is a repeatable page-native WebMCP demo, not a saved candidate profile, fit score, or join recommendation.

## Source and setup

- Official job page: https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/
- Verified against the public page on 2026-08-31.
- Open `/case` on the current Rolequiry origin in a browser that can see page-native WebMCP tools.
- Confirm that the product bar reports `WebMCP 8/8 live`.

Do not copy the full JD into this repository. Before the demo, capture the posting's final URL, title, and timestamp. Keep this bounded official fact visible in the rehearsal: `50% travel is expected.` For Candidate A, that published percentage already exceeds the candidate's roughly 20% travel ceiling, so the posting-level percentage mismatch is resolved by the official page and is not itself unknown. The remaining Travel uncertainty is narrower: how that stated expectation is actually distributed across the Seoul team's cadence, concentration, duration, launch spikes, and consecutive onsite stretches.

The current page supports these four decision variables for the rehearsal:

1. Travel concentration
2. Hands-on coding share
3. Technical decision authority
4. Concurrent deployment load

Search only official OpenAI pages and attributable first-person sources for the active Travel cadence question. If the OpenAI posting disappears, switch to the official Palantir Seoul Forward Deployed Software Engineer posting and rewrite both mappings around that role. If the OpenAI posting is live but no additional credible claim-specific cadence source exists beyond the imported employer claim, keep OpenAI and preserve only that lived cadence question as `UNKNOWN`.

## Candidate A

Candidate A is synthetic and stays only in the agent conversation:

```text
Six years across backend and AI product engineering; some enterprise delivery;
no sustained high-travel role; travel ceiling about 20%; technical authority
matters; hands-on coding is preferred but the exact coding mix is flexible.
```

The official posting says `50% travel is expected.` That already conflicts with Candidate A's stated ceiling. The candidate may treat that published mismatch as decisive, or may still investigate the operational cadence behind the published expectation before deciding.

Use the official URL with this prompt:

> Here is my career context and this JD. Put the role into Rolequiry, identify the decision variables that matter specifically to me, propose a priority mapping, and ask me to confirm priorities before writing them.

Import only the four dimensions above. Rolequiry should receive agent-imported employer-claim extracts and testable variables only. Keep the raw profile, career narrative, and any fit rationale in the agent conversation.

The agent must propose first and write only after the candidate replies with this exact confirmation:

```text
Travel concentration = CRITICAL
Hands-on coding share = MEDIUM
Technical decision authority = HIGH
Concurrent deployment load = MEDIUM
```

Candidate A's full sequence is:

```text
import_role_from_claims
get_role_claims
human confirmation
set_candidate_priorities
select_decision_changer
record_research_evidence (only when a credible active-probe source exists)
get_case_state
select_decision_changer when the user explicitly asks to check again
```

After `set_candidate_priorities`, all four controls should update and no claim should be active yet. After `select_decision_changer`, Travel should become the active probe. That probe is about lived cadence beyond the published percentage, not about whether the posting states a percentage above 20%.

If a credible active-probe source exists, record one source and keep its identity/provenance agent-reported. Rolequiry stores the URL, kind, and stance metadata but does not authenticate source identity. Preserve both the employer fact `50% travel is expected.` and any remaining lived unknown. If the additional Travel cadence evidence is mixed, weak, or non-resolving, do not force a write. Leave only that cadence question `UNKNOWN` and turn it into a measurable interview or offer-stage question, for example:

> Across the last two quarters, what were the median and maximum travel days per FDE, and how concentrated were those days across weeks?

## Candidate B

Candidate B is also synthetic and starts from the same imported OpenAI case:

```text
Six years in solutions and platform engineering; frequent travel is acceptable;
the next role must keep sustained hands-on production coding; coordination is
acceptable only when it does not replace building.
```

Overwrite all four values before selecting again so Candidate A state cannot leak into the comparison:

```text
Travel concentration = LOW
Hands-on coding share = CRITICAL
Technical decision authority = MEDIUM
Concurrent deployment load = MEDIUM
```

Candidate B uses the same imported claim IDs from `get_role_claims`. The current proof run returned `imported-1` through `imported-4`, but the agent should always use the IDs it actually receives. Do not reimport or reset the case between candidates.

Candidate B's comparison loop is:

```text
set_candidate_priorities
select_decision_changer
```

Travel should be the selected probe for Candidate A. Hands-on coding should be the selected probe for Candidate B. The selected claim IDs should differ.

Rolequiry preserves both outcomes without turning them into a fit score or join recommendation: the employer-published 50% expectation can already matter decisively for one candidate, while the remaining lived cadence question can still be worth investigating before a final decision.

## Observable checkpoints

- Product bar shows `WebMCP 8/8 live`.
- The dossier header shows the OpenAI role and the agent-reported posting link.
- `get_role_claims` returns only agent-imported, untrusted employer-claim extracts, source snippets, and claim IDs.
- After Candidate A confirmation, all four priority controls show `CRITICAL`, `MEDIUM`, `HIGH`, `MEDIUM` with no active probe before selection.
- After Candidate A selection, Travel has the `Active probe` highlight.
- Candidate B overwrites all four values on the same case before selection, then Hands-on coding becomes the `Active probe`.
- The exact travel source snippet can remain `50% travel is expected.` while still being untrusted `AGENT_IMPORTED` content inside Rolequiry until the agent independently checks it against the official page.
- `get_case_state` remains normalized and contains no resume, profile, career narrative, fit score, or join recommendation field.

## Storyboard

Published on YouTube and embedded on the Devpost entry:

```text
0:00-0:20 problem and thesis
0:20-0:50 Candidate A + real JD import
0:50-1:20 explicit confirmation + Travel selection
1:20-1:55 evidence/unknown + verification question
1:55-2:25 Candidate B priority overwrite + coding selection
2:25-2:50 why Rolequiry is more than a ChatGPT answer
```

The public demo video follows this storyboard. Do not treat this document as the source of the video file itself.
