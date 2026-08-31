# WebMCP Proof Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Rolequiry's existing seven-tool WebMCP workflow works as a candidate-specific, auditable real-job investigation while hardening the browser policy and aligning the demo and documentation.

**Architecture:** Keep the existing case domain and seven tools unchanged unless a real model-facing evaluation exposes an ambiguity. Add only explicit origin-agent/permissions headers, portable evaluation artifacts, a two-candidate real-job rehearsal, and canonical documentation. Raw career context remains in the connected agent; Rolequiry continues to own only confirmed priorities, claims, evidence, uncertainty, and active-probe state.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5 strict mode, `use-webmcp-tool`, Vitest, Testing Library, Bun, Biome, Chrome 151 with the WebMCP Blink feature, and `agbrowse`.

**Spec:** `docs/superpowers/specs/2026-08-31-webmcp-proof-hardening-design.md`

## Global Constraints

- Apply `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` to every application route.
- Do not add COOP or COEP; WebMCP requires an origin-keyed agent cluster, not `crossOriginIsolated`.
- Preserve the existing seven WebMCP tools, state model, ranking, evidence authority, and UI.
- Raw resumes and candidate narratives remain in agent conversation and never enter Rolequiry storage.
- Priorities cross the write boundary only after explicit candidate confirmation.
- Unknown and neutral evidence remain unresolved; never force support/challenge or invent a source.
- Add no dependency, eval framework, eighth tool, database, account, fit score, standard MCP adapter, or new onboarding UI.
- Keep the manual UI as progressive enhancement and preserve desktop and narrow layouts.
- Keep repository publication, Devpost submission, and public video publication deferred until after code freeze.
- Never stage or modify `ChatGPT Image 2026년 8월 30일 오후 05_32_53 (1).png` or `RoleProbe_PRD_WebMCP_Challenge_v1.3.docx`.
- Use official OpenAI and Chrome pages as primary sources; Palantir is only the fallback if the OpenAI posting is unavailable.

Before executing any task, set the durable evidence directory once in every
shell that runs a plan command:

```bash
export EVIDENCE_DIR=/Users/kimhyoyeol/.codex/visualizations/2026/08/31/01a0563b-376a-7890-99e2-1e16282ba58d/rolequiry-ulw
mkdir -p "$EVIDENCE_DIR"
```

---

### Task 1: Make the WebMCP browser policy explicit

**Files:**
- Modify: `next.config.ts:1-7`

**Interfaces:**
- Consumes: Next.js `NextConfig.headers()` and the existing `/:path*` route matcher documented in `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`.
- Produces: every route returns `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` without changing page or tool code.

- [ ] **Step 1: Build the unchanged app for the failing-first HTTP scenario**

Run:

```bash
rm -rf .next
bun run build -- --webpack 2>&1 | tee "$EVIDENCE_DIR/runtime-red-build.txt"
```

Expected: build exits 0. This pins the unchanged artifact before the policy change.

- [ ] **Step 2: Start the unchanged production server and capture RED**

Run from the worktree:

```bash
(exec bun run start -- --hostname 127.0.0.1 --port 3210) >"$EVIDENCE_DIR/runtime-red-server.txt" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" >"$EVIDENCE_DIR/runtime-red-server.pid"
for attempt in {1..30}; do
  curl -fsS http://127.0.0.1:3210/case >/dev/null && break
  sleep 1
done
curl -sS -D "$EVIDENCE_DIR/runtime-red-case-headers.txt" -o /dev/null http://127.0.0.1:3210/case
curl -sS -D "$EVIDENCE_DIR/runtime-red-employer-headers.txt" -o /dev/null http://127.0.0.1:3210/employer/atlas-fde
set -o pipefail
bun -e '
const response = await fetch("http://127.0.0.1:3210/case");
const expected = new Map([
  ["origin-agent-cluster", "?1"],
  ["permissions-policy", "tools=(self)"],
]);
for (const [name, value] of expected) {
  if (response.headers.get(name) !== value) {
    throw new Error(`${name}: expected ${value}, received ${response.headers.get(name)}`);
  }
}
' 2>&1 | tee "$EVIDENCE_DIR/runtime-red-assertion.txt"
```

