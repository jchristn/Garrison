# Dashboard handoff

A summary of what the Garrison operator console contains, how it is checked, and what it does not do yet. The plan (`GARRISON_PLAN.md`, Phase 5) has the task-level history.

## Navigation

Eleven sidebar hubs in three sections, defined in one place (`src/config/navConfig.js`). Hubs with more than one page use tabs synced to `?tab=`. Every route from before the consolidation redirects to its hub and tab.

| Section | Hub | Tabs | Who sees it |
|---|---|---|---|
| Operate | Home | none | everyone signed in |
| | Invoke | none | everyone signed in |
| | Runs | Runs, Conversations, Pipeline runs, Queue | everyone signed in |
| | Approvals | Approvals, Stage reviews (one badge with both pending counts) | everyone signed in |
| | Analytics | none | everyone signed in |
| | Agents | Agents, Deployments, Pipelines, Triggers, Capabilities | everyone signed in |
| Platform | Configuration | Harness Profiles, Prompt Templates, MCP Servers, Secrets, Workspaces, Artifact Stores, Manifests | everyone signed in |
| | Fleet | Worker nodes, Control plane, Node Pools | Node Pools: system administrators |
| Administration | Access | Tenants, Users, Credentials, Roles, Assignments | Tenants: system administrators; the rest: administrators |
| | Monitoring | Request History, Audit, API Explorer | everyone signed in |
| | System | Settings, Server Info | Settings: administrators |

The sidebar only hides what the table above lists. Everything else is enforced by the server: a page a user may not read shows a permission message instead of data.

Detail pages: `/dashboard/runs/:id`, `/dashboard/conversations/:id`, `/dashboard/pipeline-runs/:id`, `/dashboard/agents/:id`, `/dashboard/prompt-templates/:id`, `/dashboard/approvals/:id`. They highlight their hub in the sidebar.

Approvals (P12.3) is the inbox for permission requests from deployments with approvals turned on. The sidebar item shows how many are pending, read from `GET approvals?status=Pending&maxResults=1` every 30 seconds and updated at once by the WebSocket `approvals` channel when the live connection is up; it disappears for callers without Approval Read. The inbox opens on Pending and filters by status, agent, decision source, and run ID; Allow and Deny open a dialog with a reason and "remember as rule" (an editable pattern prefilled from the suggested rule). A 409 `ApprovalNotPending` and a 403 end in a toast. The detail page shows every field, the redacted input preview, the matched and suggested rules, and links to the run, agent, and deployment. Run detail shows an "Awaiting approval" badge and banner, the approval wait in telemetry, an Approvals tab with Allow and Deny, and labels `ApprovalRequested` and `ApprovalDecided` events in the transcript with a link to the approval. The deployment form has an Approvals step: the on switch, the default action, the timeout and its decision, an ordered rules editor that keeps rule IDs, and a "Test a tool call" panel that posts to `approval-check` (saved deployments only).

Pipelines (P12.9) add tabs, not sidebar items (decision D-048). Agents > Pipelines lists pipeline definitions (stages as an agent chain, review gates, time limit, version) with Start (input text, one `Idempotency-Key` per dialog, then the new pipeline run), Preview prompts (`POST pipelines/{id}/preview` with sample input and a sample output per earlier stage), and View pipeline runs; Duplicate keeps stage references. The form has an ordered stage editor: add, remove, and reorder stages; per stage an agent, an optional deployment of that agent (empty means weighted selection), an optional Task handoff template with an optional pinned version, handoff character limit, maximum attempts, continue on failure, and a review gate with timeout, timeout action, and maximum revisions, plus run parameters. Server errors keyed `stages[i].field` show on their stage. Runs > Pipeline runs filters by status, pipeline, and time (the server has no outcome filter); a pipeline run's page shows the summary, the input, the pending review with Approve, Request changes, and Reject, and the stage timeline (status, executions, attempts, revisions, blocked reason, stage runs linked to Run detail, and reviews), with Cancel, Retry, and Delete for finished runs. It follows the WebSocket channel `pipeline-run:{id}` and polls every 3 seconds when that is not available. Approvals > Stage reviews opens on pending reviews; the decide dialog requires a comment for Request changes, shows revisions left, keeps a 409 `RevisionLimitReached` in the dialog, and ends a 409 `ReviewNotPending` in a toast. The sidebar badge adds pending approvals and pending stage reviews (`approvals.changed` carries `reviewsPending`). Run detail links a stage run to its pipeline run, and the runs list has a hidden Pipeline run column and accepts `?pipelineRunId=`.

