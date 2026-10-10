# M1 simulated user session

Plan tasks P9.14 (lightweight simulated user session) and P8.17 (documentation examples executed as written). This is the M1 session described in `~/Code/Agents/requirements/SIMULATED_USER_TESTING.md`: a lighter pass than the full pre-1.0 session. It answers one question. If a new operator, who has just deployed Garrison and wants to put agents to work, sits down with the dashboard, the docs, and an SDK, what do they trip over?

Nothing was fixed during the session. No doc command was wrong enough to block progress, so no doc was edited. Findings are listed for the user to triage before any fix starts, as P9.14 requires.

## Environment

| Item | Value |
|---|---|
| Date | 2026-10-10, 15:05 to 15:30 UTC |
| Commit | `a216a9600464447da3ca49764c8fe2e2bb2f9f95`, working tree clean at start |
| Host | macOS (Darwin 25.6), Apple silicon, zsh, Node 24.21, Python 3.14.8, Playwright Chromium 1248 |
| Stack | The existing K3S deployment (namespace `garrison`): `garrison-server` x1, `garrison-worker-0` and `-1`, dashboard, `garrison-postgres-0` |
| Images | server `sha256:0c99ba2b...`, worker `sha256:0ee90cc2...`, dashboard `sha256:27d5d1b6...` |
| URLs | Dashboard http://127.0.0.1:8081 (operator port-forward, not the documented 8080), REST and A2A http://127.0.0.1:8700, MCP http://127.0.0.1:8701/mcp |
| Sign-in | tenant `default`, `admin@garrison` / `password` |
| Agents present | `claude-helper` (Claude Code, may delegate), `codex-coder` (Codex), `mux-helper` (Mux, `gpt-oss:20b`), `smoke-echo` (fake harness) |
| Settings changed | `Audit.RetentionDays` set to 366, then -5 (stored as 1), then back to 365, within about 10 seconds |

Deviation from the requirements: the requirements ask for a fresh, isolated instance. This session used the existing live deployment on purpose, as the task asked, so install paths are not covered here. They were covered by P8.18 to P8.22 (`docs/testing/NEW_USER_REVIEW.md`).

Evidence (screenshots, exported charts, raw request and response captures, scripts) is in the session scratch area and is not committed:

- Dashboard: `/private/tmp/claude-501/-Users-joelchristner-Code/c3c5b8dd-2eca-45a3-987f-4b1330ddbc66/scratchpad/ui/shots/` (screenshot names are given below as `shots/<name>.png`)
- Documentation examples: `.../scratchpad/p817/` (`p817_results.md`, `rest_out.txt`, `mcp_out.txt`, `sse.txt`, `validate.txt`, `rest.sh`, `mcp.py`)
- SDK: `.../scratchpad/sdk/` (`sdk_results.md`, the venv project in `proj/`)

## Personas

| Persona | Knows | Goal | Surfaces |
|---|---|---|---|
| **Platform engineer evaluating Garrison** (Dana) | The README and the dashboard | Understand agents and deployments from the UI alone, create an agent with its own system prompt, run it, read its telemetry, follow a delegation, compare harnesses in Analytics, change a setting | Dashboard (Playwright, Chromium, 1440x900 plus 390x844), one language switch |
| **Agent developer** (Sam) | `sdk/python/README.md` | Call Garrison from Python: sign in, invoke, stream, read metrics, handle errors | Python SDK in a fresh venv outside the repository |
| **Integrating developer** (Ira) | README, `docs/QUICKSTART.md`, `REST_API.md`, `MCP_API.md`, `A2A_API.md` | Paste the documented examples and check that each does what the doc says | curl, jq, a small Python MCP client |

## Summary

- **Findings:** 33 in total. None are blockers, 2 are major, 17 are minor, and 14 are polish. By category: 4 bug, 10 docs, 18 UX (3 of them are questions for the user), and 1 i18n.
- **What matters most:**
  1. M1-01: Settings accepts an out-of-range value, reports "Settings saved and applied", and silently stores a clamped value. `-5` became a 1-day audit retention.
  2. M1-02: Filtering Analytics by a model name with a colon (`gpt-oss:20b`) shows no runs, in the dashboard and in the SDK.
  3. M1-03: The deployment wizard binds both the System and the Task role to whichever template is newest, of any kind, unless the user changes them.
- **Core journeys:** every one was completed with no workaround needed. The dashboard explains agents and deployments well. Creating a template, an agent, and a deployment through the forms, invoking, streaming, the run telemetry, the delegated child run, chart export, a settings change, and cleanup all worked the first time.
- **P8.17:** about 80 documentation examples were run: 4 README, 18 QUICKSTART, about 48 REST, 19 MCP, and 20 A2A calls. 4 failed against the docs: 2 status-code mismatches, 1 nonexistent tenant returning 200, and the zsh `$RANDOM` messageId problem. 3 were not run, each with a reason. `examples/validate.sh` passed 25 of 25 checks.
- **SDK:** the Python quick start works once the package is installed from the folder. `pip install garrison-sdk` fails because the package is not published, and the first example uses keys a Kubernetes user has no documented way to find.