Expected: the Bun assertion exits non-zero because the two explicit response headers are absent. The build and routes themselves must remain healthy; a connection or build failure is not a valid RED.

- [ ] **Step 3: Tear down the RED server**

Run:

```bash
SERVER_PID=$(cat "$EVIDENCE_DIR/runtime-red-server.pid")
kill "$SERVER_PID"
wait "$SERVER_PID" 2>/dev/null || true
if lsof -nP -iTCP:3210 -sTCP:LISTEN; then
  exit 1
fi
```

Record the PID and empty port check in the task report.

- [ ] **Step 4: Add the minimal Next.js header configuration**

Replace the placeholder `nextConfig` body with:

```ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Origin-Agent-Cluster", value: "?1" },
          { key: "Permissions-Policy", value: "tools=(self)" },
        ],
      },
    ];
  },
};
```

Do not add COOP, COEP, constants, helpers, middleware, or a dependency.

- [ ] **Step 5: Rebuild and capture GREEN HTTP policy**

Run:

```bash
rm -rf .next
bun run build -- --webpack 2>&1 | tee "$EVIDENCE_DIR/runtime-green-build.txt"
(exec bun run start -- --hostname 127.0.0.1 --port 3210) >"$EVIDENCE_DIR/runtime-green-server.txt" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" >"$EVIDENCE_DIR/runtime-green-server.pid"
for attempt in {1..30}; do
  curl -fsS http://127.0.0.1:3210/case >/dev/null && break
  sleep 1
done
curl -sS -D "$EVIDENCE_DIR/runtime-green-case-headers.txt" -o /dev/null http://127.0.0.1:3210/case
curl -sS -D "$EVIDENCE_DIR/runtime-green-employer-headers.txt" -o /dev/null http://127.0.0.1:3210/employer/atlas-fde
set -o pipefail
bun -e '
const urls = [
  "http://127.0.0.1:3210/case",
  "http://127.0.0.1:3210/employer/atlas-fde",
];
const expected = new Map([
  ["origin-agent-cluster", "?1"],
  ["permissions-policy", "tools=(self)"],
]);
for (const url of urls) {
  const response = await fetch(url);
  for (const [name, value] of expected) {
    if (response.headers.get(name) !== value) {
      throw new Error(`${url} ${name}: expected ${value}, received ${response.headers.get(name)}`);
    }
  }
}
console.log("verified explicit WebMCP policy on both routes");
' 2>&1 | tee "$EVIDENCE_DIR/runtime-green-assertion.txt"
```

Expected: both curl captures contain the two exact headers and the assertion prints `verified explicit WebMCP policy on both routes` with exit 0.

- [ ] **Step 6: Prove WebMCP discovery in a real flagged Chrome**

With the GREEN production server still running, run:

```bash
CHROME_PROFILE=$(mktemp -d -t rolequiry-webmcp-chrome.XXXXXX)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --user-data-dir="$CHROME_PROFILE" \
  --remote-debugging-port=9334 \
  --enable-blink-features=WebMCP \
  --no-first-run \
  --no-default-browser-check \
  about:blank >"$EVIDENCE_DIR/runtime-green-chrome.txt" 2>&1 &
CHROME_PID=$!
echo "$CHROME_PID" >"$EVIDENCE_DIR/runtime-green-chrome.pid"
echo "$CHROME_PROFILE" >"$EVIDENCE_DIR/runtime-green-chrome-profile.txt"
for attempt in {1..30}; do
  curl -fsS http://127.0.0.1:9334/json/version >/dev/null && break
  sleep 1
done
CDP_PORT=9334 agbrowse navigate http://127.0.0.1:3210/case
CDP_PORT=9334 agbrowse wait-for-text "WebMCP 7/7 live" --timeout 30000
CDP_PORT=9334 agbrowse evaluate 'JSON.stringify({originAgentCluster: window.originAgentCluster, secureContext: window.isSecureContext, modelContext: typeof document.modelContext})' | tee "$EVIDENCE_DIR/runtime-green-webmcp-api.txt"
CDP_PORT=9334 agbrowse evaluate '(async () => (await document.modelContext.getTools()).map((tool) => tool.name).sort())()' | tee "$EVIDENCE_DIR/runtime-green-tool-list.txt"
CDP_PORT=9334 agbrowse console --clear --reload --duration 3000 | tee "$EVIDENCE_DIR/runtime-green-console.txt"
CDP_PORT=9334 agbrowse network --reload --duration 2000 | tee "$EVIDENCE_DIR/runtime-green-network.txt"
CDP_PORT=9334 agbrowse screenshot --json | tee "$EVIDENCE_DIR/runtime-green-screenshot.json"
```

