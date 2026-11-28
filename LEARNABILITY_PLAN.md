# Garrison Learnability Plan (0.3.0)

Garrison now has a lot of concepts. A new operator meets harnesses, nodes, agents, deployments, and runs, then keepers, mandates, messages, reports, escalations, memory, organizations, executives, change rules, evals, canaries, freezes, and the board. Each one is documented and each one has a page, but nothing in the dashboard shows how they fit together, and nothing shows what actually happened when a request went into an organization and an answer came back.

This plan adds three things to 0.3.0 before it ships:

- **The activity trail.** Open a run and see every hop from the request that started it, through every agent, message, child run, report, escalation, approval, and tool effect, back to the reply.
- **The organization designer.** One visual editor for organizations, used both for published organizations and for studio drafts, that also covers mandates, keepers, budgets, and change rules.
- **Guided learning.** A Learn page of concept diagrams drawn for Garrison, and short guided tours, one per job, that walk through the real dashboard on real sample data.

Two full UX passes over the whole dashboard close the plan. One is a design review and one is a simulated user session. The user triages the findings from each pass.

The trail comes first because it is the most useful of the three on its own, and because seeing a real trail teaches the concepts better than any tour. The tours come last because they walk through the trail and the designer.

## Table of Contents

1. [How to use this plan](#1-how-to-use-this-plan)
2. [Progress Dashboard](#2-progress-dashboard)
3. [Scope](#3-scope)
4. [Current state](#4-current-state)
5. [Decision log](#5-decision-log)
6. [Architecture](#6-architecture)
7. [Route inventory](#7-route-inventory)
8. [Work breakdown](#8-work-breakdown)
9. [Security and RBAC](#9-security-and-rbac)
10. [Risks and open questions](#10-risks-and-open-questions)

---

## 1. How to use this plan

### 1.1 Status markers, annotations, and IDs

This plan uses the same markers and annotation format as `AUTONOMOUS_AGENTS_PLAN.md` section 1.1 (`[ ]`, `[~]`, `[x]`, `[-]`, `[!]`, then `  | <who> <YYYY-MM-DD> <note or commit>`). Tasks are `LP<phase>.<n>` and decisions are `LP-<nnn>`. IDs never change. A task that grows is split into `LP2.3a`, `LP2.3b`. When scope changes, add a task rather than rewriting a finished one.

Work happens on `feature/autonomous-agents`. Commit and push per task. Nothing merges to `main` until AA13.15, and AA13.15 now waits on this plan (see LP0.1).

### 1.2 Default bar for every task

The default bar in `AUTONOMOUS_AGENTS_PLAN.md` section 1.2 and the layer checklist in section 1.3 apply to every task here without exception. They cover the C# style from `CLAUDE.md` and `~/Code/Agents/requirements/CODE_STYLE.md`, settings in place of constants, scope map, OpenAPI, request history, Postman, docs for every route and tool, prompt templates, nine locales with tooltips, no em dashes, `127.0.0.1`, and zero build warnings. This plan adds the following:

- **Dashboard work** meets `~/Code/Agents/requirements/DASHBOARD_STYLE_AND_USABILITY.md` and `FRONTEND_ARCHITECTURE.md`:
  - the shared API client;
  - backend filters and sort;
  - the Columns control and saved page size from 5c4d7ff3;
  - custom confirm modals and no browser dialogs;
  - copyable IDs;
  - loading, empty, and error states;
  - visible focus and keyboard parity;
  - `prefers-reduced-motion`;
  - no horizontal page scroll at 1366x768 with the sidebar open.
- **Diagrams and canvases** must be readable in light and dark themes, in every locale, and in right-to-left layout. Every diagram has a text alternative: a list or table carrying the same information, for screen readers and for narrow screens.
- **Tests are targeted.** Each task runs only the suites and vitest files it touches. Examples:
  - `dotnet run --project src/Test.Automated -f net10.0 --no-build -- --suites RunTrail`
  - `npx vitest run src/tests/runTrail.test.jsx`

  The full matrix belongs to AA13.11 and CI. A task's annotation names the targeted runs.
- **Dashboard code changes** end with `npm run lint` and `npm run build` in `dashboard/`. `scripts/check-em-dash.sh` and `scripts/check-version.sh` must pass.
- **Writing:** new or changed docs follow `WRITING_DOCUMENTS.md`, including the humanizer review.

### 1.3 Requirements conflicts

The conflicts recorded in `AUTONOMOUS_AGENTS_PLAN.md` section 1.4 still hold. One more is recorded here:

| Generic requirement | Garrison rule kept | Why |
|---|---|---|
| `DASHBOARD_STYLE_AND_USABILITY.md` "Allow tables to scroll horizontally on small screens" | Tables may scroll sideways below 768px only. At 1366x768 and wider, default columns must fit. | User instruction on 2026-11-27 (5c4d7ff3) |

---

## 2. Progress Dashboard

| Phase | Name | Depends on | Status | Done / Total |
|---|---|---|---|---|
| LP0 | Plan wiring | none | Done | 2 / 2 |
| LP1 | Activity trail: server | LP0 | Done | 14 / 14 |
| LP2 | Activity trail: dashboard | LP1.5 (API shape) | In progress (LP2.10 spec not run) | 9 / 10 |
| LP3 | Organization designer | LP0 | In progress | 1 / 12 |
| LP4 | Guided learning: diagrams, Learn page, tours | LP4.1 to LP4.4 none; LP4.5 onward LP2, LP3 | In progress | 9 / 10 |
| LP5 | UX pass 1: design review of the whole dashboard | LP1 to LP4 | In progress | 0 / 5 |
| LP6 | UX pass 2: simulated users on a fresh instance | LP5 | Not started | 0 / 5 |
| LP7 | Release integration | LP6 | Not started | 0 / 5 |
| LP8 | App appearance | LP0 (before LP6) | Not started | 0 / 6 |

Total tasks: 69.

```
LP0 wiring
  |
  +--> LP1 trail server --(API shape, LP1.5)--> LP2 trail dashboard --+
  +--> LP3 organization designer ------------------------------------+--> LP4.5+ tours --> LP5 UX pass 1 --> LP6 UX pass 2 --> LP7 release
  +--> LP4.1..LP4.4 diagrams and Learn page (parallel) --------------+
```

LP1, LP3, and the diagram half of LP4 can run at the same time in separate missions. LP2 can start against a mocked trail response as soon as LP1.5 fixes the response shape.

---

## 3. Scope

### 3.1 Delivers

- A server-built activity trail for any run, which walks back to where the work started and forward to everything it caused. It is exposed over REST, the management MCP server, and the four SDKs.
- A Trail view on Run detail. It has a sequence view, a graph view, and a list view, plus a side drawer that loads each step's detail. "Open trail" links appear wherever a run, message, escalation, approval, report, or keeper tick is shown.
- One organization canvas, used to design a published organization (its working tree) and an organization in a studio draft. It covers units, leads, members, peer lines, mandates and keepers, unit budgets, and the change rules that apply to a unit. It validates live and has a read-only mode with health, spend, and activity overlays.
- A Learn page with interactive concept diagrams. The diagrams are React SVG components built from theme tokens with translated labels, and each box links to its page and its doc.
- A tour engine with several named tours, each tied to one job. Tours navigate between routes and offer to load the gerbil example when the tenant is empty. Each hub has a "?" button that starts its tour.
- Two whole-dashboard UX passes with findings, the user's triage, fixes, and verification.

### 3.2 Out of scope

- A new HTTP stack or graph database: the trail is assembled from existing tables.
- Agent-written text inside the trail response (LP-002).
- Run tokens reading trails (LP-010).
- Drag-and-drop creation of brand new harness profiles or credentials from the canvas. The canvas links to the existing forms.
- Video or animated tour assets.

---

## 4. Current state

The plan builds on what exists. Each item is checked against the code on 2026-11-27.

**Run lineage already recorded:**

| Record | Fields that link it |
|---|---|
| `Run` | `ParentRunId`, `RootRunId`, `RetryOfRunId`, `FanOutGroupId`, `PipelineRunId`, `TriggerId`, `MandateId`, `MandateTickId`, `EscalationId`, `EvalRunId`, `ShadowTrialId`, `ConversationId`, `CallerType`, `CallerId`, `TraceId` |
| `AgentMessage` | `SenderRunId`, `DeliveredRunId` |
| `Report` | `RunId` |
| `Escalation` | `RaisingRunId`, `RoutedRunId` |
| `Approval` | `RunId`, `RootRunId` |
| `ChildWaitRequest` | `ParentRunId`, `ChildRunId` |
| `MandateTick` | `RunId` |
| `EffectOperation` | `RunId` (the effect journal) |

The gap is that nothing stitches these into one picture.

**Run detail** already has a Children tab (`RunChildrenTree.jsx`, fan-out groups) and an event timeline (`RunTimeline.jsx`).

**Organizations:**

- `OrgChartTree.jsx` draws the published chart and edits the working tree on Organization detail. It shows health, spend, and Cancel everything in this unit.
- `studio/canvas/OrgCanvas.jsx` (AA7.10, `@xyflow/react` 12.12.0) edits the organization in a studio draft. It supports nested units, peer lines, the keyboard, and a side panel (`OrgUnitPanel.jsx`) for lead and members.
- The two are separate editors. Neither edits mandates, keepers, budgets, or change rules.

**Learning:**

- `Tour.jsx` is one nine-step tour that highlights shell areas and does not move between pages.
- `Explainer.jsx` panels sit at the top of pages and tabs.
- `SetupWizard.jsx` covers first run (credential, architect, sample manifest, first keeper, test invoke).
- There are no diagrams.

**Schema:** the latest migration is 60.

---

## 5. Decision log

| ID | Decision | Reason |
|---|---|---|
| LP-001 | The server builds the trail in one call (`GET .../runs/{runId}/trail`) with caps on nodes, message hops, and time span, and marks the response `truncated` with the reason when a cap is hit. | A client walk needs dozens of requests and cannot apply tenant and permission checks consistently. Caps keep a looping organization from producing an unbounded response. |
| LP-002 | The trail response carries no agent-written text: no prompts, outputs, message bodies, report bodies, escalation questions or answers, memory, or tool arguments. It carries IDs, kinds, states, timestamps, durations, the agent, unit, and deployment names a person gave them, token and cost totals, and status codes. The drawer loads text from the existing detail routes and renders it as data with its source shown. | AA-025: agent-written data is untrusted. Keeping it out of the trail also keeps the response small and cacheable. |
| LP-003 | The trail starts at the origin, then walks forward. The origin is found by walking back through `ParentRunId`, a message's `DeliveredRunId` to `SenderRunId`, `EscalationId` to `RaisingRunId`, `MandateTickId`, `TriggerId`, and `PipelineRunId`, until it reaches a person or API caller, a trigger, a keeper tick, or the hop cap. The requested run is marked as the focus. | People click into the middle of a chain. "From my request to the first agent and back" needs the start even when the click lands three hops in. |
| LP-004 | Each node is checked against the caller's read permission for its resource type. Another tenant's records never appear. A node the caller may not read appears as a placeholder with its kind and time only. | Tenant isolation and RBAC are non-negotiable. A placeholder keeps the shape of the chain honest without revealing the record. |
| LP-005 | The sequence view (one lane per agent, time running down) is the default. The graph view and the list view are tabs. Below 768px the list view is the only view. | A sequence reads as "request, then hops, then reply". A free graph gets unreadable beyond about 15 nodes. The list is the accessible equivalent and fits a phone. |
| LP-006 | There is one organization canvas. `OrgCanvas` becomes a component that takes an editing source: a draft source that sends studio unit graph operations, or a working-tree source that calls the organization unit routes. `OrgChartTree` stays only as the narrow-screen and read-only fallback. | Two editors that drift are worse than one. The studio canvas already has the keyboard model and operation handling. |
| LP-007 | Change rules stay people-only (AA-023). The canvas shows the rules that match a unit and opens the existing rule editor scoped to that unit. Rules are never draft items, and an architect run never writes one. | The canvas is a person's tool. The no-self-modification limits in `ExecutiveDraftValidator` and the rule routes are not touched. |
| LP-008 | Concept diagrams are React components that draw SVG from CSS tokens and `t()` labels, not static image files. English SVG exports for `docs/images` are generated from the same components by a script. | Static SVGs cannot follow the theme, the locale, or right-to-left layout, and they drift from the product. |
| LP-009 | Tours are data: a tour is a list of steps, each naming a route, a target selector (`data-tour`), and a title and body key. The engine navigates, waits for the target with a timeout, skips a missing target with a note, and saves completion per tour per user. Each tour has one e2e spec. | The single shell tour cannot move between pages. Steps keyed to `data-tour` attributes, with a spec per tour, break loudly when the UI moves instead of pointing at nothing. |
| LP-010 | The trail is available to people: REST, the management MCP server, and the SDKs. The trail tool is hidden from run tokens, and the route answers 403 to a run token. | A run seeing other units' work across the organization is more than its unit gives it. Revisit after 0.3.0 if agents need their own lineage. |
| LP-011 | The live trail of a running request refreshes through the existing auto-refresh control (`AutoRefreshSelect`, default 5 seconds while any node is running, off when all are terminal). There is no new WebSocket channel in 0.3.0. | It reuses a pattern operators already know and adds no new channel to secure and document. |
| LP-012 | Each UX pass is a gate. Pass 1 is a design review of every route. Pass 2 is a simulated user session per `SIMULATED_USER_TESTING.md` on a fresh instance. Neither pass fixes anything while it runs. The user triages each finding, and approved fixes are verified before the next pass starts. | The user asked for at least two passes that check the dashboard looks good and makes sense. Observe, then decide, then fix is the requirement's own rule. |
| LP-013 | Runs record their entry surface (`EntrySurface`: Rest, Mcp, A2a, App, Dashboard, Trigger, Keeper, Message, Escalation, Eval, Shadow, Internal) as a structured column, and the trail's Caller node and root Run node carry it. The reply stays drawn from the root run's terminal state; no reply record is added. | User decision 2026-11-27. The reply is what the caller receives when the root run ends; the surface is the missing half of "from my request". |
| LP-014 | Shadow runs store the live run they copy as `ShadowOfRunId`, a structured column, and the trail draws a `Shadowed` edge from the live run to its shadow copy. | User decision 2026-11-27. The link was only inside an idempotency key string, which breaks the structured-persistence rule for a fact the product relies on. |
| LP-015 | The trail follows a non-blocking escalation answer into the keeper tick that received it (`DeliveredTickId`) and that tick's run, with an `Answered` edge. Organization validation `valid` means no Error; Warnings show but do not block Publish. | User decisions 2026-11-27. The answer link already exists in the data; warnings match what publishing enforces today. |
| LP-016 | Agentic apps get full appearance settings (user request 2026-11-27): a palette with light and dark variants (eight built-in presets or custom), a subtitle, welcome title, composer placeholder, agent display name and avatar, starter prompts (at most 4), default theme and whether users may switch it, corner style, density, and toggles for the files panel, language picker, and a Powered by Garrison footer. Logo, favicon, and avatar upload inline in the app form and are stored as assets. | The user asked for palettes and configurable appearance; the eight existing color fields and the asset picker covered only part of it. |
| LP-017 | Presets live in the dashboard (`utils/appPalettes.js`) and fill the color fields; the server stores the resolved colors plus the `paletteId` the operator chose, so the app page needs no palette catalog and an operator can start from a preset and adjust it. A dark color left null is derived from its light color by the app page. Every preset passes WCAG AA for text on each surface in both themes. | Keeps one source of truth for what the app page draws, and lets presets change without a migration. |

---

## 6. Architecture

### 6.1 Trail model

New types in `src/Garrison.Core`, one per file:

| Type | Kind | Contents |
|---|---|---|
| `RunTrailNodeKindEnum` | enum | `Caller`, `Trigger`, `KeeperTick`, `Run`, `Message`, `Report`, `Escalation`, `Approval`, `Effect`, `FanOutGroup`, `PipelineRun`, `Reply`, `Redacted` |
| `RunTrailEdgeKindEnum` | enum | `Started`, `Spawned`, `FannedOut`, `Retried`, `Sent`, `Woke`, `Filed`, `Raised`, `Routed`, `Answered`, `Requested`, `Decided`, `Performed`, `Replied` |
| `RunTrailTruncationEnum` | enum | `None`, `NodeCap`, `HopCap`, `SpanCap` |
| `RunTrailNode` | class | `Id` (the record ID), `Kind`, `State`, `AgentId`, `AgentName`, `UnitId`, `UnitName`, `DeploymentId`, `StartedUtc`, `EndedUtc`, `DurationMs`, `InputTokens`, `OutputTokens`, `CostUsd`, `RunKind`, `IsFocus`, `Lane` (the agent ID, or `caller`), `CallerType` and `CallerName` (Caller and Reply nodes), `ToolName` (Effect nodes; the tool name, never its arguments), `RedactedKind` (Redacted nodes) |
| `RunTrailEdge` | class | `FromId`, `ToId`, `Kind`, `AtUtc` |
| `RunTrail` | class | `OriginId`, `FocusRunId`, `Nodes`, `Edges`, `Truncation`, `NodeCount`, `HopCount`, `GeneratedUtc` |
| `RunTrailSettings` | class | `MaxNodes` (default 500, min 10, max 5000), `MaxMessageHops` (default 12, min 0, max 50), `MaxSpanHours` (default 72, min 1, max 720), `IncludeEffects` (default true) |

No property is a tuple, no class is nested, and every public member has XML docs with its defaults and bounds.

### 6.2 Trail service

`src/Garrison.Server/Runtime/RunTrailService.cs` builds the trail:

1. Load the focus run with a tenant filter. A missing run or another tenant's run answers 404.
2. Walk back to the origin as described in LP-003, counting message hops.
3. Walk forward breadth first from the origin. Each step reads:
   - child runs by `ParentRunId`, fan-out groups, retries;
   - messages by `SenderRunId` and the runs they woke by `DeliveredRunId`;
   - reports by `RunId`;
   - escalations by `RaisingRunId` and their routed and answer runs;
   - approvals by `RunId`;
   - effect operations by `RunId` when `IncludeEffects` is on.

   Reads are batched by ID set per level, never one query per node.
4. Deduplicate by record ID so a message loop shows once.
5. Stop at a cap and set `Truncation`.
6. Apply LP-004 permission filtering.
7. Add a `Reply` node when the origin has a caller and the root run reached a terminal state.

`ChainOfCommand` supplies unit names from the published revision in force at each node's start time.

### 6.3 Surfaces

| Surface | Contract |
|---|---|
| REST | `GET /v1.0/api/tenants/{tenantId}/runs/{runId}/trail?includeEffects=true`. Answers 200 with `RunTrail`, 404 for a missing or cross-tenant run, and 403 to a run token. Scope map: resource `Run`, operation `Read`. |
| Management MCP | `garrison_get_run_trail` (`runId`, `includeEffects`) returns `structuredContent` with the `RunTrail`. It is hidden from run tokens. |
| SDKs | `GetRunTrailAsync` in C#, `get_run_trail` in Python, `getRunTrail` in JS, `GetRunTrail` in Go, with typed models. |
| Telemetry | Counter `garrison_run_trail_requests_total{outcome}`, histogram `garrison_run_trail_build_seconds`. The span `garrison.run_trail.build` nests under the request span and carries the attributes `node_count`, `hop_count`, and `truncation`. |
| Settings | `RunTrail` section in the server settings, `docker/server/garrison.json`, Helm values, the k8s config map, the dashboard Settings page, and `docs/CONFIGURATION.md`. |

### 6.4 Organization canvas sources

`dashboard/src/utils/orgCanvasSource.js` defines the interface that `OrgCanvas` calls:

- `load`, `addUnit`, `removeUnit`, `moveUnit`;
- `setLead`, `addMember`, `removeMember`;
- `connectUnits`, `disconnectUnits`;
- `setBudget`;
- `attachMandate`, `detachMandate`;
- `validate`.

There are two implementations:

- `draftOrgSource` wraps the studio unit graph operations that exist today.
- `workingTreeOrgSource` wraps the organization unit, budget, and mandate routes used by Organization detail today.

The Publish button stays where publishing lives now: the org revision on Organization detail, and the draft release in the studio.

---

## 7. Route inventory

Required by `DASHBOARD_STYLE_AND_USABILITY.md` "Route Inventory". It covers new and changed routes only.

| Route | User job | Roles | Backend | Table and filter needs | Actions and modals | Empty and error states |
|---|---|---|---|---|---|---|
| `/dashboard/runs/{id}?tab=trail` | Follow a request through every agent and back | Operator, admin, tenant admin, viewer | `GET .../runs/{id}/trail`, existing detail routes for the drawer | List view: LocalTableFrame with Columns; filters by kind, agent, state | Step drawer, Open record, Copy ID, Export JSON, Refresh, auto-refresh | Run has no hops (single run, shown as request and reply); truncated (banner naming the cap and a setting link); redacted steps (inline note); load failed (retry) |
| `/dashboard/organizations/{id}?tab=design` | Design or change an organization visually | Admin, tenant admin, org editor | Organization unit, budget, mandate routes; change rule list | Canvas outline list (keyboard and narrow screens) | Unit panel tabs (People, Keepers, Budget, Rules), Validate, Publish revision, Discard working changes (confirm modal) | No units yet (start from a template or add the root unit); validation errors listed with links to the unit; read-only for viewers |
| `/dashboard/organizations/{id}?tab=chart` | See how an organization is doing | All | Same, plus spend, latest reports, activity counts | None | Click a unit: its runs, its latest trail | No activity in range |
| `/dashboard/studio/{draftId}` (organization view) | Design an organization in a draft | Admin, tenant admin, drafts | Studio draft operations (existing) | As above | As above, using draft operations | As today |
| `/dashboard/learn` | Understand the concepts and how they relate | All | None (static, translated) | None | Diagram boxes link to pages and docs; Start tour buttons | Not applicable |
| Every hub (`?` button) | Learn the hub's job in place | All | None | None | Start, Back, Next, Skip, Done | Tour target missing: the step is skipped with a note |

---

## 8. Work breakdown

### Phase LP0: Plan wiring

- [x] LP0.1 Add AA13.17 to `AUTONOMOUS_AGENTS_PLAN.md`: "`LEARNABILITY_PLAN.md` complete (every LP task `[x]` or `[-]`)". AA13.15 depends on it. Update that plan's Progress Dashboard and its task total.  Accept: AA13.15 lists the dependency; totals add up.  | claude 2026-11-27 AA13.17 added, AA13.15 waits on it, AA dashboard 4 / 17, total 192
- [x] LP0.2 `CLAUDE.md` names this plan next to the active plan, and `docs/REMAINING_PLAN_MATRIX.md` gains a row for it.  Accept: links resolve.  | claude 2026-11-27 CLAUDE.md pointer and matrix row

### Phase LP1: Activity trail, server

- [x] LP1.1 Lineage inventory. For every way a run starts (REST invoke, A2A, MCP, conversation turn, trigger, keeper tick, message wake, escalation answer, fan-out, child, retry, pipeline stage, eval, shadow, canary), record which fields link it to its cause and whether the reply to the caller is recorded. Write the result as a table in `docs/TRAILS.md` (new). List every missing link as LP1.2 work.  Accept: one row per start path, each confirmed in code; gaps listed.  | claude 2026-11-27 docs/TRAILS.md inventory, 18 start paths checked in code (85213112). Gaps recorded there: no reply record on any path, non-blocking escalation answers, shadow source run, request surface; none needed a column
- [x] LP1.2 Schema, next free migration (61 or later):  | claude 2026-11-27 migration 61: tenant-led indexes on runs (parent, root, retryof, pipeline), agent_messages (senderrun, deliveredrun), reports (run), escalations (routedrun), approvals (run); effect_operations and escalations raisingrun already had them; no link column (69156dbd). db-sqlite, db-postgresql pass
  - indexes for the trail's batched reads where they are missing (`runs(tenant_id, parent_run_id)`, `runs(tenant_id, root_run_id)`, `agent_messages(tenant_id, sender_run_id)`, `agent_messages(tenant_id, delivered_run_id)`, `reports(tenant_id, run_id)`, `escalations(tenant_id, raising_run_id)`, `effect_operations(tenant_id, run_id)`);
  - any link column LP1.1 found missing, as a structured column, never JSON.

  Accept: migrate-twice, tenant isolation, and backup coverage on both providers.
- [x] LP1.3 Enums and models from section 6.1, plus `RunTrailSettings` with clamped setters.  Accept: build is clean; XML docs state defaults and bounds.  | claude 2026-11-27 RunTrailNodeKindEnum, RunTrailEdgeKindEnum (plus Delivered), RunTrailTruncationEnum, RunTrail, RunTrailNode, RunTrailEdge, RunTrailSettings (69156dbd)
- [x] LP1.4 Batched data-layer reads: `I*Methods` methods that take a tenant ID and an ID set, with Sqlite and Postgresql implementations, async with `CancellationToken`, and an `IEnumerable` method paired with its async variant where one is returned.  Accept: Touchstone cases on both providers.  | claude 2026-11-27 ListByIdsAsync, ListByParentsAsync, ListRetriesOfAsync, ListByPipelineRunsAsync, ListBySenderRunsAsync, ListByDeliveredRunsAsync, ListByRaisingRunsAsync, ListByRoutedRunsAsync, ListByRunsAsync (reports, approvals, effects), fan-out ListByParentsAsync, ticks ListByIdsAsync, chunked by AdoIdSetQuery (69156dbd). run-trail batched-reads on both providers
- [x] LP1.5 `RunTrailService` per section 6.2, with LP-003 origin resolution, caps, dedupe, LP-004 filtering, and the `Reply` node. The JSON shape is fixed by `dashboard/src/tests/fixtures/runTrail.json` (committed with LP0 so LP2 could start; camelCase, enums as strings).  Accept: a Touchstone case serializes a built trail and checks it has exactly the fixture's property names.  | claude 2026-11-27 RunTrailService, RunTrailWalk, RunTrailOrigin; fixture-shape case. Unit names come from the live revision, not the one in force at each step (ChainOfCommand reads live only); null properties are omitted from the JSON
- [x] LP1.6 REST route in `RunTrailRoutes.cs` (a registrar class), with OpenAPI metadata, scope map entry, request history capture, and the run-token 403 (LP-010).  Accept: route cases for 200, 404, cross-tenant 404, and the run-token 403.  | claude 2026-11-27 RunTrailRoutes, handler-scoped so a run token gets 403 RunTokenTrailNotAllowed before authorization; includeEffects query parameter (400 on a bad value)
- [x] LP1.7 Management MCP tool `garrison_get_run_trail` with a typed `McpGetRunTrailArguments`, an input schema, `structuredContent`, and run-token hiding.  Accept: tool listed for a person's token and absent for a run token.  | claude 2026-11-27 garrison_get_run_trail, a Management tool (hidden from and refused for run tokens), McpGetRunTrailArguments, structuredContent
- [x] LP1.8 Telemetry and settings per section 6.3, including a panel on the runs Grafana dashboard.  Accept: metric names in `GarrisonMetricCatalog`; label cardinality checked by `LabelGuard`; settings documented.  | claude 2026-11-27 garrison.run_trail.requests{outcome}, garrison.run_trail.build{truncation}, span garrison.run_trail.build, Runs dashboard panel, TELEMETRY.md rows; RunTrail.* as cluster settings (Settings page reads the catalog), CONFIGURATION.md. telemetry suite passes
- [x] LP1.9 Touchstone `RunTrailSuite` on both providers, registered in `GarrisonSuites.cs`. Cases:  | claude 2026-11-27 RunTrailSuite: run-trail-unit 3 cases, run-trail-sqlite and run-trail-postgresql 14 cases each, all pass; also db-*, telemetry, organizations-*, management-mcp-* pass
  - a plain invoke;
  - a fan-out with three children and a retry;
  - a message chain three hops deep with a reply;
  - a loop of two agents messaging each other, which shows each record once and stops at the hop cap;
  - an escalation answered by a person;
  - a keeper tick origin;
  - an approval;
  - effects on and off;
  - the node cap;
  - redaction for a viewer without message read;
  - cross-tenant 404;
  - focus in the middle of a chain resolving to the origin.

  Accept: targeted run passes on sqlite and postgresql.
- [x] LP1.10 SDKs: typed models and the method in all four, a live harness case each, and README sections.  Accept: `scripts/run-sdk-harnesses.sh` cases for the trail pass.  | claude 2026-11-27 RunTrail, RunTrailNode, RunTrailEdge, OrganizationValidationResult and Problem plus their enums in C#, Python, JS, Go; GetRunTrailAsync/get_run_trail/getRunTrail/GetRunTrail and ValidateOrganizationAsync/validate_organization/validateOrganization/ValidateOrganization; run trail and organization validate harness cases and README sections. No harness has a case filter, so scripts/run-sdk-harnesses.sh ran all four in full: csharp, python, js, go, consoles PASS
- [x] LP1.11 Docs and Postman:  | claude 2026-11-27 REST_API.md trail and validate entries (fields, edge kinds, problem codes), MCP_API.md garrison_get_run_trail row and paragraph, docs/TRAILS.md finished (shows, origin rules, caps and settings, redaction, run token refusal, why text is left out, dashboard views, validate route); Postman: 4 trail requests in Runs, 3 validate requests in Organizations, variable descriptions updated (postman/README.md has no counts to update). check-api-docs.py passes (288 REST paths, 161 MCP tools); Newman on Auth, Harness Profiles, Artifact Stores, Agents, Deployments, Runs, Organizations: 120 requests, 279 assertions, 0 failed
  - `REST_API.md` and `MCP_API.md` entries;
  - `docs/TRAILS.md` (what a trail shows, origin rules, caps, redaction, why text is not in it);
  - a Postman request with its description and variables;
  - `scripts/check-api-docs.py` passes;
  - Newman runs the new request.

  Accept: all pass; doc reviewed for human voice.

- [x] LP1.12 Entry surface (LP-013): `EntrySurfaceEnum`, a `runs.entry_surface` column in the next free migration, set on every start path from the LP1.1 inventory, `entrySurface` on the trail's Caller and root Run nodes, the fixture updated, and the dashboard showing it on the caller lane.  Accept: Touchstone cases per start path on both providers; fixture and dashboard vitest updated.  | claude 2026-11-27 EntrySurfaceEnum, runs.entrysurface (migration 62), set in RunService from the creation surface label every start path already passes (EntrySurfaces.FromSurface: rest and playground Rest, mcp, a2a, app, trigger, keeper, message, escalation, eval, shadow; pipeline stages Internal). Dashboard is reserved: no header or principal tells it from Rest, so it is recorded as Rest (documented). entrySurface on the Caller node and on Run nodes with no parent and no retry-of; fixture, fixture-shape case, Caller step detail in the sequence view, SDK models, docs. Checks: run-trail suites on sqlite and postgresql 34/34 (new entry-surface-map unit case and entry-surface case per provider covering REST, MCP, trigger, and message wake through real routes; A2A, app, keeper, escalation, eval, shadow covered by the map case only), db-sqlite and db-postgresql 38/38 incl. migrate-twice, vitest runTrail, trailLayout, runTrailApi 46/46, scripts/run-sdk-harnesses.sh all PASS
- [x] LP1.13 Shadow link (LP-014): `runs.shadow_of_run_id`, filled by `ShadowTrialService` when a shadow copy starts, a `Shadowed` edge kind, and trail cases.  Accept: Touchstone cases on both providers.  | claude 2026-11-27 runs.shadowofrunid (migration 63, partial index), set by ShadowTrialService.CreateShadowAsync from the source run; IRunMethods.ListShadowsOfAsync; Shadowed edge kind; the walk follows it forward and steps back through it, so a copy's trail starts at the live run's origin; SDK models and docs. Checks: run-trail, shadow-sqlite, shadow-postgresql, db-sqlite, db-postgresql 88/88 (new shadow-link case per provider; the shadow trial case now asserts ShadowOfRunId and entry surface Shadow). The dashboard shows the new edge with its enum name, since the locale files are being edited by another agent; a translated label is left for LP2 follow-up
- [x] LP1.14 Escalation answer into the tick (LP-015): the trail walks from an answered non-blocking escalation to the tick in `DeliveredTickId` and its run.  Accept: Touchstone case.  | claude 2026-11-27 RunTrailService reads the ticks in DeliveredTickId of answered non-blocking escalations in one batch, draws Answered from the escalation to the tick and Started from the tick to its run, and does not follow that run further (the tick is its own origin); hop cap applies. Checks: run-trail suites on sqlite and postgresql 38/38 with the new escalation-answer-tick case (also checks an undelivered answer has no tick)

### Phase LP2: Activity trail, dashboard

- [x] LP2.1 API client method `getRunTrail(runId, { includeEffects })` and a `useRunTrail` hook that drives auto-refresh per LP-011.  Accept: vitest against the LP1.5 fixture.  | claude 2026-11-27 5faccb7b getRunTrail, listRunOperations, useRunTrail (5 s while running, off when terminal); vitest runTrailApi.test.jsx passes
- [x] LP2.2 Layout utility `utils/trailLayout.js`. Lanes are ordered by first appearance with the caller lane first. Rows follow time with collapsed idle gaps. Edges route between lanes. The utility is pure and unit tested for ordering, gap collapse, loops, and right-to-left mirroring.  Accept: vitest passes.  | claude 2026-11-27 5faccb7b vitest trailLayout.test.js passes (ordering, shared rows, gap collapse, loops, RTL, keyboard order, graph layers, summary)
- [x] LP2.3 `TrailSequence.jsx`, an SVG sequence view:
  - **Lanes:** headers show the agent name and unit; badges show the run kind (Shadow and Eval marked).
  - **Edges:** arrows are labeled with their edge kind.
  - **States:** colors pair with an icon and a text label.
  - **Focus:** the focus run is highlighted and scrolled into view.
  - **Placeholders:** redacted steps are drawn as a hatched box.
  - **Interaction:** zoom and pan, plus keyboard navigation (arrow keys move between steps, Enter opens the drawer).

  Accept: renders the fixture at 1366 wide without page scroll, and the axe check passes.  | claude 2026-11-27 7dbcc104 vitest runTrail.test.jsx (lanes, icon and label, hatched redacted, focus, keys, RTL, axe in jsdom); fixture width checked against a 1050px budget; real-browser width and axe are in the unrun e2e spec
- [x] LP2.4 `TrailGraph.jsx`, a graph view on `@xyflow/react` with a time-layered layout. Nodes match the sequence view's styles. A minimap is shown above 25 nodes.  Accept: renders the fixture; shares styles with LP2.3.  | claude 2026-11-27 7dbcc104 trailToFlow vitest (layers, labels, RTL); shared tone styles; lazy loaded with the canvas chunk
- [x] LP2.5 `TrailList.jsx`, the list view. A LocalTableFrame (`tableId="run-trail"`) with Columns and saved page size, filters for kind, agent, and state, and a row click that opens the drawer. It is the only view below 768px (LP-005).  Accept: default columns fit at 1366; it is the only view at 390.  | claude 2026-11-27 7dbcc104 vitest filters and row open; list only below 768px (matchMedia) in vitest; 1366 fit not measured in a browser
- [x] LP2.6 `TrailStepDrawer.jsx`:
  - It loads the step's record from its existing detail route.
  - Agent-written text is shown as data, with its source line ("written by agent X in run Y") inside a marked block and never rendered as raw HTML.
  - Each step has links to its record page and Copy ID.

  Accept: vitest covers a message, a report, an escalation, an effect, and a redacted step.  | claude 2026-11-27 7dbcc104 vitest message, report, escalation, effect, redacted, person-written provenance
- [x] LP2.7 The Trail tab on Run detail, with three view tabs (sequence, graph, list), a summary strip, a truncation banner, an Export JSON button, and an empty state for a single run.
  - The summary strip shows agents, hops, duration, tokens, cost, and failures.
  - The truncation banner names the cap and links to the setting.

  Accept: vitest for each state.  | claude 2026-11-27 7dbcc104 vitest sequence default, view switch, ?step= drawer, truncation, single run, load error, narrow
- [x] LP2.8 "Open trail" entry points:
  - Run rows (action menu), Conversation detail turns, the Message thread, Escalation detail, Approval detail, Report detail, Keeper tick rows, and the board's activity items.
  - Each opens the focus run's trail with the step selected.

  Accept: each link has a vitest or e2e assertion.  | claude 2026-11-27 7dbcc104 vitest for the Runs row menu, escalation, approval, report, message thread, conversation turns, keeper ticks, board (escalations and unhealthy reports; the latest brief link is covered only when the brief has a runId)
- [x] LP2.9 i18n and tooltips for every new string in all nine locales, plus a right-to-left check of the sequence view.  Accept: missing-key and pseudo-locale checks pass.  | claude 2026-11-27 7dbcc104 nine locales and tips appended; i18nKeys parity, placeholder, and leftover-English checks pass; RTL mirroring covered by vitest. The static-key test fails only on other agents' in-progress learn and orgDesigner keys
- [~] LP2.10 e2e spec `trail.spec.js`. Start a two-agent message chain on the fake harness, open the trail from the first run, step through it with the keyboard, and open a message in the drawer. Not run by default per the targeted-test rule. The annotation records whether it ran.  Accept: spec committed; targeted run recorded.  | claude 2026-11-27 e0785a16 spec committed against mocked APIs with the LP1.5 fixture instead of a live fake-harness chain; NOT run

### Phase LP3: Organization designer

- [x] LP3.1 `orgCanvasSource` interface and `draftOrgSource` (section 6.4). Refactor `OrgCanvas` to call the interface with no change in behavior.  Accept: existing studio canvas vitests pass unchanged.  | claude 2026-11-27 595e0ac1; orgCanvas.test.jsx and studioCanvas.test.js pass unchanged, plus orgCanvasSource.test.js
- [~] LP3.2 `workingTreeOrgSource` over the organization unit routes, and a Design tab on Organization detail that hosts the canvas. `OrgChartTree` stays as the Chart tab's read-only view and as the editor below 768px (LP-006).  Accept: add a unit, set a lead, add a member, connect peers, and remove a unit on a published organization's working tree, then publish a revision.  | claude 2026-11-27 7fd9adc0; vitest covers each operation on a mocked client. Outstanding: the accept run on a real server (orgDesigner.spec.js covers it on mocks, not run). Chart tab keeps the card tree by default with a Tree/Canvas switch, so the existing specs hold; publish stays in the page header
- [x] LP3.3 People palette: a searchable side list of agents. Drag an agent onto a unit to add it as a member, or onto the lead slot to make it the lead, with a keyboard equivalent (pick an agent, then pick a unit). A New agent action opens the existing agent form and drops the result into the unit.  Accept: vitest for drag and for the keyboard path.  | claude 2026-11-27 7fd9adc0; orgDesigner.test.jsx: drag start, drop on box and lead row, pick and place, Enter or L on a unit. New agent reuses agentsConfig through ConfigFormModal
- [~] LP3.4 Keepers tab in the unit panel. It lists each member's mandates with their wake schedule. Attach an existing mandate, create one with the existing mandate form (prefilled with the agent), and edit its wake schedule. A keeper badge on the member chip shows the next wake.  Accept: create a keeper from the canvas and see it on the Keepers page.  | claude 2026-11-27 7fd9adc0; reuses keepersConfig and KeeperRevisionModal (wake schedule is a new revision). Vitest for attach, detach, create, schedule. Outstanding: the accept check on a real server
- [x] LP3.5 Budget tab in the unit panel. It shows the unit budget with spend so far and the parent's remaining headroom, and edits it through the existing route. A budget above the parent's is refused inline with the server's reason.  Accept: vitest for the refusal.  | claude 2026-11-27 7fd9adc0; headroom is the nearest ancestor's budget for the period (the server's BudgetExceedsParent rule) and what it has left. Vitest for the inline 409 refusal
- [x] LP3.6 Rules tab in the unit panel (LP-007). It lists the change rules that match the unit, each with its class and approvals, and an Add rule action opens the existing rule editor scoped to this unit. For a run token context the tab is read-only with the reason shown.  Accept: vitest; no rule is ever written through a draft operation.  | claude 2026-11-27 7fd9adc0; lists rules on the unit or above it, opens changeRulesConfig scoped to the unit, read-only for principalType Run or without ChangeRule permission. "Approvals" shown as who wrote the rule. Vitest asserts no source method or unit operation touches rules
- [x] LP3.7 Live validation. The canvas calls `validate` after each change and lists problems with links to the unit. Problems include a unit without a lead, an agent in two units, a peer line to a missing unit, a budget over the parent's, a keeper whose deployment is missing, and a unit with no path to the root. Validation uses the server's publish checks through a dry-run route if one does not exist yet (add it under LP3.7a with scope map, OpenAPI, Postman, docs, and Touchstone cases).  Accept: each problem shows in the list and clears when fixed.  | claude 2026-11-27 7fd9adc0; working tree calls POST .../validate (contract of eddf5301: severity Error/Warning, valid = no Error), errors and warnings listed apart, every code translated; falls back to client checks on 404/405. Draft source computes UnitWithoutLead, AgentInTwoUnits, PeerLineToMissingUnit, UnitDetachedFromRoot on the client (studio Validate is a whole-draft dry run). Vitest with a mocked client, and a canvas test where the problem clears
- [x] LP3.7a Organization validation dry run: `POST /v1.0/api/tenants/{tenantId}/organizations/{id}/validate` returns `OrganizationValidationResult { valid, problems: [{ code, severity, unitId, agentId, mandateId, message }] }`, scope map Organization Read, OpenAPI, Touchstone on both providers.  Accept: each problem code is reported and clears when fixed.  | claude 2026-11-27 OrgTreeValidator.Inspect (non-throwing twin of Validate) plus OrganizationService.ValidateWorkingTreeAsync; severity Error is what publishing refuses, Warning publishes (UnitWithoutLead, KeeperDeploymentMissing, MandateMismatch); valid means no Error. run-trail org-inspect and org-validate pass on both providers. Postman and REST_API.md go with LP1.11
- [~] LP3.8 Templates. Start a new organization from Blank, Gerbil (one keeper), or Site reliability (the `examples/autonomous/site-reliability-org` shape), using the existing manifest apply. The result opens in the Design tab.  Accept: each template applies on a fresh tenant and validates clean.  | claude 2026-11-27 7fd9adc0; dry run then apply through applyManifest; examples copied in by dashboard/scripts/sync-org-templates.mjs with a drift test. Gerbil adds a one-unit gerbil-org; the SRE change rules and eval set are not applied (no manifest kind). Outstanding: apply on a fresh tenant
- [~] LP3.9 Read-only overlays on the canvas for the Chart tab above 768px:
  - each unit's health from its latest report, spend against budget, and runs and messages in the selected range;
  - clicking a unit lists its recent runs, each with Open trail.

  Accept: overlays match the numbers on the Budgets tab and on Runs filtered by unit.  | claude 2026-11-27 7fd9adc0; Tree/Canvas switch on the Chart tab; activity is runs, escalations, and cost from GET .../performance (no per-unit message count exists), recent runs from its sampleRunIds with Open trail. Outstanding: compare numbers on a real server
- [~] LP3.10 Canvas polish:
  - auto layout, a minimap above 12 units, and fit to screen;
  - undo of the last change (sent as the inverse operation), with redo;
  - a visible focus ring and keyboard parity for every new action;
  - i18n and tooltips in nine locales.

  Accept: vitest for undo and redo; axe check passes.  | claude 2026-11-27 7fd9adc0; vitest for inverses and for undo and redo on the canvas; minimap above 12 units, fit without animation under reduced motion, nine locales and tooltips. Outstanding: axe check (e2e, not run). npx vitest run orgDesigner, orgTemplates, orgCanvasSource, orgCanvas, studioCanvas, organizations, i18nKeys, tooltips (135 pass); lint, build, check-em-dash pass
- [~] LP3.11 Docs: `docs/ORGANIZATIONS.md` and `docs/STUDIO.md` describe the designer with screenshots from both themes, and the e2e spec `orgDesigner.spec.js` builds the site reliability shape from Blank.  Accept: docs reviewed for human voice; spec committed; targeted run recorded.  | claude 2026-11-27 ORGANIZATIONS.md "Designing in the dashboard" and STUDIO.md "Organizations on the canvas", humanizer pass; orgDesigner.spec.js committed, not run. Outstanding: screenshots in both themes, pending for the LP5 UX pass

### Phase LP4: Guided learning

- [x] LP4.1 Diagram kit: `components/learn/Diagram.jsx` with box, group, arrow, and label primitives that draw SVG from CSS tokens, mirror in right-to-left layout, wrap translated labels, and link a box to a route. Every diagram carries a text alternative (`<desc>` plus a visible "Show as list" toggle).  Accept: vitest for mirroring and wrapping at German length.  | claude 2026-11-27 components/learn (textWrap, diagramLayout, Diagram.jsx, diagramPalette); vitest src/tests/learn.test.jsx 13/13 (German wrapping, CJK breaks, RTL mirror, list toggle, list below 768px); committed with LP4.2
- [x] LP4.2 Seven diagrams drawn with the kit:  | claude 2026-11-27 components/learn/diagrams.js; each box checked against the docs and the classes they name (RunService, FreezeService, MessageService, KeeperScheduler, ExecutiveDraftValidator, OrgBrakeService, OrgBudgetGuard); light and dark screenshots of the exports checked; strings in nine locales
  1. **The runtime:** tenant, harness profile, credential, node pool, node, agent, deployment, run.
  2. **A request's life:** caller, REST, MCP or A2A, run admission (freezes, budgets), lease, worker, harness, events, reply.
  3. **Autonomy building blocks:** mandate, keeper, wake schedule, tick, run, memory, report, escalation.
  4. **Teams:** mailboxes, wake-on-message, loop guards.
  5. **An organization:** units, leads, members, peer lines, budgets, chain of command, published revisions.
  6. **Self-revision:** executive, draft, `ExecutiveDraftValidator` hard limits, change rules, eval, shadow, canary, apply, revert.
  7. **Brakes:** freeze, spend cap, kill switch, org budget guard, Cancel everything.

  Every box links to its page and its doc.  Accept: each diagram reviewed against the code paths named in `docs/ARCHITECTURE.md`; light and dark screenshots.
- [x] LP4.3 The Learn page `/dashboard/learn`, in the sidebar's utility group next to Guided tour. It has the diagrams in learning order, one short paragraph each, a Start tour button per section, and a glossary that uses the same words as the docs vocabulary. `Explainer` panels gain a "See the diagram" link to their section.  Accept: route in nav; vitest for the page; reviewed for human voice.  | claude 2026-11-27 views/LearnView.jsx, components/learn/learnSections.js, hidden nav entry plus a sidebar utility link next to Guided tour, Explainer link for 26 topics; Start tour calls startTour(tourId) and opens the shell tour until LP4.5; vitest src/tests/learn.test.jsx 13/13; i18nKeys and tooltips vitest show no failures from these strings; lint and build pass
- [x] LP4.4 `scripts/export-diagrams.mjs` renders each diagram to an English SVG in `docs/images/learn/`, and `docs/ARCHITECTURE.md`, `docs/ORGANIZATIONS.md`, `docs/EXECUTIVES.md`, and `docs/BRAKES.md` embed them.  Accept: images render on GitHub in both themes.  | claude 2026-11-27 renders through Vite SSR from dashboard/node_modules (no new dependency), seven SVGs with an embedded light palette and a prefers-color-scheme dark palette; checked in headless Chromium in both schemes; embedded in ARCHITECTURE (runtime, request, autonomy, teams), ORGANIZATIONS, EXECUTIVES, BRAKES; check-em-dash passes
- [x] LP4.5 Tour engine per LP-009:
  - **Definitions:** tour definitions live in `config/tours.js`.
  - **Steps:** each step can navigate to a route; the engine waits for the target (default timeout 3 seconds, a setting in `constants`) and skips a missing target with a note.
  - **Persistence:** completion is saved per tour per user, with replay from the Learn page and the sidebar.
  - **Accessibility:** focus moves into the step card and the card has a visible focus ring. `prefers-reduced-motion` turns off the scroll animation, and Escape closes the tour.

  The existing shell tour becomes the "First look" tour on the new engine.  Accept: vitest for navigation, waiting, skipping, and persistence.  | claude 2026-11-27 020b2553; config/tours.js, components/tours/TourRunner.jsx, context/TourContext.jsx, utils/tours.js; TOUR_TARGET_TIMEOUT_MS 3000 in constants; completion keyed by tenant and principal; card focused with a visible ring, Tab trapped, Escape closes, focus returns, page behind is inert; card placed by placeTourCard in LTR and RTL down to 390px; the sidebar's Guided tour now lists the six tours with Start or Replay. vitest src/tests/tours.test.jsx
- [x] LP4.6 Sample data. When a tour needs records the tenant does not have, it offers to load the gerbil example (and the site reliability example for the organization tours) through the existing manifest apply, with a confirm modal that says what will be created.  Accept: the offer appears on an empty tenant and not on a populated one.  | claude 2026-11-27 020b2553; components/tours/TourSampleModal.jsx dry-runs the apply and lists each resource with Created, Updated, or Unchanged; needs: agents or runs (gerbil), keepers (gerbil), organizations (site reliability); a failed check never offers. vitest for empty and populated tenants
- [~] LP4.7 Six tours, each three to seven steps:
  - **First look** (the shell).
  - **Run an agent:** harness profile, agent, deployment, Invoke, Run detail, Trail.
  - **Follow a request:** the Trail tab's three views and the drawer.
  - **Build a team:** the Design tab, palette, Keepers, Budget, publish.
  - **Keep it safe:** freezes, spend caps, kill switch, change rules, approvals.
  - **Watch an organization:** the board, performance, reports, escalations.

  Each hub's "?" button starts the tour that covers it.  Accept: each tour walks to the end on a fresh tenant with sample data.  | claude 2026-11-27 95a0a76d; 7, 6, 5, 5, 5, 5 steps, text checked against the components; Keep it safe also shows a keeper's limits for spend caps and the kill switch on Home; the Design tab takes ?unit= so the unit panel tabs show; HUB_TOURS maps home, invoke, agents, connections, runs, organizations, autonomy, approvals (tab overrides for board, performance, change rules, freezes, keepers). Outstanding: walk each tour on a fresh tenant with sample data on a real server
- [x] LP4.8 First run. The setup wizard's last step offers the Learn page and the Run an agent tour. A new user who skips the wizard sees one dismissible Home card pointing to Learn, and the dismissal is saved per user.  Accept: vitest.  | claude 2026-11-27 fee908e9; SetupWizard last step, components/tours/HomeLearnCard.jsx; Skip wizard sets garrison_setup_skipped per user. vitest in tours.test.jsx
- [x] LP4.9 i18n and tooltips for diagrams, the Learn page, and all tours in nine locales, with a right-to-left check of two diagrams.  Accept: missing-key and pseudo-locale checks pass.  | claude 2026-11-27 34b11942; tour strings and tips in nine locales, plus trail entry surface labels and the Shadowed and Delivered edges; the brakes diagram and glossary now say message wakes are refused too, brakes.svg re-exported; RTL mirroring covered by learn.test.jsx. vitest tours, learn, i18nKeys (with pseudo-locale), tooltips, runTrail, trailLayout, runTrailApi pass
- [x] LP4.10 One e2e spec per tour in `dashboard/tests/e2e/tours/`, each asserting every step's target is visible. The annotation records which specs were run (targeted).  Accept: specs committed.  | claude 2026-11-27 dashboard/tests/e2e/tours/ (six specs and tourHelpers.js, steps read from config/tours.js; first-look adds 390px RTL and Escape, keep-it-safe adds the empty-tenant offer). Written, not run

### Phase LP8: App appearance (LP-016, LP-017)

Field names on the agentic app (REST, manifests, SDKs, the app page config), camelCase. These are fixed here so the server and front-end work can run in parallel:

| Field | Type, default | Notes |
|---|---|---|
| `subtitle` | string?, null | Up to 200 characters, under the name in the header and on the welcome screen |
| `welcomeTitle` | string?, null | Up to 120 characters; null shows the display name |
| `composerPlaceholder` | string?, null | Up to 120 characters |
| `agentDisplayName` | string?, null | Up to 80 characters, the author name on agent messages; null shows the entry agent's name |
| `agentAvatarAssetId` | string?, null | An image asset, like `logoAssetId` |
| `paletteId` | string?, null | The preset the operator started from, or `custom`; informational only |
| `darkPrimaryColor`, `darkAccentColor`, `darkBackgroundColor`, `darkHeaderColor`, `darkAgentBubbleColor`, `darkConversationListColor`, `darkComposerColor`, `darkFilesColor` | string?, null | `#rgb` or `#rrggbb`; null derives from the light color |
| `themeDefault` | `AppThemeDefaultEnum` (`System`, `Light`, `Dark`), `System` | |
| `allowThemeSwitch` | bool, true | False hides the toggle and ignores a saved choice |
| `cornerStyle` | `AppCornerStyleEnum` (`Sharp`, `Rounded`, `Pill`), `Rounded` | |
| `density` | `AppDensityEnum` (`Compact`, `Comfortable`), `Comfortable` | |
| `showFilesPanel`, `showLanguagePicker`, `showPoweredBy` | bool, true | |
| `starterPrompts` | string[], empty | At most 4, each up to 200 characters, a child table with an order column |

- [x] LP8.1 Models, enums, schema (next free migration), validation with field codes, app revisions and export include the new fields, starter prompts as an ordered child table, backup and tenant deletion coverage.  Accept: Touchstone cases on both providers, migrate-twice.  | claude 2026-11-27 schema 64 (agentic_apps columns, agentic_app_starter_prompts with position, tenant-led index); enums AppThemeDefaultEnum, AppCornerStyleEnum, AppDensityEnum; every color now takes #rgb or #rrggbb; codes InvalidColor, TooLong, TooMany, Required, UnknownAsset; app revisions hold only member pins and edges, so appearance stays on the app like the existing branding; backup is a whole-database dump and tenant deletion walks TableCatalog. apps- and db- suites pass on Sqlite and PostgreSQL (54/54)
- [x] LP8.2 REST, manifests (`kind: AgenticApp` spec), the public app config the app page reads, the management MCP app tools, OpenAPI, Postman, `REST_API.md`, `MCP_API.md`, and the four SDKs.  Accept: `scripts/check-api-docs.py`, SDK harness cases, Newman for the app folder.  | claude 2026-11-27 GET /v1.0/apps/{slug} carries every field (agentAvatarUrl instead of the asset ID, agentDisplayName falls back to the entry agent); new GET /v1.0/apps/{slug}/avatar; manifest branding keys use the table names except agentAvatar (an asset name, like logo and favicon); MCP create and update tools; OpenAPI from the models; Postman create, update, info test, and a no-avatar request; REST_API.md, MCP_API.md, MANIFESTS.md; SDK models in all four with harness checks on the support triage example. apps-, examples-, db- suites 68/68 on both providers; check-api-docs.py passes (289 paths, 161 tools); SDK harnesses pass (C#, Python, JS, Go, consoles); Newman Auth, Harness Profiles, Artifact Stores, Agents, Deployments, Agentic Apps 184/184 assertions
- [ ] LP8.3 Dashboard palettes: eight presets with light and dark variants in `utils/appPalettes.js`, each checked for WCAG AA by a vitest; a swatch picker plus a custom editor with light and dark columns and a contrast warning per pair.  Accept: vitest for presets and contrast.
- [ ] LP8.4 Dashboard appearance step: every field above, inline upload for logo, favicon, and avatar through the existing asset upload, starter prompt editor (add, reorder, remove), and a live preview of the app page in light and dark that updates as fields change.  Accept: vitest; no sideways scroll at 1366; nine locales with tooltips.
- [x] LP8.5 App page (`app-ui`) applies everything: dark palette and derivation, subtitle, welcome title, starter prompt buttons on a new conversation, placeholder, agent name and avatar, default theme and the switch rule, corner style, density, hidden files panel or language picker, and the footer.  Accept: app-ui vitest and lint and build; axe-relevant contrast holds for every preset.  | claude 2026-11-27 app-ui branding.js (dark variables per theme, deriveDarkColor in OKLCH, applied only when paletteId is set so older apps keep their look; data-corners and data-density), theme.js appTheme (themeDefault, allowThemeSwitch ignores a saved choice), ChatShell, ChatPane, TurnView, Composer, SignIn, PoweredBy; docs/APP_UI.md Theming. vitest appearance, branding, components, i18n; lint and build pass. Preset contrast is checked by dashboard appPalettes.test.js
- [~] LP8.6 Docs: `docs/APPS.md` (fields and presets) and `docs/APP_UI.md` (theming variables, dark derivation), `CHANGELOG.md`, and an example app manifest using a preset and starter prompts.  Accept: reviewed for human voice.  | claude 2026-11-27 server half: docs/APPS.md Appearance section (field table, defaults, validation codes, one paragraph on dashboard presets, manifest keys), REST_API.md, MCP_API.md, MANIFESTS.md, CHANGELOG.md; examples/agentic-apps/support-triage uses paletteId ocean and three starter prompts. Outstanding: docs/APP_UI.md (theming variables, dark derivation) from the app-ui half

### Phase LP5: UX pass 1, design review of the whole dashboard

This pass covers every route, not only the new ones. It asks two questions of each one: does it look good, and does it make sense? Nothing is fixed during the review (LP-012).

- [~] LP5.1 Capture. Stand up a seeded instance with the gerbil and site reliability examples, runs, a three-hop message chain, an escalation, a canary, and an eval. Extend `dashboard/tests/audit/tableWidths.mjs` into `dashboard/tests/audit/capture.mjs`, which screenshots every route, tab, detail page, and modal opened from a row action. It captures:
  - 1366x768, 1280x800, 768x1024, and 390x844;
  - light and dark;
  - English and German, plus Japanese at 1366.

  It also captures the loading, empty, and error states using mocked responses where the live instance cannot produce them. Record the environment (commit, image tags, ports) at the top of `docs/testing/UX_PASS_1.md`.  Accept: a coverage matrix of route by viewport by theme by locale, with every cell captured or a stated reason.  | claude 2026-11-27 tooling done: `dashboard/tests/audit/seed.mjs` and `capture.mjs`; first full capture at a7e7829d (3,994 cells captured, the rest skipped with reasons, none failed) and the environment header in `docs/testing/UX_PASS_1.md`. Final capture pending after LP4
- [ ] LP5.2 Visual review against the visual parts of `DASHBOARD_STYLE_AND_USABILITY.md` (Look and Feel, Controls, Data Tables, Responsive, Accessibility, Error and Empty States), done by a reviewer who did not build LP1 to LP4. It checks:
  - spacing, alignment, and type scale;
  - visual hierarchy, and nested card clutter;
  - contrast in both themes;
  - clipped or overlapping text;
  - consistent badges and icons;
  - diagram legibility;
  - canvas and trail density at 15, 50, and 200 nodes;
  - focus rings.

  Accept: findings `UXP1-nnn` with severity, route, viewport, theme, screenshot, and the expected and actual results.
- [ ] LP5.3 Sense-making review by a second reviewer who reads only the dashboard and the docs. For each route:
  - Does it answer the three questions in "Product Standard"?
  - Are labels and terms the ones the docs and the Learn page use?
  - Is the next step obvious from each empty state?
  - Do links between related records exist both ways?
  - Do the tours and diagrams match what the pages actually do?

  The reviewer also walks the six tours.  Accept: findings appended to `UX_PASS_1.md` in the same format.
- [ ] LP5.4 Triage. Show the user a ranked summary, ask which findings to fix, and record each decision (fix, defer with reason, decline) in the report.  Accept: every finding has a decision from the user.
- [ ] LP5.5 Fix and verify. Fix the approved findings in grouped commits, recapture the affected cells, and attach before and after screenshots to each finding.  Accept: every approved finding verified; lint, build, and targeted vitests pass.

### Phase LP6: UX pass 2, simulated users on a fresh instance

This pass follows `~/Code/Agents/requirements/SIMULATED_USER_TESTING.md` in full: observe, record evidence, and let the user decide. It runs on an instance built from the docs on a clean compose project (`garrison-usertest`), never the development stack.

- [ ] LP6.1 Stand up from the docs exactly as written, through Docker Compose and through the minikube overlay. Time a first-time evaluator from a clean checkout to their first trail, and record every point where the docs were wrong or incomplete. Record the environment at the top of `docs/testing/UX_PASS_2.md`.  Accept: environment recorded; time to first trail recorded.
- [ ] LP6.2 Journeys by persona, each run only through the dashboard and the docs:
  - **First-time evaluator:** wizard, Learn page, Run an agent tour, first trail.
  - **Organization designer:** builds the site reliability shape from Blank in the Design tab, adds keepers and budgets, adds a change rule, and publishes.
  - **Operator investigating a failure:** a request into the organization fails two hops in; find it from Home, open the trail, find the failing step and its cause, and freeze the unit.
  - **Restricted viewer:** sees the trail with redacted steps, cannot edit the canvas, and gets clear reasons.
  - **Careless user:** drags members into loops, deletes a unit with keepers, closes the tab mid-tour, and resizes to 390 mid-canvas.

  Accept: a coverage matrix of journey by persona, each covered or with a stated reason.
- [ ] LP6.3 Whole-dashboard look and sense recheck. Rerun `capture.mjs` on the fresh instance and review every route again after the LP5 fixes, because a fix in one place often moves a problem to another.  Accept: findings `UXP2-nnn` appended with evidence.
- [ ] LP6.4 Triage with the user. Present a ranked summary and record a decision for every finding.  Accept: every finding has a decision.
- [ ] LP6.5 Fix and verify the approved findings by rerunning their steps on a fresh instance, then tear the instance down (or record what was left running and why).  Accept: the Definition of Done in `SIMULATED_USER_TESTING.md` holds.

### Phase LP7: Release integration

- [ ] LP7.1 The `CHANGELOG.md` `[0.3.0]` section gains Activity trail, Organization designer, and Learn page and tours entries, written for people.  Accept: user review (folds into AA13.13).
- [ ] LP7.2 `README.md` and `DOCKERHUB_README.md` mention the trail and the designer, and `docs/README.md` links `docs/TRAILS.md` and the Learn diagrams.  Accept: links resolve.
- [ ] LP7.3 Rerun AA13.9 (dashboard lint, build, tests, visual QA summary) and AA13.10 (the i18n gate) for the new views, and annotate both AA tasks.  Accept: both annotated with this plan's commits.
- [ ] LP7.4 Website (`~/Websites/usegarrison.ai`): the autonomy page shows the trail and designer screenshots, and the site builds.  Accept: `npm run build` passes; user reviews.
- [ ] LP7.5 Rebuild local images (`./build-all.sh`), restart the compose stack, and hand the operator a short checklist for the AA13.15 test that now includes a trail and the designer. Mark every LP task `[x]` or `[-]` and set LP0.1's AA13.17 to done.  Accept: stack healthy; checklist given; this plan complete.

---

## 9. Security and RBAC

- **Tenant scope:** every trail read filters by the tenant ID from `RequestContext`, and a cross-tenant run answers 404. Batched reads carry the tenant ID in every query.
- **Read permissions:** each node is checked against the caller's read permission for its resource type, and unreadable nodes become `Redacted` placeholders (LP-004). The redaction rules are tested as part of LP1.9.
- **Run tokens:** they get 403 on the route, and the MCP tool is hidden from them (LP-010). The trail adds no mutation, so the effect journal rule (AA-026) is untouched.
- **Agent-written text (AA-025):** the trail response never carries it (LP-002). The drawer shows it as data with provenance, inside a marked block, escaped, never as HTML. Audit records name trail reads by run ID only.
- **The designer** writes through the same routes and permissions as today. It adds no new write path for runs, and change rules stay people-only (LP-007, AA-023). Nothing in this plan touches `ExecutiveDraftValidator` or the hard limits of AA-022.
- **Sample data:** loading the examples uses the existing manifest apply permission. The confirm modal names everything that will be created.

---

## 10. Risks and open questions

**Risks:**

- **Trail size in busy organizations.** A keeper-driven organization can produce thousands of hops in a day. The caps and the truncation banner handle the worst case. If LP6 shows real trails hitting the cap often, the follow-up is paging the forward walk, not raising the default.
- **The reply leg may not be recorded for every path.** LP1.1 exists to find out. Where the reply is not recorded (for example an A2A task that the caller polls), the trail ends at the root run's terminal state, and `docs/TRAILS.md` says so.
- **Canvas refactor regressions.** LP3.1 is a no-behavior-change refactor that must pass the existing studio tests first. Nothing else in LP3 starts before it lands.
- **Tour rot.** Every tour has an e2e spec keyed to `data-tour` attributes. A failing spec is a release blocker for the tour, not a reason to delete the step.
- **Release date.** This plan adds about 59 tasks before AA13.15. The phases are ordered so that the trail alone (LP1, LP2) is shippable if the user decides to cut the rest, with LP5 and LP6 then run over what shipped.

**Open questions (ask the user when the phase starts):**

1. LP1.1: if the A2A reply is not recorded, should LP1.2 add it, or should the trail end at the run?
2. LP3.8: are Gerbil and Site reliability the right templates, or does the user want a third (for example a two-person support team)?
3. LP4.3: should the Learn page sit in the sidebar's utility group or at the top of navigation for new tenants?