## Timings

| Journey step | Time |
|---|---|
| Sign in to Home rendered | 0.7 s |
| Any hub page (Agents, Runs, Analytics, Fleet, Access, Monitoring) to network idle | 0.55 to 0.7 s; tab switches 20 to 70 ms |
| Clone a template, edit, save a new version | Save 1.5 s (includes the toast wait) |
| Create an agent (form) | 1.5 s |
| Create a deployment (6-step wizard) | 1.5 s to save; about 2 minutes of reading for a first-timer |
| Invoke `m1-terse` (Claude Code) from Invoke to the result | 2.3 s execution, TTFT 1.83 s, queue 2 ms |
| Delegated run `claude-helper` to `codex-coder` | Parent 11.8 s, child 7.2 s |
| Analytics export PNG, CSV, SVG | Immediate |
| Python SDK: install from the folder | 3 s |
| Python SDK: first successful login and invoke | 0.14 s |
| QUICKSTART steps 0 to 8, existing stack | About 6 minutes, including `validate.sh` (41 s) |

Nothing a user would call slow was seen. The only waits were the model calls themselves.

## Coverage

| Surface | Item | Persona | Status |
|---|---|---|---|
| Dashboard | Sign-in, Home KPIs, API activity chart, worker cards, common tasks | Dana | Covered |
| Dashboard | Agents hub: Agents list, Add agent form (valid and invalid name), row actions, delete | Dana | Covered |
| Dashboard | Agents hub: Deployments list, 6-step create wizard, delete cascade | Dana | Covered |
| Dashboard | Configuration: Harness Profiles list, Prompt Templates list, detail, clone, edit, versions, live preview, delete (bound and unbound) | Dana | Covered |
| Dashboard | Configuration: MCP Servers, Secrets, Workspaces, Artifact Stores, Manifests tabs | | Not covered (time box; QUICKSTART exercised secrets and manifests over REST) |
| Dashboard | Invoke: agent and deployment pickers, send, live transcript, Open run | Dana | Covered |
| Dashboard | Runs list, filters visible, run detail, telemetry, transcript, child runs, retry, View JSON | Dana | Covered (retry probed only on a deleted agent's run) |
| Dashboard | Analytics: range, filters, group by harness and model, data table, export PNG, CSV, SVG | Dana | Covered |
| Dashboard | System: Settings (edit, invalid value, revert), Server Info | Dana | Settings covered; Server Info opened only |
| Dashboard | Fleet, Access, Monitoring hubs and every tab | Dana | Load and error check only |
| Dashboard | Setup wizard, Guided tour | | Not covered (time box) |
| Dashboard | Language switch (Deutsch), dark theme, 390 px width | Dana | Covered on 6 pages, run detail, and 3 pages |
| Dashboard | Keyboard-only navigation, restricted user | | Not covered (lighter M1 session) |
| SDK | Python README quick start, streaming, metrics, analytics, manifests, errors, test harness | Sam | Covered |
| SDK | JavaScript, C#, Go | | Not covered (one SDK per the plan task) |
| Docs | README curl examples | Ira | Covered |
| Docs | QUICKSTART steps that apply to an existing stack (0 to 8, cleanup) | Ira | Covered; dashboard steps covered by Dana |
| Docs | REST_API.md sample (about 48 calls) | Ira | Covered |
| Docs | MCP_API.md (19 calls) | Ira | Covered except `claude mcp add` (would change the user's own Claude Code config) |
| Docs | A2A_API.md (20 calls) | Ira | Covered |
| Docs | Postman collection | | Not rerun (P9.13 ran it against this cluster) |
| Operations | Restart, update, factory reset, degraded dependencies | | Not covered (the task forbids restarting the shared cluster) |

## Dashboard walkthrough (Dana)

1. **First screen.** Home shows real numbers: 4 agents, 4 deployments, 2/2 nodes ready, 52 succeeded runs. There is an API activity chart and a "Common tasks" list. It is clear what to do next. One wrong note: the "External services" card advertises Grafana and Prometheus that do not exist on this deployment (M1-05). `shots/02-home.png`
2. **What are agents and deployments?** The Agents hub opens with a diagram (Caller, Agent, Deployment A weight 300, Deployment B weight 100, Run) and three short paragraphs. They answer the question with no need for the docs: the agent is the identity, the deployment is how it runs, and traffic is split by weight. Configuration explains harness profiles and prompt templates the same way. This works well. `shots/03-agents.png`, `shots/04-config.png`
3. **A second Claude agent with its own system prompt.** Dana opened `builtin/default-system` and pressed Clone. The clone is created at once as `default-system-custom`, with no prompt for a name, and the name is locked from then on (M1-07). She edited the content ("Answer every request in one short line, prefixed with TERSE:"). The live preview updated, and Save created v2. `shots/07-view-default-system.png`, `shots/08-clone-dialog.png`, `shots/09-template-edited-preview.png`, `shots/10-template-saved.png`
4. **Agent.** "Add agent" opens a clear modal. An invalid name (`M1 Terse!`) is refused with "Use lowercase letters, digits, and hyphens, starting and ending with a letter or digit." `m1-terse` was created. `shots/11-add-agent-form.png`, `shots/12-agent-invalid-name.png`, `shots/13-agent-created.png`
5. **Deployment.** The 6-step wizard (Basics, Harness, Prompts, Resources, Overrides, Placement and limits) is understandable. Two defaults set traps (M1-03, M1-04). To learn that a Claude deployment needs a Secret bound under alias `anthropic`, Dana had to look at the existing `claude-helper-default` deployment. The wizard does not say which alias the claude-code profile expects. The deployment saved correctly, and the server added the `DelegatedTask` binding by itself. `shots/14-add-deployment-form.png`, `shots/15-dep-step2.png` to `shots/15-dep-step6.png`, `shots/16-dep-prompts-filled.png`, `shots/17-dep-resource-item.png`, `shots/19-dep-created.png`
6. **Invoke.** Dana picked M1 Terse, asked "What is the capital of France?", and got `TERSE: Paris.` in 2.3 s. The transcript streamed in place (lifecycle, assistant, usage, result, exit). The custom system prompt clearly took effect. `shots/21-invoke-streaming.png`, `shots/22-invoke-done.png`
7. **Find the run.** The Runs list showed the run with agent, harness, node, TTFT, duration, tokens, and cost. The detail page has a telemetry bar, 15 metrics, the transcript with filters, and Result, Input, Stderr, and Child runs tabs. The deployment appears as a truncated ID (M1-20). The template versions the run used are recorded in the API but not shown (M1-23). `shots/23-runs.png`, `shots/24-run-detail.png`
8. **Delegated run tree.** Dana asked `claude-helper` to have `codex-coder` write a string-reversal expression. The parent transcript shows the `garrison_invoke_agent` tool call and its result. The Child runs (1) tab links to the Codex run (depth 1, caller "agent claude-helper", parent link back), which answered `s[::-1]`. The parent's telemetry reads oddly for a run that spent its time waiting on a tool (M1-08). `shots/26-delegate-parent.png`, `shots/27-delegate-child-runs.png`, `shots/28-delegate-child.png`
9. **Analytics.** The KPIs, the explanation card, and 9 charts are clear. Group by Harness and by Model work, and the data table and exports (PNG 2228x996, CSV, SVG) are good. The model filter fails for `gpt-oss:20b` (M1-02). Legends say `ClaudeCode` (M1-24). `shots/29-analytics.png`, `shots/30-analytics-by-harness.png`, `shots/31-analytics-by-model.png`, `shots/32-analytics-datatable.png`, `shots/33-analytics-model-filter-colon.png`, `shots/export-garrison_analytics-ttft_day_groupby-harness.{png,csv,svg}`
10. **Settings.** System > Settings labels each value by where it comes from (ConfigMap, Environment, editable) and whether it needs a restart. That is very helpful on Kubernetes. Changing `Audit.RetentionDays` to 366 saved and survived a reload. Entering `-5` exposed M1-01. The value was restored to 365. `shots/35-settings.png`, `shots/36-setting-saved.png`, `shots/37-setting-invalid.png`, `shots/38-setting-reverted.png`
11. **Deutsch.** Home, Agents, run detail, Analytics, Invoke, and System were checked. The translation is complete and natural, with German number and date formats (`11,78 s`, `10.10.2026, 08:13`, `0,0176 $`). Only text generated by the server stays in English (M1-24). `shots/39-de-home.png` to `shots/44-de-system.png`
12. **Dark theme and phone width.** Dark theme is legible. At 390 px, Runs, Analytics, and Deployments have no horizontal page overflow. `shots/45-mobile-runs.png`, `shots/46-mobile-analytics.png`, `shots/47-mobile-deployments.png`, `shots/48-dark-run.png`
13. **Cleanup through the dashboard.** Deleting the template while it was still bound was refused with a clear toast ("used by deployment(s) m1-terse-claude"), although the confirmation text had said something else (M1-21). Deleting the agent also deleted its deployment, without saying so first (M1-06). Then the template was deleted. Retry on the deleted agent's old run said "The record was not found." (M1-22). The API confirmed that nothing named `m1-*` or `*-custom` remains. `shots/49-delete-template-bound.png`, `shots/50-delete-agent-with-deployment.png`, `shots/51-run-of-deleted-agent.png`, `shots/52-retry-deleted-agent.png`
14. **Other hubs.** Fleet (Nodes, Node Pools), Access (Tenants, Users, Credentials, Roles, Assignments), and Monitoring (Request History, Audit, API Explorer) each loaded in about 0.55 s, with no error banners and no console errors. `shots/53-fleet.png`, `shots/53-access.png`

## SDK quick start (Sam, Python)

Sam followed `sdk/python/README.md` literally in a fresh venv outside the repository.

- `pip install garrison-sdk` fails (M1-19). `pip install -e .` from `sdk/python` worked in 3 s.
- The quick start's `login_with_keys("access_...", "secret_...")` did not work at first: a Kubernetes user has no documented way to find those keys (M1-17). `login("admin@garrison", "password")` worked.
- These work as written: streaming (8 events, 1.1 s), run metrics, analytics with `group_by`, the `from_ >= to` error, manifest dry run, `wait_for_completion`, `events`, and `list`. One real model call (`mux-helper`, "Reply with OK") answered `OK` in 9.4 s.
- Bad password, bad tenant, unknown agent, and unknown run all raise `GarrisonError` with the server's code, message, and requestId. This is good.
- `analytics.runs(model="gpt-oss:20b")` returns 0 runs (M1-02).
- The test harness command, run as written against Kubernetes, gives 18 cascading failures (M1-18). With the cluster's keys it passes 18 of 18.

Full table: `.../scratchpad/sdk/sdk_results.md`.

## Documentation examples (Ira, P8.17)

All results are listed below, with the exact difference for each failure. The raw table with all 80 rows is in `.../scratchpad/p817/p817_results.md`.

| Doc | Run | Pass | Fail against the doc | Not run |
|---|---|---|---|---|
| README | 4 (token, nodes, `/openapi.json`, admin API key via `docs/KUBERNETES.md`) | 4 | 0 | 0 |
| QUICKSTART | 18 steps (0 to 8, failure and cleanup sections) | 17 | 1: A2A messageId repeats under zsh (M1-09) | 1: dashboard steps, covered by Dana |
| REST_API.md | About 48 calls | 44 | 3: `DELETE /v1.0/token` returns 200 `{"valid":false}` where the doc says 204; `POST /runs` with `wait:false` returns 202 where the doc says 201 (M1-11); `/tenants/nope/agents` returns 200 and an empty list (M1-13). The `POST /runs` example fails as written because its agent `helper` has no deployment (M1-26) | 1: `DELETE /runs` with no filter (M1-15) |
| MCP_API.md | 19 calls | 19 (3 with notes: M1-12, M1-29, M1-30) | 0 | 1: `claude mcp add` |
| A2A_API.md | 20 calls | 20 (2 with notes: M1-10, M1-16) | 0 | 0 |
| `examples/validate.sh` | 1 | 25 of 25 checks passed in 41 s | Sample output in the doc says 30 (M1-25) | |

Created and removed by Ira: secrets `claude-credential`, `codex-credential`, and `mux-credential`; agents `planner`, `coder`, `echo`, and `researcher` with their deployments; and REST samples `helper` and `anthropic-api-key`. Sam's test harness created and removed its own `sdk-py-*` agent. Their runs remain in run history.

## Findings

Severity is blocker, major, minor, or polish. Category is bug, docs, UX, i18n, or performance. "Question" marks behavior that may be intended; the user decides.

### Major

#### M1-01: Settings saves an out-of-range value as a clamped one and says it was applied

- **Severity:** major. **Category:** bug. **Surface:** Dashboard (System > Settings), probably the settings REST route behind it.
- **Oracle:** SIMULATED_USER_TESTING (invalid input is rejected with a message that says how to fix it, never accepted silently). A retention of 1 day can also lead to data loss.
- **Steps:**
  1. System > Settings, set `Audit.RetentionDays` to `-5`.
  2. Save.
  3. Reload the page.
- **Expected:** a validation error naming the field and the allowed range, and nothing saved.
- **Actual:** the toast says "Settings saved and applied." After a reload the field reads `1`, so the value was clamped to the minimum and applied live. If the leader's maintenance pass runs before someone notices, it can purge every audit record older than a day. The editable `Runs.RetentionDays`, `Runs.EventRetentionDays`, `RequestHistory.RetentionDays`, and scheduling timings probably behave the same (not checked). On this stack the value was restored within about 10 seconds, and the stack is only 13 hours old, so nothing was old enough to be purged.
- **Evidence:** `shots/37-setting-invalid.png`
- **Suggested direction:** reject out-of-range values with a field error, both in the form and on the server.

#### M1-02: The Analytics model filter returns no runs for a model name with a colon

- **Severity:** major. **Category:** bug. **Surface:** Dashboard Analytics, REST, Python SDK (and probably every SDK).
- **Oracle:** another surface: grouping by model shows the runs, and the same filter left unencoded finds them.
- **Steps:**
  1. Open Analytics, set Model to `gpt-oss:20b`. The dashboard sends `model=gpt-oss%3A20b`.
  2. Or, in Python: `client.analytics.runs(from_=..., to=..., model="gpt-oss:20b")`.
- **Expected:** the Mux runs (13 in the SDK check).
- **Actual:** the dashboard shows "No runs in this range" and the SDK returns 0. `model=gpt-oss:20b` sent unencoded returns 13, so the server apparently compares the value while it is still percent-encoded. Every Ollama-style name (`llama3:8b`, `qwen3:32b`) is affected. Other query parameters with reserved characters may share the cause.
- **Evidence:** `shots/33-analytics-model-filter-colon.png`, `.../scratchpad/sdk/sdk_results.md`

### Minor

#### M1-03: The deployment wizard binds System and Task to whichever template is newest

- **Severity:** minor. **Category:** UX. **Surface:** Dashboard, Agents > Deployments > create, step 3 (Prompts).
- **Oracle:** convention, and the product's own model (Task templates and System templates are separate kinds).
- **Steps:**
  1. Create any template, or clone one.
  2. Start a new deployment and go to Prompts.
- **Expected:** System preset to `builtin/default-system` and Task to `builtin/default-task`, or each list filtered to templates of the matching kind.
- **Actual:** both rows are preset to the first template in the list, which is the newest of any kind (here `default-system-custom`). The lists also offer all 22 templates, including tool descriptions and config files. A user who accepts the defaults sends a system prompt as the task wrapper, and the caller's message is lost.
- **Evidence:** `shots/15-dep-step3.png`

#### M1-04: A new resource binding defaults Kind to "MCP server" with a Secret selected

- **Severity:** minor. **Category:** UX (possible bug). **Surface:** Dashboard, deployment wizard step 4 (Resources).
- **Steps:**
  1. In step 4, press Add item.
- **Expected:** the resource list matches the selected kind, or Kind defaults to Secret when no MCP servers exist.
- **Actual:** Kind shows "MCP server", while the Resource list contains only secrets, with `Secret: mux-credential` preselected. Saving as is would bind a secret as an MCP server. It was not saved, so it is unknown whether the server rejects it. The step also does not say which alias the chosen harness profile expects (for example `anthropic` for claude-code). Dana had to read an existing deployment to find out.
- **Evidence:** `shots/17-dep-resource-item.png`

#### M1-05: Home advertises Grafana and Prometheus that are not deployed

- **Severity:** minor. **Category:** bug. **Surface:** Dashboard Home, "External services".
- **Oracle:** the product contradicts itself; CLAUDE.md (loopback is always `127.0.0.1`, never `localhost`).
- **Steps:**
  1. Sign in to the Kubernetes deployment and scroll Home.
- **Expected:** the card appears only when those services exist, with working URLs.
- **Actual:** links to `http://localhost:3000` (Grafana, "Default credentials: admin / admin") and `http://localhost:9090` (Prometheus). Neither exists in namespace `garrison`, and both URLs refuse connections. The card also uses `localhost`.
- **Evidence:** `shots/02-home.png`, `kubectl -n garrison get svc` (no Grafana or Prometheus)

#### M1-06: Deleting an agent also deletes its deployments without saying so first

- **Severity:** minor. **Category:** UX. **Surface:** Dashboard Agents, REST.
- **Oracle:** SIMULATED_USER_TESTING (destructive actions say what they will destroy).
- **Steps:**
  1. Agents, row menu of an agent with a deployment, Delete.
- **Expected:** "Delete m1-terse and its 1 deployment (m1-terse-claude)?"
- **Actual:** "Delete "m1-terse"? This cannot be undone." The deployment disappears too (REST reports `cascaded: 1`).
- **Evidence:** `shots/50-delete-agent-with-deployment.png`

#### M1-07: Cloning a template does not ask for a name, and the name cannot be changed later

- **Severity:** minor. **Category:** UX. **Surface:** Dashboard prompt template detail.
- **Steps:**
  1. Open `builtin/default-system`.
  2. Press Clone.
  3. Try to rename the copy.
- **Expected:** the user names the copy when cloning, or can rename it before first use.
- **Actual:** a template named `default-system-custom` is created immediately. Its Name field is disabled from then on. A second clone of the same template was not tried, so it is unknown whether it collides. The row menu on the template list also offers only View and View JSON, not Clone.
- **Evidence:** `shots/06-template-actions.png`, `shots/08-clone-dialog.png`

#### M1-08: Telemetry for a run that delegates or calls tools reads oddly (question)

- **Severity:** minor. **Category:** UX (question). **Surface:** Dashboard run detail, Analytics, REST run metrics.
- **Steps:**
  1. Open the parent run `run_mv2japhm_gq5wHisfcKbYtGdLsIf` (`claude-helper` delegating to `codex-coder`).
- **Expected:** the first tool call counts as the model's first output, or the bar shows tool time separately.
- **Actual:** TTFT is 11.74 s of an 11.78 s run, because the 7 s spent waiting on the child run counts as "startup". Streaming time is 0 ms, and output tokens per second is n/a despite 214 output tokens. Averages in Analytics will make delegating agents look like slow starters. The definitions match the Analytics explanation card, so this may be intended.
- **Evidence:** `shots/26-delegate-parent.png`, `shots/48-dark-run.png`

#### M1-09: The QUICKSTART A2A example repeats its messageId under zsh

- **Severity:** minor. **Category:** docs. **Surface:** `docs/QUICKSTART.md` step 4.
- **Steps:**
  1. In macOS Terminal (zsh), run the A2A `SendMessage` example twice, changing the text.
- **Expected:** two tasks.
- **Actual:** `"messageId":"qs-'$RANDOM'"` sits on the left of a pipe, so zsh evaluates it in a subshell, where `$RANDOM` gives the same value each time. The second call silently returns the first task's answer. See M1-10.
- **Suggested direction:** `$(uuidgen)` in the example.

#### M1-10: An A2A messageId reused with different text quietly returns the old task (question)

- **Severity:** minor. **Category:** UX (question). **Surface:** A2A.
- **Steps:**
  1. SendMessage with messageId X and text "first".
  2. Send again with messageId X and text "second".
- **Expected:** a new task, or an error that the id was already used with different content.
- **Actual:** the same task (`Echo: first`). This matches `A2A_API.md`, but together with M1-09 it hides mistakes.

#### M1-11: Two REST routes return a different status than documented

- **Severity:** minor. **Category:** docs (or bug). **Surface:** REST.
- **Actual:**
  - `DELETE /v1.0/token` returns 200 `{"valid":false}`. The doc says 204.
  - `POST /v1.0/api/tenants/{t}/runs` with `wait:false` returns 202 `Queued`. The doc says 201. The invoke route documents 202 for the same case, so the docs are probably what is wrong.

#### M1-12: MCP and A2A run summaries do not include the served model

- **Severity:** minor. **Category:** UX. **Surface:** MCP `garrison_invoke_agent` and `garrison_get_run` results, A2A metadata, `examples/validate.sh`.
- **Oracle:** another surface (REST runs carry `servedModel`), and the README's point about models that are quietly substituted.
- **Actual:** no `servedModel` field, so `validate.sh` prints `model -` for MCP runs.

#### M1-13: A nonexistent tenant in the path returns 200 and an empty list

- **Severity:** minor. **Category:** bug. **Surface:** REST.
- **Steps:**
  1. As `admin@garrison`, `GET /v1.0/api/tenants/nope/agents`.
- **Expected:** 404, tenant not found.
- **Actual:** 200, `totalRecords: 0`. A typo looks like an empty tenant.

#### M1-14: A manifest dry run does not say what would change

- **Severity:** minor. **Category:** UX. **Surface:** REST, SDKs, `docs/QUICKSTART.md` step 2.
- **Actual:** every item reports `Validated` with the message "Would be created." even for items that the real apply reports as `Unchanged`. `createdCount` is 0, and a new item gets a `resourceId` for a record that does not exist. The QUICKSTART does not say what the dry run prints.

#### M1-15: The `DELETE /runs` example deletes every finished run

- **Severity:** minor. **Category:** docs. **Surface:** `REST_API.md`.
- **Actual:** the text says "Delete finished runs matching a filter", but the example has no filter and no warning, and the filters are not listed. Copying it wipes run history. Not executed for that reason.

#### M1-16: A2A parameter-override errors do not name the parameter

- **Severity:** minor. **Category:** UX. **Surface:** A2A (MCP not checked).
- **Actual:** `-32602 "One or more run parameters are not allowed."` For the same request, REST adds `fields: {"parameters.model": "Deployment echo-fake does not allow overriding model."}`.

#### M1-17: The SDK quick start signs in with keys a Kubernetes user cannot find

- **Severity:** minor. **Category:** docs. **Surface:** `sdk/python/README.md` (the other SDK READMEs probably match; not checked), `docs/KUBERNETES.md`.
- **Actual:** the first example is `login_with_keys("access_...", "secret_...")`. On K3S the default tenant keys are `default-access-key` and `default-secret-key` in Secret `garrison-secrets`, and no document names them. `login(email, password)` works and would be a better first example.

#### M1-18: The SDK test harness command fails with 18 cascading errors on Kubernetes

- **Severity:** minor. **Category:** docs. **Surface:** `sdk/python/README.md`, `test_harness.py`.
- **Actual:** the documented command uses the Docker and source-build default keys. On K3S the first check fails with 401. The other 17 then fail with `set tenant_id on the client (or log in)` and `KeyError: 'agent'`. The harness should stop after an authentication failure, and the README should say where the keys come from.

#### M1-19: `pip install garrison-sdk` fails because the package is not published

- **Severity:** minor. **Category:** docs. **Surface:** `sdk/python/README.md`.
- **Actual:** "No matching distribution found for garrison-sdk". The local install works but is listed second. `pip install -e .` also writes `garrison_sdk.egg-info` into the repository. It is gitignored and was removed after the session.

### Polish

#### M1-20: IDs appear where names are expected

- **Severity:** polish. **Category:** UX. **Surface:** Dashboard.
- **Actual:**
  - The Deployments list shows the Agent and Harness profile columns as truncated IDs (`agt_mv2j4kki_BWJVBqK…`, `hrn_builtin_claude_c…`).
  - Run detail shows Deployment as `dep_mv2j8f0q_w71eiEy…`.
  - The Analytics Deployment filter lists deleted deployments as raw IDs.
- **Evidence:** `shots/14-add-deployment-form.png` (list behind the modal), `shots/24-run-detail.png`, `shots/29-analytics.png`

#### M1-21: The template delete confirmation contradicts what the server does

- **Severity:** polish. **Category:** UX. **Surface:** Dashboard.
- **Actual:** the dialog says "Deployments that bind it will fail to compile." The server then refuses with 409 "used by deployment(s) m1-terse-claude". The refusal is the better behavior, so only the wording is wrong. The dialog could list the bound deployments up front.
- **Evidence:** `shots/49-delete-template-bound.png`

#### M1-22: Retrying a run whose agent was deleted says "The record was not found."

- **Severity:** polish. **Category:** UX. **Surface:** Dashboard run detail.
- **Actual:** the run is on screen, so "not found" is confusing. "The agent m1-terse no longer exists" would explain it. The Retry button could also be disabled.
- **Evidence:** `shots/52-retry-deleted-agent.png`

#### M1-23: The run page does not show which template versions a run used

- **Severity:** polish. **Category:** UX. **Surface:** Dashboard run detail.
- **Oracle:** README ("Every run records the exact template versions it was compiled with").
- **Actual:** the run JSON has `templateVersions` (with `templateId` and `templateName`), but the page shows them only through View JSON.

#### M1-24: Untranslated and internal names leak into the UI

- **Severity:** polish. **Category:** i18n. **Surface:** Dashboard.
- **Actual:**
  - Analytics legends, the data table, and exports say `ClaudeCode` (the enum name), while the rest of the UI says "Claude Code". Two missing-model buckets are labeled differently: `Codex / unknown` in one place and "Unknown model" in the other.
  - In German, transcript lines generated by the server stay English ("Workspace prepared at ...", "Harness exited with code 0").
  - Settings are labeled with raw keys (`Rest.Hostname`) in every language.
- **Evidence:** `shots/export-garrison_analytics-ttft_day_groupby-harness.png`, `shots/41-de-run.png`, `shots/44-de-system.png`

#### M1-25: The `validate.sh` sample output in QUICKSTART says 30, but the default run gives 25

- **Severity:** polish. **Category:** docs. **Surface:** `docs/QUICKSTART.md` step 8.
- **Actual:** 30 is the count with `researcher` included, but the command shown first runs without it.

#### M1-26: Invoking an agent with no deployment returns 404 NotFound

- **Severity:** polish. **Category:** UX. **Surface:** REST.
- **Actual:** 404 "Agent helper has no active deployment with a weight above zero." The message is clear, but the status reads as "agent not found". 409 fits better. The `REST_API.md` `POST /runs` example uses `helper`, which the preceding examples create without a deployment, so it cannot succeed as written.

#### M1-27: A secret accepts an expiry date that has already passed (question)

- **Severity:** polish. **Category:** UX (question). **Surface:** REST.
- **Actual:** the `REST_API.md` PUT example sets `expiresUtc: 2026-01-01`, which is already past. It is accepted with no warning, and the secret stays active.

#### M1-28: The analytics examples in REST_API.md use fixed dates and an old model name

- **Severity:** polish. **Category:** docs.
- **Actual:** `from=2026-10-09..to=2026-10-10` and `model=claude-sonnet-4-5` return nothing on a current stack (runs report `claude-sonnet-5-5`). A first-time reader sees zeros.

#### M1-29: `garrison_list_agents` returns fields that MCP_API.md does not list

- **Severity:** polish. **Category:** docs. **Surface:** MCP.
- **Actual:** the results include `displayName`. Agents created in the dashboard carry `inputSchemaJson: ""` and `outputSchemaJson: ""` instead of omitting them.

#### M1-30: MCP error text is formatted inconsistently

- **Severity:** polish. **Category:** UX. **Surface:** MCP.
- **Actual:** `RunFinished: Run ... already finished` has a code prefix, while `Run run_nope not found.` has none. Quotes inside tool result text are escaped as `"`.

#### M1-31: `outputTokensPerSecond` comes back as null instead of being left out

- **Severity:** polish. **Category:** docs. **Surface:** REST and SDK.
- **Actual:** the SDK README says fields the server cannot measure are omitted. The key is present with `None`.

#### M1-32: Built-in template fields look editable

- **Severity:** polish. **Category:** UX. **Surface:** Dashboard, built-in prompt template detail.
- **Actual:** the page says "Built-in templates are read-only", but the Name input and the other fields are enabled and look editable. There is no Save button, so nothing can be saved.
- **Evidence:** `shots/07-view-default-system.png`

#### M1-33: The Analytics range buttons wrap onto two lines

- **Severity:** polish. **Category:** UX. **Surface:** Dashboard Analytics at 1440 px.
- **Actual:** the range control sits in a narrow column, so the buttons render as "Last / hour", "Last / day", and so on. The range buttons are also not exposed with the button role, which makes them harder to reach with assistive technology. This was found through Playwright's role queries.
- **Evidence:** `shots/33-analytics-model-filter-colon.png`

## Doc commands corrected during the session

None. No command was wrong enough to block progress.

## Prioritized list

Recommendations are the agent's; the user decides.

| Priority | ID | Title | Severity | Category | Recommendation |
|---|---|---|---|---|---|
| 1 | M1-01 | Settings saves an out-of-range value as a clamped one and says it was applied | major | bug | Fix now |
| 2 | M1-02 | The Analytics model filter returns no runs for model names with a colon | major | bug | Fix now |
| 3 | M1-03 | The deployment wizard binds System and Task to the newest template | minor | UX | Fix now |
| 4 | M1-04 | A resource binding defaults Kind to MCP server with a Secret selected; the expected alias is not shown | minor | UX | Fix now |
| 5 | M1-05 | Home advertises Grafana and Prometheus that are not deployed, at `localhost` | minor | bug | Fix now |
| 6 | M1-09 | The QUICKSTART A2A messageId repeats under zsh | minor | docs | Docs only |
| 7 | M1-17 | The SDK quick start uses keys a Kubernetes user cannot find | minor | docs | Docs only |
| 8 | M1-19 | `pip install garrison-sdk` is not published | minor | docs | Docs only |
| 9 | M1-18 | The SDK test harness cascades after an authentication failure | minor | docs | Docs, plus stop the harness after the auth failure |
| 10 | M1-06 | Agent delete does not mention cascaded deployments | minor | UX | Fix now |
| 11 | M1-13 | A nonexistent tenant returns 200 and an empty list | minor | bug | Fix now |
| 12 | M1-15 | The `DELETE /runs` example has no filter | minor | docs | Docs only |
| 13 | M1-11 | Status codes differ from the docs (token delete, runs `wait:false`) | minor | docs | Docs only |
| 14 | M1-07 | Template clone does not ask for a name; the name is locked | minor | UX | Fix later |
| 15 | M1-14 | Manifest dry run does not say what would change | minor | UX | Fix later |
| 16 | M1-16 | A2A override errors do not name the parameter | minor | UX | Fix later |
| 17 | M1-12 | MCP and A2A summaries have no served model | minor | UX | Fix later |
| 18 | M1-08 | Telemetry for tool-using and delegating runs (question) | minor | UX | Discuss |
| 19 | M1-10 | A2A messageId reuse with different content (question) | minor | UX | Discuss |
| 20 | M1-20 | IDs shown instead of names | polish | UX | Fix later |
| 21 | M1-23 | Run page does not show template versions | polish | UX | Fix later |
| 22 | M1-24 | `ClaudeCode` in legends; server text and settings keys untranslated | polish | i18n | Fix later |
| 23 | M1-21 | Template delete dialog wording | polish | UX | Fix later |
| 24 | M1-22 | Retry on a deleted agent's run says "not found" | polish | UX | Fix later |
| 25 | M1-25 | `validate.sh` sample count | polish | docs | Docs only |
| 26 | M1-28 | Analytics examples use fixed dates and an old model name | polish | docs | Docs only |
| 27 | M1-29 | `garrison_list_agents` fields | polish | docs | Docs only |
| 28 | M1-31 | `outputTokensPerSecond` is null rather than absent | polish | docs | Docs only |
| 29 | M1-26 | Agent with no deployment returns 404 | polish | UX | Leave as is or fix later |
| 30 | M1-30 | MCP error text formatting | polish | UX | Fix later |
| 31 | M1-32 | Built-in template fields look editable | polish | UX | Fix later |
| 32 | M1-33 | Analytics range buttons wrap and lack the button role | polish | UX | Fix later |
| 33 | M1-27 | Secret accepts a past expiry (question) | polish | UX | Discuss |

## Decisions

Made by the user on 2026-10-10:

- Fix all 33 findings now, including the polish items.
- M1-08: keep time to first token as the true first model output, and also record the time a run spends waiting on runs it delegated to, plus time to first token excluding that wait, so charts can compare like with like.
- M1-10: reusing an A2A `messageId` with the same content returns the existing task (safe retries); reusing it with different content is rejected with 409 Conflict and a clear message.
- M1-27: a secret whose expiry is already in the past is rejected with 400 on create and update.

## Left in place

Nothing created by the session remains except run history: the runs of `m1-terse`, the QUICKSTART agents, and the SDK harness agent. The settings value changed during the session was restored to 365. The dashboard language was set back to English, but the theme preference in the Playwright profile is irrelevant to other users.