Expected: `originAgentCluster` and `secureContext` are true, `modelContext` is `object`, and the sorted tool list is exactly:

```json
[
  "get_case_state",
  "get_role_claims",
  "import_role_from_claims",
  "record_interview_answer",
  "record_research_evidence",
  "select_decision_changer",
  "set_candidate_priorities"
]
```

Console must contain no application errors and network must contain no failed same-origin assets.

- [ ] **Step 7: Tear down every Task 1 runtime resource**

Run:

```bash
CHROME_PID=$(cat "$EVIDENCE_DIR/runtime-green-chrome.pid")
CHROME_PROFILE=$(cat "$EVIDENCE_DIR/runtime-green-chrome-profile.txt")
SERVER_PID=$(cat "$EVIDENCE_DIR/runtime-green-server.pid")
kill "$CHROME_PID" "$SERVER_PID"
wait "$CHROME_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true
rm -rf "$CHROME_PROFILE"
if lsof -nP -iTCP:3210 -sTCP:LISTEN || lsof -nP -iTCP:9334 -sTCP:LISTEN; then
  exit 1
fi
```

Record the PID values, profile path removal, and empty port checks.

- [ ] **Step 8: Verify and commit Task 1**

Run:

```bash
bun run typecheck
bun run lint next.config.ts
git add next.config.ts
git commit -m "fix: make WebMCP origin policy explicit"
```

Expected: typecheck and targeted lint exit 0; only `next.config.ts` is committed.

---

### Task 2: Add model-facing WebMCP journey evaluations

**Files:**
- Create: `docs/evals/webmcp-agent-journeys.json`
- Create: `docs/evals/webmcp-agent-journeys.md`
- Conditional only after an observed model failure: modify `lib/webmcp/contracts.ts`, `lib/webmcp/use-case-tools.ts`, and the smallest covering existing test.

**Interfaces:**
- Consumes: the seven current tool names/descriptions/schemas, Chrome's `messages` plus expected-call evaluation shape, `agbrowse web-ai`, and the real `/case` tool registry.
- Produces: six portable scenarios plus a dated result ledger that records model choice, call order, arguments, output reuse, UI result, environment, and full commit SHA.

- [ ] **Step 1: Create the portable scenario JSON**

Create this complete JSON dataset:

