# OpenAI Seoul FDE real-job rehearsal

This is a repeatable WebMCP demonstration, not a saved candidate profile or a claim that the role is a good fit.

## Source and setup

- Official job page: https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/
- Verified against the public page on 2026-08-30.
- Open `https://rolequiry.com/case` in a browser that exposes the page's WebMCP tools.
- Confirm that the product bar reports `WebMCP 7/7 live`.

Do not copy the full JD into this repository. The current page provides four useful decision variables for this rehearsal: expected travel, the balance between hands-on coding and coordination, where technical authority sits, and the load created by multiple concurrent deployments.

## Synthetic candidate

The candidate below is fictional and exists only to make the workflow reproducible.

- Six years across backend engineering and AI product engineering.
- Some customer-facing enterprise delivery, but no sustained high-travel role.
- Strong preference for hands-on building over primarily coordinating delivery.
- Values clear technical authority and enough focus to ship production systems well.
- Comfortable with travel up to roughly 20%, below the posting's stated 50% expectation.

The raw candidate narrative remains in agent conversation context. Rolequiry should receive only extracted employer claims and importance values the candidate explicitly confirms.

## Opening prompt

> Here is my career context and this JD. Put the role into Rolequiry, identify the decision variables that matter specifically to me, and ask me to confirm priorities before writing them.

Provide the synthetic candidate bullets above and the official URL with that prompt.

The agent should browse the source, call `import_role_from_claims`, and propose a priority mapping. It must stop for confirmation before writing priorities. A useful import contains no more than these four concise claim dimensions:

1. Travel concentration
2. Hands-on coding share
3. Technical decision authority
4. Concurrent deployment load

Exact claim wording may vary with the agent. Do not pass claim kind, status, coverage, tension, ranking, a resume, or a fit rationale into Rolequiry.

## Candidate confirmation

Reply exactly:

> Travel is CRITICAL. Hands-on coding and technical authority are HIGH. Concurrent deployments are MEDIUM.

The agent should map this confirmation to the imported claim IDs and call `set_candidate_priorities`. Check that all four controls update in the UI and that no card is active yet. Priority writing and probe selection are deliberately separate operations.

## Expected tool order

```text
import_role_from_claims
get_role_claims
set_candidate_priorities
select_decision_changer
record_research_evidence
select_decision_changer
```

After confirmation, ask:

> Which uncertainty should change my decision next?

Travel should become the active probe because it is candidate-confirmed as CRITICAL and remains unresolved. Then ask:

> Research only this active question. Make a reasonable attempt to find counterevidence, record one source you can cite, and preserve uncertainty when the evidence is mixed or non-resolving.

The agent uses its own browsing capability. It should record one relevant public employer-published or first-person source, not perform an open-ended company survey. A source label and source kind are agent-reported capture metadata; Rolequiry does not authenticate the source identity or page contents.

## Observable checkpoints

- Product bar: `WebMCP 7/7 live`.
- Dossier header: OpenAI role plus the agent-reported original posting link.
- Claim Board: all four candidate-confirmed priority controls update without a reload.
- Claim Board: Travel has the `Active probe` highlight only after selection.
- Evidence drawer: the recorded source has URL, stance, kind, and agent-reported provenance.
- Decision Path: evidence changes the live case while still showing what remains unknown.
- After evidence: the path asks the user to `Check again`; it does not silently jump to another probe.
- Final interview question is measurable, for example: `Across the last two quarters, what were the median and maximum travel days per FDE, and how concentrated were those days across weeks?`

## What this proves

The connected agent can interpret career context, inspect a real JD, research an active uncertainty, and explain candidate-specific hypotheses. Rolequiry supplies the auditable shared state: employer claims, candidate-confirmed importance, typed evidence provenance, deterministic ranking, and a falsifiable next question.

This rehearsal does not prove source authenticity, calculate an objective fit score, store the resume, run general company deep research, expose a remote MCP server, or work in a client that cannot see page-native WebMCP tools.