Invoke's response card has two tabs (P5.52). Preview streams the assistant text over SSE and renders it as Markdown, with reasoning in a collapsed block, tool calls as chips, and live timing; it stays selected when the run ends and points to Response, which shows the result text, structured output, outcome, errors, and telemetry. Sending again clears the card and drops late frames from the previous run. Sending again also cancels the run still in progress, and leaving Invoke (route change, reload, or tab close via `pagehide`) cancels it with `fetch` `keepalive` (a beacon cannot carry the `Authorization` header), unless the "Stop the run when I leave" setting next to Send is off (`localStorage` key `garrison_invoke_stop_on_leave`). Cancel reads "Cancelling..." until the run reports Cancelled. A deployment that allows a `timeoutSeconds` override gets a Time limit field with presets, validated against the override's range and `Runtime.MaxRunSeconds` when settings are readable (P3.15). Run guard stops (`RepetitionDetected`, `NoProgress`, `OutputLimitExceeded` from `maxAssistantChars`) get a `RunGuardNotice` in Preview, Response, and Run detail; the deployment form's Placement and limits step has Repetition guard, Maximum assistant characters, and No-progress timeout with the cluster defaults shown. Model output is rendered by `MarkdownView` (marked for GitHub-flavored Markdown, DOMPurify for sanitizing: no scripts, event handlers, frames, forms, inline styles, or URL schemes other than http, https, and mailto), which Run detail uses for the result too, with a raw text toggle.

Runs > Conversations (P12.1) lists conversations from `GET /conversations` (title, agent, Working or Idle, turns, affinity node, fallbacks with the last reason, last activity; filter by agent, also from `?agentId=`) with Continue (Invoke pre-filled with `?conversationId=`) and View turns as runs (`/runs?conversationId=`). A conversation's page shows the summary, every turn from `GET /conversations/{id}/runs` (status, outcome, whether it resumed the session or fell back and why, input and result previews), a box that sends the next turn with `conversationId`, and Delete; a busy conversation disables Send, and 409 ConversationBusy (and the other 409 conversation codes) show translated messages. Invoke has a Conversation choice (single run, start a new conversation, continue one); after the first turn it switches to continuing the new conversation, and while continuing the deployment is fixed to the conversation's. Run detail shows the conversation, turn, session (resumed, fresh after a fallback with the reason, or first), resumed session, and affinity node. Agent detail links to the agent's conversations. Deployments offer the ConversationFallback prompt role.

Agents > Capabilities (AD4.8) is the capability catalog from `GET /capabilities`: agents, MCP tools, and harness built-ins in one table with kind, origin (Derived or Manual, plus Shared for built-ins every tenant sees), summary, source, hints, and tags. The server returns the whole filtered catalog in one response, so the page sorts and pages it in the browser; kind and tag filters and the name search go to the server, the origin filter stays in the browser. The source cell links an agent entry to the agent's page, an MCP tool to the MCP Servers tab searched for its server (with the tool name), and a built-in to its harness profile with the node label a run needs (`garrison.io/tool-pandoc=true`). Hints read "Median, p90, cost per run" when Known and show an Unknown badge otherwise; a value is never shown as zero for lack of data. Entries whose last refresh failed carry a badge, a banner counts them, and their details lead with the warning. Derived entries keep Edit and Delete in the row menu, disabled, with a tooltip saying where to change the source; there is no bulk delete. Manual entries are created and edited in a form (name, kind, summary, optional source agent or MCP server and tool, tags, node label requirements, input and output schemas), with `InvalidJsonSchema` shown on the schema field and `NameConflict` in a toast. Refresh opens a dialog that refreshes every MCP server or one, then lists the totals and one row per server with its error. Harness profiles have a Tool probes editor (name, executable, one allowed argument, description) checked against the server's rules, agent revisions list their capabilities in a Capabilities column with an editor for the draft, and a run blocked with `NoToolWorker` names the tools it waits for.