```json
{
  "schemaVersion": "rolequiry-webmcp-evals-v1",
  "source": "https://developer.chrome.com/docs/ai/webmcp/evals",
  "roleUrl": "https://openai.com/careers/forward-deployed-engineer-seoul-seoul-south-korea/",
  "toolNames": [
    "get_role_claims",
    "get_case_state",
    "select_decision_changer",
    "record_interview_answer",
    "import_role_from_claims",
    "record_research_evidence",
    "set_candidate_priorities"
  ],
  "scenarios": [
    {
      "id": "direct-import",
      "kind": "direct",
      "precondition": "Rolequiry is open with no imported OpenAI case.",
      "messages": [
        {
          "role": "user",
          "content": "Import the official OpenAI Forward Deployed Engineer, Seoul posting into Rolequiry as testable employer claims. Do not infer my priorities yet."
        }
      ],
      "expectedCalls": [
        {
          "turn": 1,
          "functionName": "import_role_from_claims"
        }
      ],
      "forbiddenCalls": [
        "set_candidate_priorities",
        "record_research_evidence",
        "record_interview_answer"
      ],
      "argumentRules": [
        "sourceUrl equals the official roleUrl",
        "claims contains 1 to 8 non-empty employer claims",
        "claims omit kind, coverage, status, unresolvedness, tension and ranking"
      ],
      "observablePass": [
        "case origin is AGENT_IMPORTED",
        "no priority is candidate-confirmed",
        "no probe is active"
      ]
    },
    {
      "id": "confirmation-gate",
      "kind": "ambiguous",
      "precondition": "The OpenAI case is imported and get_role_claims has returned the four claim IDs.",
      "messages": [
        {
          "role": "user",
          "content": "My travel ceiling is about 20 percent, technical authority matters, and I prefer hands-on work but can accept a flexible coding mix. Propose priorities first; do not write them until I confirm."
        },
        {
          "role": "user",
          "content": "I confirm: Travel CRITICAL, Hands-on coding MEDIUM, Technical authority HIGH, Concurrent deployments MEDIUM."
        }
      ],
      "expectedCalls": [
        {
          "turn": 2,
          "functionName": "set_candidate_priorities"
        }
      ],
      "forbiddenCalls": [
        "set_candidate_priorities on turn 1",
        "select_decision_changer before turn 2 confirmation"
      ],
      "argumentRules": [
        "priorities uses claim IDs returned by get_role_claims",
        "the four importance values exactly match the confirmed mapping",
        "no raw career narrative or rationale is included"
      ],
      "observablePass": [
        "all four controls show candidate-confirmed priorities",
        "activeProbeId remains null after the write"
      ]
    },
    {
      "id": "decision-routing",
      "kind": "direct",
      "precondition": "Candidate A priorities are confirmed and no probe is active.",
      "messages": [
        {
          "role": "user",
          "content": "Which uncertainty should change my decision next?"
        }
      ],
      "expectedCalls": [
        {
          "turn": 1,
          "functionName": "select_decision_changer"
        }
      ],
      "forbiddenCalls": [
        "record_research_evidence before selection",
        "an agent-invented research target"
      ],
      "argumentRules": [
        "the tool takes an empty object",
        "the returned claim_id, unresolved_variable and measurable_form become the sole research target"
      ],
      "observablePass": [
        "Travel is the active probe",
        "ranking becomes visible only after selection"
      ]
    },
    {
      "id": "research-discipline",
      "kind": "ambiguous",
      "precondition": "Travel is the active probe.",
      "messages": [
        {
          "role": "user",
          "content": "Research only the active Travel question. Attempt to find credible counterevidence. Record a source only if it resolves this claim; preserve uncertainty when it does not."
        }
      ],
      "expectedCalls": [
        {
          "turn": 1,
          "functionName": "record_research_evidence",
          "condition": "only when a credible claim-specific source exists"
        }
      ],
      "forbiddenCalls": [
        "researching a non-active claim",
        "record_interview_answer",
        "set_candidate_priorities",
        "recording arbitrary news or analyst commentary"
      ],
      "argumentRules": [
        "sourceKind is EMPLOYER_OFFICIAL or FIRST_PERSON_EXPERIENCE",
        "stance is NEUTRAL when material is mixed or non-resolving",
        "sourceUrl, sourceLabel and summary refer to the same source"
      ],
      "observablePass": [
        "evidence is attached only to Travel when recorded",
        "weak material is neutral or unrecorded",
        "unknown remains explicit"
      ]
    },
    {
      "id": "interview-continuity",
      "kind": "journey",
      "precondition": "One claim is active and the candidate supplies a real hiring-manager answer.",
      "messages": [
        {
          "role": "user",
          "content": "The hiring manager told me the team typically travels two weeks per quarter, with occasional longer launches. Record this answer against the question we are currently checking."
        }
      ],
      "expectedCalls": [
        {
          "turn": 1,
          "functionName": "record_interview_answer"
        }
      ],
      "forbiddenCalls": [
        "supplying claimId",
        "attaching the answer to a non-active claim",
        "fabricating an answer"
      ],
      "argumentRules": [
        "speakerRole is HIRING_MANAGER",
        "text preserves the candidate-provided substance",
        "stance reflects whether the answer supports, challenges or leaves the active claim neutral"
      ],
      "observablePass": [
        "only the active claim gains candidate-specific evidence",
        "selectionState becomes EVIDENCE_UPDATED"
      ]
    },
    {
      "id": "full-journey",
      "kind": "journey",
      "precondition": "Rolequiry starts from a fresh case tab and the official role page is available.",
      "messages": [
        {
          "role": "user",
          "content": "Use the official OpenAI Seoul FDE role and my 20 percent travel ceiling to build a Rolequiry case. Ask before writing priorities, investigate only the selected uncertainty, and finish with what I should verify next."
        },
        {
          "role": "user",
          "content": "I confirm the proposed mapping. Continue."
        }
      ],
      "expectedCalls": [
        {
          "sequence": 1,
          "functionName": "import_role_from_claims"
        },
        {
          "sequence": 2,
          "functionName": "get_role_claims"
        },
        {
          "sequence": 3,
          "functionName": "set_candidate_priorities",
          "condition": "after explicit confirmation"
        },
        {
          "sequence": 4,
          "functionName": "select_decision_changer"
        },
        {
          "sequence": 5,
          "functionName": "record_research_evidence",
          "condition": "only when credible evidence exists"
        },
        {
          "sequence": 6,
          "functionName": "get_case_state"
        }
      ],
      "forbiddenCalls": [
        "priority write before confirmation",
        "whole-company research",
        "fit score or join recommendation",
        "raw resume persistence"
      ],
      "argumentRules": [
        "later calls reuse claim IDs and active-probe output from earlier calls",
        "research stays inside the selected claim",
        "final guidance uses the measurable form or remaining unknown"
      ],
      "observablePass": [
        "the UI and tool outputs represent one shared case",
        "the final response distinguishes employer claim, evidence and unknown",
        "the final response gives a falsifiable verification question"
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate the JSON structure**

Run:

```bash
bun -e '
const path = "docs/evals/webmcp-agent-journeys.json";
const data = await Bun.file(path).json();
if (data.schemaVersion !== "rolequiry-webmcp-evals-v1") throw new Error("schemaVersion");
if (data.scenarios.length !== 6) throw new Error("scenario count");
const ids = new Set(data.scenarios.map((scenario) => scenario.id));
if (ids.size !== 6) throw new Error("duplicate scenario id");
for (const scenario of data.scenarios) {
  for (const key of ["messages", "expectedCalls", "forbiddenCalls", "argumentRules", "observablePass"]) {
    if (!Array.isArray(scenario[key])) throw new Error(`${scenario.id}.${key}`);
  }
}
console.log(`validated ${data.scenarios.length} WebMCP scenarios`);
' | tee "$EVIDENCE_DIR/evals-json-validation.txt"
```

Expected: `validated 6 WebMCP scenarios` and exit 0.

- [ ] **Step 3: Create the execution/result ledger**

`docs/evals/webmcp-agent-journeys.md` must contain:

- official Chrome eval rationale and the distinction between deterministic browser checks and probabilistic model checks;
- the exact Chrome command `--enable-blink-features=WebMCP` and `document.modelContext.getTools()` discovery check;
- the exact `agbrowse web-ai status --vendor chatgpt --json` preflight;
- one table with columns Scenario, Model surface, Commit SHA, Expected, Observed, Verdict, Evidence;
- a row for every scenario, filled from an actual run with no unfilled status cells;
- an explicit note that one model run is evidence, not a statistical guarantee;
- the raw-resume, confirmation, active-probe, neutral/unknown, and source-authenticity boundaries.

- [ ] **Step 4: Run the model-facing scenarios before changing tool contracts**

Run current CLI help/status first:

```bash
EVALUATED_SHA=$(git rev-parse HEAD)
echo "$EVALUATED_SHA" >"$EVIDENCE_DIR/model-evaluated-sha.txt"
agbrowse --help >"$EVIDENCE_DIR/agbrowse-help.txt"
agbrowse web-ai --help >"$EVIDENCE_DIR/web-ai-help.txt"
agbrowse web-ai status --vendor chatgpt --json | tee "$EVIDENCE_DIR/web-ai-status.json"
```

For each scenario, use a fresh ChatGPT web-ai query with the complete seven-tool descriptions and schemas supplied from `lib/webmcp/contracts.ts` and `lib/webmcp/use-case-tools.ts`. Require JSON-only output containing `calls`, `reusedOutputs`, and `finalAnswerPolicy`; use the scenario's user messages verbatim. Run these exact six isolated queries:

```bash
for scenario_id in \
  direct-import \
  confirmation-gate \
  decision-routing \
  research-discipline \
  interview-continuity \
  full-journey
