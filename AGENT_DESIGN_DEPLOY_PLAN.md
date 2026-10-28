# Garrison Agent Design and Deploy Plan

This plan adds a way to design, test, version, deploy, and use agentic apps on Garrison. An agentic app is a small group of agents with one entry agent that talks to a person or to the outside world and calls the others. Users build apps in a studio, which is itself a Garrison agent, and end users reach each app through its own chat UI.

This document is a companion to `GARRISON_PLAN.md`. It uses the same conventions (section 1 of that plan) so the two can be tracked side by side, but its task IDs use the `AD` prefix and its decisions use `AD-` numbers, so nothing here collides with a `P` task or a `D-` decision.

| | |
|---|---|
| Parent plan | `GARRISON_PLAN.md` (last decision at plan creation: D-063) |
| Product version | `0.1.0-alpha` (unchanged by this plan; versions change only on explicit user approval) |
| Plan created | 2026-10-28 |
| Plan owner | Joel Christner |
| Status | Planning only. No source code has changed for this plan. |

---

## Table of Contents

1. [How To Use This Plan](#1-how-to-use-this-plan)
2. [Progress Dashboard](#2-progress-dashboard)
3. [Purpose and Scope](#3-purpose-and-scope)
4. [Current State and Gaps](#4-current-state-and-gaps)
5. [Vocabulary](#5-vocabulary)
6. [Decision Log](#6-decision-log)
7. [Architecture](#7-architecture)
8. [Work Breakdown](#8-work-breakdown)
9. [Security and RBAC](#9-security-and-rbac)
10. [Risks and Open Questions](#10-risks-and-open-questions)
11. [Use Case Walkthrough: Research Overview](#11-use-case-walkthrough-research-overview)

---

## 1. How To Use This Plan

Every unit of work is a checkbox with a stable ID such as `AD3.2`. The ID never changes once assigned, even if the task moves or gets dropped. Commits, pull requests, and mission notes reference it.

Status markers are the same as in `GARRISON_PLAN.md`:

| Marker | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | Partial: implemented or tested, with outstanding acceptance, scale, depth, or coverage stated on the task row |
| `[x]` | Done and verified (tests or a described manual check) |
| `[-]` | Dropped or deferred, with a reason in the annotation |
| `[!]` | Blocked, with the blocker in the annotation |

Annotation format: `  | <who> <YYYY-MM-DD> <short note, commit hash, or PR>`

Example (illustrative only; the row text is shortened here, and real rows keep their full text and `Accept:` note):

```
[x] AD1.1 ... Accept: ...  | claude 2026-11-02 schema 35, both providers (revisions-* suite)
[!] AD6.7 ... Accept: ...  | jc 2026-11-20 blocked on approval to serve the app UI from the dashboard image
```

Each task row ends with an acceptance note that starts with `Accept:`. A task is `[x]` only when that note is true. The default bar from `GARRISON_PLAN.md` still applies on top of it: the build has zero warnings, and the change is covered by a test or a written manual check.

Each task is sized so one captain can finish it as one mission. When a task turns out larger, split it into new IDs (for example `AD3.2a`) rather than rewriting it.

Rules that carry over from the parent plan and the repository's `CLAUDE.md`:

- Decisions that change architecture go in the [Decision Log](#6-decision-log) with the next `AD-` number, and affected sections are updated in the same change.
- When scope changes, add a task with a new ID. Do not silently rewrite a finished task.
- Update the [Progress Dashboard](#2-progress-dashboard) by hand when a phase changes state.
- Every schema change ships for both supported databases, Sqlite and Postgresql (D-011), with migrate-twice tests.
- Every new route and MCP tool gets an operation scope map entry, OpenAPI metadata, Postman coverage, and documentation.
- Every new prompt text comes from a `PromptTemplate` (D-006, D-021). That includes the studio agent's own system prompt.
- Every new dashboard or app UI element carries a translated tooltip (D-030) in all shipped locales.
- Plain ASCII only. Never use em dashes.

---

## 2. Progress Dashboard

| Phase | Name | Depends on | Status | Done / Total |
|---|---|---|---|---|
| AD1 | Agent revisions and environments | none | Not started | 0 / 10 |
| AD2 | Agent assets | AD1 | Not started | 0 / 9 |
| AD3 | Conversation file space | AD1 | Not started | 0 / 9 |
| AD4 | Agent catalog and capability registry | AD1, AD2 | Not started | 0 / 8 |
| AD5 | Parallel fan-out and gather | AD3, AD4 | Not started | 0 / 9 |
| AD6 | Agentic app resource and per-app chat UI | AD1, AD3 | Not started | 0 / 12 |
| AD7 | Studio agent and management tools | AD1, AD2, AD4, AD6 | Not started | 0 / 11 |
| AD8 | Studio visual editor | AD7 | Not started | 0 / 7 |
| AD9 | Playground, deploy, and promote experience | AD7 | Not started | 0 / 8 |
| AD10 | Reference converter agent, MCP binding, and research example | AD2, AD4, AD5, AD6 | Not started | 0 / 7 |
| AD11 | Later: eval sets and promotion gates | AD9 | Later (AD-007) | 0 / 6 |

Total active tasks (AD1 to AD10): 90. Later tasks (AD11): 6.

Dependency graph (an arrow means "must land before"):

```
AD1 revisions/environments --+--> AD2 assets ----------+--> AD4 catalog/capabilities --+--> AD5 fan-out/gather --+
                             |                         |                               |                        |
                             +--> AD3 file space ------+-------------------------------+                        |
                             |                         |                                                        v
                             +-------------------------+--> AD6 agentic app + app UI --> AD7 studio agent --> AD8 visual editor
                                                                                             |
                                                                                             +--> AD9 playground/deploy/promote --> AD11 (later) evals
AD2 + AD4 + AD5 + AD6 --> AD10 reference converter, MCP binding, research example
```

AD2 and AD3 can run in parallel after AD1. AD4 can start once AD2's data model (AD2.1) has landed. AD8 and AD9 can run in parallel after AD7.

Milestones for this plan:

| Milestone | Definition | Phases |
|---|---|---|
| **ADM1: Building blocks** | Revisions, environments, assets, conversation file space, catalog, and fan-out work through REST, MCP, and SDKs, without the studio. | AD1 to AD5 |
| **ADM2: Apps** | An agentic app can be defined by manifest, deployed, and used by end users through its own chat UI with a file panel. | AD6, AD10 |
| **ADM3: Studio** | The agent architect builds, tests, deploys, and promotes an app from chat or canvas. | AD7 to AD9 |
| **ADM4: Quality gates (later)** | Eval sets run against revisions and gate promotion. | AD11 |

---

## 3. Purpose and Scope

### 3.1 The problem

Garrison runs agents well, but building a useful multi-agent app on it today takes an operator who knows the configuration model by heart: harness profiles, prompt templates, deployments, delegation allow lists, MCP servers, artifact globs, and manifests. Changes go straight to live configuration because agents have no revisions. Files an agent writes disappear between turns unless artifact globs collect them, and a child agent cannot hand files to its parent. A parent can call children only one at a time in a blocking call or start them and poll each one. End users have no place to talk to an app except the operator dashboard.

### 3.2 What this plan delivers

1. Immutable agent revisions with draft and published states, plus environments (`dev`, `staging`, `prod`) as deployment labels, with promotion and rollback.
2. Versioned agent assets (system prompts, skills, reference files, document templates) stored in artifact stores and placed into each run's workspace where its harness expects them.
3. A conversation file space shared by a conversation's turns and by every run in a delegation tree.
4. An agent catalog and a capability registry that describe Garrison agents, external MCP tools, and harness built-ins the same way.
5. Parallel fan-out with a gather step, timeouts, partial results, cancellation, and budget limits.
6. An agentic app resource with one entry agent, and a separate branded end-user chat UI per app with a file panel and a shareable URL.
7. A studio that is itself a Garrison agent (the agent architect), used through chat or a visual canvas over the same draft, which builds a draft manifest bundle, shows a diff, dry-runs it, and applies it only after the user approves.
8. A playground for test invocations against draft revisions, plus deploy and promote from the studio.
9. A reference document converter agent, a pattern for binding external MCP servers with credentials, and a full example app for the research use case.
10. Later: eval sets and eval gates before promotion.

### 3.3 Out of scope

- A new tenancy concept. Environments are labels on deployments (AD-003).
- Changes to the worker lease protocol beyond adding fields to `ExecutionSpec`.
- A hosted marketplace. Manifest bundles (P12.21) remain the exchange format.
- Version number changes or package and image publication, unless the user approves them separately.
- Editing `GARRISON_PLAN.md`. When work from this plan lands, a separate change adds a pointer and any cross-cutting `D-` decision to it.

---

## 4. Current State and Gaps

This section records what exists at commit `e65cb5c` (schema version 34) and what each gap means for this plan. File references are relative to the repository root.

### 4.1 What exists

| Area | What exists | Where |
|---|---|---|
| Agents | `Agent` with kind `Hosted` or `Remote`, input mode, `inputSchemaJson` and `outputSchemaJson`, delegation mode (`None`, `AllowList`, `Any`), `DelegationMaxDepth` (0 to 10, default 2), `DelegationAllowRecursion`, child table `agent_delegation_allowlist`, MCP tool exposure. A `Version` counter increments on change; there are no stored revisions. | `src/Garrison.Core/Models/Agent.cs`, `src/Garrison.Core/Enums/DelegationModeEnum.cs`, `src/Garrison.Server/Routes/AgentRoutes.cs` |
| Deployments | One agent per deployment, harness profile, model, prompt bindings, resource bindings, overrides, parameters, allowed run overrides, node selectors, weight, `Version`. Runs snapshot the deployment version. No environment concept. | `src/Garrison.Core/Models/Deployment.cs`, `src/Garrison.Server/Routes/DeploymentRoutes.cs`, plan section 8.4 |
| Compile preview | `POST .../deployments/{id}/compile-preview` returns the `ExecutionSpec` with secrets redacted. | `DeploymentRoutes.cs` line 62, plan section 8.6 |
| Prompt templates | Versioned (`prompt_template_versions`), tenant-scoped resolution (D-022), render preview. | `src/Garrison.Core/Models/PromptTemplate.cs`, `PromptTemplateVersion.cs`, `docs/PROMPTS.md` |
| Delegation | `garrison_invoke_agent` (waits, or returns a run ID), `garrison_start_run` (async), `garrison_list_agents` filtered by the run's allow list, depth, cycle, and recursion checks, child reserve and `DelegationCapacityExhausted`. | `MCP_API.md` "Delegation from inside a run", `docs/SCALING.md` |
| Continuation | Opt-in `suspensionEnabled`: a run waiting on approvals or synchronous children releases its slot, archives `work/`, `home/`, `config/` as `.garrison/continuation.zip`, and resumes on any capable worker. | `docs/CONTINUATION.md`, `src/Garrison.Core/Models/ChildWaitRequest.cs` |
| Conversations | `Conversation` (`cnv_`): one agent, harness session ID, affinity node, active and last run, busy flag. Next turns go to the same agent. Transcripts export as Markdown or JSON. | `src/Garrison.Core/Models/Conversation.cs`, `MCP_API.md` "Conversations", `docs/TRANSCRIPTS.md` |
| Artifacts | Stores `Database`, `Filesystem`, `S3`; explicit deployment `artifactGlobs` only (D-046); epoch-fenced uploads; download-only URLs; `.garrison/` namespace reserved for internal state. | `docs/ARTIFACTS.md`, `src/Garrison.Server/Routes/ArtifactRoutes.cs`, `src/Garrison.Server/Services/ArtifactService.cs` |
| Pipelines | Ordered stages, each in its own workspace; handoff by `PipelineStage` template with result text, structured output, and artifact references (not file contents); human reviews. | `docs/PIPELINES.md` |
| Approvals | `Approval` (`apr_`) with kinds `Tool`, `Command`, `FileChange`; dashboard inbox; `approvals` WebSocket channel. | `src/Garrison.Core/Enums/ApprovalKindEnum.cs`, `WEBSOCKETS_API.md` |
| Management MCP | Tools to create, update, and delete agents, deployments, pipelines, triggers, notification endpoints, and to apply and export manifests. Hosted run tokens cannot use them. | `MCP_API.md` "Management tools", `docs/MANAGEMENT_MCP.md`, `src/Garrison.Server/Protocols/GarrisonMcpServer.cs` |
| Manifests | `garrison/v1` documents, multi-document apply in one transaction, `dryRun=true`, per-document results, export bundles with `followReferences`. | `docs/MANIFESTS.md`, `src/Garrison.Server/Routes/ManifestRoutes.cs` |
| RBAC | Built-in roles plus `AgentDeveloper`, `AgentOperator`, `AgentInvoker`; resource-scoped role assignments; an operation scope map for every route and tool. | Plan section 7.2, `src/Garrison.Server/Routes/OperationScopeMap.cs` |
| Triggers, quotas | Cron and signed webhook triggers; opt-in daily quotas (D-041). | `docs/TRIGGERS.md`, plan D-038 to D-041 |
| Executors | Process executor and `KubernetesJob` executor (run pod per run, spec over pods/attach, no credentials in the run pod, egress NetworkPolicy). | `src/Garrison.Worker/Execution/ProcessRunExecutor.cs`, `src/Garrison.Worker/Kubernetes/KubernetesJobRunExecutor.cs`, `RunPodManifestBuilder.cs`, D-033 |
| WebSocket | Channels `runs`, `run:{runId}`, `nodes`, `approvals`, `pipeline-run:{id}`. | `WEBSOCKETS_API.md` |
| Dashboard | Views for agents (`AgentsView.jsx`, `AgentDetailView.jsx`), deployments (`DeploymentsView.jsx`), conversations (`ConversationsView.jsx`, `ConversationDetailView.jsx`), invoke, manifests, artifacts, approvals; hub navigation (`views/hubs/HubView.jsx`); `SetupWizard.jsx` with steps `welcome`, `secret`, `manifest`, `invoke`. | `dashboard/src/views/`, `dashboard/src/components/SetupWizard.jsx` |
| SDKs | C#, Python, JavaScript/TypeScript, Go, each with a live test harness. | `sdk/{csharp,python,js,go}`, `scripts/run-sdk-harnesses.sh` |

### 4.2 Gaps this plan closes

| ID | Gap | Consequence today | Closed by |
|---|---|---|---|
| G-AD1 | No agent revisions. `Agent.Version` is a counter, not a stored snapshot. | Any edit goes live for every deployment; no draft, no diff, no rollback of agent definitions. | AD1 |
| G-AD2 | No environments. | Teams cannot hold a tested `prod` while iterating on `dev`. | AD1 |
| G-AD3 | System prompts are templates, but skills, reference files, and document templates have no home. Workspace templates hold seeded files, not versioned binary assets. | A `.dotx` template or a Claude skill must be baked into a git repository or an image. | AD2 |
| G-AD4 | Workspaces are per run. Pipelines pass artifact references, not files. Conversations keep files only on the affinity node or in continuation archives. | A child's output file is invisible to its parent, and user-facing files have no stable home across turns. | AD3 |
| G-AD5 | `garrison_list_agents` returns names and descriptions only; no schemas, cost, or latency hints; no view of MCP tools or harness built-ins. | An orchestrator cannot choose well among agents and tools. | AD4 |
| G-AD6 | Fan-out is `garrison_start_run` per child plus polling `garrison_get_run`. No group, join, group timeout, group budget, or group cancel. | Fan-out prompts are fragile and burn turns on polling. | AD5 |
| G-AD7 | No grouping of agents into an app, and no end-user surface outside the operator dashboard. | Every end user needs dashboard access to talk to an agent. | AD6 |
| G-AD8 | Hosted run tokens cannot use management tools, by design (P12.10). | An agent cannot act as a designer without a new, narrower grant. | AD7 |
| G-AD9 | Approvals cover harness permission prompts only. | There is no way to approve a configuration change proposed by an agent. | AD7 |
| G-AD10 | No test surface for unpublished configuration. Invoke always uses live deployments. | Users test in production. | AD9 |
| G-AD11 | No reference capability for document conversion. | The research use case cannot finish without custom work. | AD10 |

---

## 5. Vocabulary

| Term | Meaning |
|---|---|
| Agentic app | A named group of agents with one entry agent, the delegation edges between them, branding, auth settings, and a chat UI. Resource name `AgenticApp`. |
| Entry agent | The app's one agent that end users (or triggers, A2A, MCP) talk to. Usually an orchestrator. |
| Agent revision | An immutable snapshot of an agent's definition: description, schemas, delegation policy, prompt template version pins, asset version pins, capability bindings. States `Draft` and `Published`. |
| App revision | An immutable set of agent revisions plus the app graph, published together. |
| Environment | A label on a deployment: `dev`, `staging`, `prod`, or another operator-defined label. Not a tenant, not a namespace. |
| Promotion | Moving an app revision (or a single agent revision) from one environment's deployments to the next, recorded as a promotion record that can be rolled back. |
| Agent asset | A versioned file an agent needs at run time: system prompt, skill, reference file, or document template. Stored in an artifact store. |
| Asset placement | Where an asset lands in the run's workspace for a given harness, for example `.claude/skills/<name>/SKILL.md` for Claude Code. |
| Conversation file space | A file area tied to a conversation (or to a root run when there is no conversation) that every turn and every run in the delegation tree reads and writes. |
| Capability | Something an agent can use: another Garrison agent, a tool on an external MCP server, or a feature built into the harness. Described by a capability descriptor. |
| Agent catalog | The capability descriptors a given run may use, filtered by its delegation allow list and bindings. |
| Fan-out group | A set of child runs started together, with a join policy, timeout, and budget. |
| Gather | The step that collects results from a fan-out group, complete or partial. |
| Studio | The design and deploy experience. It is a built-in agent (the agent architect) plus dashboard views (chat and canvas). |
| Agent architect | The built-in studio agent, `builtin/agent-architect`. |
| Draft bundle | The studio's working set of manifest documents, not yet applied. |
| Playground | Test invocations against draft revisions inside the studio. |
| App UI | The end-user chat UI for one agentic app. Separate from the operator dashboard. |

---

## 6. Decision Log

AD-001 to AD-009 are decisions the user made. AD-010 onward are choices this plan makes where the request left room; each is marked "proposed" in its source until the user confirms it or work lands on it.

| ID | Decision | Rationale | Source |
|---|---|---|---|
| AD-001 | Design studio: the studio is itself a built-in Garrison agent (the agent architect) that runs as a normal deployment on a model and harness the user picks. It creates resources through Garrison's management tools and reuses conversations, approvals, and RBAC. The same studio offers two ways to work: no-code natural language chat, and a low-code visual editor (a canvas of agents and the delegation edges between them, plus property panels) that stays in sync with the same draft. The studio has two experiences: (a) designing agents, system prompts, and assets, and (b) setting deployment and runtime parameters. | The studio dogfoods the platform and inherits its security model instead of building a parallel one. | User, 2026-10-28 |
| AD-002 | What the studio produces: one or more agents, that is an agentic app. The usual shape is one orchestrator agent that talks to the human or the outside world and invokes other agents. An agentic app is modeled as a grouping of agents with one entry agent. The studio builds a draft manifest bundle, shows it as a diff, validates it with a dry run, and applies it only after the user approves. | Matches how multi-agent apps are actually built, and reuses manifests (section 8.5 of the parent plan) as the single change format. | User, 2026-10-28 |
| AD-003 | Versioning: immutable agent revisions with draft and published states, and promotion between environments (`dev`, `staging`, `prod`). Environments are deployment labels, not a new tenancy concept. Rollback is included. | Safe iteration without changing the tenancy model. | User, 2026-10-28 |
| AD-004 | Assets: a new versioned agent asset resource covering system prompts, skills (Claude Code `SKILL.md` and equivalents for other harnesses), reference files, and document templates such as `.dotx`. Assets are stored in the existing artifact stores and placed into the run workspace at run time, with harness-specific placement (for example `.claude/skills`). | Reuses storage that already handles Database, Filesystem, and S3 with fencing and limits. | User, 2026-10-28 |
| AD-005 | Agents using agents, all four in scope: (a) an agent catalog the orchestrator can query (capabilities, input and output schemas, cost and latency hints), filtered by the delegation allow list; (b) parallel fan-out without waiting, with a gather or join step, including timeouts, partial results, cancellation, and budget limits; (c) a file space that lasts for the whole conversation and is shared between parent and child runs, so files persist across turns and pass between agents; (d) the studio writes delegation allow lists and depth limits automatically from the app graph. | These are the four things an orchestrator needs that Garrison lacks today (gaps G-AD4 to G-AD6). | User, 2026-10-28 |
| AD-006 | Capabilities such as document conversion come from three sources, supported equally, and the studio helps users choose: (1) capabilities users build as Garrison agents (a reference converter agent ships as an example and template, backed for example by the DocConverter project or pandoc); (2) external MCP servers registered and bound to agents, with credential handling; (3) capabilities built into the harness itself (its shell, pandoc, or skills). A capability registry or descriptor lets the catalog and the studio treat all three the same way. | No single source fits every operator; one descriptor keeps the orchestrator's view uniform. | User, 2026-10-28 |
| AD-007 | Testing: a playground in the studio for test invocations against draft revisions, plus deployment from the studio, are in scope now. Saved eval sets and eval gates before promotion are a later phase, included in this plan and marked as later. | Get the build-test-deploy loop working first; formal evaluation follows. | User, 2026-10-28 |
| AD-008 | End users: each agentic app gets its own separate end-user chat UI, apart from the operator dashboard. It includes a panel to browse and download the files the agent produces (backed by the conversation file space), app-level branding and auth, and a shareable URL. | End users should not need operator access or see operator concepts. | User, 2026-10-28 |
| AD-009 | Plan format: follow `GARRISON_PLAN.md` conventions, split into chunks that can be dispatched as missions. | Lets the work run through Armada missions. | User, 2026-10-28 |
| AD-010 | A system prompt asset is a `PromptTemplate` version, referenced by the revision, not a separate copy of text. Skills, reference files, and document templates are binary or text files in an artifact store. | Keeps D-006 and D-021 (every prompt is a template) and avoids two ways to store prompt text. | Plan author, 2026-10-28, proposed |
| AD-011 | Asset content lives under a reserved `.garrison-assets/` key prefix in the tenant's chosen artifact store. Asset files are not artifacts: they do not appear in artifact listings and are not deleted by artifact retention. A tenant setting names the default asset store; with none set, the `Database` store is used up to `Assets.MaxFileBytes`. | Reuses store drivers and credentials while keeping assets and run outputs separate, as `.garrison/` already does for continuation state. | Plan author, 2026-10-28, proposed |
| AD-012 | Deployments pin an agent revision (`agentRevisionId`). A deployment with no pin follows the agent's latest published revision, which is how existing deployments behave after migration (each existing agent gets revision 1, published, built from its current row). | Existing installs are not a constraint (no existing installs, per user memory), but a clean default keeps manifests simple. | Plan author, 2026-10-28, proposed |
| AD-013 | Environment labels are a fixed column on `deployments` (`environment`, default `dev`), validated against a tenant list of allowed environments (default `dev`, `staging`, `prod`, ordered). Promotion order follows the list. | Matches AD-003 and keeps queries indexed without a new entity. | Plan author, 2026-10-28, proposed |
| AD-014 | The conversation file space is shared by every run in one delegation tree and by every turn of one conversation. Writes are optimistic per path: each write carries the base version it read; a write against a stale base is kept under a conflict name (`name.<runId>.ext`) and raises a `FileConflict` warning event. Nothing is silently overwritten. | Parallel children writing the same path is expected under fan-out (AD-005b); losing a file is worse than an extra file. | Plan author, 2026-10-28, proposed |
| AD-015 | File space sync happens at run start (download into `{{run.workspaceDir}}/files/` by default) and run end (upload changed files, epoch-fenced like artifacts), plus MCP tools for reads and writes during a run. | End-of-run sync covers the common case without a network filesystem; MCP tools cover mid-run hand-off. Works for both Process and KubernetesJob executors. | Plan author, 2026-10-28, proposed |
| AD-016 | Fan-out uses new MCP tools (`garrison_fan_out`, `garrison_gather`, `garrison_cancel_fan_out`) on top of existing child runs, and gather waits use the existing continuation child-wait path when `suspensionEnabled` is set. | Builds on proven delegation, capacity, and suspension code instead of a second scheduler. | Plan author, 2026-10-28, proposed |
| AD-017 | The studio agent gets management access through a new delegated grant: when a deployment sets `managementAccess: Drafts`, its run token may call studio draft tools only, acting for the human who started the conversation, with the intersection of that person's permissions and the draft scope. It never applies changes directly; applying needs a `DraftApply` approval decided by a person. | Keeps P12.10's rule that run tokens cannot change configuration, while letting the studio propose changes. | Plan author, 2026-10-28, proposed |
| AD-018 | Draft bundle items store manifest document text (YAML) per `(kind, name)` row, with a base hash for conflict checks. This is user-authored document text like prompt template content, and is listed as an unmanaged exception next to section 7.5 of the parent plan. | Manifests are already the change format (AD-002); parsing them into every entity's tables twice would duplicate the manifest service. | Plan author, 2026-10-28, proposed |
| AD-019 | The visual canvas edits the same draft through server-side graph operations. Neither the chat nor the canvas holds private state; both subscribe to a `studio-draft:{draftId}` WebSocket channel and use a draft version number for optimistic concurrency. | One source of truth makes "stays in sync" (AD-001) a property of the design, not of client code. | Plan author, 2026-10-28, proposed |
| AD-020 | The app UI is a separate single-page app in a new `app-ui/` directory (React 19 and Vite, like the dashboard), served from the existing dashboard image under `/apps/{appSlug}/` by default, talking to an app gateway route family `/v1.0/apps/{appSlug}/...` on the main port. A separate image is optional and needs the user's approval to publish. | Separate from the operator console in code, auth, and URL, without a new published image by default. | Plan author, 2026-10-28, proposed |
| AD-021 | App end users are Garrison users with a new built-in role `AppUser` assigned at resource scope on the app. An app can also allow anonymous sessions (off by default), which get a short-lived app session token limited to that app's own conversations. | Reuses identity and RBAC (AD-001 spirit) and keeps anonymous use explicit. | Plan author, 2026-10-28, proposed |
| AD-022 | The capability registry derives descriptors automatically (agents from published revisions, MCP tools from cached `tools/list`, harness built-ins from node probes) and allows manual descriptors for anything it cannot derive. Cost and latency hints come from existing run analytics over a bounded window. | Descriptors stay accurate without hand maintenance. | Plan author, 2026-10-28, proposed |
| AD-023 | The studio is a new top-level dashboard sidebar item (12 hubs). The tests that cap the sidebar (raised to 11 by D-037) move to 12. | The studio is a primary workflow, not a tab. Needs the user's confirmation because it amends D-037. | Plan author, 2026-10-28, proposed |
| AD-024 | The canvas uses `@xyflow/react` (React Flow, MIT). | Mature, accessible graph editing for React 19 without writing a canvas from scratch. | Plan author, 2026-10-28, proposed |

---

## 7. Architecture

### 7.1 How the pieces fit

```
  End user (browser)                   Operator / builder (dashboard)
        |                                     |
        v                                     v
  App UI  /apps/{slug}/              Studio view: chat panel | canvas | diff | playground
        |                                     |
        |  /v1.0/apps/{slug}/...              |  /v1.0/api/tenants/{t}/studio/...  + WS studio-draft:{id}
        v                                     v
  +------------------------------------------------------------------------------------+
  | Command (control plane)                                                            |
  |  App gateway -> conversation on entry agent      Studio service -> draft bundle     |
  |  Conversation file space service                  Manifest service (dry run, apply) |
  |  Capability registry + catalog                    Approvals (new kind DraftApply)   |
  |  Fan-out groups + gather                          Revisions, environments, promote  |
  |  InvocationCompiler: revision + assets + file space -> ExecutionSpec               |
  +------------------------------------------------------------------------------------+
        |  lease + ExecutionSpec (asset files, file space manifest)       ^ events, uploads
        v                                                                 |
  Worker (Process or KubernetesJob executor): place assets, sync files/, run harness
        |
        +-- harness calls Garrison MCP: catalog, fan-out, gather, files, (studio draft tools)
```

The agent architect is an ordinary hosted agent. Its runs call studio draft tools over Garrison MCP with a run token, exactly as an orchestrator calls `garrison_invoke_agent` today. The dashboard studio view is a client of the same studio service, so a change made on the canvas shows up in the agent's next tool call and a change the agent makes shows up on the canvas.

### 7.2 New and changed entities

New ID prefixes were checked against `src/Garrison.Core/Constants.cs` and the source tree at plan time; none collide.

| Entity | Prefix | Tables | Key fields | Phase |
|---|---|---|---|---|
| AgentRevision | `arv_` | `agent_revisions`, child `agent_revision_prompt_pins`, `agent_revision_asset_pins`, `agent_revision_allowlist`, `agent_revision_capabilities`, `agent_revision_tags` | Agent, number (per agent, starts at 1), state (`Draft`, `Published`), content hash, description, input and output schema (existing unmanaged JSON columns copied per revision), delegation mode, max depth, recursion, author, change note, published by and time. Immutable once `Published`. | AD1 |
| PromotionRecord | `pro_` | `promotion_records`, child `promotion_record_items` | App or agent, source and target environment, revision promoted, previous revision per deployment (for rollback), actor, time, kind (`Promote`, `Rollback`), outcome. | AD1 |
| AgentAsset | `aas_` | `agent_assets`, child `agent_asset_tags` | Tenant, name (unique per tenant), kind (`SystemPrompt`, `Skill`, `ReferenceFile`, `DocumentTemplate`), description, current version, prompt template ID when kind is `SystemPrompt`. | AD2 |
| AgentAssetVersion | `aav_` | `agent_asset_versions`, child `agent_asset_version_files` | Asset, number, store, per-file path, media type, bytes, SHA-256, author, change note. A skill is a directory, so a version has one or more files. | AD2 |
| HarnessAssetPlacement | (child of harness profile) | `harness_profile_asset_placements` | Asset kind, path template (for example `{{run.workspaceDir}}/.claude/skills/{{asset.name}}/`), whether the asset is also listed in the system prompt through a fragment template. | AD2 |
| ConversationFileSpace | `cfs_` | `conversation_file_spaces` | Tenant, conversation (nullable), root run (when there is no conversation), store, mount path, byte and file counts, limits, retention. | AD3 |
| ConversationFile | `cff_` | `conversation_files`, child `conversation_file_versions` | File space, path, current version, deleted flag; per version: bytes, SHA-256, media type, producing run, lease epoch, storage key, time. | AD3 |
| CapabilityDescriptor | `cap_` | `capability_descriptors`, child `capability_descriptor_tags`, `capability_descriptor_requirements` | Tenant, name, kind (`Agent`, `McpTool`, `HarnessBuiltIn`), source reference (agent ID, MCP server ID plus tool name, or harness type plus requirement), summary, input and output schema (unmanaged JSON, user or tool authored), cost hint, latency hint, derived or manual, last refreshed. | AD4 |
| FanOutGroup | `fog_` | `fan_out_groups`, child `fan_out_group_members` | Parent run, join policy (`All`, `Any`, `Quorum` with count), timeout, budget (max children, max cost USD, max tokens), status (`Running`, `Joined`, `TimedOut`, `BudgetExceeded`, `Cancelled`), per member: child run, label, status. | AD5 |
| AgenticApp | `app_` | `agentic_apps`, child `agentic_app_members`, `agentic_app_edges`, `agentic_app_environments`, `agentic_app_branding` | Tenant, name and slug (unique per tenant; slug unique cluster-wide for the URL), entry agent, members with roles, edges (caller agent, callee agent, max depth contribution, fan-out allowed), per-environment deployment selection, auth mode (`TenantUsers`, `AppUsers`, `Anonymous`), branding (display name, logo asset, colors, welcome text), current app revision. | AD6 |
| AppRevision | `apv_` | `app_revisions`, child `app_revision_members` | App, number, state, pinned agent revision per member, edges snapshot, author, note. | AD6 |
| StudioDraft | `sdr_` | `studio_drafts`, child `studio_draft_items`, `studio_draft_layout` | Tenant, owner, conversation (the architect's), target app, version number, status (`Open`, `PendingApproval`, `Applied`, `Discarded`); per item: kind, name, document text (AD-018), base hash, operation (`Upsert`, `Delete`); per layout row: node key, x, y. | AD7 |
| EvalSet, EvalCase, EvalRun | `evs_`, `evc_`, `evr_` | `eval_sets`, `eval_cases`, `eval_runs`, `eval_run_results` | Later (AD11). | AD11 |

Changed entities:

| Entity | Change | Phase |
|---|---|---|
| Deployment | `agentRevisionId` (nullable, AD-012), `environment` (AD-013), `managementAccess` (`None` default, `Drafts`; AD-017), `fileSpaceMountPath` (default `files`). | AD1, AD3, AD7 |
| Agent | `latestPublishedRevisionId`, `draftRevisionId`. Live fields become the editable draft view; runs compile from revisions. | AD1 |
| Run | `agentRevisionId`, `fileSpaceId`, `fanOutGroupId` (when a member), `appId` and `appRevisionId` (when started through an app), kind value `Playground`. | AD1, AD3, AD5, AD6, AD9 |
| Conversation | `fileSpaceId`, `appId`. | AD3, AD6 |
| Approval | kind value `DraftApply`, with a link to the studio draft and the dry-run result. | AD7 |
| HarnessProfile | child table for asset placements; optional tool probes (for example `pandoc --version`) reported as node capabilities. | AD2, AD4 |
| ExecutionSpec | `AssetFiles` (store reference, key, SHA-256, target path), `FileSpace` (mount path, file list with versions, upload policy). | AD2, AD3 |
| ResourceTypeEnum | `AgentRevision`, `AgentAsset`, `ConversationFileSpace`, `Capability`, `FanOutGroup`, `AgenticApp`, `StudioDraft`, `Promotion`, later `EvalSet`. | Each phase |
| Built-in roles | New `AppUser`; `AgentDeveloper` gains the new design resource types; new `Releaser` role holds `Execute` on `Promotion` for `staging` and `prod`. | AD1, AD6 |

### 7.3 Data model work for every supported database

Garrison supports Sqlite and Postgresql only (D-011). Every phase that adds tables:

- adds a `SchemaMigration` to `src/Garrison.Core/Database/Ado/SchemaBuilder.cs` with the next free version (35 at plan time; take the next free number when the work lands, because other work may claim 35 first),
- adds query files under `src/Garrison.Core/Database/Sqlite/Queries` and `src/Garrison.Core/Database/Postgresql/Queries`, and dialect differences in `src/Garrison.Core/Database/Sql/SqlDialect.cs`,
- registers tables in `src/Garrison.Core/Database/TableCatalog.cs` (backup, tenant deletion, retention),
- adds driver interface methods under `src/Garrison.Core/Database/Interfaces`,
- passes migrate-twice, tenant isolation, and cross-tenant 404 tests on both providers (`GARRISON_TEST_PROVIDERS=sqlite,postgresql`).

Columns stay structured. The only new unmanaged text columns are: revision copies of the existing input and output JSON Schema columns, capability descriptor schemas (from the same kind of source), and studio draft item document text (AD-018). Each is listed in the phase task that adds it and in the docs.

### 7.4 REST surface

All tenant routes live under `/v1.0/api/tenants/{tenantId}`. Each gets an operation scope map entry and OpenAPI metadata.

| Phase | Routes |
|---|---|
| AD1 | `GET, POST /agents/{id}/revisions`; `GET /agents/{id}/revisions/{revId}`; `POST /agents/{id}/revisions/{revId}/publish`; `GET /agents/{id}/revisions/diff?from=&to=`; `GET /environments`, `PUT /environments` (tenant list); `POST /promotions` (promote); `POST /promotions/{id}/rollback`; `GET /promotions`. Deployment create and update accept `agentRevisionId` and `environment`. |
| AD2 | `GET, POST /agent-assets`; `GET, PUT, DELETE /agent-assets/{id}`; `GET, POST /agent-assets/{id}/versions` (multipart or octet-stream per file); `GET /agent-assets/{id}/versions/{n}/files/{path}`. |
| AD3 | `GET /conversations/{id}/files`; `GET /conversations/{id}/files/{path}` (content); `GET /conversations/{id}/files/{path}/versions`; `POST /conversations/{id}/files` (user upload); `DELETE /conversations/{id}/files/{path}`; `POST /conversations/{id}/files/{path}/download-url`. Run-scoped equivalents under `/runs/{id}/files` for trees without a conversation. |
| AD4 | `GET /capabilities` (filters: kind, tag, search); `GET /capabilities/{id}`; `POST, PUT, DELETE /capabilities` (manual descriptors); `POST /capabilities/refresh`. |
| AD5 | `GET /runs/{id}/fan-out-groups`; `GET /fan-out-groups/{id}`; `POST /fan-out-groups/{id}/cancel`. |
| AD6 | Tenant: `GET, POST /apps`; `GET, PUT, DELETE /apps/{id}`; `GET, POST /apps/{id}/revisions`; `POST /apps/{id}/revisions/{revId}/publish`. App gateway (new family, main port): `GET /v1.0/apps/{slug}` (branding, auth mode); `POST /v1.0/apps/{slug}/session`; `GET, POST /v1.0/apps/{slug}/conversations`; `POST /v1.0/apps/{slug}/conversations/{id}/messages`; `GET /v1.0/apps/{slug}/conversations/{id}/files[...]`. |
| AD7 | `GET, POST /studio/drafts`; `GET, DELETE /studio/drafts/{id}`; `PUT, DELETE /studio/drafts/{id}/items/{kind}/{name}`; `GET /studio/drafts/{id}/diff`; `POST /studio/drafts/{id}/validate`; `POST /studio/drafts/{id}/request-apply`; `GET /studio/drafts/{id}/graph`; `POST /studio/drafts/{id}/graph-operations`. |
| AD9 | `POST /studio/drafts/{id}/playground/invoke`; `POST /deployments/{id}/compile-preview` gains `agentRevisionId` and `environment`. |
| AD11 | Later: `/eval-sets`, `/eval-sets/{id}/cases`, `/eval-runs`. |

### 7.5 MCP surface

| Tool | Who may call | Phase |
|---|---|---|
| `garrison_list_agent_revisions`, `garrison_get_agent_revision`, `garrison_publish_agent_revision`, `garrison_promote`, `garrison_rollback_promotion` | Users and credentials with the matching permission | AD1 |
| `garrison_list_agent_assets`, `garrison_get_agent_asset` | Users, credentials, and studio run tokens (read) | AD2 |
| `garrison_files_list`, `garrison_files_read`, `garrison_files_write`, `garrison_files_delete` | Run tokens (scoped to their tree's file space), users | AD3 |
| `garrison_list_capabilities`, `garrison_describe_capability`; `garrison_list_agents` gains schemas and hints | Run tokens (filtered by allow list and bindings), users | AD4 |
| `garrison_fan_out`, `garrison_gather`, `garrison_cancel_fan_out` | Run tokens with delegation enabled | AD5 |
| `garrison_list_apps`, `garrison_get_app`, `garrison_create_app`, `garrison_update_app` | Users and credentials | AD6 |
| `garrison_studio_get_draft`, `garrison_studio_put_item`, `garrison_studio_remove_item`, `garrison_studio_graph`, `garrison_studio_graph_operation`, `garrison_studio_diff`, `garrison_studio_validate`, `garrison_studio_request_apply`, `garrison_studio_playground_invoke` | Users, and run tokens from deployments with `managementAccess: Drafts` (AD-017) | AD7, AD9 |

### 7.6 WebSocket surface

| Channel | Permission | Sends | Phase |
|---|---|---|---|
| `conversation-files:{conversationId}` | Read on Conversation | `files.changed` with the changed paths and versions | AD3 |
| `fan-out:{groupId}` | Read on Run for the parent run | `fan-out.status` with members and statuses | AD5 |
| `studio-draft:{draftId}` | Read on StudioDraft | `draft.changed` with the draft version, changed items, and graph delta | AD7 |
| `app-conversation:{conversationId}` (app gateway socket) | App session for that conversation | Entry agent text, status, and `files.changed`; no operator detail such as tool calls unless the app enables it | AD6 |

### 7.7 SDK impact

| SDK | Work |
|---|---|
| C# (`sdk/csharp`) | Typed models and methods for revisions, environments, promotions, assets (streamed upload), file spaces, capabilities, fan-out groups, apps, studio drafts; typed `ExecutionSpec` fields for assets and file space. |
| Python (`sdk/python`) | Same operations with dataclasses; streamed upload and download. |
| JavaScript/TypeScript (`sdk/js`) | Same operations with TypeScript types (ESM and CJS builds); an app gateway client module used by `app-ui/`. |
| Go (`sdk/go`) | Same operations in new files (`revisions.go`, `assets.go`, `files.go`, `capabilities.go`, `fanout.go`, `apps.go`, `studio.go`). |
| All | Each SDK's live test harness gains cases per phase; README sections updated; `scripts/run-sdk-harnesses.sh` passes. |

### 7.8 Dashboard and app UI

| Surface | Change | Phase |
|---|---|---|
| `AgentDetailView.jsx` | Revisions tab (list, diff, publish), assets tab (pins), capabilities tab. | AD1, AD2, AD4 |
| `DeploymentsView.jsx` | Environment column and filter, pinned revision, promote and rollback actions. | AD1 |
| `ConversationDetailView.jsx` | Files tab backed by the file space. | AD3 |
| `RunDetailView.jsx` | Fan-out groups in the run tree, member statuses, gather results. | AD5 |
| New Apps tab under Agents | App list and detail (members, entry agent, environments, branding, URL). | AD6 |
| New Studio view (sidebar, AD-023) | Chat panel bound to the architect's conversation, canvas (AD8), diff and validate panel, playground (AD9), deploy and promote panel. | AD7 to AD9 |
| `SetupWizard.jsx` | New step `studio` after `secret`: pick harness and model for the agent architect and create its deployment. | AD9 |
| `app-ui/` (new) | End-user chat: conversation list, message stream, file panel with download, branding, sign-in or anonymous session, all shipped locales. | AD6 |

---

## 8. Work Breakdown

Each phase lists the files and areas it touches and the phases it depends on. Tasks inside a phase are in the order a captain should take them; a task depends on the earlier tasks in its phase unless it says otherwise.

### Phase AD1: Agent revisions and environments

Depends on: none.
Touches: `src/Garrison.Core/Models` (new `AgentRevision`, `PromotionRecord`, child models), `src/Garrison.Core/Enums` (revision state, promotion kind), `src/Garrison.Core/Database` (migration, both providers, `TableCatalog.cs`), `src/Garrison.Core/Compilation` (compile from revision), `src/Garrison.Core/Manifests`, `src/Garrison.Server/Routes` (new `AgentRevisionRoutes.cs`, `PromotionRoutes.cs`, changes to `AgentRoutes.cs`, `DeploymentRoutes.cs`, `OperationScopeMap.cs`), `src/Garrison.Server/Protocols/GarrisonMcpServer.cs`, `sdk/*`, `dashboard/src/views/AgentDetailView.jsx`, `DeploymentsView.jsx`, `docs/MANIFESTS.md`, `REST_API.md`, `MCP_API.md`, `assets/postman`.

- [ ] AD1.1 Schema and models for `AgentRevision` and its child tables, plus `agents.latestpublishedrevisionid` and `agents.draftrevisionid`, on Sqlite and Postgresql. Migration builds revision 1 (Published) for every existing agent from its current row.  Accept: migrate-twice passes on both providers; a seeded agent has exactly one published revision whose content hash matches its fields; cross-tenant reads return 404.
- [ ] AD1.2 Revision service: create or update the single open draft per agent, publish (freeze, compute content hash, reject publish of an unchanged draft with `RevisionUnchanged`), list, get, and a field-level diff between two revisions.  Accept: unit tests show a published revision cannot change through any service method; diff lists changed fields, prompt pins, allow list entries, and schema changes.
- [ ] AD1.3 Deployments gain `agentRevisionId` (nullable) and `environment` (default `dev`), validated against the tenant environment list (AD-013, new `tenant_environments` table with ordered labels). Runs record `agentRevisionId`. `InvocationCompiler` reads agent fields from the pinned revision, or from the latest published revision when unpinned (AD-012).  Accept: golden compile tests show a deployment pinned to revision 1 renders revision 1 after revision 2 is published; an unknown environment returns 400 `UnknownEnvironment`.
- [ ] AD1.4 Promotion and rollback service: promote a revision (agent now, app in AD6.4) from environment A to the next environment B by repinning B's deployments, record a `PromotionRecord` with the previous pins, and roll back by restoring them. Promotion runs in one transaction and is audited.  Accept: tests promote dev to staging to prod and roll back prod; rollback restores exact previous pins; a promotion that skips an environment in the ordered list is refused with `PromotionOrderViolation` unless `allowSkip` is set by a user holding Execute on Promotion for the target.
- [ ] AD1.5 REST routes for revisions, environments, and promotions (section 7.4), operation scope map entries (`AgentRevision`, `Promotion` resource types), OpenAPI metadata, request history.  Accept: route tests cover success, 400 validation, 403 without permission, 404 cross-tenant, and the scope map test passes for every new route.
- [ ] AD1.6 MCP tools for revisions and promotions (section 7.5), denied to run and node tokens.  Accept: MCP tests call each tool as a user, and as a run token (refused); `tools/list` shows them only to permitted callers.
- [ ] AD1.7 Manifests: `Agent` documents gain `revision` handling (applying an Agent writes the draft; `publish: true` publishes it), `Deployment` documents gain `environment` and `agentRevision`; export emits pinned revisions.  Accept: apply, dry run, and export round-trip tests pass on both providers; a bundle exported from one tenant applies cleanly to another.
- [ ] AD1.8 SDK support in C#, Python, JavaScript/TypeScript, and Go for revisions, environments, promotion, and rollback.  Accept: each SDK harness creates a draft, publishes, promotes, and rolls back against a live server; `scripts/run-sdk-harnesses.sh` passes.
- [ ] AD1.9 Dashboard: Revisions tab on agent detail (list, diff view, publish), environment column, filter, revision pin, and promote and rollback actions on deployments; tooltips in all locales.  Accept: `npm run lint`, `npm run build`, and `npm test` pass; browser tests cover publish, diff, promote, and rollback; the tooltip coverage test passes.
- [ ] AD1.10 Documentation and Postman: new `docs/REVISIONS.md`, updates to `REST_API.md`, `MCP_API.md`, `docs/MANIFESTS.md`, Postman requests for every new route.  Accept: Newman run of the new folder passes against Compose; `scripts/check-em-dash.sh` passes.

### Phase AD2: Agent assets

Depends on: AD1 (assets are pinned by revisions).
Touches: `src/Garrison.Core/Models` (`AgentAsset`, `AgentAssetVersion`, `HarnessAssetPlacement`), `src/Garrison.Core/Database`, `src/Garrison.Core/Compilation` (`ExecutionSpec.AssetFiles`), `src/Garrison.Core/Seed` (built-in placements), `src/Garrison.Server/Services/ArtifactService.cs` (asset prefix), new `AgentAssetRoutes.cs`, `src/Garrison.Worker/Execution/WorkspacePreparer.cs`, `FileMaterializer.cs`, `src/Garrison.Worker/Kubernetes/RunPodEnvelope.cs`, `RunPodManifestBuilder.cs`, `sdk/*`, `dashboard/src/views`, docs.

- [ ] AD2.1 Schema and models for `AgentAsset`, `AgentAssetVersion` (with per-file rows), `agent_revision_asset_pins`, and `harness_profile_asset_placements` on both providers. `SystemPrompt` assets reference a `PromptTemplate` (AD-010).  Accept: migrate-twice and tenant isolation tests pass on both providers; a `SystemPrompt` asset without a template ID is refused with `AssetTemplateRequired`.
- [ ] AD2.2 Asset storage under the `.garrison-assets/` prefix in the tenant's asset store (AD-011), with settings `Assets.MaxFileBytes`, `Assets.MaxVersionBytes`, `Assets.MaxFilesPerVersion` (documented defaults and ranges), SHA-256 on write, idempotent re-upload, and exclusion from artifact listings and retention.  Accept: tests on Database, Filesystem, and S3 (Less3 script) stores show assets stored, hashed, absent from `GET .../artifacts`, and kept after artifact retention runs.
- [ ] AD2.3 Built-in asset placements seeded for each built-in harness profile: Claude Code skills under `.claude/skills/<name>/`, reference files and document templates under `{{run.workspaceDir}}/assets/<name>/` for every harness, and harness-specific skill paths for Codex, Mux, and Gemini CLI where the harness has an equivalent (otherwise the `assets/` path plus a listing in the system prompt through a new `builtin/agent-assets-instructions` fragment template).  Accept: golden compile tests per built-in profile show the expected target paths; the fragment is a protected, resettable template.
- [ ] AD2.4 Compiler and worker: `ExecutionSpec.AssetFiles` lists store key, SHA-256, and target path; the worker downloads through a run-token-scoped internal route, verifies the hash, and writes files before launch, for both the Process and KubernetesJob executors (assets are fetched by the worker and passed in the run pod envelope; run pods still hold no credentials, D-033).  Accept: fake-harness runs on both executors see the asset files at the expected paths; a hash mismatch fails the run before launch with `AssetIntegrityFailed`.
- [ ] AD2.5 REST routes for assets and versions (section 7.4) with streamed upload, scope map entries (`AgentAsset`), and a read-only file preview for text assets.  Accept: route tests cover upload limits (413 with the setting named), 404 cross-tenant, and 403 without permission.
- [ ] AD2.6 Manifests: `AgentAsset` kind (inline text for small files, or a reference to an uploaded version), revision `assets:` pins, and export with content for text assets and references for binary ones.  Accept: a bundle with a skill asset applies, exports, and re-applies unchanged; binary assets export as references with a clear note, never silently dropped.
- [ ] AD2.7 MCP read tools for assets (section 7.5) and management write tools for users.  Accept: MCP tests list and read assets as a user and as a studio run token; run tokens without `managementAccess` cannot write.
- [ ] AD2.8 SDKs (four) and dashboard: assets view under Configuration with version history and upload, assets tab on agent revisions.  Accept: SDK harnesses upload and pin an asset; dashboard browser tests cover upload and pin; tooltip test passes.
- [ ] AD2.9 Documentation (`docs/ASSETS.md`, `docs/HARNESSES.md` placement section), Postman.  Accept: docs list every placement path per built-in profile and every setting with default and range; Newman passes.

### Phase AD3: Conversation file space

Depends on: AD1 (runs record revision; can start in parallel with AD2).
Touches: `src/Garrison.Core/Models` (`ConversationFileSpace`, `ConversationFile`), `src/Garrison.Core/Database`, `src/Garrison.Core/Compilation` (`ExecutionSpec.FileSpace`), `src/Garrison.Server/Routes/ConversationRoutes.cs`, `RunRoutes.cs`, node protocol routes, `src/Garrison.Server/WebSockets`, `GarrisonMcpServer.cs`, `src/Garrison.Worker/Execution` (sync in and out), `src/Garrison.Worker/Kubernetes` (pod envelope and line protocol), `sdk/*`, `dashboard/src/views/ConversationDetailView.jsx`, docs.

- [ ] AD3.1 Schema and models for file spaces, files, and file versions on both providers. A file space is created on first use for a conversation, or for a root run without a conversation; delegated children resolve to their root's file space.  Accept: migrate-twice passes; a three-level delegation tree resolves to one file space; a new conversation turn resolves to the same file space as the previous turn.
- [ ] AD3.2 File space service: put with base version (AD-014 conflict naming), get, list, version history, delete (soft, versions kept until retention), limits (`FileSpaces.MaxFileBytes`, `MaxTotalBytes`, `MaxFiles`) and retention tied to conversation retention. Storage reuses the deployment's artifact store under a `.garrison-files/` prefix.  Accept: concurrent writes with the same base produce one winner and one conflict file plus a `FileConflict` warning event; limits refuse with the setting named.
- [ ] AD3.3 Worker sync: at start, download the file space into the mount path (`fileSpaceMountPath`, default `files`); at end, upload new and changed files, epoch-fenced and repair-aware like artifact uploads, before workspace cleanup. Paths reject traversal, absolute paths, and links.  Accept: a fake-harness run writes `files/a.txt`; the next turn on another worker reads it; a stale-epoch upload is refused.
- [ ] AD3.4 KubernetesJob executor support: the worker stages files into the run pod envelope and relays changed files back through the pod line protocol, without giving the pod credentials.  Accept: the Kubernetes executor test (k3s or the existing executor test harness) passes the same scenario as AD3.3.
- [ ] AD3.5 MCP file tools for runs (`garrison_files_*`), scoped to the run's own tree, with the same limits; reads see the latest committed version, writes commit immediately and are visible to siblings.  Accept: a parent reads a file a child wrote through the tool before the child finishes; a run in another tree gets 404.
- [ ] AD3.6 REST routes for conversation and run file spaces (section 7.4), download URLs, user upload, and the `conversation-files:{id}` WebSocket channel.  Accept: route tests cover upload, download, versions, 404 cross-tenant, and channel delivery on change.
- [ ] AD3.7 Interaction with continuation and pipelines: continuation archives exclude the mount path (the file space is the source of truth); pipeline stages started in one pipeline run share one file space, so later stages see earlier files.  Accept: a suspended and resumed run sees files written by its children; a two-stage pipeline test shows stage 2 reading stage 1's file.
- [ ] AD3.8 SDKs (four) and dashboard Files tab on conversation detail with version history and download.  Accept: SDK harnesses list and download files after a run; dashboard browser test passes; tooltip test passes.
- [ ] AD3.9 Documentation (`docs/FILE_SPACES.md`, updates to `docs/ARTIFACTS.md` and `docs/CONTINUATION.md`), Postman.  Accept: docs explain sync points, conflict naming, limits, and the difference between artifacts and file spaces; Newman passes.

### Phase AD4: Agent catalog and capability registry

Depends on: AD1 (descriptors come from published revisions), AD2.1 (asset kinds referenced by harness built-in descriptors).
Touches: `src/Garrison.Core/Models` (`CapabilityDescriptor`), `src/Garrison.Core/Database`, `src/Garrison.Core/Services` (registry, refresh), `src/Garrison.Server/Services/WorkerMcpTestService.cs` (tool list cache), `src/Garrison.Server/Routes` (new `CapabilityRoutes.cs`), `GarrisonMcpServer.cs`, `src/Garrison.Core/Seed` (new template), node capability reporting in `src/Garrison.Worker`, `sdk/*`, dashboard, docs.

- [ ] AD4.1 Schema and models for capability descriptors (section 7.2) on both providers.  Accept: migrate-twice and tenant isolation tests pass; descriptor schemas are validated as JSON Schema on save (`InvalidJsonSchema`).
- [ ] AD4.2 Derivation for Garrison agents: on revision publish, create or refresh an `Agent` descriptor from description, tags, input and output schema, and skills.  Accept: publishing a revision updates its descriptor; unpublished drafts never appear.
- [ ] AD4.3 Derivation for MCP tools: refresh descriptors from bound MCP servers' `tools/list` through the existing worker MCP test path (for stdio) or direct HTTP listing, cached with a TTL setting, with tool input schemas copied.  Accept: a test MCP server's tools appear as descriptors; a removed tool disappears after refresh; a failed refresh keeps the last good list and records a warning.
- [ ] AD4.4 Derivation for harness built-ins: harness profiles may declare tool probes (for example `pandoc --version`, `soffice --version`); workers report results as node capabilities; descriptors of kind `HarnessBuiltIn` carry a placement requirement so runs that need them land on capable nodes.  Accept: a worker with a fake probe reports the tool; a run whose agent requires it queues with a clear `blockedReason` when no node has it.
- [ ] AD4.5 Cost and latency hints from run analytics over a bounded window (median and p90 duration, mean cost, sample size), refreshed by the leader maintenance loop (AD-022).  Accept: hints match a seeded set of runs; descriptors with fewer than a configurable minimum sample report `unknown`, never zero.
- [ ] AD4.6 Catalog MCP tools `garrison_list_capabilities` and `garrison_describe_capability`; `garrison_list_agents` gains schemas and hints. Results for run tokens are filtered by the run's allow list, bound MCP servers, and harness type.  Accept: a run token sees only allowed agents and bound tools; a user sees all tenant descriptors they can read.
- [ ] AD4.7 Template `builtin/garrison-catalog-instructions` (fragment) included by `builtin/garrison-tools-instructions` when delegation is enabled, plus REST routes for descriptors and manual descriptors.  Accept: template is protected and resettable; compile golden tests include it only when delegation is on; route tests pass.
- [ ] AD4.8 SDKs (four), dashboard Capabilities view under Agents (filter by kind, source link, hints), docs (`docs/CAPABILITIES.md`), Postman.  Accept: SDK harness lists capabilities; dashboard and tooltip tests pass; Newman passes.

### Phase AD5: Parallel fan-out and gather

Depends on: AD3 (children write results to the shared file space), AD4 (orchestrators pick children from the catalog).
Touches: `src/Garrison.Core/Models` (`FanOutGroup`, members), `src/Garrison.Core/Database`, run admission and delegation services, continuation child-wait code (`ChildWaitRequest.cs`, `ChildWaitAdmission.cs`), `GarrisonMcpServer.cs`, `src/Garrison.Server/Routes/RunRoutes.cs`, WebSockets, `src/Garrison.Core/Seed` (templates), `sdk/*`, `dashboard/src/views/RunDetailView.jsx`, `docs/SCALING.md`, `MCP_API.md`.

- [ ] AD5.1 Schema and models for fan-out groups and members on both providers.  Accept: migrate-twice passes; a group's members are child runs of its parent run in the same tree.
- [ ] AD5.2 `garrison_fan_out`: start up to `Delegation.MaxFanOutWidth` (setting, default 8, range 1 to 64) children in one call, each passing allow list, depth, and cycle checks; returns the group ID and child run IDs without waiting. A check failure for any child refuses the whole call before any child starts.  Accept: tests start 5 children in one call; a disallowed child refuses the call and no child run exists.
- [ ] AD5.3 `garrison_gather`: wait up to `waitSeconds` for the join policy (`All`, `Any`, `Quorum`), return finished results (result text, structured output, file space paths written), pending members, and failures. Partial results are always returned on timeout.  Accept: tests cover each policy, a timeout returning partial results, and a failed child reported with its outcome.
- [ ] AD5.4 Group timeout, cancellation (`garrison_cancel_fan_out`, cancelling the parent cancels its groups), and budget limits (max children, max cost USD, max tokens) enforced as children report usage; on breach, remaining members are cancelled and the group ends `BudgetExceeded`.  Accept: tests show cancellation reaches every running member, and a cost budget breach cancels the rest and is visible to gather.
- [ ] AD5.5 Capacity and continuation: gather waits register child waits so a parent with `suspensionEnabled` releases its slot; without suspension, fan-out obeys the child reserve and fails fast with `DelegationCapacityExhausted` when children could never run.  Accept: a one-slot worker test completes a fan-out of 3 with suspension on; without suspension it fails fast instead of deadlocking.
- [ ] AD5.6 Templates: `builtin/garrison-fan-out-instructions` fragment and a gather result rendering template, so no fan-out text is hard-coded.  Accept: the no-hard-coded-text compiler test passes; templates are protected and resettable.
- [ ] AD5.7 REST routes and the `fan-out:{groupId}` WebSocket channel; run summaries show `fanOutGroupId`.  Accept: route and channel tests pass; cross-tenant 404.
- [ ] AD5.8 Dashboard run tree shows groups, members, join policy, and budget use; SDKs (four) read groups.  Accept: browser test shows a 3-member group; SDK harnesses read a group; tooltip test passes.
- [ ] AD5.9 Documentation (`MCP_API.md` fan-out section, `docs/SCALING.md` capacity notes), Postman, and a fake-harness example manifest under `examples/`.  Accept: example applies and runs on Compose with the fake harness; Newman passes.

### Phase AD6: Agentic app resource and per-app chat UI

Depends on: AD1 (app revisions pin agent revisions), AD3 (file panel). AD5 is not required but the example app uses it.
Touches: `src/Garrison.Core/Models` (`AgenticApp`, `AppRevision`, child models), `src/Garrison.Core/Database`, `src/Garrison.Core/Manifests`, `src/Garrison.Core/Security` (app sessions), `src/Garrison.Server/Routes` (new `AppRoutes.cs`, `AppGatewayRoutes.cs`), `src/Garrison.Server/WebSockets`, built-in role seed, new `app-ui/` directory, `dashboard/` (Apps tab, image serving `/apps/`), `docker/compose.yaml` and `k8s/` (only to route `/apps/` and `/v1.0/apps/`), `sdk/*`, docs.

- [ ] AD6.1 Schema and models for apps, members, edges, environment selections, branding, and app revisions on both providers; slug unique cluster-wide.  Accept: migrate-twice passes; a slug conflict returns 409 `AppSlugTaken`; deleting an agent that is an app member is refused with `AgentInUse`.
- [ ] AD6.2 App service and tenant REST routes (section 7.4), validation (entry agent is a member, edges reference members, graph has no unreachable members), operation scope map (`AgenticApp`).  Accept: route tests for create, update, validate errors, 403, and 404 cross-tenant.
- [ ] AD6.3 Delegation derivation (AD-005d): from the app graph, compute each member's allow list, delegation mode, and max depth (longest path from that member), and write them into the members' draft revisions; show drift when a member's published policy differs from the graph.  Accept: tests derive policies for a three-level graph; a manual edit that contradicts the graph is reported as drift, not silently overwritten.
- [ ] AD6.4 App revisions and app-level promotion: publishing an app revision pins every member's revision; promoting an app promotes all member deployments in one transaction through AD1.4.  Accept: promote and rollback of a 3-agent app changes all three pins together or none.
- [ ] AD6.5 App identity: built-in `AppUser` role at resource scope on the app; app auth modes (`TenantUsers`, `AppUsers`, `Anonymous` off by default) and app session tokens limited to the app's gateway routes and the caller's own conversations (AD-021).  Accept: security tests show an app session cannot call `/v1.0/api/...`, cannot read another user's conversation, and expires; anonymous mode is refused unless enabled.
- [ ] AD6.6 App gateway routes `/v1.0/apps/{slug}/...`: branding, session, conversations (start on the entry agent with the app's selected environment deployment), messages, and file space reads, plus the app conversation socket. Operator detail (tool calls, thinking) is hidden unless the app enables it.  Accept: gateway tests run a two-turn conversation on the fake harness and list and download a file the agent wrote.
- [ ] AD6.7 `app-ui/` scaffold: React 19 and Vite, lint, unit tests, i18n with the dashboard's locale set, tooltips, accessibility checks, build output served by the dashboard image under `/apps/{slug}/` (AD-020).  Accept: `npm run lint`, `npm run build`, `npm test` pass in `app-ui/`; the dashboard image serves the app at `/apps/demo/` in Compose.
- [ ] AD6.8 App UI chat: conversation list, new conversation, streaming responses, retry on stream drop, approval-pending notice when the entry agent waits on an operator.  Accept: browser test sends two turns and sees streamed text; a dropped socket reconnects and resumes from the last sequence.
- [ ] AD6.9 App UI file panel: browse the conversation file space, version history, download, and live refresh on `files.changed`.  Accept: browser test sees a file appear while the agent runs and downloads it with a matching SHA-256.
- [ ] AD6.10 Branding and shareable URL: logo asset, colors, display name, welcome text, and a copyable URL from the dashboard app detail.  Accept: branding changes show in the app UI without a rebuild; the URL opens the app's sign-in or anonymous session as configured.
- [ ] AD6.11 Manifests (`AgenticApp` kind with members, edges, environments, branding), MCP app tools, SDKs (four, including a gateway client in the JS SDK), dashboard Apps tab under Agents.  Accept: a full app bundle applies, exports, and re-applies unchanged; SDK harnesses create an app; dashboard and tooltip tests pass.
- [ ] AD6.12 Documentation (`docs/APPS.md`, `docs/APP_UI.md`), Compose and Kubernetes routing notes for `/apps/` and `/v1.0/apps/`, Postman.  Accept: Compose stack serves an app end to end; Newman passes; `k8s` kustomize build renders the ingress paths.

### Phase AD7: Studio agent and management tools

Depends on: AD1, AD2, AD4, AD6 (the studio writes revisions, assets, and apps and reads the catalog).
Touches: `src/Garrison.Core/Models` (`StudioDraft`, items, layout), `src/Garrison.Core/Enums/ApprovalKindEnum.cs` (`DraftApply`), `src/Garrison.Core/Database`, `src/Garrison.Core/Seed` (architect agent, templates, skill assets), `src/Garrison.Core/Security` (delegated management grant), `src/Garrison.Server/Routes` (new `StudioRoutes.cs`, `ApprovalRoutes.cs`), manifest service, `GarrisonMcpServer.cs`, `src/Garrison.Server/WebSockets`, `dashboard/src/views` (new `StudioView.jsx`), `sdk/*`, docs.

- [ ] AD7.1 Schema and models for studio drafts, items, and layout on both providers; draft item document text is the listed unmanaged exception (AD-018).  Accept: migrate-twice passes; concurrent updates with a stale draft version return 409 `DraftVersionConflict`.
- [ ] AD7.2 Draft service: start a draft from an empty app or from an export of an existing app (`followReferences`), put and remove items, diff against live configuration (per document: `Create`, `Update` with field changes, `Delete`, `Unchanged`), and validate by manifest dry run.  Accept: tests build a draft for a 3-agent app, diff shows creates, and validation reports the same per-document results as `manifests/apply?dryRun=true`.
- [ ] AD7.3 `DraftApply` approvals: `request-apply` creates an approval holding the diff and dry-run result; a person with the needed permissions decides it; on approval the bundle applies in one transaction, revisions publish when the draft says so, and the `ManifestApply` audit row links back to the draft. A changed live configuration since validation forces re-validation.  Accept: tests show no change before approval, an atomic apply after approval, refusal when the approver lacks a needed permission, and `DraftStale` when live configuration moved.
- [ ] AD7.4 Delegated management grant (AD-017): deployments with `managementAccess: Drafts` get run tokens that can call studio draft tools for the conversation's human principal, with the intersection of that person's permissions and draft scope. Run tokens can never call apply, delete live resources, or read secret values.  Accept: security tests show the grant limited to drafts, denied for a principal without design permissions, and revoked when the run ends.
- [ ] AD7.5 Studio MCP tools (section 7.5) for draft read, item put and remove, graph read and operations, diff, validate, and request apply.  Accept: MCP tests run a full draft-to-approval flow as a studio run token on the fake harness.
- [ ] AD7.6 Built-in agent architect: protected, cloneable `builtin/agent-architect` agent definition seeded per tenant, with system prompt templates for experience (a) design and experience (b) runtime parameters, and skill assets that teach manifest authoring, capability choice (AD-006), and Garrison conventions. It has no deployment until the user creates one (AD9.5).  Accept: seed test shows the agent, templates, and assets per tenant; templates are resettable; no prompt text is hard-coded.
- [ ] AD7.7 Runtime parameters experience (b): the architect and the studio service cover deployment fields (harness, model, effort, max turns, budget, timeouts, environment, node pool, artifact globs, approval rules, quotas, triggers), each written as draft items with validation hints from the existing models.  Accept: a test conversation on the fake harness sets model, timeout, and an approval rule through tools, and the diff shows exactly those fields.
- [ ] AD7.8 Capability guidance: the architect reads the catalog and a comparison template to recommend one of the three capability sources (AD-006) with reasons, and writes the chosen binding (agent edge, MCP server binding, or harness requirement) into the draft.  Accept: a scripted fake-harness conversation produces each of the three binding kinds in the draft.
- [ ] AD7.9 `studio-draft:{draftId}` WebSocket channel carrying draft version, changed items, and graph delta (AD-019).  Accept: channel test shows an MCP tool change delivered to a dashboard subscriber with the new version.
- [ ] AD7.10 Dashboard Studio view (sidebar item per AD-023 once confirmed, else a tab under Agents): chat panel bound to the architect conversation, draft item list, diff panel, validate and request-apply buttons, and the approval decision inline for permitted users.  Accept: browser test runs a chat-driven draft to an approved apply on the fake harness; sidebar count tests updated; tooltip test passes.
- [ ] AD7.11 SDKs (four) for drafts and studio routes, documentation (`docs/STUDIO.md`, `MCP_API.md` studio section, `docs/SECURITY.md` grant section), Postman.  Accept: SDK harnesses create, diff, and validate a draft; Newman passes.

### Phase AD8: Studio visual editor

Depends on: AD7.
Touches: `src/Garrison.Server` studio service (graph projection and operations), `dashboard/package.json` (new dependency `@xyflow/react`, AD-024), `dashboard/src/views/StudioView.jsx` and new components under `dashboard/src/components/studio/`, dashboard i18n files, docs.

- [ ] AD8.1 Graph projection: server builds nodes (agents, entry marker, capability bindings) and edges (delegation, with depth and fan-out flags) from the draft, and applies graph operations (add agent, connect, disconnect, set entry, remove) as draft item edits.  Accept: unit tests round-trip graph operations to draft items and back with no drift.
- [ ] AD8.2 Canvas component with `@xyflow/react`: render the graph, drag to connect, keyboard operation for every action, and layout persistence in `studio_draft_layout`.  Accept: browser test adds two agents and an edge by keyboard alone; positions survive reload.
- [ ] AD8.3 Property panels for agent (description, schemas, system prompt template version, assets, capabilities), edge (depth, fan-out allowed), and app (entry agent, branding, auth mode).  Accept: each panel edit appears in the diff panel; invalid values show the server's field error.
- [ ] AD8.4 Deployment and runtime panel per environment (experience b) on the canvas.  Accept: editing a staging timeout produces one draft item change for the staging deployment only.
- [ ] AD8.5 Live sync between chat and canvas over `studio-draft:{draftId}`, with conflict handling on stale versions (reload the item and show what changed).  Accept: browser test makes a change through the architect's tool and sees the canvas update without reload; a conflicting canvas edit shows the conflict notice.
- [ ] AD8.6 Accessibility and i18n: canvas screen reader summaries, focus order, tooltips in all locales.  Accept: accessibility checks and the tooltip coverage test pass.
- [ ] AD8.7 Documentation of the canvas in `docs/STUDIO.md` with screenshots from the fake-harness example.  Accept: docs reviewed for human voice; em dash check passes.

### Phase AD9: Playground, deploy, and promote experience

Depends on: AD7 (can run in parallel with AD8).
Touches: run service (`Playground` run kind), studio service, `src/Garrison.Server/Routes/DeploymentRoutes.cs` (compile preview), `dashboard/src/views/StudioView.jsx`, `dashboard/src/components/SetupWizard.jsx`, `sdk/*`, docs.

- [ ] AD9.1 Playground runs: invoke draft revisions through ephemeral deployments in a reserved `draft` environment, run kind `Playground`, excluded from app UIs, catalog hints, and analytics defaults, with conversations and a file space like any run.  Accept: a playground run uses the draft's unpublished system prompt; it never appears in an app UI or in capability hints.
- [ ] AD9.2 Playground UI in the studio: chat with the draft entry agent over multiple turns, run tree with fan-out groups, file panel, and transcript export.  Accept: browser test runs a two-turn playground conversation on the fake harness and downloads a file.
- [ ] AD9.3 Compile preview for revision and environment: `compile-preview` accepts `agentRevisionId` and `environment`, and the studio shows the exact command line, placed asset paths, and file space mount before deploy.  Accept: preview of a draft revision shows asset target paths; secrets stay redacted.
- [ ] AD9.4 Deploy from the studio: apply the approved draft to `dev` (publish revisions, create or repin dev deployments).  Accept: end-to-end test goes from empty draft to a running dev app reachable at its app URL.
- [ ] AD9.5 SetupWizard step `studio` (after `secret`): choose harness profile and model for the agent architect and create its deployment with `managementAccess: Drafts`.  Accept: wizard browser test creates the architect deployment; skipping the step leaves the wizard working as today.
- [ ] AD9.6 Promote and rollback UI in the studio and app detail: show the per-environment diff (revisions and environment overrides), require Execute on Promotion for the target, and offer rollback from history.  Accept: browser test promotes dev to staging and rolls back; a user without permission sees the action disabled with a tooltip explaining why.
- [ ] AD9.7 SDKs (four) for playground invoke and compile preview options.  Accept: SDK harnesses run a playground invocation.
- [ ] AD9.8 Documentation (`docs/STUDIO.md` playground, deploy, and promote sections; `docs/QUICKSTART.md` studio path), Postman.  Accept: a new user can follow the quickstart from Compose to a deployed fake-harness app; Newman passes.

### Phase AD10: Reference converter agent, MCP binding, and research example

Depends on: AD2 (templates as assets), AD4 (capability descriptors), AD5 (fan-out in the example), AD6 (app and app UI).
Touches: `examples/agentic-apps/` (new), `src/Garrison.Worker/Dockerfile` (optional build argument only), harness profile seed (tool probes), `docs/`, `scripts/` (smoke script), `src/Test.Automated` (example smoke suite).

- [ ] AD10.1 Reference converter agent `doc-converter` as a manifest bundle under `examples/agentic-apps/doc-converter/`: input schema (source path in the file space, target format, template asset, style overrides such as base font size), output schema (result path, warnings), skills for Markdown to Word with a reference document, Word to PDF, and style changes; backed by pandoc by default, with the DocConverter project as an alternative backend once its interface is confirmed (Q-AD1).  Accept: on a worker with pandoc, the agent converts a Markdown file to `.docx` using a template asset and writes the result to the file space; the bundle is documented as a template to copy.
- [ ] AD10.2 Optional worker image build argument that installs pandoc and a headless PDF path (LibreOffice or a LaTeX engine, Q-AD2), plus seeded tool probes so nodes advertise them (AD4.4). Default image unchanged.  Accept: image built with the argument reports the tools; built without it, runs needing them queue with `blockedReason` naming the tool.
- [ ] AD10.3 External MCP capability binding pattern: register an MCP converter server, bind it to an agent with credentials from a secret (header or env templates, D-023), required tools for pre-flight, and its descriptor in the catalog. The studio can walk a user through it.  Accept: a test MCP server with bearer auth is registered, pre-flight passes, the tool appears in the catalog for the bound agent only, and the secret value never appears in events or transcripts.
- [ ] AD10.4 Harness built-in capability example: the same conversion done by the orchestrator's own harness shell or skill, described by a `HarnessBuiltIn` descriptor, so all three sources (AD-006) are shown side by side.  Accept: docs and example show the three sources producing the same `.docx` from the same input.
- [ ] AD10.5 Research overview example app under `examples/agentic-apps/research-overview/`: orchestrator entry agent, researcher subagent, writer subagent, `doc-converter`, edges, environments, branding, and a fake-harness script that drives the walkthrough in section 11.  Accept: the bundle applies on Compose; the fake-harness smoke reaches a PDF in the file space through the app gateway.
- [ ] AD10.6 Example smoke suite in `src/Test.Automated` and a script under `scripts/` that runs the research example end to end on the fake harness.  Accept: the suite passes on Sqlite and Postgresql.
- [ ] AD10.7 Documentation (`docs/CAPABILITIES.md` choosing a source, `examples/agentic-apps/README.md`).  Accept: docs reviewed for human voice; em dash check passes.

### Phase AD11: Later: eval sets and promotion gates

Depends on: AD9. Marked later by AD-007; no work starts until the user moves it into scope.
Touches: `src/Garrison.Core/Models` (`EvalSet`, `EvalCase`, `EvalRun`), database, new routes, studio view, promotion service, `sdk/*`, docs.

- [ ] AD11.1 (later) Schema and models for eval sets, cases (input, optional expected output or rubric, file fixtures), eval runs, and per-case results on both providers.  Accept: migrate-twice passes on both providers.
- [ ] AD11.2 (later) Eval runner: run a set against an agent or app revision in the `draft` environment as playground runs, with bounded concurrency and budget.  Accept: a 10-case set runs on the fake harness and records results per case.
- [ ] AD11.3 (later) Scorers: exact match, JSON Schema validity, contains, and an LLM judge that is itself a Garrison agent with its prompt from a template.  Accept: each scorer has unit tests; the judge's prompt comes from a template.
- [ ] AD11.4 (later) Promotion gates: an environment may require a named eval set to pass a threshold for the revision being promoted; promotion fails with `EvalGateFailed` otherwise, and the gate result links to the eval run.  Accept: a failing eval blocks promotion to `prod`; a passing one allows it.
- [ ] AD11.5 (later) Studio UI to save playground conversations as eval cases and to view eval runs.  Accept: browser test saves a case from the playground and runs the set.
- [ ] AD11.6 (later) SDKs (four), documentation (`docs/EVALS.md`), Postman.  Accept: SDK harnesses run an eval set; Newman passes.

---

## 9. Security and RBAC

| Topic | Rule | Tasks |
|---|---|---|
| Studio permissions | The architect never holds more authority than the person it works for. Its run token can write drafts only (AD-017). Apply happens through a `DraftApply` approval decided by a person whose own permissions cover every document in the bundle. Promotion to `staging` and `prod` needs Execute on `Promotion` for that environment, held by the new `Releaser` role or a tenant admin. | AD7.3, AD7.4, AD1.4, AD9.6 |
| Separation of design and run | The architect's deployment is a normal deployment with its own harness, model, and quotas. Its tools are listed only to deployments with `managementAccess: Drafts`. Agents built by the studio get `managementAccess: None` unless a person sets otherwise. | AD7.4 |
| Asset trust | Assets are configuration, written only by principals with Write on `AgentAsset`. Skills are executable instructions to a harness, so the diff shows asset changes in full for text and by hash for binary. Assets are placed only inside the run's workspace or isolated home, never on shared paths. Hash checks on the worker stop tampered content (`AssetIntegrityFailed`). | AD2.2, AD2.4, AD7.2 |
| Document templates | `.dotx` and `.docx` templates can carry macros. The converter reference uses templates as style references only and never runs macros; docs warn against macro-enabled formats, and `.dotm`, `.docm` uploads are refused by default (setting to allow). | AD2.2, AD10.1 |
| MCP credentials | MCP header and environment values reference secrets (encrypted at rest, D-023). Secrets are resolved only in the compiler, scrubbed from stderr and events, never exported in bundles, never readable by the studio run token. The studio can create a secret only by asking the user to enter its value in the dashboard secret form. | AD10.3, AD7.4 |
| File space isolation | A file space belongs to one tenant and one conversation or root run. Run tokens reach only their own tree's file space. App sessions reach only their own conversations. Paths reject traversal, absolute paths, and links. Uploads are epoch-fenced like artifacts, so a fenced-out worker cannot write. | AD3.2, AD3.3, AD3.5, AD6.5 |
| App end users | App sessions call only `/v1.0/apps/{slug}/...`. They never see tool calls, thinking, other users' conversations, or operator routes unless the app enables tool visibility. Anonymous mode is off by default and rate limited when on. | AD6.5, AD6.6 |
| Fan-out abuse | Width, depth, budget, and capacity limits apply to every fan-out; cancellation is transitive. Quotas (opt-in, D-041) count every child. | AD5.2, AD5.4, AD5.5 |
| Audit | Draft applies, revision publishes, promotions, rollbacks, asset writes, app auth changes, and grant use by run tokens write audit records. | Each phase |
| Prompt injection | Content fetched by research subagents can try to steer the orchestrator or the architect. Mitigations: the architect cannot apply changes, the approval shows a full diff, delegation is limited to the graph's allow lists, and permission approvals (P12.3) still gate risky harness tools. | AD7.3, AD6.3 |

---

## 10. Risks and Open Questions

| ID | Risk or question | Impact | Mitigation or owner |
|---|---|---|---|
| R-AD1 | Harness skill locations differ and change between CLI versions (Claude Code `.claude/skills`; equivalents for Codex, Mux, and Gemini CLI may not exist or may move). | Assets placed where the harness does not look. | Placements are data on harness profiles, editable without a release; fallback to `assets/` plus a system prompt listing; probe tests on image rebuilds. |
| R-AD2 | Syncing large file spaces at every run start costs time and bandwidth. | Slow turns for file-heavy conversations. | Per-file version checks so unchanged files are skipped on warm workers, limits per file space, and MCP reads for large files instead of full sync (setting to sync on demand). |
| R-AD3 | Parallel children writing the same path. | Confusing results. | AD-014 conflict naming plus `FileConflict` events; fan-out instructions template tells children to write under their own subfolder. |
| R-AD4 | Studio quality depends on the user's chosen model and harness. | Poor drafts from weak models. | Every change goes through diff, dry run, and approval; skills and templates for the architect are editable; the canvas is always available as a fallback. |
| R-AD5 | Two editors (chat and canvas, or two people) on one draft. | Lost edits. | Draft version numbers and 409 conflicts (AD-019). |
| R-AD6 | Revisions add a layer between agents and runs. | Confusing behavior if users edit an agent and expect it live. | Default unpinned deployments follow the latest published revision (AD-012); the dashboard shows "draft changes not published" on agents with an open draft. |
| R-AD7 | Converting Markdown to Word with a `.dotx` template: pandoc's `--reference-doc` expects a `.docx`. | Template not applied. | The converter skill copies the `.dotx` styles into a reference `.docx` first, or stores the template as `.docx`; covered by AD10.1 acceptance. |
| R-AD8 | Prompt injection through fetched research content. | Unwanted actions. | See section 9 "Prompt injection". |
| R-AD9 | A new top-level sidebar item amends D-037. | Navigation churn. | AD-023 is proposed; AD7.10 falls back to a tab under Agents until confirmed. |
| Q-AD1 | Where is the DocConverter project and what interface does it expose (CLI, library, MCP server)? It was not found in this repository. | Decides whether the reference converter wraps it as a CLI in the worker image or binds it as an MCP server. | User. Until answered, AD10.1 ships pandoc as the default backend. |
| Q-AD2 | Which PDF path should the optional worker build argument install: LibreOffice headless (large, high fidelity for `.docx`) or a LaTeX engine (pandoc to PDF from Markdown, loses Word styling)? | Image size and output fidelity. | Recommend LibreOffice for `.docx` to PDF; user to confirm before AD10.2. |
| Q-AD3 | Should anonymous app sessions be allowed at all in production overlays? | Exposure of agents to the internet. | Default off (AD-021); user to confirm whether the Helm chart should allow enabling it. |
| Q-AD4 | Should the app UI also ship as its own published image? | Publication needs approval. | Served from the dashboard image by default (AD-020); separate image only on approval. |
| Q-AD5 | Should file spaces support external end-user uploads larger than the artifact per-file limit (for example research PDFs)? | Upload failures for large sources. | Separate `FileSpaces.MaxFileBytes` setting (AD3.2); user to confirm defaults. |
| Q-AD6 | Can one conversation span several agents? Today a conversation belongs to one agent. | The app conversation is on the entry agent; subagents run as delegated children. | Keep one agent per conversation; children share the file space instead. Revisit if a use case needs handing the conversation to another agent. |

---

## 11. Use Case Walkthrough: Research Overview

The user asks: "build a research overview of Jev and other decision models". The steps below show which planned feature serves each step. The app is the one in AD10.5: an orchestrator entry agent (`research-orchestrator`), a researcher subagent (`researcher`), a writer subagent (`report-writer`), and the reference converter (`doc-converter`).

### 11.1 Building the app in the studio

| Step | What happens | Feature | Tasks |
|---|---|---|---|
| B1 | The builder opens Studio. The SetupWizard already created the agent architect's deployment on the harness and model they picked. | Studio agent, SetupWizard step | AD7.6, AD9.5 |
| B2 | The builder says "I need an agent that researches a topic, collects sources in parallel, writes a report with me, and exports Word and PDF." The architect proposes four agents and their edges. | Chat experience (a), draft bundle | AD7.2, AD7.5 |
| B3 | The canvas shows the orchestrator with edges to researcher, writer, and converter. The builder drags an extra edge from writer to converter in the canvas; the chat sees it. | Visual editor, live sync | AD8.1, AD8.2, AD8.5 |
| B4 | The architect writes allow lists and max depth from the graph (orchestrator depth 2, writer depth 1). | Delegation derivation | AD6.3 |
| B5 | The builder uploads a `.dotx` corporate template and a "citation style" skill; the architect pins them on the writer and converter revisions. | Agent assets, placement | AD2.1 to AD2.4 |
| B6 | The architect asks how conversion should work and explains the three sources; the builder picks the reference converter agent. | Capability guidance, registry | AD7.8, AD4.2 to AD4.4 |
| B7 | Experience (b): the builder sets the researcher's model and a 10 minute timeout, a cost budget for fan-out, and `prod` branding. | Runtime parameters | AD7.7, AD8.4 |
| B8 | The builder tries the draft in the playground over two turns and checks the compile preview. | Playground, compile preview | AD9.1 to AD9.3 |
| B9 | The architect requests apply. The builder reviews the diff and dry-run result in Approvals and approves. Revisions publish; dev deployments are created. | DraftApply approval, deploy | AD7.3, AD9.4 |
| B10 | After testing in dev, a releaser promotes the app to staging and prod. Later, a bad prompt change is rolled back in prod. | Revisions, environments, promotion, rollback | AD1.4, AD6.4, AD9.6 |
| B11 | (Later) An eval set built from playground conversations must pass before prod promotion. | Eval gates | AD11.4 |

### 11.2 The end user's conversation

| Step | User request or agent action | Feature that serves it | Tasks |
|---|---|---|---|
| 1 | The end user opens the shareable app URL, signs in (or gets an anonymous session if enabled), and sees the app's branding. | App UI, app auth, branding | AD6.5, AD6.7, AD6.10 |
| 2 | "Build a research overview of Jev and other decision models." The app gateway starts a conversation on the entry agent's `prod` deployment, with a new file space. | App gateway, conversation, file space | AD6.6, AD3.1 |
| 3 | The orchestrator checks the catalog for what it can use: `researcher` (input schema `{url, focus}`, median 90 s, cost hint), `report-writer`, `doc-converter`. | Agent catalog with schemas and hints | AD4.5, AD4.6 |
| 4 | The orchestrator returns candidate URLs to the user and writes them to `files/sources.md`. The file shows up in the file panel. | File space, MCP file tools, file panel | AD3.5, AD6.9 |
| 5 | The user confirms. The orchestrator fans out one `researcher` child per URL (8 children) with a 15 minute timeout and a cost budget, without waiting on each. | Fan-out, budget | AD5.2, AD5.4 |
| 6 | Children write notes to `files/notes/<source>.md` in the shared file space. Two write the same path; one is kept under a conflict name and the orchestrator sees a warning. | Shared file space, conflict handling | AD3.2, AD3.3 |
| 7 | The orchestrator gathers. Seven finish; one times out. Gather returns seven results plus the pending one, and the orchestrator reports partial coverage. While waiting, its slot was released. | Gather, partial results, continuation | AD5.3, AD5.5 |
| 8 | Turn 2: "Focus on Jev, multi-criteria analysis, and Bayesian decision models." The next turn resumes the harness session and sees every note file from turn 1. | Conversation resume (P12.1), file space across turns | AD3.3, AD3.7 |
| 9 | Turn 3: "Use these sections: Executive summary, Background, Model comparison, Recommendations." The orchestrator records the outline in `files/outline.md`. | File space | AD3.5 |
| 10 | The orchestrator invokes `report-writer` to draft `files/report.md` from the notes and outline, using the citation style skill placed at the harness's skill path. | Delegation, assets placement | AD2.3, AD2.4 |
| 11 | Turn 4: "Rewrite the executive summary in plainer prose." The orchestrator calls `report-writer` again; the new version of `report.md` is a new file version, and the old one stays in history. | File versions, delegation | AD3.2, AD6.9 |
| 12 | Turn 5: "Convert it to Word using our template." The orchestrator calls `doc-converter` with the template asset; `files/report.docx` appears in the file panel. | Reference converter, document template asset | AD10.1, AD2.1 |
| 13 | Turn 6: "Make the body font 11 point." `doc-converter` applies the style override and writes a new version of `report.docx`. | Converter style overrides, file versions | AD10.1, AD3.2 |
| 14 | Turn 7: "Now give me a PDF." `doc-converter` converts on a node that advertises the PDF tool; `files/report.pdf` appears. A run needing the tool on a node without it would queue with a clear reason. | Harness built-in capability, placement | AD4.4, AD10.2 |
| 15 | The user downloads the `.docx` and `.pdf` from the file panel. | File panel download | AD6.9 |
| 16 | The operator reviews the conversation in the dashboard: transcript, run tree with the fan-out group, and the same files. | Dashboard conversation files, run tree | AD3.8, AD5.8 |

The same flow works with the other two capability sources from AD-006: in step 12, the orchestrator could call a tool on a bound external MCP converter (AD10.3), or run pandoc through its own harness shell with the template placed as an asset (AD10.4). The catalog lists whichever ones the app binds, and the orchestrator's prompt does not change.