Fleet > Control plane (P10.19) lists the control-plane replicas from `GET /v1.0/api/control-nodes`: name with a Leader badge, translated status (Starting, Ready, Draining, Offline), version, schema version, backplane, uptime, heartbeat age (highlighted with a Stale badge when a replica that is not Offline has been silent for more than 15 seconds), active requests, open streams, held long polls, and address. It is read-only, refreshes every 15 seconds, and says which replica answered the list (`respondingNodeId`). A row opens a detail with every field from a fresh `GET /control-nodes/{id}`. With Grafana configured, each replica links to the Garrison overview dashboard filtered with `var-node`. The worker tab is still the hub's default, so existing links to Fleet land on worker nodes.

Home shows "Control plane ready x / y" next to "Nodes ready" (from the overview's `controlNodesByStatus`; the tooltip names the leader from `leaderNodeId`, and the card turns amber when no replica leads). The Nodes panel has two sections, Control plane and Worker nodes, each with a link to its Fleet tab. System > Server Info links the answering replica (`nodeId`) to the Control plane tab; the top bar does not show it, because server info is cached once per session and a load balancer can send the next request elsewhere.

## What every page has

- An explainer panel for pages whose objects relate to others (agents and deployments, profiles, prompts, secrets and aliases, nodes and pools, control nodes and worker nodes, users and credentials, roles and assignments, runs and queue, manifests). It can be dismissed and reopened.
- A translated tooltip on every control, column header, tab, badge, and card that says what it is and how it is used (decision D-030).
- Tables with search, filters, sorting, a column picker, pagination with page sizes up to 1,000, auto-refresh, and CSV export.
- Charts (Home, Request History, Analytics, Run detail phases) with an export menu: CSV, PNG, SVG, and JSON.
- Nine languages (English, German, Japanese, Spanish, French, Italian, Simplified Chinese, Traditional Chinese, Cantonese), light and dark themes, and an RTL pseudo-locale for layout testing.

## Checks

| Check | Command | What it covers |
|---|---|---|
| Lint | `npm run lint` | ESLint, no warnings allowed |
| Unit | `npm test` | Markdown rendering and sanitizing, formatters per locale, i18n key and placeholder parity, untranslated strings, enum labels, telemetry and analytics helpers, exporters, tooltips for generated controls |
| Browser (mocked) | `npx playwright test` | every route and tab, forms and modals, tooltips on every element (about 13,200 checks), redirects, keyboard tabs, exports, languages, RTL overflow |
| API contract | `npm run test:contract` | starts a real server and worker, seeds conversations and approvals, and compares live GET responses with browser mocks |
| Live | `npm run test:live` | signs in to a deployed stack and visits every page, Analytics, and a run's telemetry and transcript |

Run Playwright with `caffeinate -dims` on a laptop that may sleep; a sleeping host stalls a test until it times out.

## Visual QA

Checked by screenshot against the live K3S deployment at 1440 by 1000: Home (KPIs, full-width activity chart), Agents (explainer and diagram), Configuration tabs (Secrets with a tooltip open, MCP Servers empty state), Runs (telemetry columns), Run detail (telemetry panel, transcript), and Analytics (filters, totals, charts grouped by harness and model). The mocked suite also runs desktop, tablet, and phone widths.

## Accessibility

Landmarks and labels on every page, keyboard access to tabs (arrow keys, Home, End), tooltips on focus as well as hover with `aria-describedby`, Escape closes tooltips and modals, focus is trapped in modals, and status is never shown by color alone (every badge has text).

## Not done yet

- Observability cards and deep links into Grafana, Prometheus, Loki, and Tempo (plan P13.12 to P13.19).
- Codex output does not stream until the app-server driver exists (P12.2a); the run still completes normally.
- New-locale translations are marked beta until a native speaker reviews them (`docs/I18N.md` lists the strings to check).

## References

- `GARRISON_PLAN.md` section 14 (dashboard design), decisions D-017 and D-030, tasks P5.1 to P5.51
- `docs/I18N.md` for locales, the glossary, and RTL
- `~/Code/Agents/requirements/DASHBOARD_STYLE_AND_USABILITY.md` and `FRONTEND_ARCHITECTURE.md`