do
  agbrowse web-ai query \
    --vendor chatgpt \
    --url https://chatgpt.com/ \
    --model thinking \
    --effort medium \
    --inline-only \
    --context-from-files "lib/webmcp/contracts.ts" \
    --context-from-files "lib/webmcp/use-case-tools.ts" \
    --context-from-files "docs/evals/webmcp-agent-journeys.json" \
    --context-transport upload \
    --prompt "Evaluate scenario ${scenario_id} exactly as defined in the attached dataset. Act as the agent that receives the listed WebMCP tools. Return JSON only with calls, reusedOutputs, finalAnswerPolicy, and no prose outside JSON." \
    --json >"$EVIDENCE_DIR/model-${scenario_id}.json"
done
```

The default new-tab behavior keeps each run isolated. Do not pass `--reuse-tab` or a prior session ID.

- [ ] **Step 5: Apply the eval-failure rule**

Compare actual calls to each scenario contract.

- If all six pass, do not modify TypeScript; record `Contracts unchanged: current model-facing journeys passed` in the ledger.
- If a scenario fails tool selection/order/arguments, first record the RED output. Change only the ambiguous tool description or affected property `description` in `lib/webmcp/contracts.ts` or `lib/webmcp/use-case-tools.ts`, keep each tool description under 500 characters and each parameter description under 150 characters, and add one structural test only when the changed value is machine-routed rather than prose. Rerun the failed scenario plus `full-journey` to GREEN, run the covering repository tests, and commit that code-only correction as `fix: clarify WebMCP tool routing`. Then set `EVALUATED_SHA=$(git rev-parse HEAD)`, overwrite `$EVIDENCE_DIR/model-evaluated-sha.txt`, and rerun all six scenarios so every ledger row covers the same code SHA.
- A provider login/capability failure is not a product RED. Record it as an environment blocker and run the same isolated expected-call prompt with the available supported ChatGPT/Gemini surface; do not invent a PASS.

- [ ] **Step 6: Prove deterministic current-page execution**

Against the flagged Chrome from Task 1, call `document.modelContext.getTools()` and `executeTool()` through `agbrowse evaluate` for this sequence:

```text
import_role_from_claims
get_role_claims
set_candidate_priorities
select_decision_changer
get_case_state
```

Use the four OpenAI demo dimensions and Candidate A mapping. Save the input/output transcript to `$EVIDENCE_DIR/deterministic-full-journey.json`. PASS only if all four UI controls reflect the confirmed mapping, no probe exists before selection, and Travel becomes active after selection.

- [ ] **Step 7: Verify and commit Task 2**

Run:

```bash
bun run test tests/import-and-evidence.test.ts tests/webmcp-registration.test.tsx
bun run typecheck
git add docs/evals/webmcp-agent-journeys.json docs/evals/webmcp-agent-journeys.md
git diff --cached --name-status
git commit -m "test: add WebMCP agent journey evals"
```

Before committing, verify this evidence commit contains only the two eval files. The ledger's `Evaluated code SHA` must equal `$EVALUATED_SHA`; any conditional TypeScript correction was committed separately in Step 5.

---

### Task 3: Turn the OpenAI rehearsal into a same-JD candidate comparison

**Files:**
- Modify: `docs/demo/openai-fde-seoul.md`

**Interfaces:**
- Consumes: the live official OpenAI Seoul FDE posting, the six-scenario eval contract, the existing four imported claim dimensions, and the seven WebMCP tools.
- Produces: one Candidate A full journey, one Candidate B comparison, a source preflight, exact confirmation boundaries, and an unpublished sub-three-minute storyboard.

- [ ] **Step 1: Preflight the real posting and evidence boundary**

Fetch the official role URL and save HTTP/final-URL/title evidence. Confirm the current posting still supports the four demo dimensions: travel, hands-on coding, technical authority, and concurrent deployment load. Search only official OpenAI pages and attributable first-person sources for the active Travel question.

If the posting is unavailable, use the official Palantir Seoul Forward Deployed Software Engineer URL and rewrite both candidate mappings around its claims. If the posting is available but no credible claim-specific evidence exists, keep OpenAI and make the research outcome `UNKNOWN`; do not switch roles merely to force an evidence write.

- [ ] **Step 2: Define Candidate A and its exact confirmation**

Candidate A remains clearly synthetic:

```text
Six years across backend and AI product engineering; some enterprise delivery;
no sustained high-travel role; travel ceiling about 20%; technical authority
matters; hands-on coding is preferred but the exact coding mix is flexible.
```

The exact confirmed mapping is:

```text
Travel concentration = CRITICAL
Hands-on coding share = MEDIUM
Technical decision authority = HIGH
Concurrent deployment load = MEDIUM
```

The document must say the agent proposes first and writes only after the candidate replies with this confirmation.

- [ ] **Step 3: Define Candidate B and the same-JD comparison**

Candidate B is also synthetic:

```text
Six years in solutions and platform engineering; frequent travel is acceptable;
the next role must keep sustained hands-on production coding; coordination is
acceptable only when it does not replace building.
```

The exact complete overwrite mapping is:

```text
Travel concentration = LOW
Hands-on coding share = CRITICAL
Technical decision authority = MEDIUM
Concurrent deployment load = MEDIUM
```

The document must instruct the agent to overwrite all four values before calling `select_decision_changer`, so Candidate A state cannot leak into the comparison. Expected active probes are Travel for A and Hands-on coding for B.

- [ ] **Step 4: Document one full agentic loop and one short comparison**

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

Candidate B starts from the same imported case, confirms the complete overwrite mapping, calls `set_candidate_priorities`, then `select_decision_changer`. The document must state that raw profiles stay in conversation, source identity is agent-reported, and unknown produces a measurable interview/offer question rather than a fit score.

- [ ] **Step 5: Add the unpublished recording storyboard**

Use these maximum timings:

```text
0:00-0:20 problem and thesis
0:20-0:50 Candidate A + real JD import
0:50-1:20 explicit confirmation + Travel selection
1:20-1:55 evidence/unknown + verification question
1:55-2:25 Candidate B priority overwrite + coding selection
2:25-2:50 why Rolequiry is more than a ChatGPT answer
```

Mark it `prepared, not published`. Do not create or upload a video.

- [ ] **Step 6: Execute the A/B surface proof**

Use flagged Chrome `document.modelContext.executeTool()` or the registered closures on `/case` to execute the exact two mappings. Save outputs and screenshots. PASS only if Candidate A selects the Travel claim ID, Candidate B selects the Hands-on coding claim ID, the IDs differ, and `get_case_state` contains no resume/profile or fit-score field.

- [ ] **Step 7: Commit Task 3**

Run a QA-by-read against every bullet above, then:

```bash
git add docs/demo/openai-fde-seoul.md
git commit -m "docs: add same-role candidate comparison"
```

Do not add sentence-presence tests for this human-facing prose.

---

### Task 4: Make README the canonical product story

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-30-agentic-candidate-due-diligence.md:1-12`

