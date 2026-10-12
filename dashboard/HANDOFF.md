# Dashboard handoff

A summary of what the Garrison operator console contains, how it is checked, and what it does not do yet. The plan (`GARRISON_PLAN.md`, Phase 5) has the task-level history.

## Navigation

Ten sidebar hubs in three sections, defined in one place (`src/config/navConfig.js`). Hubs with more than one page use tabs synced to `?tab=`. Every route from before the consolidation redirects to its hub and tab.

| Section | Hub | Tabs | Who sees it |
|---|---|---|---|
| Operate | Home | none | everyone signed in |
| | Invoke | none | everyone signed in |
| | Runs | Runs, Conversations, Queue | everyone signed in |
| | Analytics | none | everyone signed in |
| | Agents | Agents, Deployments | everyone signed in |
| Platform | Configuration | Harness Profiles, Prompt Templates, MCP Servers, Secrets, Workspaces, Artifact Stores, Manifests | everyone signed in |
| | Fleet | Worker nodes, Control plane, Node Pools | Node Pools: system administrators |
| Administration | Access | Tenants, Users, Credentials, Roles, Assignments | Tenants: system administrators; the rest: administrators |
| | Monitoring | Request History, Audit, API Explorer | everyone signed in |
| | System | Settings, Server Info | Settings: administrators |

The sidebar only hides what the table above lists. Everything else is enforced by the server: a page a user may not read shows a permission message instead of data.

Detail pages: `/dashboard/runs/:id`, `/dashboard/conversations/:id`, `/dashboard/agents/:id`, `/dashboard/prompt-templates/:id`. They highlight their hub in the sidebar.

Invoke's response card has two tabs (P5.52). Preview streams the assistant text over SSE and renders it as Markdown, with reasoning in a collapsed block, tool calls as chips, and live timing; it stays selected when the run ends and points to Response, which shows the result text, structured output, outcome, errors, and telemetry. Sending again clears the card and drops late frames from the previous run. Sending again also cancels the run still in progress, and leaving Invoke (route change, reload, or tab close via `pagehide`) cancels it with `fetch` `keepalive` (a beacon cannot carry the `Authorization` header), unless the "Stop the run when I leave" setting next to Send is off (`localStorage` key `garrison_invoke_stop_on_leave`). Cancel reads "Cancelling..." until the run reports Cancelled. A deployment that allows a `timeoutSeconds` override gets a Time limit field with presets, validated against the override's range and `Runtime.MaxRunSeconds` when settings are readable (P3.15). Run guard stops (`RepetitionDetected`, `NoProgress`, `OutputLimitExceeded` from `maxAssistantChars`) get a `RunGuardNotice` in Preview, Response, and Run detail; the deployment form's Placement and limits step has Repetition guard, Maximum assistant characters, and No-progress timeout with the cluster defaults shown. Model output is rendered by `MarkdownView` (marked for GitHub-flavored Markdown, DOMPurify for sanitizing: no scripts, event handlers, frames, forms, inline styles, or URL schemes other than http, https, and mailto), which Run detail uses for the result too, with a raw text toggle.

Runs > Conversations (P12.1) lists conversations from `GET /conversations` (title, agent, Working or Idle, turns, affinity node, fallbacks with the last reason, last activity; filter by agent, also from `?agentId=`) with Continue (Invoke pre-filled with `?conversationId=`) and View turns as runs (`/runs?conversationId=`). A conversation's page shows the summary, every turn from `GET /conversations/{id}/runs` (status, outcome, whether it resumed the session or fell back and why, input and result previews), a box that sends the next turn with `conversationId`, and Delete; a busy conversation disables Send, and 409 ConversationBusy (and the other 409 conversation codes) show translated messages. Invoke has a Conversation choice (single run, start a new conversation, continue one); after the first turn it switches to continuing the new conversation, and while continuing the deployment is fixed to the conversation's. Run detail shows the conversation, turn, session (resumed, fresh after a fallback with the reason, or first), resumed session, and affinity node. Agent detail links to the agent's conversations. Deployments offer the ConversationFallback prompt role.

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
| API contract | `npm run test:contract` | starts a real server and worker, seeds every resource, and compares 67 GET responses (including both control-node routes and the conversation routes) with the mocks the browser tests use |
| Live | `npm run test:live` | signs in to a deployed stack and visits every page, Analytics, and a run's telemetry and transcript |

Run Playwright with `caffeinate -dims` on a laptop that may sleep; a sleeping host stalls a test until it times out.

## Visual QA

Checked by screenshot against the live K3S deployment at 1440 by 1000: Home (KPIs, full-width activity chart), Agents (explainer and diagram), Configuration tabs (Secrets with a tooltip open, MCP Servers empty state), Runs (telemetry columns), Run detail (telemetry panel, transcript), and Analytics (filters, totals, charts grouped by harness and model). The mocked suite also runs desktop, tablet, and phone widths.

## Accessibility

Landmarks and labels on every page, keyboard access to tabs (arrow keys, Home, End), tooltips on focus as well as hover with `aria-describedby`, Escape closes tooltips and modals, focus is trapped in modals, and status is never shown by color alone (every badge has text).

## Not done yet

- Observability cards and deep links into Grafana, Prometheus, Loki, and Tempo (plan P13.12 to P13.19).
- Approvals inbox (Phase 12).
- Codex output does not stream until the app-server driver exists (P12.2a); the run still completes normally.
- New-locale translations are marked beta until a native speaker reviews them (`docs/I18N.md` lists the strings to check).

## References

- `GARRISON_PLAN.md` section 14 (dashboard design), decisions D-017 and D-030, tasks P5.1 to P5.51
- `docs/I18N.md` for locales, the glossary, and RTL
- `~/Code/Agents/requirements/DASHBOARD_STYLE_AND_USABILITY.md` and `FRONTEND_ARCHITECTURE.md`