**Interfaces:**
- Consumes: the implemented seven-tool workflow, progressive-enhancement UI, new eval artifacts, and A/B rehearsal.
- Produces: one public-facing product narrative and one historical marker on the superseded plan.

- [ ] **Step 1: Lead README with the decision-quality distinction**

Immediately after `Interview the job before it interviews you.`, add:

```text
Most job tools ask, “Can I get hired?” Rolequiry asks, “If I get the offer,
should I join?”
```

Then explain in one compact paragraph that ChatGPT can analyze a JD, while Rolequiry owns durable, inspectable case state: confirmed priorities, employer claims, evidence/provenance, active uncertainty, and next verification.

- [ ] **Step 2: Clarify progressive enhancement and boundaries**

In `Why WebMCP` and the real-role loop:

- state that the manual controls remain a supported progressive-enhancement path sharing the same `CaseStore`;
- state that removing WebMCP removes the candidate-specific conversation-to-research loop, not the fallback UI;
- keep raw resumes in agent conversation and keep fit scoring out;
- state that the competition surface is page-native WebMCP, not a standard remote MCP server;
- link both `docs/evals/webmcp-agent-journeys.md` and `docs/demo/openai-fde-seoul.md`.

Do not add marketing claims about source verification, model superiority, or compatibility with clients that cannot see WebMCP.

- [ ] **Step 3: Mark the previous plan historical**

Add this block below the prior plan title:

```markdown
> **Status (2026-08-31): Historical.** The seven-tool candidate-priority
> workflow described here has shipped. Current proof hardening is tracked in
> `docs/superpowers/plans/2026-08-31-webmcp-proof-hardening.md`.
```

Do not rewrite its completed implementation as 35 checked boxes.

- [ ] **Step 4: Audit deferred/public and user-owned boundaries**

Run `git status --short` in both the feature worktree and main checkout. The feature diff must not publish a repository, create submission metadata, include a video URL, or contain the untracked DOCX/PNG.

- [ ] **Step 5: Commit Task 4**

Run a QA-by-read against the spec, then:

```bash
git add README.md docs/superpowers/plans/2026-08-30-agentic-candidate-due-diligence.md
git commit -m "docs: sharpen the Rolequiry decision story"
```

Do not add prose snapshot or grep tests.

---

## Final Integrated Verification

After all four task reviews are clean:

1. Run the TypeScript no-excuse audit on any changed `.ts`/`.tsx` file, LSP diagnostics, `bun run test`, `bun run typecheck`, `bun run lint`, and `bun run build -- --webpack`.
2. Remove only `.next` and rerun `bun run build` once to characterize the external-volume Turbopack persistence path. A repeat of the pre-existing persistence database error is reported separately and does not erase a green webpack production build; any other build error blocks completion.
3. Start the final webpack artifact on port 3210 and repeat the exact header, flagged-Chrome discovery, deterministic full journey, desktop 1440x900, and narrow 390x844 scenarios.
4. At desktop width, set `Candidate priority for Travel` to `CRITICAL`, activate `Rank next question`, and require the Decision Path to show Travel. At narrow width, require `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
5. Save final console/network output and screenshots, then kill the server/Chrome processes, remove the temporary Chrome profile, and verify ports 3210/9334 are empty.
6. Compare the ledger's evaluated code SHA with the latest runtime/tool-contract commit. Documentation-only commits may follow it. If any later commit changed `next.config.ts`, `lib/webmcp/`, or the tool-registration path, rerun all six model scenarios and add a new evidence-only ledger commit before final review.
7. Run the HEAVY whole-branch review against the merge-base package. Resolve every criterion-cited blocker, rerun only affected scenarios, then rerun the full set once at the reviewed SHA.
