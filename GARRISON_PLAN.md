# Garrison Implementation Plan

Garrison is a multi-tenant control plane that stations headless agent harnesses (Claude Code, Codex, Mux, Gemini CLI, and any CLI you can describe) on a fleet of worker nodes, and dispatches them on demand behind REST, MCP, and A2A. The control plane decides what runs, where, with which prompts, credentials, MCP servers, and workspaces. Worker nodes do the running. Each side scales on its own.

This document is the build plan. It is meant to be executed, annotated, and kept current by whoever is doing the work. The first stopping point is the MVP (milestone M1, Phase 9). Everything after M1 takes the system to a production-grade, horizontally scalable 1.0.

| | |
|---|---|
| Repository | https://github.com/jchristn/Garrison |
| Product version at plan creation | `0.1.0-alpha` (agents never change versions without explicit approval, see `VERSIONING.md`) |
| License | MIT |
| Primary language | C# (.NET 8 and .NET 10), React 19 dashboard |
| Deployment target | Kubernetes (generic, K3S, minikube) |
| Plan owner | Joel Christner |

---

## Table of Contents

1. [How To Use This Plan](#1-how-to-use-this-plan)
2. [Progress Dashboard](#2-progress-dashboard)
3. [Product Definition](#3-product-definition)
4. [Decision Log](#4-decision-log)
5. [Requirements Compliance Matrix](#5-requirements-compliance-matrix)
6. [Architecture](#6-architecture)
7. [Domain Model](#7-domain-model)
8. [Configurability Model: Harnesses, Prompts, Resources, Deployments](#8-configurability-model-harnesses-prompts-resources-deployments)
9. [Run Lifecycle, Scheduling, and Leasing](#9-run-lifecycle-scheduling-and-leasing)
10. [API Surfaces](#10-api-surfaces)
11. [Security Model](#11-security-model)
12. [Repository Layout](#12-repository-layout)
13. [Kubernetes Deployment Design](#13-kubernetes-deployment-design)
14. [Dashboard Design and Route Inventory](#14-dashboard-design-and-route-inventory)
15. [SDK Design](#15-sdk-design)
16. [Testing Strategy](#16-testing-strategy)
17. [Telemetry](#17-telemetry)
18. [Work Breakdown](#18-work-breakdown)
19. [Risks and Open Questions](#19-risks-and-open-questions)
20. [Appendices](#20-appendices)

---

## 1. How To Use This Plan

Every unit of work is a checkbox with a stable ID such as `P3.4.2`. The ID never changes once assigned, even if the task moves or gets dropped, so commits, pull requests, and notes can reference it.

Annotate tasks in place. The status marker goes in the checkbox, and the annotation goes at the end of the line after two spaces and a pipe:

| Marker | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done and verified (tests or a described manual check) |
| `[-]` | Dropped or deferred, with a reason in the annotation |
| `[!]` | Blocked, with the blocker in the annotation |

Annotation format: `  | <who> <YYYY-MM-DD> <short note, commit hash, or PR>`

Example:

```
- [x] P1.2.3 Implement `TenantMethods` for Postgresql.  | claude 2026-10-09 schema_migrations tracked, idempotent (db-* migrate-twice test)
- [!] P7.3.1 Publish images to Docker Hub.  | jc 2026-10-14 blocked on Docker Hub org token
```

Rules for keeping the plan honest:

- A task is `[x]` only when its acceptance note is true. If a task has no acceptance note, "builds without warnings and is covered by a test or a written manual check" is the default bar.
- When scope changes, add a new task with a new ID. Do not silently rewrite a finished task.
- Decisions that change architecture go in the [Decision Log](#4-decision-log) with the next `D-` number, and the affected sections get updated in the same change.
- Update the [Progress Dashboard](#2-progress-dashboard) counts when a phase changes state. It is maintained by hand, and that is fine.
- Never use em-dashes in this file or in anything the plan produces (see `WRITING_DOCUMENTS.md`).

---

## 2. Progress Dashboard

| Phase | Name | Milestone | Status | Done / Total |
|---|---|---|---|---|
| 0 | Repository bootstrap | M1 | Complete | 14 / 14 |
| 1 | Core foundation: settings, data layer, identity, RBAC, history, audit | M1 | Complete | 51 / 51 |
| 2 | Configuration domain: harness profiles, prompts, resources, agents, deployments, manifests | M1 | Complete | 29 / 29 |
| 3 | Runtime: runs, scheduler, leases, worker node, harness execution, events | M1 | Complete | 47 / 47 |
| 4 | Protocol ingress: REST invoke, MCP, A2A, delegation | M1 | Complete | 10 / 10 |
| 5 | Dashboard | M1 | Complete | 52 / 52 |
| 6 | SDKs (C#, Python, JavaScript/TypeScript, Go) | M1 | In progress | 18 / 21 |
| 7 | Container images and Kubernetes assets | M1 | In progress | 37 / 38 |
| 8 | Documentation and Postman | M1 | Complete | 22 / 22 |
| 9 | MVP verification (milestone M1) | M1 | Complete | 17 / 17 |
| 10 | Control plane high availability and scale-out | M2 | In progress | 22 / 25 |
| 11 | Pod-per-run isolation executor | M2 | In progress | 13 / 20 |
| 12 | Advanced orchestration: conversations, approvals, remote agents, triggers, budgets, artifacts | M3 | In progress | 4 / 46 active (1 dropped) |
| 13 | Observability stack and dashboards | M2 | Complete | 28 / 28 |
| 14 | Benchmarking | M3 | In progress | 14 / 15 |
| 15 | Hardening, simulated user testing, and 1.0 release | M4 | Not started | 0 / 21 |

Milestones:

| Milestone | Definition | Phases |
|---|---|---|
| **M1: MVP** (signed off 2026-10-10, D-031) | One control node, two worker nodes, a Claude Code agent, a Mux agent, and a Codex agent running headless; dashboard, four SDKs, tests, Postman, and documentation; deployable to minikube and K3S. | 0 to 9 |
| **M2: Scale** | N control-plane replicas behind a Service with HPA, leader-elected maintenance, event backplane, pod-per-run isolation, full observability stack. | 10, 11, 13 |
| **M3: Orchestration** | Multi-turn conversations, permission approvals relayed to humans, self-registered remote agents invoked over A2A/MCP, triggers, budgets and quotas, artifact storage, benchmarks. | 12, 14 |
| **M4: 1.0** | Security review, simulated user testing, upgrade path, release process. | 15 |

### Current state and where to pick up (updated 2026-10-12)

Execution resumed 2026-10-12 at the user's request. P12.3 approvals from `worktree-agent-a808f7add5e64672e` (`2df763a`) is integrated with P12.1 conversations, validated, and deployed to `garrison-k3s`. All 59 conflicting files were resolved while retaining both features and migrations 12 and 13. Integration merge `fa189a0` and G-28 fix `f947551` are committed and pushed to `main`. P10.22 bulk event insertion is implemented, verified, and deployed; its code and current results are saved with this plan update.

**State**

- M1 done. M2 open: 10 tasks in phases 10 and 11 (Phase 13 complete). M3: Phase 12 at 4 of 46 active tasks, Phase 14 at 14 of 15. M4 not started. Phase 7 has 38 listed tasks, not 39; Phase 12 has 46 active tasks including P12.2a plus the deliberately dropped P12.30.
- Combined .NET 8 and 10 build: zero errors/warnings. Full Touchstone net10 run: 469/469 on SQLite/PostgreSQL; four additional provider cases subsequently passed for approval/conversation interaction and upgrade from schema 12. The latest net8 database/approval suites pass 39/39 on both providers. xUnit net8 passed its all-suites fact; NUnit net10 passed 306/306 SQLite cases. All four SDK harnesses pass. Dashboard lint/build, 253 unit tests, 72 contract routes, and 123 Playwright browser tests pass. All CI mirror pairs, eight Kustomize overlays, Helm lint/template, and em-dash checks pass.
- New integration regression: an approval pending during a conversation keeps it busy, refuses concurrent turns without consuming a turn number, clears approval counters on completion, and preserves the session for the next turn. Upgrade from schema 12 to 13 preserves the session/turn count, adds working approval storage, and applies no migration again on restart. Both providers pass.
- Real Claude Code 2.1.296 smoke against the combined local server passed: a Bash request reached Garrison, a human-style REST Allow decision unblocked it, the harmless command wrote its test file, and Claude exited 0. Temporary test files/configuration were removed; no login was copied into the cluster. Approval waits over about an hour remain untested against MCP session idle timeouts.
- Reference SQL schemas are regenerated from SchemaBuilder through migration 14 and execute on both providers. The old migration-12 gap on the approvals branch is resolved.
- `garrison-k3s` was rolled out 2026-10-12 with the combined conversations/approvals tree: 2 server replicas, 2 workers, dashboard, and existing observability. Database schema confirmed 13. All six live dashboard tests pass. Initially real-harness validation was 21/25 because stored Codex credentials needed reauthentication; after the user supplied a dedicated login and the delegation check was corrected, all 25 checks pass with a successful Codex child.
- G-28 is fixed and verified on both providers/frameworks; server image rolled out successfully. The validation script now requires a delegated child to succeed instead of accepting a failed child as a passing run-tree check. Both verdict paths were checked; live Claude/Mux validation passes 20/20 with a successful delegated Mux child and SSE. The user completed a dedicated login under `~/.garrison/codex-auth`; it was imported through the write-only secret value API without displaying credentials. Secret status is now `Ok`, and the corrected all-three-agent validation passes 25/25 with a successful Codex delegated child.
- P10.22 is implemented and verified: provider-limited multi-row inserts retain replay deduplication and whole-batch rollback, including a late-chunk failure. Net10 event/worker/protocol/replica/observability/structured-output/approval suites pass 118/118; net8 runtime passes 20/20 on both providers. Five-round direct database medians at batch 100 improve SQLite 12% and PostgreSQL 11.22x; batch 1 is unchanged within observed variation. Raw generated results remain local under `benchmarks/results/20261012-event-inserts`, with medians and reproduction instructions in `docs/SCALING.md`. Updated server image rolled out successfully with 2 Ready replicas; all 25 real-harness checks (including a successful Codex child) and 6 live dashboard tests pass after the rollout. The reproduction script was exercised from a clean temporary baseline checkout and leaves no extra worktree.
- P12.7 is complete and deployed: an empty operator-configured tenant/harness/exact-model price table (migration 14), scoped CRUD API, four SDKs, and Configuration > Model Prices. Reported cost including zero wins; optional cache/reasoning rates fall back to input/output, accounting flags avoid double charging, repairs price each phase before accumulation, and historical costs survive price edits/deletion. Full net10 regression passes 484/484 on SQLite/PostgreSQL; net8 pricing/database checks pass 25/25; build has zero warnings/errors; all four SDK harnesses, 261 dashboard unit tests, 125 browser checks, 74 contract routes, and 8 telemetry checks pass. The browser audit initially hit shared trace cleanup when two Playwright commands overlapped; it passes in an isolated rerun. Generated SQL schemas through 14 execute on both providers. K3S has schema 14 and 2 Ready server replicas; the live empty-table/CRUD fixture was removed, all 25 real-harness checks and 6 live dashboard checks pass. D-038 records daily midnight-UTC quotas and an empty price table; D-039 records continued admission with incomplete accounting for unknown cost.
- Cluster access: kubeconfig `~/.kube/garrison-k3s.yaml`, namespace `garrison`; REST 8700, MCP 8701, dashboard 8081, Grafana 3000, Prometheus 9090. REST/dashboard forwards were restarted after rollout. Applying the overlay resets server replicas to 1; restore 2 afterwards. Same-tag image deployments require explicit worker/dashboard rollout restarts.

**Pick up here, in order**

1. Codex reauthentication and corrected real-harness validation are complete (25/25). Run an approval wait over an hour to verify MCP session idle behavior; this soak is still open.
2. Cost estimation P12.7 is complete. Continue daily UTC budgets/quotas (P12.6, D-038/D-039), delegation budgets (P12.35), and QoSKit (P12.36, P12.38, D-036). Design answers are in D-035. G-28 and P10.22 are complete; P10.23 event coalescing remains open.
3. Remaining M2 work: P10.23 to P10.25, P11.14 to P11.20. Run P14.15 before P10.24 tuning, because tuning depends on its results; then Phase 15. P10.23 prevents storing one event per token for `builtin/codex-app-server`.
4. Close G-12 by switching `builtin/codex` to app-server mode after a soak covering MCP servers, output schema, thread resume, and sandbox configuration.
5. Other follow-ups: dashboard manifest `errorCode`; IMPROVEMENTS.md I-01 (synchronous invocation waits holding connections); cancel-latency robustness under load; conversation directory cleanup on delete, conversation retention, and affinity wait expiry end-to-end coverage.


**Waiting on the user**

- No credential action pending: the user completed a dedicated Garrison Codex login on 2026-10-12; the secret is `Ok` and real-harness validation passes. Keep that login separate from the operator's active Codex login.
- No budget-design question pending: D-038 records daily UTC windows; D-039 records continued admission with visibly incomplete accounting when cost is missing.
- Publishing images and packages (P7.5, P6.20) stays deferred until the user asks.

**Things to know when resuming**

- Telemetry renamed metrics (`_seconds` suffixes, worker token and cost series are counters, new labels); see CHANGELOG compatibility notes.
- C# SDK `Tenants.DeleteAsync` now returns `Task` (G-7), and every single-resource DELETE answers 204.
- The `.bat` scripts added by Phase 14 and the telemetry verifier are untested (no Windows host). The benchmark ci-gate workflow passed on GitHub for `d9ce033`.
- Several agents editing one working tree caused commits to be grouped; for the next stretch, prefer one agent per area, or worktrees branched from the current commit.
- Agent worktrees branch from the last pushed commit, not the local `main`: push before starting a worktree agent, or it misses unpushed merges (this is how P12.3 missed P12.1).
- Agents that start their own sub-agents can stop while waiting and not resume; when the sub-agent finishes, message the parent agent to finish its checks and commit.

---

## 3. Product Definition

### 3.1 The problem

Agent harnesses such as Claude Code, Codex, and Mux are full agents. They bring their own tool loops, file editing, shell access, MCP clients, and session state. Running one of them from a script is easy. Running hundreds of them for many teams, each with its own prompts, credentials, MCP servers, and workspaces, with requests arriving over MCP and A2A and agents calling other agents, is not. Kubernetes can schedule the containers, but it knows nothing about prompts, sessions, tool permissions, delegation depth, token cost, or who is allowed to invoke which agent.

Aegon proved the pattern on one machine: each agent is a harness wrapped as a service, long work runs as jobs that are started and polled, and every tool call carries a short-lived token scoped to one turn. Garrison is that pattern made distributed, multi-tenant, and declarative.

### 3.2 What Garrison is

- A **control plane** ("Command") of stateless .NET nodes that own the registry of agents and their configuration, accept invocations over REST, MCP, and A2A, compile each invocation into a fully resolved execution spec, queue it, and track it through completion.
- A **data plane** of worker nodes ("Posts") that pull work by lease, materialize an isolated workspace and home directory, run the harness process headless with the compiled command line, environment, files, and stdin, parse its output stream into normalized events, and report back.
- A **configuration system** in which every harness command line, every prompt, and every resource binding is data, not code, and can be edited, versioned, previewed, cloned, and applied declaratively.
- A **dashboard and SDKs** that make all of that operable.

### 3.3 What Garrison is not

- Not a model gateway. Model routing belongs to the harness or to a separate gateway such as Conductor. A Mux deployment can point at a Conductor virtual model runner by configuration.
- Not a general container scheduler. Garrison runs inside Kubernetes and uses it; it does not replace it.
- Not an agent framework. Garrison does not implement a tool loop of its own in the MVP. A provider-API execution mode (PolyPrompt, as in Aegon) is a post-1.0 option, not a goal.

### 3.4 Vocabulary

The Garrison theme is used for product naming and documentation. API nouns stay literal so the REST surface reads cleanly.

| Concept | API noun | Garrison name | Meaning |
|---|---|---|---|
| Control plane node | (server) | Command | Stateless API, scheduler, compiler, registry. Many replicas. |
| Worker node | `Node` | Post | Pulls runs, executes harnesses. Many replicas. |
| Harness profile | `HarnessProfile` | Drill | How to run one harness headless: executable, argument template, environment, files, parser. |
| Prompt template | `PromptTemplate` | Orders | A named, versioned, rendered text template. Every prompt Garrison sends is one. |
| Agent | `Agent` | Unit | A named capability with an identity, a description, A2A card data, and exposure settings. |
| Agent deployment | `Deployment` | Detail | Binds an agent to a harness profile, prompt templates, resources, placement, and limits. An agent can have several (for example a Claude Code variant and a Mux variant) with traffic weights. |
| Run | `Run` | Sortie | One invocation of one deployment. Has a lifecycle, events, a result, and usage. |
| Resource bindings | `McpServer`, `Secret`, `Workspace`, `ArtifactStore` | Kit | What a run is issued: MCP servers, credentials, a workspace, and storage. |
| Delegation | `Run.ParentRunId` | Requisition | One agent's run invoking another agent. |
| Self-registration | `POST .../register` | Muster | Nodes and remote agents announcing themselves. |

### 3.5 Personas

| Persona | Primary jobs |
|---|---|
| Platform administrator | Install and upgrade Garrison, manage tenants, node pools, global settings, and built-in harness profiles. |
| Tenant administrator | Manage users, credentials, roles, secrets, and quotas inside a tenant. |
| Agent developer | Author harness profiles, prompt templates, agents, and deployments; preview renders; test-invoke; read run transcripts. |
| Operator | Watch runs and nodes, cancel or retry work, investigate failures through events, request history, and audit. |
| Integrator | Call agents from code (SDKs, REST), from MCP clients, or from other A2A agents. |
| Agent (non-human) | Delegates to other agents through Garrison's MCP tools with a scoped run token. |

---

## 4. Decision Log

| ID | Decision | Rationale | Source |
|---|---|---|---|
| D-001 | Product name is Garrison. | Chosen by the user. | User, 2026-10-09 |
| D-002 | Kubernetes is the deployment target. Ship Kustomize base plus overlays for generic Kubernetes, K3S, and minikube, and a Helm chart. Docker Compose stacks are not shipped. Dockerfiles exist only to build images. | User asked for Kubernetes assets instead of Docker assets. | User, 2026-10-09 |
| D-003 | Harness credentials support API keys and subscription tokens: `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENAI_API_KEY`/`CODEX_API_KEY`, a Codex `auth.json` file credential, and generic env/file secrets. Documentation carries a terms-of-service caveat for subscription tokens on shared servers. | User selected "Subscription tokens too". | User, 2026-10-09 |
| D-004 | Run isolation: MVP runs each harness as a subprocess inside the worker pod with its own workspace and its own `HOME`. Phase 11 adds an optional executor that launches a Kubernetes Job (pod) per run. | User selected subprocess in MVP, pod-per-run later. | User, 2026-10-09 |
| D-005 | SDKs: C#, Python, JavaScript/TypeScript, Go. | User selected all four. | User, 2026-10-09 |
| D-006 | All prompts are configurable. Every piece of text Garrison sends to a harness or exposes as a tool description is a `PromptTemplate`. Built-ins are seeded, protected, cloneable, and resettable. | User requirement. | User, 2026-10-09 |
| D-007 | Headless harness invocation is fully configurable through `HarnessProfile` data: executable, ordered argument templates with conditions, environment templates, materialized files, prompt and system prompt delivery, MCP config delivery, output parser, timeouts, exit-code policy, and probes. Deployments layer overrides on top. | User requirement. | User, 2026-10-09 |
| D-008 | Scheduling is pull-based. Workers lease runs from the control plane with an atomic compare-and-set claim and a fencing epoch. The control plane never connects to workers. | Keeps the control plane stateless and leaderless on the hot path, works across NAT and network policy, and lets each plane scale independently. | Ideation |
| D-009 | Coordination uses database leases by default (`coordination_leases` table) behind an `ILeaseProvider` interface. Clutch is an optional provider (Phase 12). Padlock is used for in-process keyed locks only. | Avoids a required service dependency. Padlock cannot coordinate across processes. | Ideation |
| D-010 | The control plane compiles each run into a fully resolved `ExecutionSpec` (command line, environment, files, stdin, parser, timeouts, MCP config) and hands it to the worker with the lease. Workers never read the database or render templates. | One source of truth for rendering and secret resolution; workers stay thin and replaceable. | Ideation |
| D-011 | Database providers: Sqlite and Postgresql only. MySQL and SQL Server are out of scope by user direction, which narrows `BACKEND_ARCHITECTURE.md`'s four-provider rule. Postgresql is the default for Kubernetes. Sqlite is for development and single-node use only and is rejected at startup when more than one control-plane replica is configured. | Requirements plus horizontal scaling. | Requirements |
| D-012 | URL convention follows Clutch: management API under `/v1.0/api/...`, tokens at `/v1.0/token`, health at `/v1.0/api/health`, request history at `/v1.0/api/request-history`, tenant-owned resources under `/v1.0/api/tenants/{tenantId}/...`. This resolves the `/api/v1` vs `/v1.0/api` inconsistency inside `BACKEND_ARCHITECTURE.md` in favor of the form the same document mandates for request history and that the reference projects use. | Consistency with the reference implementation. | Requirements conflict, called out |
| D-013 | Voltaic hosts MCP on its own `HttpListener`, so the control plane exposes MCP on a second port (default 8701). A2A is served on the main Watson port by Garrison's own routes using Voltaic's public A2A model and JSON types, because one Voltaic `A2AHttpServer` hosts exactly one agent card and Garrison hosts many. | Voltaic's dispatch layer is internal and cannot be mounted into Watson. | Research of Voltaic 2.3.0 |
| D-014 | Settings are split. Node-local bootstrap settings (bind address, ports, database connection, logging) come from the settings JSON file and environment and are restart-required. Cluster runtime settings (scheduling, retention, limits, security policy, feature flags) live in the database, are edited from the Settings page, and apply live across all replicas. When the settings file is writable (development), the Settings page edits it as `BACKEND_ARCHITECTURE.md` requires; when it is mounted from a ConfigMap, those fields are shown read-only with their source. | A settings file cannot be the shared source of truth for N replicas mounted from a read-only ConfigMap. | Justified divergence, see section 5 |
| D-015 | Run events are persisted to the database with a per-run monotonic sequence. Live streaming (SSE, WebSocket, A2A streaming) tails the database by sequence, which works across replicas without a broker. Phase 10 adds an optional notification backplane to cut latency. | Correct across replicas on day one, optimizable later. | Ideation |
| D-016 | Images publish to Docker Hub as `jchristn77/garrison-server`, `jchristn77/garrison-worker`, and `jchristn77/garrison-dashboard`, multi-arch (amd64, arm64). `DOCKERHUB_README.md` is kept because images are published. | Matches the reference projects' publishing pattern. | Clutch build scripts |
| D-017 | Dashboard locales: `en` (source), `de`, `ja`, plus the `zz` RTL/expansion pseudo-locale for M1; the full set matches Armada: `es`, `fr`, `it`, `zh-Hans`, `zh-Hant`, `yue-Hant` follow (P5.48), marked beta until reviewed by a native speaker. | Matches Clutch and Hydra. | Requirements |
| D-018 | The worker image bundles Node.js with pinned `@anthropic-ai/claude-code` and `@openai/codex`, and Mux built from a pinned commit of `jchristn/Mux` as a framework-dependent `Mux.Cli.dll` with a `/usr/local/bin/mux` wrapper (Aegon's method). Gemini CLI is optional behind a build argument. | Aegon proved this layout. | Aegon `docker/images/harness-base/Dockerfile` |
| D-019 | Run success is decided by the parser's final event, never by the exit code alone. The exit code is recorded. | Aegon lesson: harnesses exit 0 on failure and non-zero after success in some cases. | Aegon `AEGON_PLAN.md` section 7 |
| D-020 | MCP pre-flight is part of the execution spec. Before launching a harness, the worker verifies each required MCP server answers `tools/list` and exposes its required tools, because Claude Code, Gemini CLI, and Mux fail MCP authentication silently. | Aegon lesson. | Aegon `McpPreflight` |
| D-021 | No hard-coded prompt text anywhere in the run path. Armada left its launch prompt, mission-mode contract, persona output contracts, pipeline handoff text, and review feedback as string literals while a template for the launch prompt sat unused. Garrison's compiler takes every string it sends from a `PromptTemplate`, and a test fails if the compiler emits text that did not come from a template or from caller input. | Armada lesson; user requirement D-006. | Armada `MissionPromptBuilder.BuildLaunchPromptAsync` |
| D-022 | Template resolution is always tenant-scoped (tenant row first, then built-in), by ID or by `(tenantId, name)`, never by name alone. | Armada resolves templates by name without a tenant filter. | Armada `PromptTemplateService.ResolveAsync` |
| D-023 | Every credential, including model endpoint keys and MCP header values that reference secrets, is encrypted at rest (D-003, section 11.5). | Armada stores model endpoint API keys in plain text. | Armada `ModelEndpointMethods` |
| D-024 | Workers buffer events across control-plane outages (bounded, with drop counters) and replay them with their original sequence numbers; runs are never silently truncated by a link drop. | Armada Harbor loses output produced while the link is down. | Armada `docs/HARBOR_PROTOCOL.md` |
| D-025 | Phase 12 permission approvals reuse Claude Code's rule syntax (`Bash(git status:*)`, `mcp__server__*`) and Armada's matcher semantics (deny beats allow, every shell subcommand must match, no command substitution), relayed through `--permission-prompt-tool mcp__garrison__garrison_permission_prompt`. Other harnesses get `Bypass` or `Refuse` until they expose an equivalent hook. | Armada proved the relay works for Claude Code only. | Armada `CliPermissionService`, `CliPermissionRuleMatcher` |
| D-026 | Garrison sets SyslogLogging `EnableConsole` only to turn the console off; the default stays on. The setter probes for a terminal (`UserInteractive`, `WindowHeight`), which fails in containers and silently drops all console output. | Changing SyslogLogging's probe would alter behavior for its existing users; an additive opt-in property can replace this later. | `src/Garrison.Server/Bootstrapper.cs`, `src/Garrison.Worker/Bootstrapper.cs` |
| D-027 | A wildcard Prometheus hostname (`*`, `+`, `0.0.0.0`) binds to the machine host name (the pod IP in Kubernetes) and falls back to `127.0.0.1`. | The OpenTelemetry Prometheus listener cannot bind a wildcard: `*` and `+` fail URI parsing and `0.0.0.0` is rejected by the managed `HttpListener`. | `GarrisonTelemetry` |
| D-028 | Docker Compose assets ship alongside Kubernetes (`docker/compose.yaml`, `docker/update.{sh,bat}`, `docker/factory/reset.{sh,bat}`), amending D-002. `update` rebuilds images from source by default (`--pull` uses published images), as the user asked; the requirements default is pull. The bootstrap container reuses the Kubernetes bootstrap script and sample manifests. | A single-machine stack with real harnesses is the fastest way to evaluate Garrison; one bootstrap script keeps both runtimes identical. | `docker/`, `docs/DOCKER.md` |
| D-029 | Run timing is measured on the worker with a monotonic clock (time to first token, streaming time, execution time) and reported with the completion; the server computes queue time from its own timestamps. Analytics aggregate in the server process over a bounded window, so percentiles work the same on Sqlite and Postgresql. | Worker and server clocks can differ; durations measured on one clock are exact. SQL percentile functions differ by provider. | Section 10.6 |
| D-030 | Every interactive or labeled dashboard element carries a useful, translated tooltip that explains what it is and how it is used (never a restatement of its label), enforced by an automated test over every route, tab, and form. | Operators learn the product from the UI itself. | P5.44 |
| D-031 | M1 is signed off with these exceptions, each recorded: P6.17 (the worker using `Garrison.Sdk` for the node protocol) is deferred because it is internal dogfooding with no user impact; P6.19, P6.20, and P7.28 are post-M1 by design; P7.5 and P6.20 wait for the user's approval to publish images and packages; P7.26 waits for minikube on the build machine (the K3S, Docker Compose, and production paths are verified or reviewed). Open known gaps G-1 to G-8, G-11, G-12, G-17, G-19, and G-20 carry into M2. | Every M1 capability works end to end on K3S and Docker Compose with real Claude Code, Codex, and Mux harnesses; the exceptions do not affect what an operator can do. | Section 2 |
| D-032 | The worker image builds Mux 1.3.0 (`60fd88a`), which fixed the issues Garrison reported (`~/Code/Mux/BUGFIXES_FROM_GARRISON.md`); Garrison reads its `failed` status, cached and reasoning tokens, cost, context window source, and `mcp.enabled`, and still parses Mux 1.2.0 output. Builds from source until the v1.3.0 release leaves draft. | Mux-side fixes are better than Garrison workarounds; source builds keep the pin exact. | `src/Garrison.Worker/Dockerfile` |
| D-033 | Pod-per-run executor: the worker creates a Job per run from a Secret-mounted spec, and the run pod writes prefixed event lines to stdout that the worker relays; run pods hold no Garrison or Kubernetes credentials. | Keeps one Garrison client per node, so leases, fencing, guards, and telemetry work unchanged, and a compromised run pod cannot reach the control plane API or the cluster API. | Phase 11 |
| D-034 | Text deltas are coalesced on the worker before they are stored (P10.23), and live streams keep tailing the database. Garrison adds no separate path that broadcasts raw deltas. | Live readers already poll the database every 250 ms (D-015) and the backplane carries hints only (P10.4), so merging inside one flush window is invisible to viewers; a second delivery path would split ordering and replay across two channels. | `AB_IMPROVEMENTS.md` G11, D-015 |
| D-035 | Answers to the AB_IMPROVEMENTS.md design questions (user, 2026-10-11): lost `AtMostOnce` runs end `NodeLost` (P12.29, P12.30 dropped); deployments default to `Trusted` with a visible warning and a tenant setting to require `Untrusted` (P11.14); per-deployment egress is plain NetworkPolicy CIDR rules (P11.15); Process runs get `0700` directories and a "trusted only" label, no per-slot OS users (P11.16); warm pods receive the spec on stdin (P11.20); resource capacity is placement accounting only (P10.25); the gateway covers Garrison tools and brokered credentials only (P12.31); exhausted delegation budgets refuse new children and let running ones finish, and callers may only lower a budget (P12.35); tenant fair share uses weighted fair queuing (P12.36); delegation capacity fails fast with a typed error (P12.38); suspension is opt-in per deployment (P12.39); pinned re-runs use deployment version snapshots in child tables (P12.43); canary rollouts recommend and an operator approves (P12.45). | Keeps the simpler, safer, and portable option in each case, and keeps a person in the loop for production routing. |
| D-036 | Queueing policy uses QoSKit (`~/Code/QoSKit`, NuGet `QoSKit`, net8.0 and net10.0) for tenant fair share (P12.36, `WeightedFairQoSQueue` keyed by tenant) and delegation capacity (P12.38, delegated children classified ahead of new top-level work), with configurable queue depth: settings for the most queued runs per tenant, per agent, and cluster-wide, and for the child reserve's queue. Admission beyond a depth limit answers 429 `QueueFull` with `Retry-After` (REST), the equivalent MCP and A2A errors, and a `QueueFull` event. The database stays the source of truth for runs and leases: QoSKit orders the candidate window each claim considers, so fairness is per replica and approximate across replicas, which the P14.15 fairness test must bound. | The user chose QoSKit for both (2026-10-11). Using the shared library avoids a second scheduler implementation, and depth limits give back-pressure instead of unbounded queues. |
| D-037 | Approvals is a top-level dashboard sidebar item with a pending-count badge (11 hubs; the two tests that capped the sidebar at 10 now allow 11). | The user chose it over a tab under Runs (2026-10-11): pending approvals block running work and need to be visible from every page. | P12.3 |

| D-038 | Budgets and cost defaults (user, 2026-10-12): P12.6 usage quotas use a daily window resetting at midnight UTC; concurrency applies to active runs. P12.7 starts with an empty, operator-configured model price table, and harness-reported cost takes precedence, including zero. | Explicit accounting boundaries and no automatically seeded provider rates. | P12.6, P12.7 |
| D-039 | Missing cost with an enabled daily cost quota (user, 2026-10-12): continue admitting runs, and visibly mark accounting incomplete when neither harness-reported cost nor an exact configured price is available. | Unknown cost is not represented as zero or used to block admission; known usage still enforces its configured limit. | P12.6, P12.7 |

---

## 5. Requirements Compliance Matrix

The requirements in `~/Code/Agents/requirements` apply to this repository. This table maps each one to where the plan satisfies it, and records every deliberate divergence.

| Requirement document | How Garrison complies | Plan tasks |
|---|---|---|
| `REPOSITORY_REQUIREMENTS.md` | `.gitignore`, `.dockerignore`, `README.md`, `DOCKERHUB_README.md`, `CHANGELOG.md`, `LICENSE.md` (MIT); source only in `src/`, `dashboard/`, `sdk/`; SDKs in `sdk/{csharp,python,js,go}` each with README and test harness using `127.0.0.1`; `REST_API.md`, `MCP_API.md` (plus `A2A_API.md`); Postman collection under `assets/postman/` with variables and folder/request descriptions. **Divergence (D-002):** items 9 through 12 describe Docker Compose. Garrison implements their intent in Kubernetes: `.yaml` extension everywhere; health probes use `exec` cURL against `127.0.0.1` with `periodSeconds: 5`, `timeoutSeconds` no greater than 5, `failureThreshold: 2`, and `successThreshold: 2` on readiness probes (Kubernetes requires `successThreshold: 1` on liveness and startup probes, which is the only deviation from "2 successes"); startup ordering uses init containers that wait for dependencies to report healthy; `k8s/scripts/update.{sh,bat}` replaces `docker/update.bat` (pull images, rolling restart, report pod status, non-destructive) and `k8s/scripts/factory-reset.{sh,bat}` replaces `docker/factory/reset.bat`. | P0.*, P6.*, P7.*, P8.* |
| `CODE_STYLE.md` | Enforced by `CLAUDE.md` in the repository, `Directory.Build.props` (`Nullable` enabled, `ImplicitUsings` disabled, documentation file generation, warnings as errors on library projects), and review. One class or enum per file, no `var`, no tuples, `using` inside the namespace, `_PascalCase` private fields, `ConfigureAwait(false)`, cancellation tokens on every async method, async variants of `IEnumerable` methods, configurable values instead of constants, specific exception types with `<exception>` docs, full dispose pattern, no `Console.WriteLine` in library code, no em-dashes. | P0.4, every C# task |
| `VERSIONING.md` | Version starts at `0.1.0-alpha` in one place (`src/Directory.Build.props`, dashboard and SDK manifests mirror it). Agents never change it without explicit approval. | P0.5 |
| `BACKEND_ARCHITECTURE.md` | Watson 7 (`Watson` package 7.3.x) as the only HTTP stack; thin `Program.cs` delegating to a bootstrapper; instance server host; per-feature route registrars; `AuthenticateRequest`, `Preflight`, and `PostRouting` hooks; typed DTOs; PrettyId prefixed IDs; `DatabaseDriverBase`, `DatabaseDriverFactory`, `DatabaseSettings`, `DatabaseTypeEnum`, `SchemaMigration`, `Interfaces/`, provider folders `Sqlite` and `Postgresql` each with `Implementations/` and `Queries/`; structured persistence with child tables (no BLOB-store anti-pattern; the only unmanaged JSON columns are named exceptions documented in section 7.5); versioned idempotent migrations; first-boot seeding; Sqlite write serialization; request capture in `PostRouting` with tenant-scoped history routes and server-side gap-filled summary buckets; `Server.UseOpenApi()`; runtime settings API with live/restart metadata and restart endpoint. **Divergence (D-014):** settings split between file (bootstrap) and database (cluster runtime) for multi-replica correctness. **Divergence (D-013):** MCP on a second port because Voltaic cannot share Watson's listener. **Divergence (D-002):** Docker Compose operations guidance is implemented as Kubernetes assets. | P1.*, P2.*, P3.*, P4.* |
| `AUTHENTICATION.md` | Full AAA model: tenants, users, credentials (access key plus encrypted secret, auth modes), auth sessions with AES-256 random-IV opaque tokens, roles, permissions (Permit/Deny, resource types, operation types), role permission maps, user role assignments and credential scope assignments with Tenant/Resource scope and `InheritsToChildren`, built-in protected roles seeded and refreshed with stable IDs, effective-permission resolution with explicit deny, owner ceiling for credentials, permission cache with version counter, bypass rules (`IsAdmin`, `IsTenantAdmin`), admin endpoint hardening, persisted authorization denials and privileged events, effective-permission inspection endpoints, constant-time comparisons, auth rate limiting, cascading deletes, signed-request (HMAC) credential auth. **Extension:** a fourth principal type, `Run`, for agent-to-agent delegation tokens, whose permissions are the intersection of the originating principal's grants and the deployment's delegation policy (section 11.4). | P1.5 to P1.9, P4.4 |
| `BACKEND_TEST_ARCHITECTURE.md` | Touchstone `Test.Shared`, `Test.Automated`, `Test.Xunit`, `Test.Nunit`; suites run against Sqlite and Postgresql in CI using a Postgres service container; `127.0.0.1` everywhere; exit codes; GitHub Actions workflow. | P1.12, P3.12, P9.* |
| `FRONTEND_ARCHITECTURE.md` | React 19, Vite 6, React Router 7, `fetch`-based `ApiClient`, no axios, hand-rolled SVG charts, `AuthContext`, `AppContext`, required Home, Request History, Request Details modal, API Explorer (OpenAPI-driven, streaming, history of 12), i18n runtime with `index.js`, `localeRegistry.js`, `resources.js`, `formatters.js`, `LanguageSelector`, CSS variables, nginx Dockerfile, ESLint. | P5.* |
| `DASHBOARD_STYLE_AND_USABILITY.md` | Route inventory (section 14.2) written before coding; grouped sidebar; topbar context chips, health, GitHub link, theme, language, logout; reusable table with above-table pagination, page sizes, jump, refresh, sortable headers, column filters, Select Columns with pinned columns, row action menus portaled above overflow, row click opens edit (view when not editable), Duplicate action, bulk actions; custom modals and confirms only; Settings page with restart-required indicators and Restart Server; setup wizard and tour; external-services card; Playwright visual QA at 1280, 768, 390 in light and dark. | P5.* |
| `I18N.md` | Same as the frontend i18n row, plus pseudo-locale and missing-key checks, locale persistence tests, `lang`/`dir` synchronization tests, and `docs/I18N.md` for maintaining locales. Backend operator-facing text uses stable codes plus structured data so the dashboard localizes it. | P5.3, P5.38 |
| `TELEMETRY_REQUIREMENTS.md` | Watson built-in telemetry confirmed on; Radiant collector subscribing to `Watson`, `Garrison`, `Voltaic`, and `Padlock` meters and sources; application meters and spans for scheduling, leasing, compilation, harness execution stages, MCP, A2A, delegation, and integrations; low-cardinality labels; observability stack as a Kubernetes component (Prometheus, Grafana, Tempo, Loki, OpenTelemetry Collector) with Grafana provisioned as code in a `Garrison` folder split by domain; external-services card on Home. **Divergence (D-002):** the stack is a Kustomize component and Helm sub-values instead of `compose.yaml`. | P1.11, P3.11, P13.* |
| `WRITING_DOCUMENTS.md` | No em-dashes anywhere; README and docs reviewed for human voice; a CI check greps for the em-dash character. | P0.13, P8.* |
| `BENCHMARKING.md` | `src/Test.Benchmark` (assembly `Garrison.Benchmark`), `benchmarks/` layout, `BENCHMARKING.md`, `IMPROVEMENTS.md`, stub harness, isolated stack on K3S in Docker, CI gate. Post-MVP. | P14.* |
| `SIMULATED_USER_TESTING.md` | A recorded session before 1.0 covering every documented install path, the dashboard, SDKs, Postman, MCP, and A2A, with findings surfaced to the user before fixing. A lighter session runs at M1. | P9.14, P15.* |
| `INSTALLERS.md` | Not applicable: Garrison is a server platform delivered as container images, Kustomize, and Helm. No desktop installers. | none |
| `EXAMPLE_APPLICATIONS.md` | References used: Clutch (repository shape, Ado plus dialect data layer, settings API, dashboard shell, SDK harness pattern, CI), Aegon (harness invocation, parsers, job model, scoped tokens, worker image), Armada (prompt templates, personas, permission relay, RBAC tests, multi-tenant scoping tests), Conductor and Tempo (test runners, dashboard tables), Hydra (i18n and request history), Constellation (controller/worker placement), Pneuma (telemetry and Grafana), SharpAI (SDK test harness). | all |

---

## 6. Architecture

### 6.1 Topology

```
                 REST / SSE / WebSocket        MCP (streamable HTTP)        A2A (JSON-RPC, SSE)
  Dashboard, SDKs, Postman      MCP clients, agents             Other A2A agents
            |                          |                                |
            v                          v                                v
  +-----------------------------------------------------------------------------------+
  |  Kubernetes Service: garrison-server   (ports 8700 REST+A2A+WS, 8701 MCP)          |
  +-----------------------------------------------------------------------------------+
            |                    |                    |
  +-----------------+  +-----------------+  +-----------------+     stateless, N replicas (HPA)
  | Command (pod 1) |  | Command (pod 2) |  | Command (pod N) |     Registry, compiler, auth/RBAC,
  +-----------------+  +-----------------+  +-----------------+     scheduler claim, event log,
            \                    |                   /              leader-elected maintenance
             \                   |                  /
           +---------------------------------------------+
           | PostgreSQL                                  |  source of truth: config, runs,
           | coordination_leases, runs, run_events, ...  |  leases, events, history, audit
           +---------------------------------------------+
                                 ^
          lease / heartbeat / events / complete (HTTPS, pull only)
                                 |
  +-----------------+  +-----------------+  +-----------------+     StatefulSet, M replicas
  | Post (worker 0) |  | Post (worker 1) |  | Post (worker M) |     Each: harness runtimes,
  |  claude, codex, |  |  claude, codex, |  |  mux only (GPU  |     process executor, workspace
  |  mux, gemini    |  |  mux            |  |  pool label)    |     PVC, own HOME per run
  +-----------------+  +-----------------+  +-----------------+
         | spawns per run: isolated workspace dir + HOME dir + harness subprocess
         | (Phase 11: optional Kubernetes Job per run instead of subprocess)
```

The control plane never initiates a connection to a worker. Workers need outbound access to the control plane Service and to whatever the harnesses call (model APIs, MCP servers). That single rule is what lets both planes scale independently: adding control nodes adds API and claim capacity, adding workers adds execution capacity, and neither needs to know how many of the other exist.

### 6.2 Components

| Component | Project | Responsibility |
|---|---|---|
| Garrison.Core | `src/Garrison.Core` | Models, enums, settings models, data layer (Sqlite and Postgresql), security primitives (token service, secret cipher, password hashing, HMAC signing), prompt renderer, invocation compiler, harness profile model, output parsers, shared services. |
| Garrison.Server | `src/Garrison.Server` | Command node. Watson host, route registrars, authentication and authorization services, request history capture, audit, scheduler claim endpoint, worker protocol, event log tailing (SSE, WebSocket), A2A gateway, Voltaic MCP host, maintenance loops under leader election, telemetry. |
| Garrison.Worker | `src/Garrison.Worker` | Post node. Registration, heartbeat, lease loop, `IRunExecutor` (process executor in MVP, Kubernetes Job executor in Phase 11), workspace and home materialization, MCP pre-flight, harness process supervision, event batching, cancellation, health endpoint, telemetry. |
| Garrison.Harnesses | `src/Garrison.Harnesses` | Output parsers (`ClaudeStreamJson`, `CodexJsonl`, `MuxJsonl`, `GeminiStreamJson`, `GenericJsonl`, `PlainText`), MCP config writers per harness, harness probes, `ProcessRunner`. Referenced by Worker and by Core tests. |
| Garrison.Sdk | `sdk/csharp/Garrison.Sdk` | C# SDK (also used by the worker for the node protocol). |
| Garrison.FakeHarness | `src/Garrison.FakeHarness` | Deterministic test harness executable that emits Claude stream-json, Codex JSONL, Mux JSONL, or plain text from a script file. Used by tests, CI, and the in-cluster smoke test. |
| Test projects | `src/Test.Shared`, `src/Test.Automated`, `src/Test.Xunit`, `src/Test.Nunit` | Touchstone suites and runners. |
| Garrison.Benchmark | `src/Test.Benchmark` | Benchmark harness (Phase 14). |
| Dashboard | `dashboard/` | React operator console. |

### 6.3 Request flows

**Invoke an agent (REST, MCP, or A2A).**

1. The ingress authenticates the caller and resolves exactly one tenant.
2. Authorization checks `Execute` on resource type `Agent` for the target agent.
3. The run service selects a deployment: the one named in the request, else a weighted pick across the agent's active deployments.
4. Admission control checks tenant and agent quotas, delegation depth, and concurrency policy. A rejected run is persisted as `Rejected` with a reason code.
5. The run is persisted as `Queued` with its inputs, caller principal, parent run (if delegated), priority, deadline, and placement requirements derived from the deployment (required harness type, node selector labels, node pool).
6. The caller gets the run ID right away. Synchronous wrappers (`invoke?wait=true`, MCP `garrison_invoke_agent`, A2A `message/send` without `returnImmediately`) then wait on the event log up to a bounded timeout.

**Execute a run (worker).**

1. A worker calls `POST /v1.0/api/node/lease` with its free capacity and a long-poll wait.
2. The Command node selects candidate runs matching the worker's capabilities and labels, claims one atomically (section 9.3), increments its fencing epoch, mints a scoped run token, compiles the `ExecutionSpec`, and returns the assignment.
3. The worker prepares the workspace, writes the files from the spec, runs MCP pre-flight, starts the harness process, and reports `started`.
4. The parser converts stdout lines into normalized events. The worker batches them to `POST .../runs/{id}/events` with the epoch. Heartbeats extend all held leases and return cancellation requests.
5. On exit, the worker reports `complete` with outcome, result text, structured output, usage, cost, session ID, exit code, and stderr tail. The Command node validates the epoch, finalizes the run, and revokes the run token.

**Delegate (agent to agent).**

1. The harness calls Garrison's MCP tool `garrison_invoke_agent` using the run token from its MCP config.
2. The token resolves to principal type `Run`, with the originating principal, tenant, depth, call chain, and the deployment's delegation policy.
3. Policy checks run: the callee is allowed, depth is below the maximum, the callee is not already in the chain unless recursion is allowed, and the budget remains.
4. A child run is created with `ParentRunId`, `RootRunId`, and `Depth + 1`. It is scheduled like any other run, possibly on a different worker. The tool waits and returns the child's result, or the child's run ID if the caller asked for asynchronous mode.

### 6.4 Scaling model

| Plane | Scales by | Bottleneck and mitigation |
|---|---|---|
| Control | Replicas behind a Service (HPA on CPU and request rate) | Database. Mitigations: indexed claim queries, bounded long-poll, event batching, request-history capture on a bounded channel, read replicas later. |
| Data | Worker replicas (StatefulSet scale, or multiple StatefulSets per node pool) | Harness processes per worker (`MaxConcurrentRuns`), model API rate limits. Mitigation: per-deployment and per-tenant concurrency limits enforced at claim time. |
| Storage | Managed Postgres or in-cluster StatefulSet | Event volume. Mitigation: event retention policy, run event compaction (keep text deltas merged), optional object storage for large artifacts. |

### 6.5 Failure handling

| Failure | Behavior |
|---|---|
| Worker dies mid-run | Its lease expires. The leader's reaper moves `Leased` runs back to `Queued` (attempt + 1) and moves `Running` runs to `Failed` with `NodeLost`, or requeues them when the deployment sets `RetryOnNodeLoss`. A stale worker that comes back is fenced out because its epoch no longer matches. |
| Command node dies | Stateless. In-flight HTTP calls fail and clients retry. Long-poll leases re-issue on another replica. Leader election moves maintenance to another replica after the coordination lease expires. |
| Database unavailable | Health reports `degraded` and readiness fails, so the Service stops routing. Workers keep running their current harness processes, buffer events up to a bounded size, and retry. |
| Harness hangs | The run deadline kills the process tree, the run ends as `TimedOut`, and stderr and the last events are kept. |
| Harness fails MCP auth silently | MCP pre-flight fails the run before launch with `McpPreflightFailed` and names the server and missing tools. |
| Duplicate submission | An `Idempotency-Key` header on run creation returns the existing run for the same caller and key within 24 hours. |

---

## 7. Domain Model

### 7.1 Conventions

All records have `id` (string, up to 64 characters, PrettyId K-sortable with a prefix), `createdutc`, `lastupdateutc`, and `active`. Tenant-owned records carry `tenantid`. Protected seeded records carry `isprotected`. Built-in records that every tenant can see (built-in harness profiles, built-in prompt templates, built-in roles) use a null `tenantid` and cannot be edited through tenant APIs; tenants clone them.

### 7.2 Identity and security entities (per `AUTHENTICATION.md`)

| Entity | Prefix | Table | Notes |
|---|---|---|---|
| Tenant | `ten_` | `tenants` | Name, active, protected, default quotas. |
| User | `usr_` | `users` | Email unique per tenant, password SHA-256, `isadmin`, `istenantadmin`. |
| Credential | `crd_` | `credentials` | Access key `access_` + 32, encrypted secret, last 4, auth mode, expiry, last used. |
| AuthSession | `ses_` | `authsessions` | Principal type `Administrator`, `User`, `Credential`, `Run`; scheme; token ID; revocation. |
| Role | `rol_` | `userroles` | Built-in roles null tenant and protected. |
| Permission | `prm_` | `permissions` | Child tables `permission_resource_types`, `permission_operation_types` (structured, no JSON arrays). |
| RolePermissionMap | `rpm_` | `rolepermissionmaps` | |
| UserRoleAssignment | `ura_` | `userroleassignments` | Scope `Tenant` or `Resource`, `resourceid`, `inheritstochildren`. |
| CredentialScopeAssignment | `csa_` | `credentialscopeassignments` | Optional direct grants in child tables. |
| AuditRecord | `aud_` | `audit_records` | Denials, privileged events, configuration changes. |
| RequestHistoryEntry | `req_` | `request_history` | Headers in child table `request_history_headers`. Bodies are retained raw text (unmanaged by design, see 7.5). |

Built-in roles: `TenantAdmin`, `SecurityAdmin`, `Auditor`, `ResourceAdmin`, `Editor`, `Viewer`, `TenantMember`, `Custom` (from `AUTHENTICATION.md`), plus Garrison roles:

| Role | Grants |
|---|---|
| `AgentDeveloper` | `Write` and `Read` on `HarnessProfile`, `PromptTemplate`, `Agent`, `Deployment`, `McpServer`, `Workspace`; `Read` on `Secret` metadata; `Execute` on `Agent`; `Read` on `Run`. |
| `AgentOperator` | `Read` on configuration; `Execute` on `Agent`; `Read`, `Update` (cancel, retry) on `Run`; `Read` on `Node`. |
| `AgentInvoker` | `Execute` on `Agent` (tenant or resource scope); `Read` on own `Run`. Intended for integration credentials. |
| `SecretManager` | `All` on `Secret`. |
| `NodeAgent` | Internal. `Execute` on the node protocol only. Assigned to node credentials. |
| `AgentRegistrar` | `Create`, `Update` on `Agent` with `Kind = Remote`; used by self-registering remote agents. |

Garrison resource types added to the permission vocabulary: `HarnessProfile`, `PromptTemplate`, `Agent`, `Deployment`, `McpServer`, `Secret`, `Workspace`, `ArtifactStore`, `Run`, `Node`, `NodePool`, `Manifest`, `Conversation`, `Approval`, `Artifact`, `Settings`.

### 7.3 Configuration entities

| Entity | Prefix | Tables | Key fields |
|---|---|---|---|
| HarnessProfile | `hrn_` | `harness_profiles`, child `harness_profile_args` (ordered), `harness_profile_env`, `harness_profile_files`, `harness_profile_success_codes` | See section 8.1. |
| PromptTemplate | `tpl_` | `prompt_templates`, `prompt_template_versions`, child `prompt_template_variables` (per version) | Name (unique per tenant), kind, description, current version, protected, built-in key. |
| McpServer | `mcp_` | `mcp_servers`, child `mcp_server_args`, `mcp_server_env`, `mcp_server_headers`, `mcp_server_required_tools` | Transport `Http` or `Stdio`, URL and path, command, timeout, required flag. Header and env values are templates that may reference secrets. |
| Secret | `sec_` | `secrets` | Kind (`AnthropicApiKey`, `ClaudeCodeOAuthToken`, `OpenAiApiKey`, `CodexAuthJson`, `GeminiApiKey`, `GenericEnv`, `GenericFile`, `BearerToken`, `BasicAuth`, `GitCredential`), encrypted value (AES-256-GCM with the cluster master key), last 4, fingerprint, expiry, rotation timestamp. Values are write-only through the API. |
| WorkspaceTemplate | `wsp_` | `workspace_templates`, child `workspace_template_files` | Kind `Empty`, `GitRepository` (URL, ref, depth, credential secret), `Seeded` (inline files), `PersistentVolume` (Phase 11). Retention policy (`DeleteOnSuccess`, `Keep`, `KeepOnFailure`). |
| ArtifactStore | `ast_` | `artifact_stores` | Kind `Database` (MVP, small artifacts), `Filesystem`, `S3` (Phase 12). |
| Agent | `agt_` | `agents`, child `agent_skills`, `agent_tags`, `agent_delegation_allowlist` | Name (unique per tenant, DNS-safe), display name, description, kind (`Hosted`, `Remote`), version, A2A exposure flag, MCP exposure flag and tool name, MCP tool description template, input mode (`Text`, `Structured` with JSON Schema), output JSON Schema (optional), delegation policy (max depth, allow recursion, allowlist mode), visibility, remote endpoint fields when `Remote`. |
| Deployment | `dep_` | `deployments`, child `deployment_prompt_bindings`, `deployment_resource_bindings`, `deployment_arg_overrides`, `deployment_env_overrides`, `deployment_file_overrides`, `deployment_node_selectors`, `deployment_parameters`, `deployment_allowed_run_overrides` | See section 8.4. |
| NodePool | `npl_` | `node_pools`, child `node_pool_tenants` | Label set and optional tenant dedication. |
| ManifestApply | `man_` | `manifest_applies`, child `manifest_apply_items` | Audit of declarative applies (who, when, what changed). |

### 7.4 Runtime entities

| Entity | Prefix | Tables | Key fields |
|---|---|---|---|
| Node | `nod_` | `nodes`, child `node_labels`, `node_capabilities` (harness type, executable, detected version, probe status) | Name (unique, StatefulSet pod name), address (informational), version, status (`Ready`, `Draining`, `Cordoned`, `Lost`), max concurrent runs, active run count, last heartbeat, credential ID, node pool. Global table (platform-owned fleet), justified in section 11.6. |
| Run | `run_` | `runs`, child `run_parameters`, `run_requirements` (labels), `run_usage` | Tenant, agent, deployment, deployment snapshot version, kind (`Invoke`, `Delegated`, `Test`), status, priority, input text, input content type, caller principal type and ID, parent and root run IDs, depth, idempotency key, attempt, max attempts, lease node, lease epoch, lease expiry, queued/leased/started/completed timestamps, deadline, outcome code, result text, structured output (unmanaged JSON, see 7.5), session ID, served model, exit code, stderr tail, error message, cost USD, cost estimated flag. |
| RunEvent | `rev_` | `run_events` | Run ID, sequence, type (`Lifecycle`, `AssistantText`, `Thinking`, `ToolCall`, `ToolResult`, `Usage`, `Progress`, `Warning`, `Error`, `Stdout`, `Stderr`, `Result`), timestamp, text, tool name, tool call ID, success flag, token counts, raw event (unmanaged JSON, see 7.5). Unique `(runid, sequence)`. |
| CoordinationLease | `lea_` | `coordination_leases` | Name, holder, epoch, acquired, expires. Leader election and singleton jobs. |
| Conversation | `cnv_` | `conversations` | Phase 12. A2A `contextId`, harness session ID, affinity node, last run. |
| Approval | `apr_` | `approvals` | Phase 12. Permission request relayed from a harness, decision, decider, rule. |
| Artifact | `art_` | `artifacts` | Phase 12 (Database store in MVP for small files). Run, name, media type, size, SHA-256, store, location. |
| ClusterSetting | `cst_` | `cluster_settings` | Key, typed value columns, value kind, updated by. Cluster runtime settings (D-014). |

### 7.5 Unmanaged JSON exceptions

`BACKEND_ARCHITECTURE.md` forbids storing structured entities as JSON blobs. Garrison has four properties that are genuinely schemaless, named so the exception is visible:

| Property | Why it is unmanaged | What is promoted to columns |
|---|---|---|
| `run_events.raweventjson` | Verbatim harness output line retained for diagnostics; harness schemas change between CLI versions. | Type, sequence, text, tool name, tool call ID, success, token counts. |
| `runs.structuredoutputjson` | Caller-defined output schema; Garrison does not interpret it. | Nothing; validation result is a column. |
| `agents.inputschemajson`, `agents.outputschemajson` | User-authored JSON Schema documents. | Nothing. |
| `request_history.requestbody`, `request_history.responsebody` | Retained HTTP bodies for diagnostics (explicitly allowed by the requirements). | Method, path, status, duration, principal, sizes, truncation flags. |

---

## 8. Configurability Model: Harnesses, Prompts, Resources, Deployments

This section answers one question: how does an operator control exactly what runs, without touching code? Four layers stack, each overriding the one before:

```
HarnessProfile (how to run a harness headless)
   + PromptTemplates (what to say, rendered per run)
   + Resource bindings (MCP servers, secrets, workspace, artifact store)
   = Deployment (the binding, with overrides, placement, limits)
   + Run-time parameters (only those the deployment allows)
   -> InvocationCompiler -> ExecutionSpec (fully resolved, sent to the worker)
```

### 8.1 HarnessProfile

A harness profile describes one headless invocation style. Built-in profiles are seeded for each supported harness and protected; tenants clone and edit.

| Field | Type | Meaning |
|---|---|---|
| `Name`, `Description` | string | Unique per tenant (built-ins under a reserved prefix `builtin/`). |
| `HarnessType` | enum `ClaudeCode`, `Codex`, `Mux`, `GeminiCli`, `Generic` | Drives capability matching and default parser. Workers advertise which types they can run. |
| `Executable` | template | Command name or absolute path, for example `claude`. |
| `Arguments` | ordered list of `{Template, Condition, Repeat}` | Each item renders to zero or more argv entries. `Condition` is a template expression; when it renders empty or `false` the argument is skipped. `Repeat` names a list variable and emits the argument once per element. Arguments are passed through `ArgumentList`, never through a shell. |
| `Environment` | list of `{Name, ValueTemplate, IsSecret}` | Rendered environment. Secret references use `{{secret.<alias>}}`. The process environment starts empty except for a configurable allowlist (`PATH`, `LANG`, `TZ`, certificate variables, proxy variables), following Aegon's whitelist. |
| `Files` | list of `{PathTemplate, ContentTemplate, Mode, IsSecret}` | Files materialized before launch: system prompt file, MCP config, settings files, `auth.json`. Paths are relative to the run's config directory, workspace, or home directory (`{{run.configDir}}`, `{{run.workspaceDir}}`, `{{run.homeDir}}`). |
| `PromptDelivery` | enum `Stdin`, `Argument`, `File` | How the rendered task prompt reaches the harness. Default `Stdin` (Aegon). |
| `PromptArgumentTemplate` | template | Used when delivery is `Argument` or `File`. |
| `SystemPromptDelivery` | enum `File`, `Argument`, `Environment`, `PrependToPrompt`, `None` | Built-ins: Claude `--system-prompt-file`, Codex `-c model_instructions_file=...`, Mux `--system-prompt <file>`, Gemini `GEMINI_SYSTEM_MD`. |
| `McpConfigFormat` | enum `ClaudeJson`, `CodexToml`, `MuxJson`, `GeminiSettings`, `None` | Garrison renders the run's MCP servers (including Garrison's own MCP endpoint with the run token) into this format. Tokens are passed through environment variables and referenced from the file where the harness supports it (Mux `${VAR}`), so they never touch disk. |
| `OutputParser` | enum `ClaudeStreamJson`, `CodexJsonl`, `MuxJsonl`, `GeminiStreamJson`, `GenericJsonl`, `PlainText` | Normalizes output into run events and a final result. `GenericJsonl` takes field mappings (`TextPath`, `FinalPath`, `SuccessExpression`, `UsagePaths`) so a new CLI can be supported without code. |
| `ResultSource` | enum `ParserFinalEvent`, `LastMessageFile`, `Stdout` | Mux needs `LastMessageFile` (`--output-last-message`) or concatenated text because its `run_completed` event has no answer text. |
| `SuccessPolicy` | enum `FinalEvent`, `ExitCode`, `FinalEventAndExitCode` | Default `FinalEvent` (D-019). |
| `SuccessExitCodes` | list of int | Used when policy involves exit codes. |
| `DefaultTimeoutSeconds` | int, 5 to 86400, default 1800 | Run deadline when the deployment does not set one. |
| `KillGraceSeconds` | int, 0 to 60, default 5 | Time between graceful stop and tree kill. |
| `MaxOutputBytes` | long | Stdout cap before the run fails as `OutputLimitExceeded`. |
| `StderrTailBytes` | int, default 8000 | Retained stderr tail. |
| `ProbeCommand` | template list | Version probe that spends no tokens, for example `claude --version`. Workers run it at startup and report capabilities. |
| `CredentialEnvironmentAllowlist` | list | Variables that may be injected from secrets for this harness (Aegon's `CredentialVariables`). |
| `IsolateHome` | bool, default true | Give each run its own `HOME` (and `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, `MUX_CONFIG_DIR` as the profile sets). |
| `SupportsResume` | bool | Phase 12 conversations. |

Built-in profiles seeded at first boot (rendered argument lists are in Appendix A):

| Built-in name | Harness | Summary |
|---|---|---|
| `builtin/claude-code` | ClaudeCode | `claude -p --output-format stream-json --verbose --setting-sources "" --permission-mode <mode> --system-prompt-file ... --model ... --max-turns ... --mcp-config ... --strict-mcp-config [--allowedTools ...] [--json-schema ...]`, prompt on stdin. |
| `builtin/codex` | Codex | `codex exec --json --skip-git-repo-check --ignore-user-config -s <sandbox> -C <workspace> [-m model] -c model_instructions_file=... -c project_doc_max_bytes=0 [-c mcp_servers...] [--output-schema ...] -`, prompt on stdin. |
| `builtin/mux` | Mux | `mux --print --config-dir <cfg> -e garrison --output-format jsonl --yolo -w <workspace> [-m model] --max-turns N --system-prompt <file> [--mcp-config ... --strict-mcp-config] --output-last-message <file>`, prompt on stdin; `endpoints.json` rendered from the deployment's model endpoint parameters with `${VAR}` secret references. |
| `builtin/gemini-cli` | GeminiCli | `gemini -p " " -o stream-json --skip-trust --approval-mode yolo [-m model]`, `GEMINI_CLI_HOME` and `GEMINI_SYSTEM_MD` set, settings file rendered. Optional in the image. |
| `builtin/generic-jsonl` | Generic | Template for bringing any CLI that emits JSONL. |
| `builtin/fake` | Generic | `garrison-fake-harness`, used by tests and the in-cluster smoke test. |

### 8.2 PromptTemplate

Every prompt is a template. That includes the task prompt and system prompt for each agent, the wrapper Garrison adds around delegated requests, the instructions that tell an agent how to use Garrison's MCP tools, MCP tool descriptions, A2A skill descriptions, and the structured-output repair prompt.

**Syntax.** A deliberately small, logic-light dialect so templates stay safe to let tenants edit:

| Construct | Example | Notes |
|---|---|---|
| Variable | `{{input.message}}` | Dotted path into the render context. Missing required variables fail validation at save time and fail the run at compile time. |
| Default | `{{input.parameters.tone \| default: "plain"}}` | Filters: `default`, `upper`, `lower`, `trim`, `json`, `indent: n`, `truncate: n`. |
| Conditional | `{{#if agent.outputSchema}} ... {{else}} ... {{/if}}` | Truthiness on strings, lists, booleans. |
| Loop | `{{#each resources.mcpServers}}- {{this.name}}{{/each}}` | Over lists in the context. |
| Include | `{{> builtin/garrison-tools-instructions}}` | Includes another template by name (cycle-checked, depth-limited). |
| Secret | `{{secret.anthropic}}` | Only allowed in harness profile environment and files, never in prompts. Enforced at save time. |
| Raw | `{{{{raw}}}} ... {{{{/raw}}}}` | Literal braces. |

**Render context.** Available to all templates: `tenant.*` (id, name), `agent.*` (name, description, skills, output schema), `deployment.*` (name, parameters), `run.*` (id, depth, parentRunId, rootRunId, workspaceDir, configDir, homeDir, deadlineUtc, attempt), `input.*` (message, contentType, parameters, structured), `caller.*` (principal type, display name, agent name when delegated), `resources.*` (mcpServers, workspace, artifactStore), `garrison.*` (mcpUrl, version), `harness.*` (type, model), and `now`.

**Versioning.** Each save creates an immutable `prompt_template_versions` row with the content, declared variables, author, and change note. Deployments pin a version or follow `latest`. Every run records the template versions it was compiled with, so a transcript can always be traced to the exact prompt text that produced it.

**Built-in templates** (protected, cloneable, resettable to default):

| Key | Kind | Used for |
|---|---|---|
| `builtin/default-system` | System | Default system prompt for hosted agents. |
| `builtin/default-task` | Task | Wraps the caller's message (`{{input.message}}`) with optional structured parameters. |
| `builtin/delegated-task` | Task | Task wrapper when the caller is another agent: names the caller, the root request, and the depth. |
| `builtin/garrison-tools-instructions` | Fragment | Explains `garrison_invoke_agent`, `garrison_list_agents`, and the delegation rules; included by system prompts when delegation is enabled. |
| `builtin/structured-output-instructions` | Fragment | Appended when the agent has an output schema and the harness lacks native schema support. |
| `builtin/structured-output-repair` | Task | Repair prompt when output fails schema validation (one retry, Aegon pattern). |
| `builtin/mcp-tool-description` | ToolDescription | Description for an agent exposed as an MCP tool. |
| `builtin/a2a-skill-description` | ToolDescription | Description for the agent's A2A skill. |
| `builtin/claude-code-mcp-config`, `builtin/codex-mcp-config`, `builtin/mux-mcp-config`, `builtin/mux-endpoints`, `builtin/mux-settings`, `builtin/gemini-settings` | ConfigFile | File content templates used by built-in harness profiles. Editable like any other template. |

Endpoints: create, update (new version), list versions, diff two versions, restore a version, clone, reset built-in to default, and **render preview** (`POST .../prompt-templates/{id}/render` with a sample context, returns rendered text and the variables used or missing). The dashboard's template editor uses preview on every change.

### 8.3 Resource bindings

| Resource | Bound by | Effect at compile time |
|---|---|---|
| `McpServer` | Deployment binding with alias | Rendered into the harness MCP config; header and env templates resolved (secrets allowed); `RequiredTools` drive pre-flight. Garrison's own MCP server (`garrison`) is added automatically when the agent's delegation policy allows any callee. |
| `Secret` | Deployment binding with alias (`{{secret.<alias>}}`) | Decrypted only inside the compiler, injected into environment or files allowed by the harness profile's credential allowlist, delivered to the worker over TLS in the lease response, never logged, scrubbed from stderr tails (Aegon `Secrets` scrubbing). |
| `WorkspaceTemplate` | Deployment binding (zero or one) | Worker prepares the workspace: empty directory, shallow git clone (credential from a bound secret), or seeded files. |
| `ArtifactStore` | Deployment binding (zero or one) | Where the worker uploads files matching the deployment's artifact globs after the run. |

### 8.4 Deployment

| Field | Meaning |
|---|---|
| `AgentId`, `Name`, `Description` | A deployment belongs to one agent. |
| `HarnessProfileId` | The profile to run. |
| `Model`, `FallbackModel`, `Effort`, `MaxTurns`, `MaxBudgetUsd` | Common knobs exposed as typed fields because every built-in profile uses them. Available to templates as `deployment.model` and so on. |
| `PromptBindings` | Role to template mapping: `System`, `Task`, `DelegatedTask`, `StructuredOutputInstructions`, `Repair`, plus any custom role a profile references. Each binding pins a version or follows latest. |
| `ResourceBindings` | MCP servers, secrets, workspace, artifact store, each with an alias. |
| `ArgumentOverrides` | Append, replace by key, or remove arguments from the profile. |
| `EnvironmentOverrides`, `FileOverrides` | Add or replace environment variables and files. |
| `Parameters` | Named values with defaults, exposed to templates as `deployment.parameters.*`. |
| `AllowedRunOverrides` | Which parameters a caller may set per run (for example `model`, `tone`), with validation (enum, regex, numeric range). Everything else is fixed by the deployment. |
| `NodeSelector`, `NodePoolId` | Placement requirements matched against node labels. |
| `MaxConcurrentRuns` | Per-deployment concurrency limit enforced at claim time. |
| `TimeoutSeconds`, `MaxAttempts`, `RetryOnNodeLoss` | Execution policy. |
| `Weight`, `IsActive` | Traffic split across an agent's active deployments. |
| `Version` | Increments on every change. Runs snapshot the deployment version they were compiled from. |

### 8.5 Declarative manifests

Every configuration entity can be expressed as a YAML or JSON document with `apiVersion: garrison/v1`, `kind`, `metadata.name`, and `spec`. `POST /v1.0/api/tenants/{tenantId}/manifests/apply` accepts a multi-document body, validates all documents, resolves name references (`harnessProfile: builtin/claude-code`), and applies them in dependency order inside one transaction, returning a per-document result (`Created`, `Updated`, `Unchanged`, `Failed`). `dryRun=true` validates without writing. Secrets in manifests carry metadata only by default; values are accepted only when `allowSecretValues=true` and the caller has `SecretManager`.

In Kubernetes, a ConfigMap of manifests plus a bootstrap Job applies them at install time, which is how the MVP's three sample agents arrive. This is also the GitOps path: keep manifests in a repository, apply them in CI.

Example (from `k8s/base/manifests/agents.yaml`):

```yaml
apiVersion: garrison/v1
kind: Agent
metadata:
  name: claude-helper
spec:
  displayName: Claude Helper
  description: General-purpose assistant running on Claude Code.
  exposure: { a2a: true, mcpTool: true }
  delegation: { maxDepth: 2, allow: [codex-coder, mux-helper] }
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: claude-helper-default
spec:
  agent: claude-helper
  harnessProfile: builtin/claude-code
  model: sonnet
  maxTurns: 8
  prompts:
    System: builtin/default-system
    Task: builtin/default-task
  resources:
    secrets:
      - { alias: anthropic, secret: claude-oauth-token }
  timeoutSeconds: 600
  nodeSelector: { garrison.io/harness-claude: "true" }
```

### 8.6 InvocationCompiler

`InvocationCompiler.CompileAsync(run, deployment snapshot, context)` produces an `ExecutionSpec`:

| Field | Content |
|---|---|
| `Executable`, `Arguments` | Final argv. |
| `Environment` | Final environment (allowlist plus rendered values plus secret values). |
| `Files` | Path, content, mode, and secret flag for each file. |
| `Stdin` | Rendered task prompt when delivery is `Stdin`. |
| `WorkingDirectoryKind`, `Workspace` | Workspace preparation instructions. |
| `Parser`, `ParserOptions`, `ResultSource`, `SuccessPolicy`, `SuccessExitCodes` | Output handling. |
| `TimeoutSeconds`, `KillGraceSeconds`, `MaxOutputBytes`, `StderrTailBytes` | Limits. |
| `McpPreflight` | Servers to check and required tools. |
| `ScrubValues` | Secret values to redact from stderr and events. |
| `TemplateVersions` | Template IDs and versions used, recorded on the run. |

Compilation is a pure function of its inputs and is unit-tested with golden files per built-in profile (`src/Test.Shared/Golden/`). `POST .../deployments/{id}/compile-preview` returns the spec with secret values redacted so developers can see the exact command line before invoking.

---

## 9. Run Lifecycle, Scheduling, and Leasing

### 9.1 States

```
            +-----------+
 create --> |  Pending  | --admission denied--> Rejected
            +-----------+
                  | admitted
                  v
            +-----------+   lease expires before start (attempt < max)
            |  Queued   | <------------------------------------------+
            +-----------+                                            |
                  | claimed by worker (epoch++)                      |
                  v                                                  |
            +-----------+ ------------------------------------------+
            |  Leased   |
            +-----------+
                  | worker reports started
                  v
            +-----------+  cancel requested  +------------+
            |  Running  | -----------------> | Cancelling | --> Cancelled
            +-----------+                    +------------+
              |   |   |
              |   |   +--> TimedOut (deadline)
              |   +------> Failed (outcome code: HarnessFailed, NotCredentialed, McpPreflightFailed,
              |                     NodeLost, OutputLimitExceeded, SchemaValidationFailed, ...)
              +----------> Succeeded
```

Phase 12 adds `AwaitingApproval` between `Running` and resumption.

### 9.2 Lease protocol

| Call | Purpose |
|---|---|
| `POST /v1.0/api/node/register` | Idempotent by node name. Sends labels, capabilities (harness types, versions, probe results), capacity, version. Returns node ID and lease settings. |
| `POST /v1.0/api/node/heartbeat` | Every `HeartbeatIntervalMs` (default 5000). Sends held runs with epochs and free capacity. Extends node liveness and all held run leases. Returns run IDs to cancel, drain flag, and settings version. |
| `POST /v1.0/api/node/lease` | Long-poll up to `LeaseWaitMs` (default 20000). Returns up to `maxRuns` assignments, each with run, epoch, run token, and `ExecutionSpec`. |
| `POST /v1.0/api/node/runs/{runId}/started` | Epoch, process ID, start time. Moves `Leased` to `Running`. |
| `POST /v1.0/api/node/runs/{runId}/events` | Epoch plus an ordered batch of events with worker-assigned sequence numbers. Idempotent on `(runId, sequence)`. |
| `POST /v1.0/api/node/runs/{runId}/complete` | Epoch plus outcome, result, usage, cost, session ID, served model, exit code, stderr tail. |
| `POST /v1.0/api/node/drain` | Node stops leasing new work and exits after current runs. Used by the pod `preStop` hook. |

Every call carries the node's session token (`NodeAgent` role). Every run-scoped call carries the epoch; a mismatch returns 409 `StaleLease` and the worker kills the process.

### 9.3 Atomic claim

The claim must be correct on both providers without relying on `SKIP LOCKED`, which Sqlite lacks. Garrison uses optimistic compare-and-set:

1. Select up to `k` candidate run IDs: `status = 'Queued'`, `harnesstype IN (worker capabilities)`, node pool allowed, ordered by priority descending then `queuedutc` ascending. Candidates whose label requirements the worker does not satisfy are filtered in code.
2. For each candidate, check the deployment and tenant concurrency limits against `Leased + Running` counts.
3. Claim with `UPDATE runs SET status = 'Leased', leasenodeid = @node, leaseepoch = leaseepoch + 1, leaseexpiresutc = @exp, leasedutc = @now, lastupdateutc = @now WHERE id = @id AND status = 'Queued'`. One affected row wins. Zero means another worker won, so try the next candidate.
4. On Postgresql, step 1 may use `FOR UPDATE SKIP LOCKED` as an optimization behind the provider's `Queries` class. The CAS in step 3 remains the correctness guarantee.

Concurrency limits are enforced inside the claim with a conditional count when the provider supports it, and are re-validated after the claim (a claim that exceeds a limit is released back to `Queued` without consuming an attempt). The limits are soft by at most the number of simultaneous claimers, which is documented.

### 9.4 Leader election and maintenance

Singleton work runs on exactly one Command replica, chosen through `ILeaseProvider` (`coordination_leases`, epoch-fenced, renewed every `LeaderRenewMs`):

| Loop | Interval | Work |
|---|---|---|
| Lease reaper | 2 s | Expired run leases: requeue or fail (section 6.5). Nodes past heartbeat timeout move to `Lost`. |
| Deadline enforcer | 5 s | Runs past deadline without a worker response move to `TimedOut`. |
| Retention | 1 h | Prune request history, run events, finished runs, and audit by cluster settings. |
| Session cleanup | 15 min | Expired auth sessions and run tokens. |

Non-singleton work (claims, event ingestion, API) runs on every replica.

### 9.5 Event streaming

Run events are appended with a per-run sequence assigned by the worker and enforced unique. Readers tail by sequence:

- `GET .../runs/{id}/events?afterSequence=n&limit=m` for polling.
- `GET .../runs/{id}/events/stream` (SSE) for live streaming. The server polls the database every `EventPollMs` (default 250) for that run while a subscriber is connected.
- WebSocket `/v1.0/ws` for dashboard subscriptions to run lists and individual runs.
- A2A `message/stream` and MCP progress notifications are built on the same tailer.

---

## 10. API Surfaces

### 10.1 REST (port 8700)

All paths below are under `/v1.0/api` unless noted. `{t}` is the tenant ID. Every list endpoint supports `maxResults`, `skip`, `ordering`, and resource-specific filters, and returns the `EnumerationResult` shape used by the reference projects (`objects`, `totalRecords`, `recordsRemaining`, `endOfResults`, `timestampUtc`).

| Area | Endpoints |
|---|---|
| Health and info | `GET /v1.0/api/health` (anonymous), `GET /v1.0/api/server-info`, `GET /openapi.json` |
| Tokens | `POST /v1.0/token`, `POST /v1.0/token/refresh`, `GET /v1.0/token`, `GET /v1.0/token/details`, `DELETE /v1.0/token` |
| Tenants | `GET/POST /tenants`, `GET/PUT/DELETE /tenants/{t}` |
| Users, credentials | `/tenants/{t}/users[/{id}]`, `/tenants/{t}/credentials[/{id}]`, `POST /tenants/{t}/credentials/{id}/rotate` |
| RBAC | `/tenants/{t}/roles`, `/tenants/{t}/permissions`, `/tenants/{t}/role-permissions`, `/tenants/{t}/user-role-assignments`, `/tenants/{t}/credential-scope-assignments`, `GET /tenants/{t}/users/{id}/permissions`, `GET /tenants/{t}/credentials/{id}/permissions` |
| Audit | `GET /tenants/{t}/audit`, `GET /tenants/{t}/audit/{id}`, `DELETE` single and bulk |
| Harness profiles | `/tenants/{t}/harness-profiles[/{id}]`, `POST .../{id}/clone`, `GET /harness-profiles/builtin` |
| Prompt templates | `/tenants/{t}/prompt-templates[/{id}]`, `GET .../{id}/versions`, `GET .../{id}/versions/{v}`, `POST .../{id}/restore/{v}`, `POST .../{id}/clone`, `POST .../{id}/reset`, `POST .../{id}/render`, `POST /tenants/{t}/prompt-templates/render` (ad hoc) |
| MCP servers | `/tenants/{t}/mcp-servers[/{id}]`, `POST .../{id}/test` (connect and list tools) |
| Secrets | `/tenants/{t}/secrets[/{id}]` (values write-only), `PUT .../{id}/value`, `POST .../{id}/test` (where meaningful) |
| Workspaces | `/tenants/{t}/workspace-templates[/{id}]` |
| Agents | `/tenants/{t}/agents[/{id}]`, `POST .../{id}/invoke`, `GET .../{id}/card` (A2A card), `POST /tenants/{t}/agents/register` (self-registration, idempotent by name) |
| Deployments | `/tenants/{t}/deployments[/{id}]`, `POST .../{id}/compile-preview`, `POST .../{id}/test` (invoke with a test prompt) |
| Runs | `GET/POST /tenants/{t}/runs`, `GET .../runs/{id}`, `POST .../runs/{id}/cancel`, `POST .../runs/{id}/retry`, `GET .../runs/{id}/events`, `GET .../runs/{id}/events/stream` (SSE), `GET .../runs/{id}/children`, `DELETE` single and bulk (finished runs only) |
| Manifests | `POST /tenants/{t}/manifests/apply`, `POST /tenants/{t}/manifests/export`, `GET /tenants/{t}/manifests/applies[/{id}]` |
| Nodes | `GET /nodes`, `GET /nodes/{id}`, `POST /nodes/{id}/cordon`, `POST /nodes/{id}/uncordon`, `POST /nodes/{id}/drain`, `DELETE /nodes/{id}`, node pools `/node-pools[/{id}]` |
| Node protocol | `POST /node/register`, `/node/heartbeat`, `/node/lease`, `/node/drain`, `/node/runs/{id}/started`, `/node/runs/{id}/events`, `/node/runs/{id}/complete` |
| Scheduling | `GET /tenants/{t}/queue/summary` (queued, leased, running by agent and harness) |
| Request history | `GET /v1.0/api/request-history`, `GET .../summary`, `GET .../{id}`, `DELETE .../{id}`, `DELETE` bulk |
| Settings | `GET/PUT /v1.0/api/settings`, `POST /v1.0/api/settings/restart`, `POST /v1.0/api/settings/database/test` |
| Overview | `GET /tenants/{t}/overview` (KPIs for the Home page in one call) |
| WebSocket | `/v1.0/ws` (subscriptions: `runs`, `run:{id}`, `nodes`) |
| A2A | `GET /v1.0/a2a/{t}/{agentName}/.well-known/agent-card.json`, `POST /v1.0/a2a/{t}/{agentName}` (JSON-RPC: `message/send`, `message/stream`, `tasks/get`, `tasks/list`, `tasks/cancel`, `tasks/resubscribe`), `GET /v1.0/a2a/{t}` (catalog of cards) |

### 10.2 MCP (port 8701, Voltaic `McpHttpServer`, path `/mcp`)

Authentication uses the same bearer tokens and access keys as REST (validated in Voltaic's `AuthenticationHandler`, which places principal and tenant in claims), plus run tokens for delegation.

| Tool | Purpose |
|---|---|
| `garrison_list_agents` | Agents the caller may invoke, with descriptions and input schemas. |
| `garrison_get_agent` | One agent's details. |
| `garrison_invoke_agent` | Start a run and wait up to `waitSeconds` (bounded below the client's tool timeout). Returns the result, or the run ID and status if still running. |
| `garrison_start_run` | Start a run and return immediately. |
| `garrison_get_run` | Status, result, usage. |
| `garrison_get_run_events` | Events after a sequence (the Aegon job-events pattern, avoids long-held calls). |
| `garrison_cancel_run` | Cancel. |
| `garrison_list_runs` | Recent runs, filtered. |
| `agent__<name>` | Optional per-agent tools when `Agent.ExposeAsMcpTool` is on; description from the agent's tool-description template. |

Management tools (create agents, apply manifests) are Phase 12 and gated on `AgentDeveloper`.

### 10.3 A2A

Each hosted or remote agent with A2A exposure gets a card at `/v1.0/a2a/{t}/{agentName}/.well-known/agent-card.json` whose skills come from `agent_skills` and whose descriptions come from templates. `message/send` creates a run (A2A task ID = run ID, `contextId` = conversation ID in Phase 12). `message/stream` streams `TaskStatusUpdateEvent` and `TaskArtifactUpdateEvent` from the run event tailer. Authentication is a bearer token or access key declared in the card's security schemes.

### 10.4 Error shape

```json
{ "error": "Forbidden", "code": "AuthorizationDenied", "message": "Credential scope is missing Execute on Agent.",
  "requestId": "...", "requiredPermission": "Execute", "resourceType": "Agent", "tenantId": "ten_..." }
```

`code` values are stable identifiers so the dashboard localizes messages (I18N backend rule).

---

### 10.6 Run telemetry and analytics contract

Run fields (REST `Run`, SDK models, MCP `garrison_get_run` summary). Durations are milliseconds; null when not measurable.

| Field | Meaning | Measured by |
|---|---|---|
| `firstTokenUtc`, `lastTokenUtc` | First and last model output event (assistant text or thinking) | Worker |
| `timeToFirstTokenMs` | Harness process start to first model output (TTFT, includes harness startup) | Worker, monotonic |
| `streamingMs` | First model output to last model output | Worker, monotonic |
| `executionMs` | Harness process start to exit | Worker, monotonic |
| `queueMs` | Queued to leased | Server |
| `totalMs` | Queued to completed | Server |
| `outputTokensPerSecond` | `outputTokens / (streamingMs / 1000)` when `streamingMs >= 100`, else null | Server |
| `inputTokens`, `outputTokens`, `cachedTokens` | Existing usage fields | Parser |
| `reasoningTokens` | Reasoning or thinking tokens when the harness reports them (Codex `reasoning_output_tokens`), else 0 | Parser |
| `toolCallCount` | Tool call events in the run | Worker |

`RunCompleteRequest` (node protocol) gains `firstTokenUtc`, `lastTokenUtc`, `timeToFirstTokenMs`, `streamingMs`, `executionMs`, `toolCallCount`, `reasoningTokens`. Schema migration version 2 adds the matching `runs` columns on Sqlite and Postgresql.

Analytics endpoint: `GET /v1.0/api/tenants/{tenantId}/analytics/runs` (permission: Run, Read).

| Query | Meaning | Default |
|---|---|---|
| `from`, `to` | ISO 8601 UTC range | last 24 hours |
| `interval` | `minute`, `hour`, `day`, `week`, or `auto` (about 24 to 96 buckets) | `auto` |
| `agentId`, `harnessType`, `deploymentId`, `model` | Filters (combinable); `model` matches the run's served model | none |
| `groupBy` | `none`, `agent`, `harness`, `model`, or `harnessModel` (one series per harness and served model pair, label `Harness / model`): one series per group | `none` |

Response:

```json
{
  "fromUtc": "2026-10-09T00:00:00Z", "toUtc": "2026-10-10T00:00:00Z", "interval": "hour", "bucketSeconds": 3600,
  "truncated": false,
  "totals": { "...metrics" },
  "series": [
    { "key": "all", "label": "All runs", "buckets": [ { "startUtc": "2026-10-09T00:00:00Z", "...metrics" } ] }
  ]
}
```

Metrics object (every bucket and `totals`): `runs`, `succeeded`, `failed`, `cancelled`, `timedOut`, `inputTokens`, `outputTokens`, `cachedTokens`, `reasoningTokens`, `costUsd`, `toolCalls`, `timeToFirstTokenMsAvg`, `timeToFirstTokenMsP50`, `timeToFirstTokenMsP95`, `streamingMsAvg`, `executionMsAvg`, `executionMsP95`, `queueMsAvg`, `outputTokensPerSecondAvg`. Buckets are gap-filled (zero counts, null averages). Series keys are agent IDs, harness types, served models, or `harness|model` pairs; labels are agent names, harness types, models, or `Harness / model`. Runs without a served model group under `unknown`. A companion `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions?from=&to=` returns the distinct agents, harnesses, deployments, and models seen in the range so the dashboard can populate its filters. At most 100,000 runs are aggregated per request (`truncated` reports when the cap was hit); ranges above 400 buckets return 400.

## 11. Security Model

### 11.1 Tenancy

Every tenant-owned query filters by tenant ID taken from the request context. Tenant IDs in paths must match the authenticated tenant unless the caller is a system administrator. Cross-tenant access returns 404, not 403, so resource existence does not leak.

### 11.2 Authentication

Schemes: bearer session token (`Authorization` or `x-token`), user login headers or body on `POST /v1.0/token`, credential direct header (`x-access-key` plus `x-secret-key`), AWS-style signed requests (`x-access-key`, `x-date`, `x-nonce`, `x-signature`), and system admin API key (`x-api-key`, platform routes only). Tokens are opaque AES-256-CBC with a random IV per token plus an HMAC-SHA256 tag (encrypt-then-MAC), backed by an `authsessions` row.

### 11.3 Authorization

Central `OperationScopeMap` maps every route and MCP tool to `(ResourceType, Operation)`. The evaluator implements explicit deny, implicit deny, resource scope, inheritance, credential owner ceiling, and the bypass order from `AUTHENTICATION.md`, with a per-principal cache invalidated by an authorization version counter in `cluster_settings`.

### 11.4 Run tokens (delegation)

When a run is leased, the Command node mints a run token: an auth session with principal type `Run`, bound to the tenant, the run ID, the originating principal, and an expiry of the run deadline plus a grace period. Its effective permissions are the intersection of:

1. The originating principal's effective permissions (owner ceiling, the same rule credentials use).
2. `Execute` on the agents in the deployment's delegation allowlist, and `Read` on its own descendant runs.

The token is revoked when the run reaches a terminal state. It is delivered to the harness only through its MCP configuration (environment variable reference where supported).

### 11.5 Secrets

The cluster master key comes from a Kubernetes Secret (`GARRISON_MASTER_KEY`, 32 bytes base64). Secret values are encrypted with AES-256-GCM, a random nonce per value, and the secret ID as associated data. Key rotation (Phase 15) re-encrypts with a key version column. Secret values never appear in API responses, logs, request history (request bodies on secret routes are redacted before capture), run events, or compile previews.

### 11.6 Global tables

`nodes`, `node_pools`, `coordination_leases`, `cluster_settings`, `schema_migrations`, built-in rows of `harness_profiles`, `prompt_templates`, and `userroles`, and `request_history` rows for unauthenticated requests are global. Nodes are platform infrastructure shared across tenants, with optional dedication through node pools; tenants see only the node pools they are allowed to use, and only the runs of their own tenant on any node.

### 11.7 Execution isolation

MVP (D-004): each run gets `workspaces/<runId>/work`, `workspaces/<runId>/home`, and `workspaces/<runId>/config` directories owned by the worker's non-root user, an empty environment plus allowlist, and a process tree that is killed on deadline or cancel. Harness permission modes default to the safest mode that works headless (Claude `--permission-mode` from the deployment, Codex `-s workspace-write`, Mux `--sandbox workspace-write`). The documentation is explicit that subprocess isolation shares the pod's kernel, network, and service account; deployments that run untrusted prompts should wait for Phase 11's pod-per-run executor with its own service account, network policy, and resource limits.

---

## 12. Repository Layout

```
Garrison/
|-- .github/workflows/          tests.yaml, dashboard.yaml, sdk.yaml, images.yaml, em-dash-check.yaml
|-- assets/
|   |-- logo.png, icon.png
|   |-- postman/                Garrison.postman_collection.json, Garrison.postman_environment.json
|   `-- grafana/                dashboards (Phase 13)
|-- benchmarks/                 (Phase 14)
|-- dashboard/                  React 19 + Vite 6 operator console, Dockerfile, nginx.conf
|-- docs/
|   |-- ARCHITECTURE.md, CONFIGURATION.md, HARNESSES.md, PROMPTS.md, MANIFESTS.md,
|   |-- KUBERNETES.md, SCALING.md, SECURITY.md, TELEMETRY.md, I18N.md, DEVELOPMENT.md
|-- k8s/
|   |-- base/                   namespace, configmaps, server, worker, dashboard, bootstrap job, rbac, netpol
|   |-- components/
|   |   |-- postgres/           in-cluster PostgreSQL StatefulSet (turnkey installs)
|   |   |-- observability/      Prometheus, Grafana, Tempo, Loki, OTel Collector (Phase 13)
|   |   `-- smoke-test/         fake-harness agent manifests and a smoke Job
|   |-- overlays/
|   |   |-- minikube/           NodePort services, local images, small resources
|   |   |-- k3s/                Traefik ingress, local-path storage
|   |   `-- production/         external DB, HPA, PDB, ingress-nginx with TLS, larger resources
|   |-- helm/garrison/          Helm chart mirroring the Kustomize base and components
|   `-- scripts/                deploy-*.{sh,bat}, update.{sh,bat}, factory-reset.{sh,bat},
|                               generate-secrets.{sh,bat}, port-forward.{sh,bat}, smoke-test.{sh,bat}
|-- sdk/
|   |-- README.md               language matrix
|   |-- csharp/                 Garrison.Sdk, Garrison.Sdk.Test (harness), README.md
|   |-- python/                 garrison_sdk/, test_harness.py, pyproject.toml, README.md
|   |-- js/                     src/ (TypeScript), dist/, test-harness.mjs, package.json, README.md
|   `-- go/                     garrison/ package, cmd/testharness, go.mod, README.md
|-- src/
|   |-- Garrison.sln
|   |-- Directory.Build.props
|   |-- Garrison.Core/
|   |-- Garrison.Harnesses/
|   |-- Garrison.Server/        Dockerfile, garrison.json
|   |-- Garrison.Worker/        Dockerfile, garrison-worker.json
|   |-- Garrison.FakeHarness/
|   |-- Test.Shared/  Test.Automated/  Test.Xunit/  Test.Nunit/
|   `-- Test.Benchmark/         (Phase 14)
|-- build-server.{sh,bat}  build-worker.{sh,bat}  build-dashboard.{sh,bat}  build-all.{sh,bat}
|-- CLAUDE.md  GARRISON_PLAN.md  README.md  DOCKERHUB_README.md  CHANGELOG.md  LICENSE.md
|-- REST_API.md  MCP_API.md  A2A_API.md  WEBSOCKETS_API.md
|-- .gitignore  .dockerignore
```

---

## 13. Kubernetes Deployment Design

### 13.1 Images

| Image | Base | Contents | Ports |
|---|---|---|---|
| `jchristn77/garrison-server` | `mcr.microsoft.com/dotnet/aspnet` is not needed; `dotnet/runtime:10.0` plus `curl` | Garrison.Server | 8700 REST/A2A/WS, 8701 MCP, 9464 metrics |
| `jchristn77/garrison-worker` | `dotnet/runtime:10.0` plus Node.js 22, `git`, `curl`, `ripgrep`, `ca-certificates` | Garrison.Worker, `claude` (`@anthropic-ai/claude-code`, pinned), `codex` (`@openai/codex`, pinned), `mux` (built from a pinned Mux commit), optional `gemini`, `garrison-fake-harness` | 8710 health, 9465 metrics |
| `jchristn77/garrison-dashboard` | `node:22-alpine` build, `nginx:alpine` runtime | Built dashboard, `nginx.conf` with SPA fallback and `/health` | 80 |

All images run as a non-root user (UID 10001), set `DISABLE_AUTOUPDATER=1` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` (worker), and take harness versions as build arguments recorded in image labels.

### 13.2 Kustomize base

| Resource | Kind | Notes |
|---|---|---|
| `garrison` | Namespace | |
| `garrison-server` | Deployment (replicas 1 in base) | Readiness and liveness probes as described in section 5; `preStop` sleep for connection draining; settings from ConfigMap `garrison-server-settings`; secrets from `garrison-secrets`; init container waits for database health. |
| `garrison-server` | Service (ClusterIP) | Ports 8700, 8701, 9464. |
| `garrison-worker` | StatefulSet (replicas 2) | Stable names `garrison-worker-0`, `-1` used as node names; `volumeClaimTemplates` for `workspaces` (10 GiB); node credential from `garrison-node-credential`; `preStop` calls `/node/drain` and waits up to `terminationGracePeriodSeconds` (default 900) for runs to finish; init container waits for the server to report healthy. |
| `garrison-worker` | Service (headless) | Health and metrics only. |
| `garrison-dashboard` | Deployment + Service | Port 80, server URL injected at runtime through `config.js`. |
| `garrison-bootstrap` | Job | Waits for server health, applies `garrison-manifests` ConfigMap through the manifest API, idempotent. |
| `garrison-manifests` | ConfigMap | Sample agents, deployments, and harness profile overrides. |
| `garrison-server`, `garrison-worker` | ServiceAccount | Worker service account has no API permissions in MVP; Phase 11 adds a Role for creating Jobs. |
| NetworkPolicy | | Workers egress to server and internet only; server ingress from dashboard, ingress controller, workers. |

Secrets are not committed. `k8s/scripts/generate-secrets.{sh,bat}` creates `garrison-secrets` (master key, token signing key, admin password, database password) and `garrison-node-credential` with random values, and `garrison-harness-credentials` from environment variables the operator provides (`ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`, `OPENAI_API_KEY`, Mux endpoint URL and key). The bootstrap Job turns those into Garrison `Secret` records.

### 13.3 Overlays and components

| Path | Purpose |
|---|---|
| `overlays/minikube` | NodePort services (server 30870, MCP 30871, dashboard 30880), `imagePullPolicy: IfNotPresent` for images loaded with `minikube image load`, reduced resource requests, includes `components/postgres`. |
| `overlays/k3s` | Traefik `IngressRoute` or `Ingress` for `garrison.local` paths `/`, `/v1.0`, `/openapi.json`, `/mcp`; `local-path` storage class; includes `components/postgres`. |
| `overlays/production` | External database through `garrison-db` Secret, server replicas 3 with HPA (2 to 10), PDBs (server `minAvailable: 1`, worker `maxUnavailable: 1`), ingress-nginx with TLS and long timeouts for SSE, resource requests and limits, pod anti-affinity, topology spread. |
| `components/postgres` | PostgreSQL 17 StatefulSet with PVC, probe `pg_isready`. |
| `components/observability` | Phase 13. |
| `components/smoke-test` | Fake-harness profile, agent, deployment, and a Job that invokes it and asserts success. Used in CI on K3S. |

### 13.4 Helm chart

`k8s/helm/garrison` renders the same resources with values for image tags, replica counts, database mode (`embedded` or `external`), ingress, harness credential secret names, worker pools (a list, each becoming its own StatefulSet with labels and harness capabilities), observability toggle, and smoke test toggle. `helm template` output is checked in CI against `kubectl kustomize` output for structural parity on the shared resources.

### 13.5 Scripts

| Script | Behavior |
|---|---|
| `deploy-minikube` | Starts minikube if needed, builds images into minikube's image store, generates secrets if missing, applies `overlays/minikube`, waits for rollout, prints URLs and the admin credential. |
| `deploy-k3s` | Applies `overlays/k3s` to the current context (works with K3S on a host or with `rancher/k3s` running in Docker), imports images with `k3s ctr images import` when building locally. |
| `update` | Non-destructive: pulls or reloads images, `kubectl rollout restart` for server, dashboard, and worker, waits for rollout, prints `kubectl get pods`. |
| `factory-reset` | Destructive: requires typing `RESET`, deletes the namespace including PVCs, re-applies the overlay, re-runs bootstrap. |
| `smoke-test` | Applies `components/smoke-test`, waits for the Job, prints the run transcript. |
| `port-forward` | Forwards server, MCP, and dashboard ports to `127.0.0.1`. |

### 13.6 Probes

| Workload | Readiness | Liveness | Startup |
|---|---|---|---|
| Server | `curl -fsS http://127.0.0.1:8700/v1.0/api/health` every 5 s, timeout 4 s, failure 2, success 2 | same command, failure 2, success 1 | same command, period 5 s, failure 24 (2 minutes for migrations) |
| Worker | `curl -fsS http://127.0.0.1:8710/health/ready` (registered with the server and leasing) | `curl -fsS http://127.0.0.1:8710/health/live` | `.../health/live`, failure 24 |
| Dashboard | `curl -fsS http://127.0.0.1/health` | same | none |

---

## 14. Dashboard Design and Route Inventory

### 14.1 References used and why

| Reference | Used for | Why |
|---|---|---|
| Clutch (`~/Code/Clutch/dashboard`) | Shell, `ApiClient`, i18n runtime, Settings page, TableFrame, request history, API Explorer | Most recent implementation in this family; same conventions and versions. |
| Armada (`~/Code/Armada/src/Armada.Dashboard`) | Run detail with live log and event viewer, grouped navigation for a large surface, WebSocket refresh, prompt template editing | Closest domain: dispatching agents and reading their transcripts. |
| Hydra admin dashboard | Route-specific page headers, request history inspector, i18n catalog structure | Strongest i18n and inspector reference. |
| Tempo | Table mechanics, setup wizard auto-detection | Strong table frame and first-run flow. |
| Constellation | Worker (node) cards and placement drill-down | Same controller/worker idea. |
| Aegon | Agent profile modal, harness chips, prompt editor with preview | Same harness configuration problem. |

### 14.2 Route inventory

| Route | User job | Roles | Backend resources | Table/filter needs | Actions and modals | Empty/error states |
|---|---|---|---|---|---|---|
| `/` | Sign in | Anyone | `POST /v1.0/token` | none | Server URL, tenant, email/password or access key; language selector | Bad credentials, server unreachable |
| `/dashboard/home` | See fleet and run health now | All | `overview`, request-history summary, nodes, runs | Range tabs for charts | KPI cards link to filtered runs/nodes; CTAs: invoke agent, add agent, apply manifest, open API Explorer; external services card | No agents yet (CTA to setup), no nodes registered (CTA to docs), partial failures per panel |
| `/dashboard/invoke` | Try an agent interactively | Invoker and above | agents, `POST runs`, events SSE | none | Agent and deployment pickers, parameters form from deployment, streaming transcript, cancel, open run | No invokable agents, run failed with outcome code |
| `/dashboard/runs` | Find and act on runs | Operator and above | runs list, cancel, retry, delete | Status, agent, deployment, harness, node, caller, outcome, from/to, depth, root run; server-side paging and sort | View (run detail), cancel, retry, delete (finished), View JSON, bulk cancel and delete | No runs, no matches, backend unavailable |
| `/dashboard/runs/:id` | Read a run's transcript and outcome | Operator and above | run, events SSE, children | Event type filter | Live event timeline (text, tool calls, results, usage), compiled spec (redacted), result and structured output, stderr tail, child runs tree, cancel, retry | Running with no events yet, run not found |
| `/dashboard/agents` | Manage agents | Developer and above (read: all) | agents CRUD | Kind, exposure, tag, name | + Add, View, Edit, Duplicate, Delete, View JSON, Invoke, View A2A card | No agents (CTA: apply sample manifest) |
| `/dashboard/agents/:id` | See one agent end to end | Developer and above | agent, deployments, runs | Runs table | Deployments with weights, A2A card, MCP exposure, delegation policy, recent runs | Agent has no active deployment |
| `/dashboard/deployments` | Bind agents to harnesses, prompts, resources | Developer and above | deployments CRUD, compile-preview, test | Agent, harness, active | + Add (multi-step form: harness, prompts, resources, overrides, placement, limits), Edit, Duplicate, Compile preview modal, Test invoke, Delete, View JSON | Missing harness profile or template references |
| `/dashboard/harness-profiles` | Control how harnesses run headless | Developer and above | harness profiles CRUD, built-ins | Harness type, built-in | + Add, Clone built-in, Edit (argument list editor with conditions, env, files, parser), Delete, View JSON | Built-ins only (prompt to clone) |
| `/dashboard/prompt-templates` | Edit every prompt | Developer and above | templates CRUD, versions, render | Kind, built-in, name | Editor with live render preview and variable list, version history with diff and restore, clone, reset built-in, View JSON | Template has validation errors |
| `/dashboard/mcp-servers` | Register MCP servers for agents | Developer and above | MCP servers CRUD, test | Transport | + Add, Edit, Test connection (lists tools), Delete, View JSON | Test failed with reason |
| `/dashboard/secrets` | Manage harness and integration credentials | Secret manager, tenant admin | secrets CRUD (write-only values) | Kind, expiring soon | + Add, Set value, Rotate, Delete, View metadata JSON | No secrets (explains which agents need them) |
| `/dashboard/workspaces` | Define run workspaces | Developer and above | workspace templates CRUD | Kind | + Add, Edit, Duplicate, Delete, View JSON | none |
| `/dashboard/manifests` | Apply and export configuration as code | Developer and above | manifests apply, export, applies history | Applies table | Paste or upload YAML, dry run diff, apply, export tenant, view apply details | Validation errors per document |
| `/dashboard/nodes` | Watch and control the worker fleet | Operator, admin | nodes, node pools | Status, pool, harness capability, label | View (capabilities, active runs, labels), cordon, uncordon, drain, remove lost node, View JSON | No nodes registered (deployment help) |
| `/dashboard/queue` | Understand scheduling pressure | Operator, admin | queue summary, runs | Grouped by agent and harness | Links to filtered runs | Empty queue |
| `/dashboard/requests` | Investigate HTTP traffic | Operator, admin, tenant admin | request history list, detail, summary, delete | Method, status, path, tenant, user, from/to; server-side paging | Request inspector modal, View JSON, delete, bulk delete | No traffic retained, no matches, disabled |
| `/dashboard/audit` | Review security events | Auditor, security admin, tenant admin | audit list, detail | Event type, principal, result, from/to | View, View JSON, bulk delete (retention) | No events |
| `/dashboard/explorer` | Execute API calls | Developer, operator, admin | `/openapi.json`, raw execution | Endpoint search | Execute, copy curl/fetch/C#, destructive confirm, response tabs, history | OpenAPI unavailable |
| `/dashboard/tenants` | Manage tenants | System admin | tenants CRUD | Name, active | + Add, Edit, Duplicate, Delete (confirm with name), View JSON | none |
| `/dashboard/users` | Manage users | Tenant admin, security admin | users CRUD | Email, admin flags, active | + Add, Edit, Duplicate, Delete, View effective permissions, View JSON | none |
| `/dashboard/credentials` | Manage access keys | Tenant admin, security admin | credentials CRUD, rotate | User, active, expiring | + Add (secret shown once with copy), Rotate, Edit, Delete, View effective permissions, View JSON | none |
| `/dashboard/roles` | Manage roles and permissions | Security admin | roles, permissions, role-permission maps | Built-in, name | + Add, Clone built-in, Edit permissions matrix, Delete, View JSON | none |
| `/dashboard/assignments` | Grant roles to users and credentials | Security admin | user role assignments, credential scope assignments | Principal, role, scope | + Add, Edit, Delete, View JSON | none |
| `/dashboard/settings` | Edit server and cluster settings | System admin (read: admin) | settings get/put, restart, database test | none | Grouped form, restart-required badges, source chips (file, env, ConfigMap, database), Restart Server with confirm and health polling | Read-only when managed by ConfigMap |
| `/dashboard/server-info` | See endpoints, version, auth context | All | server-info, token details | none | Copyable REST, MCP, A2A URLs; version; feature flags; current principal and permissions | none |

Navigation groups: **Start** (Home, Invoke), **Operate** (Runs, Queue, Nodes), **Configure** (Agents, Deployments, Harness Profiles, Prompt Templates, MCP Servers, Secrets, Workspaces, Manifests), **Observe** (Request History, Audit, API Explorer), **Administration** (Tenants, Users, Credentials, Roles, Assignments), **System** (Settings, Server Info). Sidebar footer: setup wizard, tour, version. Topbar: server URL chip, tenant chip with switcher (system admins), principal and role pills, health dot, live (WebSocket) indicator, GitHub link, theme, language, logout.

---

## 15. SDK Design

All four SDKs share one surface and naming, adjusted to each language's idioms:

| Module | Operations |
|---|---|
| Client | Construct with base URL (default `http://127.0.0.1:8700`), token or access key and secret, optional tenant; `authenticate*`, `health`, `serverInfo`. |
| Agents | list, get, create, update, delete, invoke (wait or not), card, register (remote). |
| Deployments | list, get, create, update, delete, compilePreview, test. |
| HarnessProfiles, PromptTemplates, McpServers, Secrets, Workspaces | CRUD; templates also render, versions, restore, clone, reset. |
| Runs | create, get, list, cancel, retry, events (poll), stream (SSE iterator), waitForCompletion. |
| Manifests | apply (with dry run), export. |
| Nodes | list, get, cordon, uncordon, drain. |
| Admin | tenants, users, credentials, roles, assignments, request history, audit, settings. |

Each SDK ships a test harness (`Garrison.Sdk.Test`, `test_harness.py`, `test-harness.mjs`, `cmd/testharness`) that takes `<baseUrl> <accessKey> <secretKey>` and exercises authentication, CRUD on a scratch agent and deployment using `builtin/fake`, invocation with wait, SSE streaming, cancellation, manifest apply, and cleanup, exiting 0 or 1. `scripts/run-sdk-harnesses.{sh,bat}` starts a local server and worker on Sqlite with the fake harness and runs all four. Go is compiled and tested inside a `golang` container when Go is not installed on the host.

---

## 16. Testing Strategy

| Layer | Where | Runs in CI |
|---|---|---|
| Model and helper unit suites | `Test.Shared` suites `Ids`, `Settings`, `Crypto`, `TemplateRenderer`, `InvocationCompiler` (golden), `Parsers` (recorded fixtures for Claude, Codex, Mux, Gemini), `GenericJsonl` | Every push |
| Database contract suites | `Test.Shared` per provider: migrations, seeding, CRUD for every entity, tenant isolation, cascading deletes, claim CAS under concurrency, lease reaper, event sequence uniqueness | Sqlite every push; Postgresql via a service container on Linux |
| Security suites | Authentication schemes, token tamper and expiry, signed requests and replay, RBAC evaluation matrix, bypass rules, admin hardening, effective permissions, run token ceiling, cross-tenant 404s | Every push |
| Integration suites | In-process server plus two in-process workers on `127.0.0.1` with the fake harness: invoke, stream, cancel, timeout, node loss and requeue, fencing, delegation depth and cycle, manifest apply, MCP tools via Voltaic client, A2A via Voltaic client, request history, settings API | Every push |
| Real-harness suites | Same flows against real `claude`, `codex`, `mux` | Manual or nightly with credentials; skipped with a reason when credentials are absent |
| Dashboard | Vitest unit tests (formatters, locale registry, query builders, openApi helpers), Playwright e2e and visual checks at 1280, 768, 390 in light and dark against a seeded server | Every push |
| SDK harnesses | Four harnesses against a local server | Every push |
| Kubernetes | `kubectl kustomize` and `helm template` render checks, kubeconform schema validation, K3S-in-Docker smoke test with the fake harness | Every push (render), main branch (smoke) |
| Text hygiene | Em-dash grep across the repository | Every push |

---

## 17. Telemetry

Meters and activity sources subscribed by Radiant: `Watson`, `Garrison`, `Garrison.Worker`, `Voltaic`, `Padlock`. Application metrics (prefix `garrison_`, low-cardinality labels only):

| Metric | Type | Labels |
|---|---|---|
| `garrison_runs_total` | counter | `outcome`, `harness`, `kind` |
| `garrison_run_stage_duration_seconds` | histogram | `stage` (`queued`, `leased`, `preflight`, `workspace`, `execution`, `finalize`), `harness` |
| `garrison_runs_active` | gauge | `status` |
| `garrison_claims_total` | counter | `result` (`won`, `lost`, `limit`, `none`) |
| `garrison_lease_expirations_total` | counter | `action` (`requeued`, `failed`) |
| `garrison_nodes` | gauge | `status` |
| `garrison_harness_tokens_total` | counter | `harness`, `direction` (`input`, `output`, `cached`) |
| `garrison_harness_cost_usd_total` | counter | `harness` |
| `garrison_delegations_total` | counter | `result` |
| `garrison_mcp_tool_calls_total` | counter | `tool`, `result` |
| `garrison_a2a_requests_total` | counter | `method`, `result` |
| `garrison_compile_duration_seconds` | histogram | `harness` |
| `garrison_event_ingest_batch_size` | histogram | none |

Spans: `run:compile`, `run:claim`, `stage:<name>` on the worker, `harness <type> exec`, `mcp <tool>`, `a2a <method>`, `db <operation>` for hot queries. The worker propagates `traceparent` from the lease response so a run's server and worker spans form one trace.

Observability stack (Phase 13): Prometheus scrapes the server and worker pods, Tempo receives traces over OTLP (through an OpenTelemetry Collector), Loki receives the server and worker logs, and Grafana ships provisioned datasources and dashboards. The Garrison dashboard links into all four: service cards on Home, and deep links from runs (trace, logs), nodes, KPIs, and request history (P13.12 to P13.19).

---

## 18. Work Breakdown

Acceptance notes follow the arrow (`->`). Tasks marked **(M1)** are required for the MVP; unmarked tasks in Phases 0 through 9 are also MVP unless marked **(post-M1)**.

### Phase 0: Repository bootstrap

- [x] P0.1 Create `~/Code/Garrison`, `git init -b main`, add remote `origin` `https://github.com/jchristn/Garrison.git`.  | claude 2026-10-09
- [x] P0.2 Add `LICENSE.md` (MIT), `.gitignore`, `.dockerignore`.  | claude 2026-10-09
- [x] P0.3 Add `GARRISON_PLAN.md` (this file).  | claude 2026-10-09 initial plan
- [x] P0.4 Add `CLAUDE.md` with the full `CODE_STYLE.md` rules, repository conventions, build and test commands, and the version rule.  | claude 2026-10-09 CLAUDE.md with full style rules
- [x] P0.5 Add `src/Directory.Build.props`: `net8.0;net10.0`, `Nullable` enable, `ImplicitUsings` disable, `LangVersion latest`, `Version 0.1.0-alpha`, `GenerateDocumentationFile` true, `TreatWarningsAsErrors` true for library projects. -> `dotnet build` of an empty solution succeeds.  | claude 2026-10-09 src/Directory.Build.props
- [x] P0.6 Create `src/Garrison.sln` with projects `Garrison.Core`, `Garrison.Harnesses`, `Garrison.Server`, `Garrison.Worker`, `Garrison.FakeHarness`, `Test.Shared`, `Test.Automated`, `Test.Xunit`, `Test.Nunit`, and `sdk/csharp/Garrison.Sdk`.  | claude 2026-10-09 src/Garrison.sln with 9 projects
- [x] P0.7 Add package references: `Watson` 7.3.x, `Voltaic` 2.3.x, `PrettyId` 2.0.x, `SyslogLogging`, `Radiant`, `Padlock` 1.2.x, `Npgsql`, `Microsoft.Data.Sqlite`, `Touchstone.*` 0.2.x, `xunit`, `NUnit`. -> restore succeeds on net8.0 and net10.0.  | claude 2026-10-09 restore OK net8.0/net10.0
- [x] P0.8 Add `README.md` skeleton, `CHANGELOG.md` (Keep a Changelog, `[0.1.0-alpha] - Unreleased`), `DOCKERHUB_README.md` skeleton.  | claude 2026-10-10 README.md, CHANGELOG.md (DOCKERHUB_README by docs stream)
- [x] P0.9 Add `assets/logo.png` and `assets/icon.png` (placeholder art until replaced).  | claude 2026-10-10 assets/logo.png, icon.png, logo.svg (placeholder art)
- [x] P0.10 Add build scripts `build-server`, `build-worker`, `build-dashboard`, `build-all` (`.sh` and `.bat`) using Docker Build Cloud multi-arch, matching Clutch.  | k8s stream 2026-10-09 build-*.sh/.bat (Docker Build Cloud, multi-arch)
- [x] P0.11 Add `.github/workflows/tests.yaml` skeleton (restore, build, Touchstone runner) on push to every branch and on pull requests.  | k8s stream 2026-10-09 .github/workflows/tests.yaml
- [x] P0.12 Add `.github/workflows/dashboard.yaml`, `sdk.yaml`, `k8s.yaml` skeletons.  | k8s stream 2026-10-09 dashboard/sdk/k8s/em-dash workflows
- [x] P0.13 Add em-dash check script `scripts/check-em-dash.{sh,bat}` and wire it into CI.  | k8s stream 2026-10-09 scripts/check-em-dash.{sh,bat}
- [x] P0.14 Initialize the NotDory memory scope for Garrison with categories `architecture`, `conventions`, `build-and-test`, `decisions`, `open-work`.  | claude 2026-10-09 NotDory scope Garrison with decisions and conventions

### Phase 1: Core foundation

Settings and composition

- [x] P1.1.1 `Constants.cs` with ID prefixes, header names, default ports, product name.  | claude 2026-10-09 Constants.cs
- [x] P1.1.2 `IdGenerator` (PrettyId K-sortable, 32 characters) with one method per entity prefix.  | claude 2026-10-09 generated IdGenerator
- [x] P1.1.3 Server settings model: `ServerSettings` with `Rest`, `Mcp`, `Database`, `Logging`, `Auth`, `RequestHistory`, `Telemetry`, `Scheduling`, `Security`, `Cluster`; clamped properties with documented defaults; JSON PascalCase on disk.  | claude 2026-10-09 ServerSettings + sections
- [x] P1.1.4 Environment overrides `GARRISON_SETTINGS_FILE`, `GARRISON_DB_TYPE`, `GARRISON_DB_HOST`, `GARRISON_DB_PORT`, `GARRISON_DB_DATABASE`, `GARRISON_DB_USERNAME`, `GARRISON_DB_PASSWORD`, `GARRISON_DB_FILENAME`, `GARRISON_AUTH_SIGNING_KEY`, `GARRISON_MASTER_KEY`, `GARRISON_ADMIN_API_KEY`, `GARRISON_ADMIN_PASSWORD`, `GARRISON_REST_PORT`, `GARRISON_MCP_PORT`, `GARRISON_PUBLIC_BASE_URL`, `GARRISON_MCP_PUBLIC_URL`, `GARRISON_REPLICA_MODE`. -> overridden fields reported as `Environment` source by the settings API.  | claude 2026-10-09 ServerSettings.ApplyEnvironment records overrides
- [x] P1.1.5 `Bootstrapper` (settings, logging, database, seeding, services, server, graceful shutdown on SIGTERM with drain) and thin `Program.cs`.  | claude 2026-10-09 Bootstrapper + SIGTERM drain
- [x] P1.1.6 Startup guard: refuse Sqlite when `Cluster.ExpectedReplicas > 1` or `GARRISON_REPLICA_MODE=multi`, with a clear error.  | claude 2026-10-09 ServerSettings.Validate rejects Sqlite with >1 replica

Data layer

- [x] P1.2.1 `DatabaseSettings`, `DatabaseTypeEnum` (`Sqlite`, `Postgresql`), `DatabaseDriverBase` exposing one `I*Methods` property per entity, `DatabaseDriverFactory` (`Create`, `CreateAndInitializeAsync`), `SchemaMigration`.  | claude 2026-10-09 driver base/factory/settings/migration
- [x] P1.2.2 Shared ADO execution layer (connection, transaction, parameter binding, retry on transient conflict per provider) plus `ISqlDialect`, following Clutch's `Ado` pattern; provider folders `Sqlite` and `Postgresql` each with driver, `Implementations/` (provider-specific method overrides, for example claim and returning clauses), `Queries/` (dialect, schema DDL, provider SQL), `Sanitizer.cs`, `Converters.cs`.  | claude 2026-10-09 Ado layer + Sqlite/Postgresql dialects
- [x] P1.2.3 Migration runner with `schema_migrations` tracking, idempotent, one transaction per version, logged provider and version.  | claude 2026-10-10 AdoDatabaseDriver.ApplyMigrationsAsync; DatabaseDriverBase.SchemaVersion; bootstrapper logs provider and schema version; migrate-twice asserts the version
- [x] P1.2.4 Schema v1 DDL for identity, security, audit, and request history tables on both providers, with tenant-scoped composite unique indexes.  | claude 2026-10-09 SchemaBuilder v1 for all tables
- [x] P1.2.5 Sqlite pragmas (WAL, busy timeout, synchronous normal) and write serialization with `SemaphoreSlim`.  | claude 2026-10-09 WAL pragmas + SemaphoreSlim writes
- [x] P1.2.6 `reference/sql/{sqlite,postgresql}/schema.sql` generated from the schema builder for operators who manage schema themselves (`ManageSchema=false` verifies tables instead of creating them).  | claude 2026-10-10 reference/sql/{sqlite,postgresql}/schema.sql (61 tables)
- [x] P1.2.7 `EnumerationRequest` and `EnumerationResult<T>` with ordering, `maxResults`, `skip`, continuation, and typed filters per entity.  | claude 2026-10-09 EnumerationQuery/Result

Identity and security

- [x] P1.3.1 Models and methods: `Tenant`, `User`, `Credential`, `AuthSession`. -> provider contract suites pass.  | claude 2026-10-09 contract suites green sqlite+postgresql
- [x] P1.3.2 Models and methods: `Role`, `Permission` (with child tables), `RolePermissionMap`, `UserRoleAssignment`, `CredentialScopeAssignment`.  | claude 2026-10-09 RBAC entities with child tables
- [x] P1.3.3 Cascading deletes (tenant -> everything; user -> credentials, sessions, assignments; credential -> scope assignments, sessions).  | identity stream 2026-10-09 cascading deletes tested
- [x] P1.4.1 `PasswordHasher` (SHA-256 per requirements), `SecretGenerator` (access and secret keys), constant-time comparison helpers.  | claude 2026-10-09
- [x] P1.4.2 `TokenService`: AES-256-CBC random IV plus HMAC-SHA256, payload per `AUTHENTICATION.md`, backed by `authsessions`.  | claude 2026-10-09 AES-CBC + HMAC encrypt-then-MAC
- [x] P1.4.3 `SecretCipher`: AES-256-GCM with master key, nonce per value, associated data.  | claude 2026-10-09 AES-256-GCM
- [x] P1.4.4 `RequestSigner` and verifier for AWS-style signed requests with clock-skew window and nonce replay cache.  | claude 2026-10-09 RequestSigner + NonceCache
- [x] P1.5.1 `RequestContext` with authentication, authorization, and URL sub-contexts and request type.  | claude 2026-10-09
- [x] P1.5.2 `AuthenticationService` hooked to `Routes.AuthenticateRequest`: bearer and `x-token` agreement, login headers on token routes only, access key and secret, signed requests, admin API key; tenant resolution and conflict rejection.  | claude 2026-10-09 all schemes incl. run tokens
- [x] P1.5.3 Token routes: `POST/GET/DELETE /v1.0/token`, `/refresh`, `/details`.  | claude 2026-10-09 /v1.0/token routes
- [x] P1.5.4 Authentication rate limiting on token and login routes (429).  | claude 2026-10-09 AuthRateLimiter on POST /v1.0/token
- [x] P1.6.1 Built-in roles and permissions seeded with stable IDs and refreshed at startup (requirements roles plus Garrison roles in section 7.2).  | claude 2026-10-09 BuiltInRoles seeded with stable IDs
- [x] P1.6.2 `OperationScopeMap`: every route and MCP tool mapped to `(ResourceType, Operation)`; unit test fails when a registered route is missing from the map.  | claude+identity 2026-10-09 RouteRegistrar records every route; completeness test
- [x] P1.6.3 `AuthorizationService`: effective permissions resolution, explicit and implicit deny, resource scope, inheritance, credential owner ceiling, bypass order, admin endpoint hardening, version-counter cache.  | claude 2026-10-09 AuthorizationService
- [x] P1.6.4 Effective permission inspection endpoints for users and credentials.  | identity stream 2026-10-09
- [x] P1.7.1 Routes: tenants, users, credentials (secret shown once, last 4 after), rotate credential.  | identity stream 2026-10-09
- [x] P1.7.2 Routes: roles, permissions, role-permission maps, user role assignments, credential scope assignments.  | identity stream 2026-10-09
- [x] P1.8.1 First-boot seeding: `Default` tenant (protected), admin user `admin@garrison` with password from `GARRISON_ADMIN_PASSWORD` (default `password`; `generate-secrets` warns when the default is used), default credential with `TenantAdmin`, admin API key from settings.  | claude 2026-10-09 DefaultSeeder (admin, default + node credentials)
- [x] P1.9.1 Audit: `AuditRecord` model and methods, persisted authorization denials, auth successes and failures, session issue and revoke, credential use and rotation, RBAC changes, bypasses, configuration changes, settings changes, restarts.  | identity stream 2026-10-09
- [x] P1.9.2 Audit routes (tenant-scoped, list with filters, read, delete, bulk delete) and retention.  | identity stream 2026-10-09
- [x] P1.10.1 Request history: model, child headers table, methods (`CreateAsync`, `ReadAsync`, `EnumerateAsync`, `SummarizeAsync` with server-side gap fill, `DeleteAsync`, `DeleteManyAsync`, `PruneAsync`).  | identity stream 2026-10-09
- [x] P1.10.2 `RequestHistoryCaptureService` in `PostRouting` with bounded channel, header redaction (`authorization`, `proxy-authorization`, `cookie`, `set-cookie`, `x-token`, `x-secret-key`, `x-api-key`, `x-signature`, anything containing `token`, `secret`, `api-key`), body truncation, secret-route body redaction.  | identity stream 2026-10-09
- [x] P1.10.3 Request history routes at `/v1.0/api/request-history`; disabled mode returns empty results.  | identity stream 2026-10-09
- [x] P1.11.1 `GarrisonTelemetry` wrapping Radiant: Prometheus listener on 9464, optional OTLP, subscriptions to `Watson`, `Garrison`, `Voltaic`, `Padlock`; best-effort (never throws into request handling).  | claude 2026-10-09 GarrisonTelemetry (Radiant)
- [x] P1.11.2 Confirm Watson `Settings.Telemetry.Enable` and log it at startup.  | claude 2026-10-09 Watson telemetry default on, Watson sources subscribed
- [x] P1.12.1 Settings API: `GET /v1.0/api/settings` with per-field metadata (`source`: `File`, `Environment`, `ConfigMap`, `Database`; `applyMode`: `Live` or `RestartRequired`; `editable`; secrets as set or not set).  | identity stream 2026-10-09
- [x] P1.12.2 `PUT /v1.0/api/settings` with validation, clamping, per-field errors, secret preservation, writes file fields when the file is writable and cluster fields to `cluster_settings`, live application to running components, audit.  | identity stream 2026-10-09
- [x] P1.12.3 `POST /v1.0/api/settings/restart` (drain, exit non-zero so Kubernetes restarts the pod) and `POST /v1.0/api/settings/database/test`.  | identity stream 2026-10-09
- [x] P1.12.4 `cluster_settings` table and `ClusterSettingsService` with version polling so all replicas apply changes live.  | identity stream 2026-10-09
- [x] P1.13.1 Server host: Watson `Webserver`, `UseOpenApi` (title, version, security schemes), `Preflight`, `PostRouting`, default 404 JSON, health route returning `healthy` or `degraded` with database check.  | claude 2026-10-09 GarrisonServer host, OpenAPI, CORS, health
- [x] P1.13.2 `server-info` route: version, node ID, REST, MCP, and A2A public URLs, feature flags, database type, replica mode.  | identity stream 2026-10-09
- [x] P1.14.1 Test suites: IDs, settings clamping and overrides, crypto (token tamper, expiry, GCM tamper), signed requests and replay.  | identity stream 2026-10-09
- [x] P1.14.2 Test suites: provider contract for identity, RBAC, audit, request history on Sqlite; matrix configuration for the other three providers via `GARRISON_TEST_PROVIDERS`.  | claude+identity 2026-10-09 GARRISON_TEST_PROVIDERS matrix
- [x] P1.14.3 Test suites: RBAC evaluation matrix, bypass rules, admin hardening, cross-tenant 404, cascading deletes.  | identity stream 2026-10-09
- [x] P1.14.4 Test suites: settings API metadata, secret preservation, restart-required flags.  | identity stream 2026-10-09
- [x] P1.15.1 `docker/test/compose.test.yaml` is not shipped (D-002); instead `scripts/test-databases.{sh,bat}` starts a Postgresql container on a non-default loopback port for the provider matrix, and CI uses GitHub Actions service containers.  | claude 2026-10-09 Postgres test container on 127.0.0.1:55432; CI service container in tests.yaml
- [x] P1.15.2 Provider matrix green on Sqlite and Postgresql locally. -> recorded in the annotation with the command used.  | claude 2026-10-10 84/84 green on sqlite+postgresql

### Phase 2: Configuration domain

- [x] P2.1.1 Template engine `TemplateRenderer`: parser and evaluator for variables, filters, `if`/`else`, `each`, includes with cycle and depth limits, raw blocks; precise error positions; no reflection on arbitrary objects (render context is a typed tree of dictionaries and lists).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.1.2 Template static analysis: declared vs used variables, unknown variables, secret references forbidden outside harness environment and files.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.1.3 Render context builder (`tenant`, `agent`, `deployment`, `run`, `input`, `caller`, `resources`, `garrison`, `harness`, `now`).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.2.1 `PromptTemplate`, `PromptTemplateVersion`, `PromptTemplateVariable` models, schema, methods on both providers.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.2.2 Prompt template routes: CRUD (update creates a version), versions, version read, restore, clone, reset built-in, render preview, ad hoc render.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.2.3 Built-in templates in section 8.2, seeded and refreshed by key with stable IDs; content lives in `src/Garrison.Core/Seed/Prompts/*.md` embedded resources so they diff cleanly.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.3.1 `HarnessProfile` model with child tables (args, env, files, success codes), schema, methods.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.3.2 Harness profile routes: CRUD, clone, list built-ins.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.3.3 Built-in harness profiles in section 8.1 and Appendix A, seeded and refreshed with stable IDs.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.4.1 `McpServer` model with child tables, schema, methods, routes, `test` endpoint (Voltaic `McpHttpClient` for HTTP; stdio test runs only on a worker in Phase 12 and is reported as unsupported on the server).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.4.2 `Secret` model, schema, methods; routes with write-only values, set value, rotate; redaction everywhere; audit on read of metadata and every write.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.4.3 `WorkspaceTemplate` model with child files, schema, methods, routes.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.4.4 `ArtifactStore` model (kind `Database` in MVP), schema, methods, routes.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.5.1 `Agent` model with child tables (skills, tags, delegation allowlist), schema, methods, routes.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.5.2 Agent self-registration `POST /tenants/{t}/agents/register` (idempotent upsert by name, `AgentRegistrar` role, records last registration time and TTL for remote agents).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.5.3 A2A card generation from agent, skills, and templates (`GET .../agents/{id}/card`).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.6.1 `Deployment` model with all child tables in section 7.3, versioning, schema, methods, routes.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.6.2 Deployment validation: references exist and are visible to the tenant, prompt roles required by the profile are bound, secrets allowed by the profile's credential allowlist, run override rules valid.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.7.1 `InvocationCompiler` producing `ExecutionSpec` per section 8.6, including MCP config rendering for `ClaudeJson`, `CodexToml`, `MuxJson`, `GeminiSettings`, the automatic `garrison` MCP server with run token, secret scrub list, template version capture.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.7.2 `compile-preview` route with secrets redacted.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.7.3 Golden-file tests for every built-in profile with representative deployments (with and without MCP servers, schemas, delegation).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.8.1 Manifest model (`apiVersion`, `kind`, `metadata`, `spec`) for `HarnessProfile`, `PromptTemplate`, `McpServer`, `Secret`, `WorkspaceTemplate`, `Agent`, `Deployment`; YAML and JSON parsing (YamlDotNet).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.8.2 `ManifestService.ApplyAsync`: validate all, resolve names, dependency order, one transaction, per-document result, dry run with diff.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.8.3 Manifest export of a tenant's configuration (secrets as metadata only).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.8.4 Manifest routes and `manifest_applies` audit trail.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.9.1 Test suites: template renderer (syntax, filters, errors), static analysis, compiler goldens, manifest apply and dry run, tenant isolation on every configuration entity, built-in protection (cannot edit or delete through tenant APIs, clone works, reset restores).  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.9.2 Provider matrix green for Phase 2 schema on both providers.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.10.1 Configuration change audit records for every create, update, delete, apply.  | config stream 2026-10-10 155 tests green on sqlite+postgresql
- [x] P2.10.2 OpenAPI metadata (summary, tag, request and response schemas) on every Phase 2 route.  | config stream 2026-10-10 155 tests green on sqlite+postgresql

### Phase 3: Runtime

Control plane

- [x] P3.1.1 `Run`, `RunEvent`, `Node`, `NodePool`, `CoordinationLease` models, schema, methods on both providers, with indexes for the claim query (`status, harnesstype, priority, queuedutc`) and event tailing (`runid, sequence`).  | claude 2026-10-10 runtime models + claim/tail indexes
- [x] P3.1.2 `RunService.CreateAsync`: deployment selection (explicit or weighted), run override validation, admission (quotas, depth, concurrency policy), idempotency key, persistence as `Queued`.  | claude 2026-10-10 RunService
- [x] P3.1.3 Run routes: create, get, list with filters, cancel, retry (new run linked to the original), events poll, events SSE stream, children, delete finished runs (single and bulk).  | claude 2026-10-10 RunRoutes incl. SSE
- [x] P3.1.4 `POST .../agents/{id}/invoke` with `wait` and `waitSeconds`; deployment `test` route.  | claude 2026-10-10 invoke + deployment test routes
- [x] P3.2.1 Node protocol routes in section 9.2 with `NodeAgent` authorization and epoch fencing (409 `StaleLease`).  | claude 2026-10-10 NodeProtocolRoutes with epoch fencing (409 StaleLease)
- [x] P3.2.2 Node credential bootstrap: `garrison-node-credential` Secret in Kubernetes carries an access key and secret seeded into the `Default` tenant's system scope with the `NodeAgent` role; seeding is idempotent and the bootstrap Job verifies it.  | claude 2026-10-09 node credential seeded with NodeAgent
- [x] P3.2.3 `SchedulerService.ClaimAsync` per section 9.3 with provider-specific candidate queries and CAS claim; concurrency limits; claim metrics.  | claude 2026-10-10 SchedulerService CAS claim
- [x] P3.2.4 Long-poll lease with a per-replica wake signal (new runs created on this replica wake local waiters immediately; other replicas pick up on their next poll tick, default 500 ms).  | claude 2026-10-10 AsyncSignal wake + LeasePollMs
- [x] P3.2.5 Run token minting at claim and revocation at completion.  | claude 2026-10-10 run tokens minted at claim, revoked at completion
- [x] P3.2.6 Event ingestion: batch insert, sequence uniqueness, terminal event handling, run usage accumulation.  | claude 2026-10-10 InsertBatch ON CONFLICT DO NOTHING
- [x] P3.2.7 Completion: outcome mapping, structured output validation against the agent's output schema, one repair retry using the repair template when the harness supports resume (otherwise fail with `SchemaValidationFailed`).  | claude 2026-10-10 JsonSchema.Net 8.0.5 (MIT; 9.x moved to a EULA, so pinned to 8.x); validation on completion; one repair as a second attempt in the same lease (directories retained, session resumed with the Repair binding or builtin/structured-output-repair); SchemaValidationFailed otherwise; outputSchemaValid, schemaValidationErrors, repairAttempts (migration 3); resume arguments in all built-in profiles; 210 tests
- [x] P3.3.1 `ILeaseProvider` and `DatabaseLeaseProvider` (`coordination_leases`, epoch-fenced).  | claude 2026-10-10 CoordinationLease TryAcquire/Release
- [x] P3.3.2 `LeaderElectionService` and maintenance loops in section 9.4.  | claude 2026-10-10 LeaderElectionService + MaintenanceService
- [x] P3.3.3 Node liveness: heartbeat timeout moves nodes to `Lost`; lost-node runs handled by the reaper.  | claude 2026-10-10 lost nodes
- [x] P3.3.4 Node admin routes: list, get, cordon, uncordon, drain, delete lost node; node pools CRUD.  | claude 2026-10-10 NodeRoutes
- [x] P3.3.5 Queue summary route and overview route (Home KPIs).  | claude 2026-10-10 OverviewRoutes
- [x] P3.4.1 WebSocket `/v1.0/ws` with token authentication from the first message or `Sec-WebSocket-Protocol`, subscriptions `runs`, `run:{id}`, `nodes`, backed by the event tailer and a periodic snapshot. Documented in `WEBSOCKETS_API.md`.  | claude 2026-10-10 LiveUpdatesHandler at /v1.0/ws

Worker

- [x] P3.5.1 Worker settings `WorkerSettings` (`ServerUrl`, `NodeName`, `AccessKey`, `SecretKey`, `Labels`, `MaxConcurrentRuns`, `WorkRoot`, `HeartbeatIntervalMs`, `LeaseWaitMs`, `EventFlushIntervalMs`, `EventBatchSize`, `EnvironmentAllowlist`, `HealthPort`, `Telemetry`), file plus `GARRISON_WORKER_*` environment overrides; `NodeName` defaults to `HOSTNAME`.  | worker stream 2026-10-10
- [x] P3.5.2 Worker bootstrapper, health endpoints `/health/live` and `/health/ready` on Watson (port 8710), graceful shutdown with drain.  | worker stream 2026-10-10
- [x] P3.5.3 Capability probing at startup: for each built-in harness type, run the probe command (no tokens spent), record executable path, version, and status; re-probe on an interval.  | worker stream 2026-10-10
- [x] P3.5.4 Registration and heartbeat loops with exponential backoff and jitter.  | worker stream 2026-10-10
- [x] P3.5.5 Lease loop respecting `MaxConcurrentRuns`, using Padlock for per-run state transitions.  | worker stream 2026-10-10
- [x] P3.6.1 `IRunExecutor` interface and `ProcessRunExecutor`: directory layout per run (`work`, `home`, `config`), file materialization with modes, environment build from allowlist plus spec, `ArgumentList` launch, stdin write and close, stdout line reader feeding the parser, stderr tail with scrubbing, deadline and cancel with tree kill after grace.  | worker stream 2026-10-10
- [x] P3.6.2 Workspace preparation: `Empty`, `GitRepository` (shallow clone with credential helper from the spec, never written to the workspace), `Seeded`; retention policy cleanup.  | worker stream 2026-10-10 (git path untested)
- [x] P3.6.3 MCP pre-flight using Voltaic `McpHttpClient` (`tools/list`, required tools); failure maps to `McpPreflightFailed`.  | worker stream 2026-10-10
- [x] P3.6.4 Event batching and flushing with ordered sequences, retry with backoff, bounded buffer during server outages.  | worker stream 2026-10-10
- [x] P3.6.5 Completion reporting with outcome classification (cancelled, timed out, parser failure, parser success, credential heuristics from stderr mapping to `NotCredentialed`, executable missing mapping to `NotInstalled`).  | worker stream 2026-10-10
- [x] P3.6.6 Cancellation from heartbeat responses; stale lease (409) kills the process immediately.  | worker stream 2026-10-10

Harnesses

- [x] P3.7.1 `IHarnessOutputParser` and `HarnessRunState` normalized model (text, thinking, tool calls, tool results, usage, cost, session ID, served model, final result, success, failure).  | worker stream 2026-10-10
- [x] P3.7.2 `ClaudeStreamJsonParser` (system init MCP status check, stream events, assistant fallback, user tool results, final `result` with usage and cost), with recorded fixtures.  | worker stream 2026-10-10
- [x] P3.7.3 `CodexJsonlParser` (`thread.started`, items, `turn.completed` usage, `turn.failed`, `error`), with recorded fixtures.  | worker stream 2026-10-10
- [x] P3.7.4 `MuxJsonlParser` (contract version 2 events; final text from `--output-last-message` file or concatenated `assistant_text`), with recorded fixtures.  | worker stream 2026-10-10
- [x] P3.7.5 `GeminiStreamJsonParser`, `GenericJsonlParser` (configurable paths), `PlainTextParser`.  | worker stream 2026-10-10
- [x] P3.7.6 `Garrison.FakeHarness`: reads a scenario file or the prompt, emits Claude, Codex, Mux, or plain output, supports delays, failures, hangs, large output, MCP calls back to Garrison (for delegation tests).  | worker stream 2026-10-10
- [x] P3.8.1 Record fixtures from real CLIs (`claude` 2.1.x, `codex` 0.15x, `mux` 1.2.x) into `src/Test.Shared/Fixtures/` with a `RECORDING.md` describing how they were produced.  | worker stream 2026-10-10 claude+codex recorded, mux+gemini hand-written

Tests

- [x] P3.9.1 Suites: claim CAS race (N parallel claimers, exactly one wins each run), concurrency limits, fencing (stale epoch rejected), lease expiry requeue and fail, node lost.  | claude 2026-10-10 RuntimeSuite claim-race/fencing/reaper
- [x] P3.9.2 Suites: in-process server plus two workers with the fake harness: invoke and wait, SSE stream, cancel, timeout, output limit, worker kill mid-run, retry.  | claude 2026-10-10 ProtocolSuite e2e: invoke, two workers, SSE, cancel (in-process server + workers)
- [x] P3.9.3 Suites: parsers against fixtures; outcome classification table.  | worker stream 2026-10-10 ParserSuite
- [x] P3.9.4 Provider matrix green for Phase 3 schema on both providers.  | claude 2026-10-10 runtime suites green on both providers
- [x] P3.10.1 Real-harness suite (skipped without credentials): Claude Code, Codex, and Mux each answer a one-line prompt through a worker.  | claude 2026-10-10 local real harnesses: Claude Code (haiku) and Codex answered OK; Mux 1.2.0 real CLI against a stub OpenAI endpoint; uses isolateHome=false clones to reuse local logins
- [x] P3.11.1 Application metrics and spans in section 17 for server and worker.  | claude 2026-10-10 worker: Radiant in Garrison.Core (shared GarrisonTelemetry), garrison.worker.* leases, runs, run.duration, harness.tokens, harness.cost_usd, completion_reports, runs.active, slots.free; span "harness <type> exec" parented on spec.TraceParent; scraped from both workers in K3S
- [x] P3.12 Run timing telemetry per section 10.6: worker measures TTFT, streaming, and execution on a monotonic clock and counts tool calls; parsers report reasoning tokens where available; node protocol, migration 2 (Sqlite and Postgresql), server computes queue, total, and tokens per second; REST, MCP run summary, tests.  | claude 2026-10-10 worker Stopwatch timing (HarnessTiming), migration 2 on Sqlite and Postgresql (upgrades v1 in place), reasoning tokens from Codex, Claude, Mux; K3S live: Claude TTFT 1.6 s, 96 tok/s; Mux TTFT 11 s; Codex streams 0 ms (single message, G-12)
- [x] P3.13 Analytics endpoint per section 10.6 (time-bucketed, gap-filled, percentiles, filters, group by agent or harness), operation scope entry, tests on both providers, `REST_API.md`, Postman.  | claude 2026-10-10 AnalyticsRoutes and RunAnalyticsService; auto interval picks at most 96 buckets; selected by createdUtc; nearest-rank percentiles; 7 cases per provider; live on K3S grouped by harness
- [x] P3.14 Analytics by model: `model` filter, `groupBy=model` and `groupBy=harnessModel`, and the `analytics/runs/dimensions` endpoint (section 10.6); tests on both providers; SDKs, REST_API.md, Postman.  | claude 2026-10-10 server, tests on both providers (183), SDKs 18/18 each, REST_API.md, Postman (Newman 203 requests, 243 assertions, 0 failures)
- [x] P3.15 Bounded, self-stopping runs (user report 2026-10-10: gpt-oss:20b on Mux looped on `* \n` for a minute until cancelled). Contract:  | claude 2026-10-10 server 4fd0e04 live (schema 8): cancel on the K3S worker image killed real process trees in 0.28 to 0.29 s (Claude Code; Codex node plus its native child); the looping gpt-oss fixture trips RepetitionDetected about 11 s into the loop; a live retry of the same prompt answered normally in 11 s; dashboard: Invoke cancels on new Send and on leaving the page (fetch keepalive, about 265 ms live), "Stop the run when I leave" setting, per-run time limit, guard notices in Invoke, Runs, Run detail, guard fields on deployments, Runtime.* and PauseGraceMs labels
- [x] P3.16 Pause tolerance (found 2026-10-10: the host slept, Docker paused, and on resume the leader marked every worker Lost and every control node Offline, including itself, and failed a healthy in-flight run with NodeLost). When the leader's maintenance loop sees that more wall-clock time passed since its previous tick than the tick interval plus the lease or heartbeat grace (a pause, clock jump, or long GC), it must not expire leases, mark nodes Lost, or mark control nodes Offline on that tick; it records a Warning ("maintenance paused for N s; giving nodes one heartbeat window to report"), waits one full heartbeat window plus grace measured from the resume, then evaluates normally. Same rule for deadline enforcement (deadlines extend by the paused time only when the run's worker kept its lease). Workers likewise renew leases immediately after detecting a local pause. Tests with an injectable clock.  | claude 2026-10-10 PauseDetector on every replica and worker (gap over interval plus Scheduling.PauseGraceMs, default 5 s); destructive transitions deferred one heartbeat window plus grace after resume; leader re-heartbeats itself first; deadlines extended only for runs whose worker renewed the lease; TimeProvider clock; 321 tests
  - Run guards, enforced on the worker for every harness, configured per deployment (`limits`) with cluster defaults (`Runtime.*`):
    - `repetitionGuard` (default on): when the most recent 2,000 characters of assistant text are a repeated unit of 1 to 64 characters at least 30 times (or otherwise degenerate, such as only whitespace and punctuation for 1,000 characters), stop the run with outcome `RepetitionDetected`.
    - `maxAssistantChars` (default 200,000): stop with outcome `OutputLimitExceeded`.
    - `noProgressSeconds` (default 300): no assistant text, thinking, tool call, or tool result for that long while the harness is running; stop with outcome `NoProgress`.
    - `timeoutSeconds` stays per deployment; a new cluster cap `Runtime.MaxRunSeconds` (default 3600) bounds every run, including per-run overrides.
  - Stopping: SIGTERM, then SIGKILL after the profile's kill grace; one Warning event with code `RunGuardTriggered` and the reason; partial output kept as the run's result text; the run ends Failed with the guard's outcome.
  - Automatic cancellation: a synchronous REST invoke or create (`wait=true`) cancels its run when the client disconnects (`cancelOnDisconnect`, default true for waits); an MCP `garrison_invoke_agent` call cancels its run when the MCP request is cancelled or the session closes; an A2A blocking `SendMessage` or stream cancels its task when the client disconnects; cancelling a run cancels its delegated child runs; cancel reaches the harness within 5 seconds.
  - Mux: the generated `settings.json` turns off `memoryEnabled` (Mux's interactive memory adds tools and a `## Memory` system prompt section).
  - Dashboard (after the control-plane UI lands): Invoke cancels its run when the page is left or a new run is sent while one is running (with a setting to keep runs going), shows guard stops clearly, and offers a per-run timeout when the deployment allows it.
- [x] P3.12.1 OpenAPI metadata on every Phase 3 route.  | claude 2026-10-10

### Phase 4: Protocol ingress

- [x] P4.1.1 `GarrisonMcpServer` on Voltaic `McpHttpServer` (port 8701, `/mcp`, legacy endpoints off, raised `MaxMessageSize`), `AuthenticationHandler` validating bearer tokens, access keys, and run tokens, mapping principal and tenant into claims.  | claude 2026-10-10 GarrisonMcpServer on Voltaic, own port
- [x] P4.1.2 MCP tools in section 10.2 with `OperationScopeMap` entries; long waits bounded and returning run IDs for polling (Voltaic 100-second handshake call limit noted by Aegon).  | claude 2026-10-10 8 tools, descriptions from builtin/mcp-tool-* templates
- [x] P4.1.3 Optional per-agent MCP tools, refreshed with `NotifyToolsChanged` when agents change.  | claude 2026-10-10 delivered by G-5: agents with `exposeMcpTool` are MCP tools in their tenant, read on every tools listing so changes appear on all replicas without a notification
- [x] P4.1.4 Bind address handling (`*` instead of `0.0.0.0`, startup detection of bind failure from the Voltaic log event).  | claude 2026-10-10 bind * and startup fault detection
- [x] P4.2.1 A2A gateway routes on Watson using Voltaic A2A models and `A2AJson`: agent card per agent, catalog, JSON-RPC `message/send`, `message/stream` (SSE), `tasks/get`, `tasks/list`, `tasks/cancel`, `tasks/resubscribe`.  | claude 2026-10-10 A2ARoutes using Voltaic models
- [x] P4.2.2 A2A task state mapping from run status; artifacts from result text and structured output.  | claude 2026-10-10 A2AMapper
- [x] P4.3.1 Delegation: run token principal, policy checks (allowlist, depth, recursion, budget), child run creation, synchronous wait with bound, asynchronous mode.  | claude 2026-10-10 DelegationPolicy + AgentInvoker
- [x] P4.3.2 `builtin/garrison-tools-instructions` included in system prompts when delegation is enabled.  | config stream 2026-10-10 builtin/garrison-tools-instructions included when delegation is enabled
- [x] P4.4.1 Suites: MCP tools via Voltaic client (auth failure, list, invoke, start and poll, cancel), A2A via Voltaic `A2AClient` (card, send, stream, get, cancel), delegation (allowed, denied, depth exceeded, cycle, token revoked after completion, ceiling enforced).  | claude 2026-10-10 ProtocolSuite: MCP via Voltaic McpHttpClient, A2A via Voltaic A2AClient, delegation allow/deny/admin denial
- [x] P4.5.1 `MCP_API.md` and `A2A_API.md` complete.  | claude 2026-10-10 docs stream; MCP_API.md and A2A_API.md with captured responses

### Phase 5: Dashboard

Foundation

- [x] P5.1 Scaffold `dashboard/` (React 19, Vite 6, React Router 7, ESLint flat config), aliases, dev proxy to `127.0.0.1:8700`, `package.json` version mirroring the product version.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.2 `ApiClient` with every endpoint as a named method, enumeration normalization to `{items, pageNumber, pageSize, totalCount}`, normalized `ApiError`, `executeExplorer` raw path, SSE helper.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.3 i18n runtime: `src/i18n/index.js`, `localeRegistry.js` (en, de, ja, zz), `resources.js`, `formatters.js` (all required helpers), `LanguageSelector` in login, topbar, settings; `lang` and `dir` sync.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.4 `AuthContext` (server URL, token, tenant, principal, permissions from token details and effective permissions, theme), `AppContext`, `ToastContext`.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.5 Design tokens and global styles (light and dark), CJK-capable font stack, compact density.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.6 Route metadata table (path, nav group, icon, title key, summary key, required permission) driving sidebar, page header, `document.title`, and role gating.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green

Shared components

- [x] P5.7 Shell: `Sidebar` (groups, collapse, footer utilities), `Topbar` (chips, health, live indicator, GitHub, theme, language, logout), `PageHeader`.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.8 `DataTable` and `TableFrame`: above-table toolbar, pagination with jump and page sizes `[10, 25, 50, 100, 250, 500, 1000]`, refresh, sortable headers with `aria-sort`, column filters, Select Columns with pinned columns persisted per table, row click opens edit (view when not editable) with interactive-target guard, bulk selection bar, ID cells no-wrap.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.9 `ActionMenu` portaled above overflow; row actions View, Edit, Duplicate, Delete, View JSON.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.10 `Modal` (sizes, ESC, backdrop close, focus trap, scroll lock), `ConfirmModal`, `JsonViewerModal`, `CodeBlock`, `CopyButton`, `CopyableId`, `StatusBadge`, `States` (loading, empty, error with retry), `FilterBar`, `RangeTabs`, `AutoRefreshSelect`.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.11 `ActivityChart` (hand-rolled SVG, stacked success and failure, portal tooltip, hour/day/week/month presets with exact bucket counts, refresh), `RunTimeline` (event stream viewer), `KeyValueEditor`, `ArgumentListEditor`, `TemplateEditor` (monospace, variable sidebar, live preview), `DiffViewer`.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.12 Setup wizard (detects empty tenant: no agents or no secrets; walks through secrets, applying sample manifests, test invoke) and guided tour; both relaunchable from the sidebar footer.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green

Pages (one task per route in section 14.2)

- [x] P5.13 Login.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.14 Home (KPIs, run activity chart, request activity chart, nodes summary, recent failures, CTAs, external services card).  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.15 Invoke.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.16 Runs.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.17 Run detail.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.18 Agents.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.19 Agent detail.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.20 Deployments (multi-step form, compile preview, test).  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.21 Harness profiles.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.22 Prompt templates (editor, preview, versions, diff, restore, clone, reset).  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.23 MCP servers.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.24 Secrets.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.25 Workspaces.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.26 Manifests.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.27 Nodes.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.28 Queue.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.29 Request History and Request Details modal.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.30 Audit.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.31 API Explorer (OpenAPI-driven, streaming, history, snippets).  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.32 Tenants.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.33 Users.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.34 Credentials.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.35 Roles.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.36 Assignments.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.37 Settings (grouped form, sources, restart required, restart with health polling) and Server Info.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green

Quality

- [x] P5.38 Vitest unit tests: formatters with explicit locales, locale persistence, `lang`/`dir` sync, query builders, OpenAPI helpers, pseudo-locale and missing-key check.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.39 Playwright: login, navigation of every route, table pagination and filters, action menu not clipped, modals, request inspector, API Explorer execution, theme and language toggles, logout; screenshots at 1280, 768, 390 in light and dark saved under `dashboard/test-results/` (git-ignored) with a summary in the handoff.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.40 Dashboard `Dockerfile` (node build, nginx runtime), `nginx.conf` (SPA fallback, `/health`, caching), runtime `config.js` injection of the server URL.  | claude 2026-10-10 dashboard stream; lint, 40 Vitest, build, 19 Playwright (mocked) green; live Playwright against K3S green
- [x] P5.41 Accessibility pass (landmarks, labels, focus, color-independent status) and the dashboard handoff note (route inventory summary, references, missing capabilities, visual QA summary).  | claude 2026-10-10 a11y pass (landmarks, labels, keyboard tabs, focus tooltips, modal focus trap, text on every badge); handoff note dashboard/HANDOFF.md (route inventory, checks, visual QA, missing capabilities, references)
- [x] P5.42 Consolidated navigation (NotDory and AssistantHub pattern): nine sidebar hubs with URL-synced tabs from `config/navConfig.js`, redirects from every old route, preserved deep links; Home KPIs read the server's status arrays (fixed "0 / NaN"); full-width 520px API request activity chart; acronym casing in all locales with a unit test; new logo and favicon.  | claude 2026-10-10 lint, 45 unit, 27 e2e, live 4/4 on K3S and Docker
- [x] P5.43 Runs telemetry: Runs table columns (TTFT, streaming, duration, queue, input, output, cached, reasoning tokens, tokens per second, cost; column picker defaults) and a Telemetry panel on Run detail with every section 10.6 field explained.  | claude 2026-10-10 Runs columns (TTFT, duration, tokens, cost visible; streaming, queue, total, cached, reasoning, tok/s, tool calls in the picker); Run detail Telemetry panel with phase bar
- [x] P5.44 Tooltips everywhere (D-030): a shared accessible Tooltip (hover and keyboard focus, portaled, delay) on every button, link, input, select, textarea, checkbox, label, column header, tab, badge, KPI card, chart control, and menu item; text in translation catalogs (`tips.*`) for every locale; an automated test visits every route, tab, and create/edit modal and fails on any element without a tooltip or whose tooltip only restates its label.  | claude 2026-10-10 Tooltip layer (data-tip, hover and focus, portaled, Escape, dark and RTL); tips.* in en, de, ja; tooltips.spec checks 1,513 distinct elements across 164 screens and fails on missing, short, or label-restating tips
- [x] P5.45 Relationship explainers: Agents vs Deployments (an agent is the addressable identity; deployments are how it runs, one or more per agent with traffic weights), plus the same treatment for Harness profiles vs Deployments, Prompt templates and bindings, Secrets and aliases, MCP servers and bindings, Nodes vs Node pools, Users vs Credentials, Roles vs Permissions vs Assignments, Runs vs Queue; an info panel per tab and a short diagram on Agents.  | claude 2026-10-10 Explainer panels on about 25 tabs and pages, relationship diagram on Agents and Deployments, Agent detail shows deployments with weight and traffic share
- [x] P5.46 Analytics hub (sidebar, Monitoring or its own item): charts over time for TTFT (avg, p50, p95), streaming and execution time, queue time, tokens (input, output, cached, reasoning), tokens per second, cost, run outcomes, and tool calls; filter by agent, harness, deployment, and model; group by agent, harness, model, or harness and model (usage over time by agent harness by model, as stacked token and cost charts and a harness by model breakdown table); range presets and custom range; URL-synced filters.  | claude 2026-10-10 Analytics hub: range and custom range, filters (agent, harness, deployment, model from the dimensions endpoint), group by none, agent, harness, model, harness and model; 8 charts plus usage by harness and model (stacked tokens and cost, breakdown table); URL-synced
- [x] P5.50 Chart export everywhere: every chart in the dashboard (Analytics, Home activity, Request History, Run detail timeline) has an export menu with CSV (the exact bucketed data behind the chart, one column per series, ISO timestamps, locale-independent numbers), PNG (rendered at 2x with title, legend, filters, and time range), SVG, and JSON; the filename carries the chart name, range, and filters; data tables get CSV export too. Tested with Playwright downloads.  | claude 2026-10-10 Export menu (CSV, PNG at 2x, SVG, JSON) on every chart; CSV on every table; filenames carry chart, range, filters; Playwright download tests
- [x] P5.51 Mock fidelity: the mocked Playwright suite passed while Run detail showed no transcript, because the mock returned a paged list where the server returns `{ events, lastSequence, hasMore }` (fixed 2026-10-10). Add a contract test that starts a real server with the fake harness, captures every GET the dashboard calls, and fails when a mock's shape (keys and types) differs from the server response.  | claude 2026-10-10 npm run test:contract starts a real server and worker, seeds every resource, compares 58 GET routes with the mocks (489 mismatches on first run, 0 now); found real bugs: Settings could never be saved, settings field types misread, Audit and Request History stuck on page 1; CI job added
- [x] P5.52 Invoke response card with two tabs: Preview streams assistant text as it arrives (SSE AssistantText and Thinking deltas) rendered as sanitized Markdown and HTML, with a live indicator and auto-scroll; Response shows the final run result as today (result text, structured output, outcome, telemetry). Preview stays useful for harnesses that do not stream (Codex: shows the full message when it arrives). Shared Markdown renderer with HTML sanitization reused wherever run output is shown.  | claude 2026-10-10 marked plus DOMPurify (strict policy); Preview streams at most every 50 ms with auto-scroll, live stats, Reasoning block, tool chips; Response with Markdown and raw toggle; Send clears the card and closes the old stream; fixed: Invoke never streamed because the request waited for completion (now wait=false). Live: Claude first token 1.8 s in 16 updates, Mux 27 updates, Codex waiting state then full answer
- [x] P5.47 Docs and Playwright coverage for P5.43 to P5.46 (mocked and live).  | claude 2026-10-10 lint clean, 69 unit, 38 Playwright (mocked), live 6/6 on K3S; README and docs/I18N.md updated
- [x] P5.48 Additional locales matching Armada: `es`, `fr`, `it`, `zh-Hans`, `zh-Hant`, `yue-Hant` (beta label in the selector), complete catalogs including tooltips, CJK font hints, key-parity and placeholder tests, and a native-speaker review checklist in `docs/I18N.md`.  | claude 2026-10-10 es, fr, it, zh-Hans, zh-Hant, yue-Hant complete (about 2,420 keys each incl. 949 tooltips), beta labels (de and ja too, matching Armada), glossary and native-review checklist in docs/I18N.md, CJK font stacks, alias fallback; key, placeholder, untranslated, and duplicate-label tests
- [x] P5.49 RTL readiness beyond the `zz` pseudo-locale: audit with `dir="rtl"` across every route (logical CSS properties, icons that mirror, charts), documented so an RTL language such as Arabic or Hebrew can be added without code changes.  | claude 2026-10-10 about 25 physical CSS properties made logical, mirrored directional icons, RTL-aware popover placement, LTR time axes and code; Playwright overflow audit on every route in zz and forced dir=rtl; how to add Arabic documented

### Phase 6: SDKs

- [x] P6.1 `sdk/README.md` language matrix and shared conventions.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.2 C# `Garrison.Sdk`: `GarrisonClient` with module properties, typed models, SSE reader, signed-request support, NuGet metadata (README, icon, license, snupkg).  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.3 C# `Garrison.Sdk.Test` harness.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.4 C# README.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.5 Python `garrison_sdk` (requests-based, typed dataclasses, SSE iterator), `pyproject.toml`.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.6 Python `test_harness.py`.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.7 Python README.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.8 JavaScript/TypeScript `@garrison/sdk` (TypeScript source, ESM and CJS builds, `fetch`-based, SSE async iterator, Node 18+ and browsers).  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.9 JavaScript `test-harness.mjs`.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.10 JavaScript README.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.11 Go module `github.com/jchristn/Garrison/sdk/go` (`net/http`, context everywhere, SSE reader).  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.12 Go `cmd/testharness`.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.13 Go README.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.14 `scripts/run-sdk-harnesses.{sh,bat}` starting server and worker on Sqlite with the fake harness, running all four harnesses, Go inside a `golang` container when Go is absent.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.15 All four harnesses green locally. -> annotate with command and date.  | claude 2026-10-10 SDK stream; all four harnesses green, 11 checks each (scripts/run-sdk-harnesses.sh)
- [x] P6.16 `.github/workflows/sdk.yaml` running the harnesses.  | claude 2026-10-10 SDK stream; .github/workflows/sdk.yaml (not yet run on GitHub)
- [ ] P6.17 Worker uses `Garrison.Sdk` for the node protocol (dogfooding). **(deferred past M1, D-031)**
- [x] P6.18 Each SDK's version mirrors the product version.  | claude 2026-10-10 0.1.0-alpha everywhere (Python 0.1.0a0, the PEP 440 form)
- [x] P6.21 SDKs: section 10.6 run fields and an analytics method in C#, Python, JavaScript/TypeScript, and Go, covered by each test harness.  | claude 2026-10-10 C# client.Analytics.RunsAsync, Python client.analytics.runs, JS client.analytics.runs, Go client.Analytics.Runs; harnesses 15/15 each
- [ ] P6.19 SDK interactive consoles (optional, Clutch pattern). **(post-M1)**
- [ ] P6.20 Publish packages (NuGet, PyPI, npm, Go module tag). **(post-M1, requires approval)**

### Phase 7: Container images and Kubernetes assets

Images

- [x] P7.1 `src/Garrison.Server/Dockerfile` (multi-stage, non-root, curl, labels).  | k8s stream 2026-10-09 image builds, health OK
- [x] P7.2 `src/Garrison.Worker/Dockerfile` (multi-stage; Node.js 22; pinned Claude Code and Codex; Mux built from pinned commit; optional Gemini; fake harness; non-root; curl, git, ripgrep).  | k8s stream 2026-10-09 2.17 GB, claude/codex/mux/fake on PATH
- [x] P7.3 `dashboard/Dockerfile` and `nginx.conf`.  | k8s stream 2026-10-09 written; image build waits on dashboard
- [x] P7.4 Local builds of all three images succeed for the host architecture. -> annotate image sizes.  | claude 2026-10-10 server 416 MB, worker 2.17 GB, dashboard 97 MB (arm64)
- [ ] P7.5 Build scripts publish multi-arch images to Docker Hub. **(requires approval before first push)**

Kustomize

- [x] P7.6 `k8s/base/kustomization.yaml`, namespace, common labels.  | k8s stream
- [x] P7.7 Server ConfigMap (`garrison.json` with Postgresql defaults), Deployment, Service, ServiceAccount, probes per section 13.6, init container waiting for the database.  | k8s stream
- [x] P7.8 Worker ConfigMap, StatefulSet (2 replicas, volume claim templates, `preStop` drain, termination grace), headless Service, ServiceAccount, probes.  | k8s stream
- [x] P7.9 Dashboard Deployment, Service, probes.  | k8s stream
- [x] P7.10 Bootstrap Job and `garrison-manifests` ConfigMap with the three MVP agents (Claude, Codex, Mux) and their deployments.  | k8s stream
- [x] P7.11 NetworkPolicies.  | k8s stream
- [x] P7.12 `components/postgres`.  | k8s stream
- [x] P7.13 `components/smoke-test` (fake harness agent and a Job asserting a successful run).  | k8s stream
- [x] P7.14 `overlays/minikube`.  | k8s stream
- [x] P7.15 `overlays/k3s`.  | k8s stream
- [x] P7.16 `overlays/production` (external DB, HPA, PDBs, ingress with TLS, anti-affinity).  | k8s stream
- [x] P7.17 `secrets.example.yaml` templates (never real values) and `generate-secrets` scripts.  | k8s stream

Helm

- [x] P7.18 Chart skeleton (`Chart.yaml` version mirrors product version, `values.yaml`, helpers).  | k8s stream
- [x] P7.19 Templates for server, worker pools, dashboard, bootstrap, postgres, ingress, HPA, PDB, NetworkPolicy, smoke test.  | k8s stream
- [x] P7.20 `values-minikube.yaml`, `values-k3s.yaml`, `values-production.yaml`.  | k8s stream
- [x] P7.21 `helm lint` and `helm template` clean (Helm run in a container when not installed).  | k8s stream helm lint clean (container)

Scripts and validation

- [x] P7.22 `deploy-minikube`, `deploy-k3s`, `update`, `factory-reset`, `smoke-test`, `port-forward` (`.sh` and `.bat`).  | k8s stream
- [x] P7.23 `kubectl kustomize` renders every overlay; kubeconform validation passes.  | k8s stream kubeconform 129 resources valid
- [x] P7.24 `.github/workflows/k8s.yaml`: render and validate on every push; K3S-in-Docker smoke test on main.  | k8s stream
- [x] P7.25 Deploy to K3S (in Docker) locally: 1 server, 2 workers, dashboard, Postgres; smoke test passes. -> annotate with command and timings.  | claude 2026-10-10 k3s in Docker (rancher/k3s), images imported with ctr; kubectl apply -k k8s/overlays/k3s then k8s/scripts/smoke-test.sh; all pods Ready in about 2 min, smoke run 0.06 s. Fixed: overlays lacked namespace (Postgres landed in default)
- [x] P7.26 Deploy to minikube locally (when minikube is available): same checks.  | claude 2026-10-10 minikube 1.39.0 (Docker driver, 3 GB) installed: Kustomize overlay and Helm chart each deployed in about 30 s; smoke test passed; examples/validate.sh 25/25 with Claude Code, Codex, and Mux for both
- [x] P7.27 Worker scale-out check: scale the StatefulSet to 4, observe registration, scale back to 2, observe drain and no lost runs.  | claude 2026-10-10 K3S: scaled to 4, all registered Ready; 12 runs spread over worker-0..3, all Succeeded; scaled to 2, worker-2/-3 drained to Offline, no lost runs
- [x] P7.28 Control plane scale check (post-M1, Phase 10 owns HA): scale server to 2 replicas with Postgres and confirm claims, events, and SSE work through either replica.  | claude 2026-10-10 main K3S cluster at 2 server replicas on PostgreSQL: validate.sh 25/25 through replica A; token from A accepted on B; SSE on B streamed all 9 events of a run created on A; MCP session from A served tools/list on B
- [x] P7.29 `docs/KUBERNETES.md`.  | k8s stream docs/KUBERNETES.md
- [x] P7.30 Image tags in overlays and chart default to the product version, never `latest`.  | k8s stream v0.1.0-alpha tags
- [x] P7.31 Resource requests and limits documented per workload.  | k8s stream
- [x] P7.32 Ingress timeouts and buffering configured for SSE and long-poll.  | k8s stream
- [x] P7.33 Probe settings reviewed against section 5 compliance row.  | k8s stream
- [x] P7.34 `docker/compose.yaml`: Postgres, server, two workers, dashboard, one-shot bootstrap; named images plus build stanzas; 127.0.0.1-only ports overridable in `.env`; curl healthchecks (5s interval, 2 retries) and `depends_on` with `service_healthy`.  | claude 2026-10-10 all six services healthy on Docker Desktop
- [x] P7.35 `docker/update.{sh,bat}` (rebuild, down, up -d, status; `--pull` option) and `docker/factory/reset.{sh,bat}` (RESET confirmation, down -v, rebuild, up; `--no-start`).  | claude 2026-10-10 update and reset verified, reset reseeded agents with zero runs
- [x] P7.36 Docker stack verified end to end with real credentials: Claude, Codex, and Mux answered; Claude to Codex delegation worked; live dashboard suite green.  | claude 2026-10-10
- [x] P7.37 `docs/DOCKER.md`, README and Docker Hub README sections, CI validation of the compose file and scripts.  | claude 2026-10-10
- [x] P7.38 k3d support: `K3D_CLUSTER` in `deploy-k3s.{sh,bat}` imports images with `k3d image import`; docs/KUBERNETES.md explains that K3S runs natively only on Linux and documents k3d for macOS and Windows.  | claude 2026-10-10 k3d 5.9.0 (K3S 1.35.5) installed; deployed with the script; smoke test, examples/validate.sh 25/25, ingress through the k3d load balancer

### Phase 8: Documentation and Postman

- [x] P8.1 `README.md`: what Garrison is, use cases, architecture diagram, quick start on minikube and K3S, local development (server plus worker on Sqlite), configuration overview, harness support table, security notes (including subscription token caveat), screenshots, license. Reviewed for human voice.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.2 `DOCKERHUB_README.md` with images, use cases, architecture, getting started, explicit raw.githubusercontent URLs for images.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.3 `REST_API.md`: every endpoint with method, path, parameters, bodies, status codes, auth, examples.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.4 `MCP_API.md`: every tool with purpose, input schema, output, examples.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.5 `A2A_API.md` and `WEBSOCKETS_API.md`.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.6 `docs/ARCHITECTURE.md` (sections 6, 9, 11 expanded).  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.7 `docs/HARNESSES.md` (built-in profiles, adding a new CLI with `GenericJsonl`, credentials per harness, known harness quirks from Aegon).  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.8 `docs/PROMPTS.md` (template syntax, context reference, built-ins, versioning).  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.9 `docs/MANIFESTS.md` (every kind with examples, GitOps workflow).  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.10 `docs/CONFIGURATION.md` (server and worker settings, environment variables, cluster settings).  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.11 `docs/SECURITY.md`, `docs/SCALING.md`, `docs/TELEMETRY.md`, `docs/I18N.md`, `docs/DEVELOPMENT.md`.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.12 `CHANGELOG.md` entry for `0.1.0-alpha` (unreleased) describing the MVP.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.13 Postman collection `assets/postman/Garrison.postman_collection.json`: collection, folder, and request descriptions; variables for `baseUrl`, `mcpUrl`, `tenantId`, `accessKey`, `secretKey`, `token`, IDs; folders by resource; token capture script; no hard-coded values.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.14 Postman environment `assets/postman/Garrison.postman_environment.json` with `127.0.0.1` defaults.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.15 Run the Postman collection with Newman (in a container) against a local server. -> all requests pass.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.16 Em-dash check passes across the repository.  | claude 2026-10-10 docs stream; verified against code and a live server; P8.15 Newman 196 requests, 218 assertions, 0 failures; P8.16 check-em-dash clean
- [x] P8.17 Documentation examples executed as written (part of P9.14).  | claude 2026-10-10 about 80 documentation examples executed: README 4/4, QUICKSTART 17/18, REST about 44/48, MCP 19/19, A2A 20/20; examples/validate.sh 25/25; mismatches recorded as M1 findings
- [x] P8.18 New-user documentation review: walk the README and linked docs as a first-time user with no context, on a clean machine (fresh clone, no images, no prior settings), and record every point of friction, missing prerequisite, unexplained term, and wrong or stale command in `docs/testing/NEW_USER_REVIEW.md` before changing anything. Covers P8.19 to P8.21.  | claude 2026-10-10 docs/testing/NEW_USER_REVIEW.md first pass: findings for README, Docker, Kubernetes, and first configuration recorded before fixes
- [x] P8.19 Path 1, Docker: from the README alone, reach a running stack (server, two workers, dashboard), sign in, and see both workers, in under 10 minutes excluding the first image build. Needs: prerequisites (Docker version, disk and memory, build time), where credentials go (`.env`), ports and what to do when one is taken, how to stop, update, and reset, and what "healthy" looks like.  | claude 2026-10-10 update.sh checks ports before building and prints the real URLs; DOCKER.md prerequisites, ports, credentials, healthy stack, stop/update/reset; warm start 13 s; .env excluded from the build context
- [x] P8.20 Path 2, Kubernetes: the same outcome on minikube, K3S (host and in Docker), and an existing cluster, from the README plus `docs/KUBERNETES.md`. Needs: which option to pick and why, prerequisites per option (kubectl, Helm optional), image build or pull, secrets and harness credentials, port-forward versus ingress, the URLs and credentials to use, and how to check, scale, update, and tear down.  | claude 2026-10-10 KUBERNETES.md rewritten: choosing a runtime, K3S in Docker (kubeconfig wait, loopback ports), minikube on macOS, existing clusters, Helm; deploy-k3s imports Postgres and curl; port-forward ports configurable; K3S deploy 49 s. minikube, Helm, and production reviewed on paper only
- [x] P8.21 Path 3, first configuration: from a running stack, add harness credentials, create two or more agents with deployments (at least two harnesses, one agent allowed to delegate to another) using both the dashboard and a manifest, then validate: invoke each over REST, MCP, and A2A, watch a run stream, confirm delegation in the run tree, and check telemetry and analytics. Ship it as a copy-paste quick start (`docs/QUICKSTART.md`) with a sample manifest in `examples/` and a script that runs the validation and prints pass or fail.  | claude 2026-10-10 docs/QUICKSTART.md (dashboard and manifest routes), examples/multi-agent.yaml (planner on Claude delegates to coder on Codex and echo; researcher on Mux), examples/validate.{sh,ps1,bat}: 30/30 on Docker and on a fresh K3S; 25/25 against the main K3S cluster with the bootstrap agents
- [x] P8.22 Fix every finding from P8.18 to P8.21 in the README and docs (README stays an overview with one short path per runtime and links to the details), then repeat the walkthrough and record the second pass, including timings, in `docs/testing/NEW_USER_REVIEW.md`. P9.14 uses the result.  | claude 2026-10-10 README restructured (one path per runtime plus your first agents); second pass from a fresh copy recorded with timings; worker image now fails the build when the Claude Code or Codex native binaries are missing

### Phase 9: MVP verification (milestone M1)

- [x] P9.1 Full build on net8.0 and net10.0 with zero warnings.  | claude 2026-10-10 strict build (docs + warnings as errors) 0 warnings on net8.0 and net10.0
- [x] P9.2 Touchstone runner, xUnit, and NUnit green on Sqlite.  | claude 2026-10-10 Touchstone 155/155 (sqlite+postgresql); xUnit 1/1 (18 s on rerun; the earlier 13 min run was host contention from parallel streams); NUnit 103/103
- [x] P9.3 Provider matrix green on Postgresql.  | claude 2026-10-10 Postgresql suites green in the same run
- [x] P9.4 Dashboard lint, unit tests, build, and Playwright green.  | claude 2026-10-10 lint, 40 Vitest, build, 19 Playwright mocked; tests/live 2/2 against K3S (npm run test:live)
- [x] P9.5 All four SDK harnesses green.  | claude 2026-10-10 C#, Python, JS/TS, Go harnesses green, 11 checks each
- [x] P9.6 Kubernetes render, validation, and K3S smoke test green.  | claude 2026-10-10 kustomize render + kubeconform 129 resources; helm lint; K3S smoke test PASS
- [x] P9.7 MVP topology deployed to K3S: 1 control node, 2 worker nodes (`garrison-worker-0`, `-1`), dashboard, Postgres.  | claude 2026-10-10 K3S: garrison-server x1, garrison-worker-0/-1 Ready (Claude 2.1.296, Codex 0.159.3, Mux 1.2.0 probed), dashboard, garrison-postgres-0
- [x] P9.8 Claude Code agent answers through the cluster (requires a provided `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`).  | claude 2026-10-10 K3S, CLAUDE_CODE_OAUTH_TOKEN in garrison-harness-credentials: claude-helper answered "OK" and "42" (claude-sonnet-5-5) on garrison-worker-0
- [x] P9.9 Codex agent answers through the cluster (requires `OPENAI_API_KEY` or a Codex `auth.json`).  | claude 2026-10-10 K3S, Codex 0.159.3 with your ChatGPT auth.json (CODEX_AUTH_JSON, secret kind CodexAuthJson): answered "42" over REST. Added CODEX_AUTH_JSON to bootstrap and CODEX_AUTH_JSON_FILE to generate-secrets; fixed bootstrap json_escape for multi-line values
- [x] P9.10 Mux agent answers through the cluster (requires an OpenAI-compatible endpoint URL, model, and key).  | claude 2026-10-10 K3S, Mux 1.2.0 against gpt-oss:20b (Ollama adapter): answered "OK" and "42". Fixed: manifest parameter names (baseUrl, adapterType) and secret kind (OpenAiApiKey); Mux profile now FinalEventAndExitCode (exit 1 after an LLM 401 was reported as Succeeded)
- [x] P9.11 Delegation demonstrated: Claude agent invokes the Codex agent through Garrison MCP.  | claude 2026-10-10 Claude to Codex through Garrison MCP: child run Delegated, depth 1, callChain claude-helper,codex-coder on the other worker, answer "s[::-1]" relayed. Also Claude to Mux ("Paris")
- [x] P9.12 Same three agents invoked through REST, MCP (Voltaic client), and A2A (Voltaic client).  | claude 2026-10-10 K3S: claude-helper, codex-coder, and mux-helper each answered over REST, MCP (garrison_invoke_agent), and A2A SendMessage
- [x] P9.13 Postman collection passes against the cluster through port-forward.  | claude 2026-10-10 Newman in Docker through port-forward to K3S: 196 requests, 218 assertions, 0 failures (Restart folder excluded)
- [x] P9.14 Lightweight simulated user session (after P8.18 to P8.22) (README quick start followed literally, dashboard walkthrough, one SDK quick start) with findings recorded in `docs/testing/M1_SESSION.md` and surfaced to the user before fixes.  | claude 2026-10-10 docs/testing/M1_SESSION.md: three personas (platform engineer in the dashboard via Playwright, agent developer with the Python SDK, integrating developer running doc examples); 33 findings (0 blocker, 2 major, 17 minor, 14 polish), surfaced to the user for triage before fixes
- [x] P9.15 CI workflows green on GitHub. **(requires push approval)**  | claude 2026-10-10 all five workflows green on b6b51ba (Tests net8.0 and net10.0, Dashboard, SDKs, Kubernetes with K3S smoke test, Text hygiene); first run caught a test race, fixed
- [x] P9.17 Fix all 33 findings in `docs/testing/M1_SESSION.md` (user decision 2026-10-10). Contract for the fixes that span server and dashboard:  | claude 2026-10-10 all 33 fixed (server 32d5cf1, dashboard next commit); live on K3S at schema 4: gpt-oss:20b filter finds 20 runs, delegating Claude run TTFT 13.2 s = 4.4 s excluding 8.7 s delegation wait, past secret expiry 400 ExpiryInPast, missing tenant 404 TenantNotFound; validate.sh 25/25; live dashboard 6/6
  - M1-08: run fields `delegationWaitMs` (time the run spent waiting on child runs it started, from server timestamps) and `timeToFirstTokenExcludingDelegationMs` (time to first token minus delegation wait that happened before the first token, never negative); analytics metrics `delegationWaitMsAvg`, `timeToFirstTokenExcludingDelegationMsAvg`, `timeToFirstTokenExcludingDelegationMsP50`, `timeToFirstTokenExcludingDelegationMsP95`.
  - M1-10: A2A `SendMessage` with a reused `messageId` and identical content returns the existing task; different content returns 409 Conflict (JSON-RPC error with a clear message).
  - M1-27: secrets with `expiresUtc` in the past return 400 on create and update.
  - M1-01: settings updates validate every value against its metadata (range, allowed values, type) and return 400 with `errors` as an object keyed by setting path; nothing is clamped silently.
  - M1-14: manifest dry runs and applies report, per item, `changes`: a list of `{ field, before, after }` (values as strings, truncated to 200 characters) for Updated items.
  - M1-12: MCP and A2A run summaries include `servedModel`.
- [x] P9.16 M1 sign-off: update the Progress Dashboard, `CHANGELOG.md`, and the decision log; record known gaps.  | claude 2026-10-10 D-031 records the sign-off and exceptions; CHANGELOG.md covers telemetry, analytics, blocked runs, streaming, Docker Compose, the dashboard, languages, and defaults; Progress Dashboard counts current. Verified on K3S (1 server, 2 workers, Postgres, dashboard): examples/validate.sh 25/25 with Claude Code, Codex, and Mux, live dashboard suite 6/6, CI green

### Known gaps at M1 (recorded 2026-10-10)

Found during M1 integration and not yet fixed. Each is actionable; annotate like any task.

- [x] G-1 MCP sessions live in one server replica's memory; with more than one replica an unknown session ID returns 404. Add a shared session store or document `sessionAffinity: ClientIP` on the MCP Service (production overlay and Helm).  | claude 2026-10-10 Garrison fronts MCP and relays to Voltaic; mcp_sessions table lets any replica serve a session, no sticky routing
- [x] G-2 Passwords are unsalted SHA-256. Move to a salted, slow hash (PBKDF2 or Argon2id) with transparent upgrade on login.  | claude 2026-10-10 PBKDF2-HMAC-SHA256, 16-byte salt, `Auth.PasswordHashIterations` (default 600,000), constant-time; legacy and under-iterated hashes upgraded on sign-in; unknown accounts take equal time; fits the existing column, no migration
- [x] G-3 MCP tool descriptions resolve only `builtin/` template names, so tenants cannot override them. Allow a tenant template to shadow a built-in by name.  | claude 2026-10-10 tenant `ToolDescription` template `mcp-tool-<toolName>` overrides `builtin/mcp-tool-<toolName>` per tenant, read on every listing; same for `mcp-tool-description` and `a2a-skill-description`
- [x] G-4 `A2ARoutes` and `AgentCardService` render agent cards differently (template rendering, security scheme key `garrison` vs `bearer`). Use one renderer.  | claude 2026-10-10 AgentCardService is the only renderer (public card, catalog, REST /card); A2AMapper.Card removed; scheme key `garrison`; test asserts the three match
- [x] G-5 Unused surface: `exposeMcpTool`, `builtin/mcp-tool-description`, `builtin/structured-output-repair` (see P3.2.7), and the `Rejected` run status are never used. `builtin/structured-output-repair` is now used by P3.2.7.  | claude 2026-10-10 wired, not removed: `exposeMcpTool` agents become MCP tools (`garrison_` prefix reserved); runs whose tenant, agent, or deployment went away before claim end `Rejected`
- [x] G-6 Per-replica state: the signed-request nonce cache and token rate limiter are per replica, and per-deployment `maxConcurrentRuns` can be exceeded slightly under concurrent claims on several replicas.  | claude 2026-10-10 claims for a limited deployment serialized in the database; maxConcurrentRuns exact across replicas; nonces and rate limits shared
- [x] G-7 DELETE returns 204 for identity and runtime resources and 200 with a body for configuration resources. Pick one.  | claude 2026-10-10 every single-resource DELETE answers 204 with no body (deployments included); filter deletes keep 200 with a count; DeleteResponse removed; C# Tenants.DeleteAsync returns Task (breaking, noted in CHANGELOG)
- [ ] G-8 SyslogLogging: add an opt-in to skip the console probe (D-026), then switch Garrison to it.
- [x] G-9 Codex agent not yet verified in the cluster (P9.9); needs `OPENAI_API_KEY` or a Codex `auth.json`.  | claude 2026-10-10 done, see P9.9
- [x] G-10 Codex runs report no served model (`servedModel` is null); the Codex parser should take it from the session or turn events when present.  | claude 2026-10-10 worker reads turn_context.model from the run's CODEX_HOME session file (CodexSessionReader); live Codex run reports gpt-6.1-sol
- [x] G-11 `kubectl port-forward` to the metrics ports (9464, 9465) does not work: the listener binds the pod host name (D-027) and port-forward connects to `127.0.0.1` inside the pod. Scraping by pod IP did not work either: the listener answers only when the Host header is the pod host name. Fix by serving `/metrics` from the existing REST or health listener, or by a Radiant option for multiple prefixes.  | claude 2026-10-10 fixed by P13.18: /metrics relayed on the service ports, which Prometheus now scrapes
- [ ] G-12 Codex output does not stream in Invoke: `codex exec --json` emits each agent message only when complete. Claude Code streams since `--include-partial-messages` was added to `builtin/claude-code`; Mux streams natively. Tracked by P12.2a. Since P12.2a, `builtin/codex-app-server` streams (opt-in); closes when `builtin/codex` switches to it after a soak.
- [x] G-13 A2A agent cards advertise `GARRISON_PUBLIC_BASE_URL`, which is also the URL handed to runs for delegation, so cards fetched from outside the cluster or Compose network show an internal host (`http://garrison-server:8700`). Split into an external URL for cards and an internal URL for runs.  | claude 2026-10-10 Rest.ExternalBaseUrl / GARRISON_EXTERNAL_BASE_URL for A2A cards and server-info (falls back to the request host); Rest.PublicBaseUrl and Mcp.PublicUrl stay internal for runs; Compose, k8s, Helm, docs
- [x] G-14 `GET /v1.0/api/tenants/{tenantId}/agents/{name}` returns 404 while invoke accepts a name; accept names on read too (IDs take precedence).  | claude 2026-10-10 agent read, update, delete, and card accept an ID or a name (ID first); permission re-checked against the resolved ID, which also closed a by-name bypass of agent-scoped deny grants on invoke
- [x] G-15 A run whose harness no Ready worker supports stays `Queued` with no explanation. Surface "no capable worker" on the run (event and dashboard badge) and on Home, and optionally fail after a configurable wait.  | claude 2026-10-10 Run.blockedReason (NoReadyWorker, NoCapableWorker, NoMatchingPool, or null), overview blockedRuns, one Warning event per reason from the leader, Runtime.FailBlockedAfterSeconds with outcome NoCapableWorker; leases carry eventSequenceStart so worker events never collide with server events ; dashboard: warning badge on Runs and Run detail with guidance, Queue blocked column, Home banner, NoCapableWorker outcome label; verified live by scaling workers to 0
- [x] G-16 Dashboard shows raw values for the agent Delegation dropdown and the deployment resource binding Kind instead of translated labels.  | claude 2026-10-10 shared enum option helper; every enum select, badge, and cell shows translated labels in 9 locales; pseudo-locale test fails on raw values
- [x] G-17 Mux context window: `builtin/mux-endpoints` does not set `contextWindow` or `maxTokens`, so Mux uses its 32,768-token default (about 19,700 usable input) even when the endpoint supports 131,072. Add deployment parameters with defaults, and Compose and Kubernetes variables (`MUX_CONTEXT_WINDOW`, `MUX_MAX_TOKENS`). Mux-side improvements found during integration are tracked in ~/Code/Mux/BUGFIXES_FROM_GARRISON.md.  | claude 2026-10-10 Mux deployment parameters contextWindow (passed as Mux 1.3.0 --context-window) and maxTokens (written to the generated endpoint); MUX_CONTEXT_WINDOW and MUX_MAX_TOKENS in Compose and the bootstrap; a Warning event when Mux reports contextWindowSource default
- [x] G-18 Mux endpoint quirks: the generated endpoint omits the adapter quirks Ollama models need for reliable tool calls (`assembleToolCallDeltas`, `enableMalformedToolCallRecovery`, `stripRequestFields`, `supportsParallelToolCalls`, `defaultFinishReason`). Expose them as deployment parameters with adapter-specific defaults.  | claude 2026-10-10 no change needed: Mux applies adapter defaults when an endpoint sets no quirks (Defaults.OllamaDefaults plus BackendQuirks defaults), and they match a hand-tuned Ollama endpoint exactly
- [x] G-19 Delegation tool hygiene for weaker models: run-token MCP sessions show the administrator-only `tenantId` argument, and gpt-oss filled it and `deploymentId` with wrong values (one failed call before success). Hide administrator-only arguments from run-token sessions, tell models to omit optional fields they do not need, and make the deployment-not-found error suggest omitting `deploymentId`.  | claude 2026-10-10 Garrison answers tools/list itself: only system administrators (not run tokens) see tenantId; optional-field descriptions say to omit them; deployment-not-found says to omit deploymentId; stray tenantId accepted and ignored
- [x] G-20 Verify session resume (structured-output repair) and `--output-schema` against real Mux, Claude Code, Codex, and Gemini CLI, not only the fake harness.  | claude 2026-10-10 verified with real CLIs: Claude Code 2.1.296 (--resume, --json-schema), Codex 0.159.3 (exec resume, --output-schema), Mux 1.3.0 on gpt-oss:20b (--output-schema; resume needed --session-id on the first run, now passed); Gemini CLI not installed. Recorded in docs/HARNESSES.md
- [x] G-21 Grafana polish: Grafana 13 shows a "Grafana Assistant" announcement modal on first sign-in (disable announcements and news in the provisioned configuration), and the Runs dashboard's "Outcomes in the selected range" stat shows fractional counts from `increase()` (round, or use a counting query).  | claude 2026-10-10 provisioned grafana.ini sets `[feature_toggles] splashScreen = false` (env vars cannot set it); outcome stats use round() with 0 decimals; verified in a browser against grafana-oss 13.0.2
- [x] G-22 A stored `CodexAuthJson` secret breaks after its first token refresh. Each run copies the stored auth.json, Codex refreshes the expired access token inside the run, OpenAI rotates the refresh token, and the rotated file is discarded with the run. The next refresh presents a used token and every Codex run fails with `refresh_token_reused` (401 "workspace routing discovery unauthorized"); found 2026-10-11 when all codex-coder runs failed about 4 hours after the access token expired, and the same login on the operator machine was invalidated with it. Fix: the control plane owns the refresh (one refresh per secret under a lock, refreshed auth.json written back encrypted, runs handed a current access token), a `NeedsReauthentication` state on the secret surfaced in the dashboard, and docs recommending `OpenAiApiKey` for shared deployments until then.  | claude 2026-10-11 control plane owns the refresh (CodexCredentialService): refresh within `Codex.RefreshBeforeExpirySeconds` (default 1 day) under a database coordination lease with compare-and-swap write-back, leader-only background refresher, runs get auth.json with an empty refresh token and a closed refresh endpoint, permanent failures mark the secret `NeedsReauthentication` (migration 10) and fail runs `NotCredentialed`; dashboard status badge; tested against a fake token endpoint only
- [x] G-23 Shipped database pool can exhaust the shipped PostgreSQL (benchmark round 0, D-4): `k8s/base/config/garrison.json` sets `MaxPoolSize` 100 per server replica while `k8s/components/postgres/postgres.yaml` leaves `max_connections` at 100; open-loop load at 60 runs/s gave 203 `500 InternalError` and at 90/s PostgreSQL "too many clients". Size the pool per replica against `max_connections` (and the HPA maximum), raise `max_connections` in the component and Helm chart, document the formula in docs/SCALING.md, and return 503 with `Retry-After` when the pool is exhausted.  | claude 2026-10-11 pool 40 with `max_connections` 200 (Kustomize, Helm, Docker); production pool 20 with at least 250 connections documented; formula and table in docs/SCALING.md; Helm refuses an embedded setup that does not fit; exhausted pool returns 503 `DatabaseBusy` with Retry-After (`Rest.DatabaseRetryAfterSeconds`)
- [x] G-24 Overload restarts the server (D-5): the liveness probe in `k8s/base/server-deployment.yaml` times out under load and the kubelet restarts the only replica. Liveness must not touch the database or the request queue; raise its timeout and failure threshold; keep readiness as the shedding signal. Helm mirror.  | claude 2026-10-11 dedicated liveness listener on 8702 (`Rest.LivenessPort`) on its own thread; probe every 10 s, timeout 10 s, 6 failures; readiness on 8700 still sheds traffic
- [x] G-25 HTML 500 pages during a database outage (D-1): `RouteRegistrar.AuthorizeAsync` and `TenantMissingAsync` read the database outside the exception mapping in `InvokeAsync`, so a database error returns Watson's HTML page. Every failure must return the JSON error shape (503 `DatabaseUnavailable` for connection failures).  | claude 2026-10-11 one exception mapping for tenant check, authorization, handler, authentication, and Watson last resort; database outage returns 503 `DatabaseUnavailable` (MCP tool error, A2A -32603 with HTTP 503); tested by stopping the database on both providers
- [x] G-26 Manifest errors leak serializer internals (D-3): an invalid enum value returns type names and byte positions from `ManifestService` (around line 606). Map to a `ManifestInvalid` error naming the document, field, and allowed values.  | claude 2026-10-11 ManifestSpecError maps serializer errors to `ManifestInvalid` with document, field, value, and allowed values; apply items gain `errorCode` and `errorField` (migration 11); dashboard does not show `errorCode` yet
- [x] G-27 Node registration race: two workers registering at once both try to create the default node pool and one gets a 500 from a duplicate-key error (seen in `garrison_db_errors_total` during P13.28). Create-if-missing must tolerate the conflict and re-read.  | claude 2026-10-11 duplicate-key on registration re-reads the pool or node; 12 parallel pool and 4 same-name node registrations on both providers

- [x] G-28 Stale lease long poll: recheck the worker's current registration and readiness on every claim pass; a poll opened before the worker becomes Lost, Offline, Draining, Cordoned, or deleted must not claim subsequently queued work. Regression coverage on SQLite and PostgreSQL.  | codex 2026-10-12 fixed; scheduler reloads current node on every claim pass and rejects changed RegisteredUtc; regression first failed on both providers, then passed eight transitions (Lost, Offline, Draining, Cordoned, inactive, re-registered, capabilities removed, deleted), with a Ready replacement claiming the untouched run; net10 related suites 74/74, net8 runtime/replica/executor suites 61/61; build zero warnings

### AB_IMPROVEMENTS.md disposition (evaluated 2026-10-11)

`AB_IMPROVEMENTS.md` compares Garrison with Kubernetes and Google AX and proposes seven strengths to amplify (A1 to A7) and twelve gaps to close (G1 to G12; written here as AB-A1 and AB-G1 so they do not collide with the known gaps above). Each item was checked against the code at `330be63` plus the uncommitted work in the tree. Two findings are real bugs today, not future features: an expired `Leased` run can execute twice (P10.20), and a requeued run's old token can still delegate (P10.21). The user answered the open design questions on 2026-10-11 (D-035, D-036); each task records its answer.

| Item | Disposition | Plan reference |
|---|---|---|
| AB-A1 Budgets per delegation tree | Partly planned: P12.6 limits tenants, agents, and deployments, not trees; the budget check in section 6.3 is not in `DelegationPolicy` | P12.35 |
| AB-A2 Tool and credential gateway, epoch fencing | New; a requeue leaves the old run token valid | P10.21, P12.31 |
| AB-A3 Declarative output mapping | Partly done: `GenericJsonl` maps text, final result, and success only. WASM escape hatch not recommended until a harness cannot be mapped, since it adds a runtime to every worker | P12.41, P12.42 |
| AB-A4 Executor capability contract | Partly done: nodes advertise executors and deployments choose one (P11.8). AX adapter prototype not recommended: Garrison is not a general scheduler (section 3.3) and no requirement asks for AX | P11.18, P11.19 |
| AB-A5 Pinned re-run and spec diff | Partly done: runs record deployment and template versions, retry exists (P3.1.3), template versions diff; no deployment history or spec diff | P12.43, P12.44 |
| AB-A6 Canary promotion and rollback | Partly planned (P12.24 traffic experiments) | P12.45 |
| AB-A7 Chaos suite for safety | Partly done: P10.14 proves liveness only | P12.34, P15.21 |
| AB-G1 Effect policy replacing `RetryOnNodeLoss` | Partly covered: the default already fails with `NodeLost`, but expired `Leased` runs requeue after the harness may have started | P10.20, P12.29, P12.30, P12.33 |
| AB-G2 Isolated execution by default | Partly done: Phase 11 executor, one global `runEgress`, `docs/SECURITY.md` guidance | P11.14 to P11.17 |
| AB-G3 Durable continuation (`Suspended`) | Partly planned (P12.1, P12.2, P12.3, P12.8); no suspend state | P12.39, P12.40 |
| AB-G4 Effect intent protocol | New | P12.32, P12.33 |
| AB-G5 Bulk event ingestion | Implemented 2026-10-12: provider-limited multi-row inserts, prepared SQLite chunks, deduplication and whole-batch rollback; measured before/after results in docs/SCALING.md | P10.22 |
| AB-G6 Delegation slot deadlock | New; confirmed, nothing reserves capacity for children | P12.38 |
| AB-G7 Tenant fair share and quotas | Partly planned (P12.6 quotas); no fair share | P12.36, P12.37 |
| AB-G8 Load test to failure | Partly done: P10.13 at laptop size, P14.5 `load`, P13.24 metrics | P14.15, P10.24, P15.21 |
| AB-G9 Warm run pods | New; conflicts with how D-033 delivers the spec | P11.20 |
| AB-G10 Workspace and artifact caching | New | P12.46 |
| AB-G11 Coalesce text deltas | New (section 6.4 promised it). The separate raw-delta broadcast path is not recommended (D-034) | P10.23, D-034 |
| AB-G12 Capacity by resources | Partly done: pod resources for Job runs only (P11.5) | P10.25 |

### Phase 10: Control plane high availability and scale-out (M2)

- [x] P10.1 Multi-replica correctness review: no in-memory state that must be shared (rate limiter, nonce cache, permission cache, SSE waiters); move shared pieces to the database or make them per-replica-safe.  | claude 2026-10-10 state inventory table in docs/SCALING.md; every cache, waiter, and session shared, invalidated, or documented per replica
- [x] P10.2 Signed-request nonce cache shared through the database with TTL.  | claude 2026-10-10 request_nonces table (migration 6), leader cleanup
- [x] P10.3 Authentication rate limiting shared or documented as per-replica with adjusted limits.  | claude 2026-10-10 shared rate_limit_buckets table (not per replica)
- [x] P10.4 `IEventBackplane` with `PollingBackplane` (default) and `PostgresNotifyBackplane` (LISTEN/NOTIFY) for run events, new-run wakeups, and cache invalidation.  | claude 2026-10-10 IEventBackplane: Local, Polling, PostgresNotify (LISTEN/NOTIFY); Cluster.Backplane Auto; hints only, waiters still re-read the database
- [x] P10.5 Lease long-poll wakeups across replicas through the backplane.  | claude 2026-10-10 lease long polls woken across replicas (worker on B claims a run created on A in under 3 s in tests)
- [x] P10.6 HPA on CPU plus custom metric (`garrison_runs_active` or request rate) through Prometheus Adapter (documented, optional).  | claude 2026-10-10 production HPA tuned; optional hpa-custom-metrics component and Helm switches
- [x] P10.7 PDBs, anti-affinity, topology spread for server and workers.  | claude 2026-10-10 soft spread in base, surge-first server rollout, production zone spread and one-at-a-time PDBs, Helm parity
- [x] P10.8 Rolling upgrade test: upgrade server while runs are in flight, zero failed runs.  | claude 2026-10-10 k8s/tests/rolling-upgrade-test.sh on k3d: 3 servers restarted under 300 runs, 0 failed, 0 creation errors
- [x] P10.9 Migration safety: migrations run once under a coordination lease before the server reports ready; other replicas wait.  | claude 2026-10-10 migrations under a Postgres advisory lock; startup listener answers live 200 and ready 503 until migrated; probes use /v1.0/api/health/live and /ready
- [x] P10.10 Database connection pool sizing guidance and settings.  | claude 2026-10-10 GARRISON_DB_MAX_POOL_SIZE and related settings, sizing guidance; Postgres driver clears its pools on dispose
- [x] P10.11 Read path optimization: covering indexes, run list projections, event pagination.  | claude 2026-10-10 migration 6 indexes for run lists, delegation trees, leader scans, event retention; label requirements loaded per claim batch
- [x] P10.12 Run and event retention and archival.  | claude 2026-10-10 archival to a JSON Lines directory before deletion (Archive.Directory)
- [x] P10.13 Load test: 3 server replicas, 10 workers with the fake harness, 1000 concurrent runs; record claim latency and throughput.  | claude 2026-10-10 k8s/tests/loadtest.sh on k3d at laptop size (3 servers, 4 workers x 4 slots, 300 runs): 300 succeeded at 5.0 runs/s (slot-bound); no-backlog claim latency p50 39 to 130 ms, p99 107 to 191 ms. Full 3/10/1000 needs a larger machine; commands in docs/SCALING.md
- [x] P10.14 Chaos test: kill server and worker pods at random during load; zero stuck runs.  | claude 2026-10-10 k8s/tests/chaos-test.sh: 7 forced server and worker pod kills under 300 runs, 300 succeeded, 0 stuck, 8 requeued
- [x] P10.15 Multiple worker pools (StatefulSets) with distinct labels and harness sets in Helm and Kustomize.  | claude 2026-10-10 worker-pools component, k3s-worker-pools overlay, Helm pools always carry their pool label
- [x] P10.16 Node pools dedicated to tenants enforced at claim.  | claude 2026-10-10 pool and tenant filtered in SQL at claim so dedicated workers do not starve; test
- [x] P10.17 Backup and restore guidance per database provider.  | claude 2026-10-10 docs/BACKUP.md and a nightly pg_dump component, verified with a restore
- [x] P10.18 `docs/SCALING.md` updated with measured numbers.  | claude 2026-10-10 docs/SCALING.md Measured results table
- [x] P10.19 Control-plane nodes visible like worker nodes (user request 2026-10-10). Contract:
  - Each server replica registers and heartbeats a `control_nodes` row (migration 7): `id` (the replica's node ID), `name`, `hostname`, `address`, `version`, `schemaVersion`, `backplane`, `status` (`Starting`, `Ready`, `Draining`, `Offline`), `startedUtc`, `lastHeartbeatUtc`, `activeRequests`, `openStreams` (SSE and WebSocket), `heldLongPolls`. Heartbeat every 5 seconds; a replica sets `Draining` on SIGTERM and `Offline` on clean exit; the leader marks rows silent for 30 seconds `Offline` and deletes rows offline longer than 24 hours.
  - `isLeader` is computed from the coordination lease; responses also carry `leaderEpoch` for the leader.
  - `GET /v1.0/api/control-nodes` and `GET /v1.0/api/control-nodes/{id}` with the same permission as worker nodes (Node, Read); `respondingNodeId` on both, so a client sees which replica answered.
  - Overview gains `controlNodesByStatus` (`[{ status, count }]`) and `leaderNodeId`.
  - Metric `garrison_control_nodes` gauge by `status`.
  - Dashboard: Fleet hub gets a Control plane tab (status, leader badge, version, schema version, uptime, heartbeat age, activity, Grafana link); Home shows "Control plane ready x / y" next to worker nodes and lists both kinds in the nodes panel; tooltips and all 9 locales.  | claude 2026-10-10 server 6412c94; dashboard: Fleet tabs Worker nodes, Control plane, Node Pools; Home "Control plane ready 2 / 2" (leader in the tooltip) and a Nodes panel with both kinds; live on two replicas
- [x] P10.20 Start gate for `Leased` runs (AB-G1, found while evaluating `AB_IMPROVEMENTS.md`): the worker launches the harness before its `started` report reaches the server (`ProcessRunExecutor` reports from the process-start callback, retrying five times), and the lease reaper requeues every expired `Leased` run whatever `RetryOnNodeLoss` says (`MaintenanceService`, the `requeue` condition). A partitioned worker can therefore keep running a harness while the same run starts again on another node. The worker gets the server's acknowledgement before it launches the process, and a run whose start was acknowledged follows the `Running` rules when its lease expires. -> chaos test that partitions a worker between launch and report shows one execution, not two.  | claude 2026-10-11 worker calls `started` before launching and launches only on a 200 for its epoch (RunEventShipper.AcknowledgeStartAsync); a run still `Leased` never started, so the reaper requeues it safely; CorrectnessSuite partition tests (fails with the gate disabled)
- [x] P10.21 Fence run tokens by lease epoch (AB-A2, first step): when an expired lease is requeued, `MaintenanceService` leaves the previous attempt's run token valid (it revokes run sessions only when the run fails), so a stale harness can still delegate through Garrison MCP. Revoke run tokens on every requeue, record the lease epoch on the run-token session, and reject MCP and A2A calls whose token epoch is not the run's current epoch. -> after a forced requeue, `garrison_invoke_agent` with the old token fails and with the new attempt's token succeeds.  | claude 2026-10-11 run-token sessions record the lease epoch (migration 11); requeue revokes that epoch and older; tokens accepted only while the run is Leased, Running, or Cancelling at the same epoch; REST and MCP tests
- [x] P10.22 Bulk event ingestion (AB-G5): `AdoRunEventMethods.InsertBatchAsync` runs one `INSERT` per event inside its transaction. Replace it with multi-row `INSERT ... VALUES (...), (...) ON CONFLICT (runid, sequence) DO NOTHING` on Sqlite and Postgresql, chunked under each provider's parameter limit; batch latency comes from the P13.24 database metrics. -> ordering and deduplication suites pass unchanged; a microbenchmark records events per second at batch sizes 1, 10, and 100, before and after.  | codex 2026-10-12 multi-row inserts with provider parameter limits (SQLite 999, PostgreSQL 65535), tuned SQLite two-row prepared chunks, single-event fast path, transaction-wide rollback and replay counts; net10 related suites 118/118, net8 runtime 20/20 on both providers; 4400-event reverse-order/replay/late-chunk rollback regression passes; five-round 3000-event medians in docs/SCALING.md, batch-100 SQLite 1.12x/PostgreSQL 11.22x versus f947551; reproducible script added
- [ ] P10.23 Coalesce text deltas before they are stored (AB-G11, D-034; section 6.4 already promised "text deltas merged", and nothing merges them today): the worker merges consecutive `AssistantText` events, and consecutive `Thinking` events, inside one flush window (`EventFlushIntervalMs`) up to a size cap (worker setting, default 2,048 characters), never across any other event type; `raweventjson` keeps the merged harness lines. -> stored rows per run drop by at least 10x on a token-streaming fixture; the transcript rebuilt from events matches the uncoalesced run; Invoke Preview streams as before.
- [ ] P10.24 Control-plane tuning from the P14.15 results (AB-G8): queue notifications targeted by node pool and harness, idle backoff for fallback polling, and sharded per-deployment concurrency counters, each done only where P14.15 shows that subsystem is the limit. -> before and after numbers in `docs/SCALING.md`.
- [ ] P10.25 Capacity by resources instead of slots (AB-G12): workers report allocatable CPU and memory at registration, the deployment `podResources` requests (P11.5) also apply to Process runs, and the claim skips runs whose requests exceed what the worker has left; `MaxConcurrentRuns` stays the hard cap. Enforcement (decided 2026-10-11, D-035): placement accounting only; no cgroup enforcement. -> a mixed small and large workload on the P14.15 harness reaches higher utilization than slot sizing with zero OOM kills.

### Phase 11: Pod-per-run isolation executor (M2)

Design (decision D-033):

- The worker stays the only Garrison client. For a `KubernetesJob` run it creates, in the run namespace (default: the worker's namespace; `Worker.RunNamespace`), a Secret holding the compiled ExecutionSpec (owned by the Job for garbage collection) and a Job labelled `garrison.io/run-id`, `garrison.io/worker`, `garrison.io/tenant`, with `backoffLimit: 0`, `activeDeadlineSeconds` from the run timeout, and `ttlSecondsAfterFinished` (`Worker.JobTtlSeconds`, default 300).
- The run pod runs the worker image with `garrison-worker run-one --spec /run/garrison/spec.json`: it materializes the workspace, home, and config directories on emptyDir volumes, runs the harness with the existing process executor and run guards, and writes normalized run events and the final completion as JSON lines on stdout (prefixed so harness noise cannot impersonate them). It has no Garrison credentials besides the run token in its MCP configuration (needed for delegation), no Kubernetes API access (`automountServiceAccountToken: false`, a dedicated `garrison-run` ServiceAccount with no RoleBindings), and runs non-root with a read-only root filesystem, all capabilities dropped, `seccompProfile: RuntimeDefault`, and an optional `runtimeClassName` (gVisor or Kata).
- The worker streams the pod log through the Kubernetes API, parses the prefixed lines, forwards events, renews the lease, and reports completion as for process runs. Cancel and timeout delete the Job with foreground propagation (the pod gets SIGTERM, then SIGKILL after its grace period). On restart, a worker reconciles: it deletes Jobs labelled with its node name for runs it no longer holds.
- Placement: deployment field `executor` (`Process` or `KubernetesJob`, default `Process`), node pool default executor, and a worker capability `KubernetesJob` (reported only when the worker can create Jobs) so runs needing it are claimed only by capable workers. Per-deployment `resources` (CPU and memory requests and limits, ephemeral storage) apply to the run pod.
- Workspace kinds for job runs: emptyDir (default) and `PersistentVolume` (a PVC named by the workspace template, mounted at the workspace path).
- NetworkPolicy for run pods: egress to DNS, the Garrison MCP Service (delegation), and an allowlist (`runEgress` CIDRs and ports; default 0.0.0.0/0 on 443 only), no ingress.
- RBAC: the worker's Role in the run namespace allows create, get, list, watch, delete on Jobs and Secrets and get, list, watch on Pods and pods/log; nothing cluster-wide.

- [x] P11.1 `KubernetesJobRunExecutor` implementing `IRunExecutor`: creates a Job per run from a pod template (image, resources, security context, service account, node selector), mounts the spec through a Secret, streams logs, reports through the worker.  | claude 2026-10-10 KubernetesJobRunExecutor (src/Garrison.Worker/Kubernetes) creates the Job first, then a spec Secret owned by it; stdout lines carry `@@garrison:<nonce>:<seq>` and the worker relays only those, reconnecting without duplicates; forged lines from a harness that read the nonce were rejected on k3d
- [x] P11.2 Runner entrypoint inside the job pod (`garrison-worker run-one`) reusing the process executor.  | claude 2026-10-10 `garrison-worker run-one` reuses ProcessRunExecutor and run guards; waits for the garrison-run NetworkPolicy with an egress canary (36 to 771 ms on k3s) and fails PodFailed after 30 s if it stays open
- [x] P11.3 Worker Role and RoleBinding for Jobs, Secrets, and Pods (logs) in its namespace only.  | claude 2026-10-10 k8s/base/rbac.yaml and Helm rbac.yaml; worker may create but never get or list Secrets (deviation from plan: reading would expose garrison-secrets)
- [x] P11.4 Run namespace option and NetworkPolicy for run pods (egress allowlist).  | claude 2026-10-10 run namespace setting; garrison-run NetworkPolicy blocks server REST, Postgres, Kubernetes API, worker; allows 443 and the MCP port; verified on k3d
- [x] P11.5 Resource limits per deployment (CPU, memory, ephemeral storage).  | claude 2026-10-10 deployment `podResources` (named so because `resources` already means secret and MCP bindings); a request above a worker default raises the limit, above the server cap is rejected; OOMKilled reports the limit
- [x] P11.6 `PersistentVolume` workspace kind.  | claude 2026-10-10 `PersistentVolume` workspace kind mounts at /workspace with the work directory as a symlink; KubernetesJob deployments only; persistence across runs verified
- [x] P11.7 Cleanup of finished Jobs and Secrets (TTL after finished).  | claude 2026-10-10 TTL after finished for Jobs; Secrets are owned by the Job and go with it; orphaned Jobs reconciled at worker start
- [x] P11.8 Executor selection per deployment (`Process` or `KubernetesJob`) and per node pool.  | claude 2026-10-10 deployment `executor` (Process, KubernetesJob), node pool `defaultExecutor`, runs record the executor, migration 9; nodes advertise executors
- [x] P11.9 Tests on K3S: isolation, cancellation, timeout, node loss.  | claude 2026-10-10 k3d: isolation, cancel (0.28 s, Job gone in 1.5 s), timeout (10 s limit ended at 11 s), node loss (retryOnNodeLoss requeued and succeeded on attempt 2, otherwise NodeLost), PodFailed for unschedulable, ImagePullBackOff, OOMKilled; a pod stopped outside Garrison counts as node loss; real Claude Code ran in a pod; KubernetesExecutorSuite (35 cases)
- [x] P11.10 gVisor or Kata runtime class option documented.  | claude 2026-10-10 `runtimeClassName` per deployment; gVisor and Kata documented in docs/KUBERNETES.md
- [x] P11.11 Security context hardening (read-only root, dropped capabilities, seccomp).  | claude 2026-10-10 no service account token, read-only root, UID 10001, all capabilities dropped, no-new-privileges, RuntimeDefault seccomp, emptyDir for work, home, config, /tmp; verified on k3d
- [x] P11.12 Image pull secrets and private registries.  | claude 2026-10-10 image pull secrets in worker settings and Helm `kubernetesExecutor` values
- [x] P11.13 `docs/SECURITY.md` isolation section updated.  | claude 2026-10-10 docs/SECURITY.md isolation section rewritten, including the trade-off that Process runs on an executor-enabled worker can read its service account token (use a separate pool)
- [ ] P11.14 Deployment trust level (AB-G2): `trustLevel` (`Trusted`, `Untrusted`) on deployments, manifests, SDKs, and the dashboard. The claim never gives an `Untrusted` run to an executor without container isolation (P11.18 capabilities; until then, `KubernetesJob` only), and a run held back this way shows a `blockedReason` naming the missing isolation. Default for new deployments (decided 2026-10-11, D-035): `Trusted` is the default, with a visible "not isolated" warning on the deployment and run views; a tenant setting can require `Untrusted` for all its deployments.
- [ ] P11.15 Egress allowlist per deployment (AB-G2): today one `runEgress` rule (443 to anywhere by default) covers every run pod. Deployments list the endpoints they need (model APIs, git hosts, MCP servers) and the worker applies a NetworkPolicy per deployment, which adds NetworkPolicy to the worker's Role. Mechanism (decided 2026-10-11, D-035): CIDR and port rules in plain NetworkPolicy; operators resolve host names. An egress proxy may follow later.
- [ ] P11.16 Process executor hardening, labelled trusted-only in `docs/SECURITY.md` and the dashboard (AB-G2). Approach (decided 2026-10-11, D-035): `0700` run directories plus the "trusted only" label in docs and dashboard; no per-slot OS users, and the worker image stays non-root.
- [ ] P11.17 Isolation red-team suite (AB-G2): a run tries to read another run's `work/`, read the worker's credentials and service account token, and reach a host outside its allowlist; every attempt fails for `Untrusted` runs on k3d in CI. `docs/SECURITY.md` and `docs/QUICKSTART.md` present the isolated path first.
- [ ] P11.18 Executor capability contract (AB-A4): each worker reports an `ExecutorCapabilities` record per executor at registration (isolation level `Process`, `Container`, or `SandboxedRuntime`; egress control; filesystem snapshot; harness session continuation; cross-node restore; cold-start class), replacing the bare executor names nodes advertise today (P11.8). Deployments declare required capabilities (for example isolation at least `Container`, continuation `Session`) and the claim matches them in SQL as it matches executors now. -> a deployment that needs `Container` isolation is never claimed by a Process-only pool.
- [ ] P11.19 Executor conformance suite (AB-A4): one suite per executor proves every capability it declares, for example that a snapshot round trip preserves `work/` and `home/` byte for byte once P12.2 exists.
- [ ] P11.20 Warm run pods (AB-G9): a per-pool, per-image set of pre-started run pods, one run per pod and then deleted, sized from queue depth and arrival rate. D-033 hands the spec over through a Secret mounted at pod creation and gives run pods no inbound path, so a warm pod needs a new way to receive its spec (decided 2026-10-11, D-035): the worker writes the spec to the pod's stdin through `pods/attach`; no ingress path from run pods to the worker. -> claim to first event p50 and p95, warm versus cold (target under 1 s warm); Kubernetes API writes per run, before and after; P11.17 passes on warm pods.

### Phase 12: Advanced orchestration (M3)

- [x] P12.1 Conversations: `Conversation` entity, A2A `contextId`, harness session resume (`--resume`, `codex exec resume`, Mux `--resume`), node affinity for workspace locality, fallback when the affinity node is lost.  | claude 2026-10-11 `Conversation` entity (migration 12), invoke/runs/MCP/A2A take `startConversation`/`conversationId` (A2A `contextId` is the conversation id), 409 `ConversationBusy` (refuse, not wait), affinity to the last node for `Runtime.ConversationAffinityWaitMs` then transcript fallback (`builtin/conversation-fallback`, prompt role `ConversationFallback`), `ConversationStateLost` requeues without an attempt; resume via Claude/Mux/Gemini `--resume`, `codex exec resume`, app-server `thread/resume`; dashboard pages, SDKs, Postman, docs; 25 Touchstone tests. KubernetesJob turns always fall back until P12.2 snapshots
- [ ] P12.2 Workspace snapshots to an artifact store for cross-node resume.
- [x] P12.2a Codex streaming: drive Codex through `codex app-server` (JSON-RPC over stdio) as a new interactive delivery mode, mapping agent message deltas to `AssistantText` events, so Codex output streams like Claude Code and Mux. `codex exec --json` (0.159.3) emits each agent message only when it completes. The same driver serves P12.1 multi-turn conversations.  | claude 2026-10-11 opt-in profile `builtin/codex-app-server` (delivery `CodexAppServer`, parser `CodexAppServer`), CodexAppServerDriver exposes handshake, thread start/resume, turn start, and a replaceable approval handler for P12.1 and P12.3; real Codex 0.159.3 smoke: TTFT 4.8 s, 74 AssistantText events; `builtin/codex` stays on `codex exec --json` until a longer soak (G-12 stays open until then)
- [x] P12.3 Permission approvals: Claude `--permission-prompt-tool` through Garrison MCP, `Approval` entity, dashboard approvals inbox, rules (allow, deny, ask) per deployment, timeouts (Armada pattern).  | codex 2026-10-12 integrated with conversations and deployed, schema 13; full backend/dashboard/SDK checks pass; real Claude permission callback/Allow smoke passes; over-hour MCP idle soak remains open in section 2
- [ ] P12.4 Remote agents: invoke self-registered A2A agents and MCP tools from a worker executor (`RemoteA2A`, `RemoteMcp`), health checks and TTL expiry for registrations.
- [ ] P12.5 Triggers: scheduled runs (cron), webhook triggers with signed payloads.
- [ ] P12.6 Budgets and quotas: per tenant, agent, and deployment limits on runs, concurrency, tokens, and cost; enforcement at admission and through `--max-budget-usd` where supported.
- [x] P12.7 Cost estimation from a model price table when the harness does not report cost.  | codex 2026-10-12 migration 14, tenant/harness/exact-model prices, reported cost including zero takes precedence; dashboard + four SDKs + API/Postman docs; .NET 8/10 on both providers, full net10 484/484, dashboard 261 unit + 125 browser + 74 contracts; deployed, live 25/25 harness and 6/6 dashboard checks
- [ ] P12.8 Artifact stores: `Filesystem` and `S3` (Less3, Hydra, AWS) with signed download URLs; dashboard artifact browser.
- [ ] P12.9 Pipelines: ordered multi-agent stages with optional human review gates (Armada pipelines).
- [ ] P12.10 Management MCP tools (agents, deployments, manifests) for agent-driven configuration.
- [ ] P12.11 Clutch `ILeaseProvider` implementation using `Clutch.Sdk`.
- [ ] P12.12 Stdio MCP servers tested from workers.
- [ ] P12.13 Provider API execution mode (PolyPrompt), Aegon's `ProviderApiHarness` pattern. (Evaluate before committing.)
- [ ] P12.14 Notifications (webhooks) on run completion and failure.
- [ ] P12.15 Dashboard pages for each feature above.
- [ ] P12.16 SDK coverage for each feature above.
- [ ] P12.17 Postman and API docs for each feature above.
- [ ] P12.18 Tests for each feature above.
- [ ] P12.19 Memory integration (NotDory MCP server binding example) documented.
- [ ] P12.20 Conductor integration example (Mux endpoint pointing at a Conductor virtual model runner).
- [ ] P12.21 Agent marketplace export and import (manifests bundles).
- [ ] P12.22 Structured input forms in Invoke generated from agent input schemas.
- [ ] P12.23 Run comparison view (same prompt across deployments).
- [ ] P12.24 Traffic splitting experiments with outcome metrics per deployment.
- [ ] P12.25 Secret providers: Kubernetes Secret references and external vaults.
- [ ] P12.26 OIDC login for the dashboard with explicit user mapping (separate design document required by `AUTHENTICATION.md`).
- [ ] P12.27 Run transcripts export (Markdown, JSON).
- [ ] P12.28 Prompt template A/B evaluation hooks.
- [ ] P12.29 Effect policy replaces `RetryOnNodeLoss` (AB-G1): `effectPolicy` (`AtMostOnce`, `AtLeastOnce`, `Journaled`) on deployments and the manifest `DeploymentSpec`; the migration maps `true` to `AtLeastOnce` and `false` to `AtMostOnce`, and `retryOnNodeLoss` is still accepted on input for one release. `Journaled` behaves as `AtMostOnce` until P12.33. Open question (decided 2026-10-11, D-035): an unclean loss under `AtMostOnce` ends `Failed` with `NodeLost` as today; no `NeedsReconciliation` status, so P12.30 is dropped. -> migration test shows existing deployments behave as before; the chaos test kills a worker mid-run under each policy and checks the resulting state.
- [-] P12.30 `NeedsReconciliation` status, only if P12.29 chooses it (AB-G1): REST, MCP, and A2A state mapping, SDK models, and dashboard actions (requeue, mark failed, mark succeeded), each audited, with a Home count of runs waiting on an operator.  | dropped 2026-10-11: P12.29 keeps `NodeLost` (D-035)
- [ ] P12.31 Tool and credential gateway (AB-A2, after P10.21): credentials Garrison brokers (git tokens, API keys) become short-lived values minted per lease epoch where the provider supports it, revoked on requeue and completion, so a stale worker's copy stops working; tracked operations dispatched before a lease expired are resolved through P12.32, since no epoch check can recall them. Scope (decided 2026-10-11, D-035): Garrison-served MCP tools and brokered credentials only; third-party MCP servers are not proxied. -> a partitioned worker's gateway calls fail after its lease expires while the replacement attempt's succeed; p99 gateway overhead under 5 ms in one region.
- [ ] P12.32 Effect intent journal (AB-G4): an `operations` table (operation ID, run ID, lease epoch, tool, argument digest, state `Authorized`, `Dispatched`, `Completed`, or `Unknown`, result reference) written by the gateway before dispatch; the operation ID travels as an idempotency key where the destination accepts one; tools are classified by MCP annotations (`idempotentHint`, `destructiveHint`) and harness profile metadata, unclassified tools count as effectful, and shell commands and direct network calls count as unknown coverage. -> fault injection that kills the worker before dispatch, after dispatch, and after completion but before reporting leaves `Authorized`, `Unknown`, and `Completed`, and only the first re-executes automatically.
- [ ] P12.33 `Journaled` recovery (AB-G1, AB-G4): a lost `Running` run under `Journaled` is requeued automatically only when it has no `Unknown` operations and no effects of unknown coverage since its last checkpoint; otherwise it is handled as `AtMostOnce`.
- [ ] P12.34 Effect-safety chaos suite (AB-A7): an effect-sink test service records every mutation with its operation ID and attempt, and the chaos scenarios of P10.14 (`k8s/tests/chaos-test.sh`) run under each effect policy and assert its guarantee: no duplicates under `AtMostOnce` and `Journaled`, every duplicate tagged under `AtLeastOnce`. Runs in CI on a schedule. -> the suite fails against today's `RetryOnNodeLoss=true` before P12.29 lands, which proves it can see the problem.
- [ ] P12.35 Budgets per delegation tree (AB-A1, extends P12.6; section 6.3 lists a budget check that `DelegationPolicy` does not implement, it checks only enablement, allowlist, cycles, and depth): limits on tokens, cost in USD, wall-clock time, run count, and fan-out per root run. The remaining budget lives on the root run; each child admission reserves an estimate by a compare-and-set debit and settles at completion against reported cost or P12.7 estimates; the remainder is passed to `--max-budget-usd` where the harness supports it; exhaustion ends with outcome `BudgetExhausted`; run detail and analytics show used and remaining budget for the tree. Open questions (decided 2026-10-11, D-035): when a tree runs out, running children finish and new delegations are refused; a caller may lower the budget for one invocation, never raise it above the deployment's. -> concurrent-debit test where N children admitted at once never overspend; a recursive fan-out agent is cut off at the configured cost and run count with `BudgetExhausted` across the tree.
- [ ] P12.36 Tenant fair share at claim (AB-G7): candidate selection across tenants by fair-share weight rather than global priority alone, with a weight on the tenant record. Algorithm (decided 2026-10-11, D-035): weighted fair queuing over tenants using QoSKit `WeightedFairQoSQueue` (flow key tenant, weight from the tenant record), with configurable queue depth limits; see D-036. -> load test with one tenant submitting 100 times the work of the others keeps the quiet tenants' p95 queue time within a target.
- [ ] P12.37 Quotas at every delegation hop (AB-G7, extends P12.6): P12.6 quotas are checked again when a delegated child is admitted, reusing the P12.35 debit, and rejections reach REST, MCP, and A2A callers as a typed `QuotaExceeded` error naming the limit.
- [ ] P12.38 Delegation slot deadlock (AB-G6): with N slots, N parents each waiting synchronously on a queued child can block every child forever, because a waiting parent's harness keeps its `WorkerHost` slot and a child only inherits its parent's priority; a deployment's `maxConcurrentRuns` can do the same. The parent is recorded as waiting on a child before the child is admitted, workers keep a bounded child reserve and a cap on resident waiting parents, and the server's `maxConcurrentRuns` check leaves out ancestors waiting on a descendant in the same deployment. Beyond the reserve (decided 2026-10-11, D-035): fail the delegation fast with a typed error (`DelegationCapacityExhausted`) when the child reserve and its configurable queue depth are exhausted; delegated children are classified ahead of new top-level work through QoSKit; see D-036. Suspension (P12.39) can replace the failure later for opted-in deployments. -> 4 slots and 4 parents that each delegate once all finish; a property test over random trees with small slot counts always finishes or fails with a typed error and never hangs.
- [ ] P12.39 Durable continuation with a `Suspended` status (AB-G3, builds on P12.1, P12.2, P12.3, P12.8): at an approval, an A2A `input-required`, or a wait on child runs, the harness stops, `work/`, `home/`, and `config/` are snapshotted to the artifact store, and the slot and lease are released; the run resumes on any capable node through session resume when its trigger fires, and suspension fails cleanly where the executor or harness lacks session continuation (P11.18). Ships with P12.29 and P12.32, since resuming is safe only when no effect has an unknown outcome. Open question (decided 2026-10-11, D-035): opt-in per deployment. -> a Claude Code and a Codex run suspended mid-task resume on another node after the original is killed, without repeating completed tool calls; 10,000 suspended runs hold zero slots; snapshot size and resume latency recorded per harness.
- [ ] P12.40 Session formats pinned per harness profile (AB-G3): each profile records the session format version it resumes, and CI resumes a recorded session for each built-in harness, so a CLI upgrade that changes the format fails the build.
- [ ] P12.41 Declarative output mapping (AB-A3): `GenericJsonl` maps only text, final result, and success today (`ExecutionParserOptions`; the `UsagePaths` in section 8.1 was never built). Extend it to a mapping schema in the harness profile (match rules on JSON paths, field extraction, event type assignment) covering assistant text, thinking, tool calls and results, usage, cost, session ID, served model, and final result; re-implement the Mux parser as a mapping; record the mapping version on each run next to the template versions. -> the recorded parser fixtures in `src/Test.Shared/Fixtures/` give identical event streams through the built-in Mux parser and its mapping; one new harness is onboarded with no C# change.
- [ ] P12.42 Parse preview for harness profiles (AB-A3): `POST .../harness-profiles/{id}/parse-preview` runs pasted sample output through the profile's parser or mapping and returns the events; the profile editor shows the result.
- [ ] P12.43 Pinned re-run (AB-A5): runs already record their deployment version and template versions (P2.7.1), but deployments keep no history and retry (P3.1.3) compiles against the current deployment and the latest templates. Add deployment version history and `POST .../runs/{id}/rerun` with `pinVersions` (default true), recompiling from the recorded versions with secrets resolved by reference. Storage (decided 2026-10-11, D-035): deployment version snapshots in child tables with the spec rebuilt on demand; no new unmanaged JSON exception. -> re-running a run whose templates have changed since produces a byte-identical spec, secret values aside.
- [ ] P12.44 Compiled-spec diff (AB-A5): `GET .../runs/{id}/spec-diff?against={otherRunId}` and a diff on Run detail (prompts, arguments, environment names, MCP configuration, secrets by name only) reusing `DiffViewer`. -> two runs from different prompt versions differ in exactly the changed template sections.
- [ ] P12.45 Canary promotion and rollback (AB-A6, extends P12.24): a rollout policy with steps (for example 5, 25, 50, and 100 percent), a minimum run count per step, and guard metrics from run analytics (success rate, cost per run, p95 duration, repair rate); the leader evaluates the guards after each step and every weight change is audited. Open question (decided 2026-10-11, D-035): the leader only recommends promotion or rollback; an operator approves each weight change, which is audited. -> a candidate that triples cost is rolled back at the first step; a healthy one reaches 100 percent within the expected number of runs.
- [ ] P12.46 Workspace caching (AB-G10, after P12.8): `GitRepository` workspaces clone fresh on every run (P3.6.2). Add a per-node git mirror cache used through `--reference`, prepared workspace snapshots in the artifact store keyed by template version and commit, and a cache hit rate metric per deployment. -> preparation time and bytes transferred, cold versus warm, on a large repository; a cached workspace is byte-identical to a fresh one.

### Phase 13: Observability stack and dashboards (M2)

Contract shared by the infrastructure tasks (P13.1 to P13.11, P13.17) and the product tasks (P13.12 to P13.16, P13.18, P13.19):

- Components: Prometheus (scrapes server and worker pods by pod IP using the `prometheus.io/*` annotations), Tempo (traces), Loki (logs), Grafana (UI), and Grafana Alloy as the collector: an OTLP receiver (gRPC 4317, HTTP 4318) forwarding traces to Tempo, plus log collection from Garrison pods (Kubernetes) or containers (Compose) into Loki with labels `app="garrison"`, `component` (`server`, `worker`, `dashboard`), and `node`. All images pinned.
- Grafana datasource UIDs: `garrison-prometheus`, `garrison-loki`, `garrison-tempo`, with trace-to-logs and logs-to-trace links between Tempo and Loki. Dashboards in folder `Garrison` with UIDs `garrison-overview`, `garrison-http`, `garrison-runs`, `garrison-workers`, `garrison-protocols`, `garrison-integrations`. Dashboard variables `node`, `harness`, `agent` where they apply, so deep links can pass `var-node=...`.
- Server and worker export OTLP to the collector when `Telemetry.OtlpEnable` is true (`GARRISON_OTLP_ENABLE`, `GARRISON_OTLP_ENDPOINT`; worker `GARRISON_WORKER_OTLP_ENABLE`, `GARRISON_WORKER_OTLP_ENDPOINT`), set by the observability overlays and Compose profile.
- Log lines that concern a run include `run=<runId>` and `trace=<traceId>` so `{app="garrison"} |= "<runId>"` finds them.
- Cluster settings (browser-facing URLs, empty means not configured): `Observability.GrafanaUrl`, `Observability.PrometheusUrl`, `Observability.LokiUrl`, `Observability.TempoUrl`, with environment variables `GARRISON_GRAFANA_URL`, `GARRISON_PROMETHEUS_URL`, `GARRISON_LOKI_URL`, `GARRISON_TEMPO_URL`, plus internal URLs the server probes for reachability (`Observability.GrafanaInternalUrl` and so on, `GARRISON_GRAFANA_INTERNAL_URL` and so on; default to the browser URL).
- `GET /v1.0/api/server-info` gains `observability`: `{ grafanaUrl, prometheusUrl, lokiUrl, tempoUrl, datasources: { prometheus, loki, tempo }, dashboards: { overview, http, runs, workers, protocols, integrations } }` (nulls when not configured). `GET /v1.0/api/observability/status` (any authenticated user) returns `[{ service, configured, reachable, version, checkedUtc }]` from server-side probes (Grafana `/api/health`, Prometheus `/-/ready`, Loki `/ready`, Tempo `/ready`), cached for 30 seconds.
- Runs record `traceId` (32 hex characters, W3C) from the trace the run was compiled in; REST, MCP summary, SDK models.
- Kubernetes: `k8s/components/observability`, enabled by new overlays `k8s/overlays/k3s-observability` and `k8s/overlays/minikube-observability` (and `OBSERVABILITY=1` in the deploy scripts); Helm value `observability.enabled`. Grafana admin credentials in Secret `garrison-grafana` created by `generate-secrets` (user `admin`, password from `GARRISON_GRAFANA_PASSWORD`, default `password`). `port-forward.sh` forwards Grafana to `127.0.0.1:${GRAFANA_PORT:-3000}` when present.
- Compose: profile `observability` (`docker compose --profile observability up -d`, and `docker/update.sh --observability`), Grafana on `127.0.0.1:${GARRISON_GRAFANA_PORT:-3000}`, Prometheus `127.0.0.1:${GARRISON_PROMETHEUS_PORT:-9090}`.

- [x] P13.1 `components/observability`: Prometheus, Grafana, Tempo, Loki, OpenTelemetry Collector with pinned versions and probes.  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.2 Prometheus scrape configuration for server and worker pods (annotations or ServiceMonitor option).  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.3 Grafana provisioning (datasources with stable UIDs, dashboards provider into folder `Garrison`).  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.4 Dashboard: Overview.  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.5 Dashboard: HTTP.  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.6 Dashboard: Runs and Scheduling.  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.7 Dashboard: Workers and Harnesses.  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.8 Dashboard: Protocols (MCP, A2A, delegation).  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.9 Dashboard: Integrations (model APIs as seen by harness usage, database).  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.10 Loki log shipping from server and worker (structured logs with trace IDs).  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.11 Helm values for observability.  | claude 2026-10-10 Prometheus v3.5.4, Loki 3.5.5, Tempo 2.6.1, Grafana 13.0.2, Alloy v1.5.0; validated on a throwaway k3d cluster and in Compose (targets up, 3 datasources healthy, 6 dashboards, 103 panel queries with data, 0 errors, logs and traces arriving)
- [x] P13.12 External services card fed by server settings (URLs and default credentials per deployment).  | claude 2026-10-10 Home Observability section from server-info and /observability/status
- [x] P13.13 Cluster settings for the observability endpoints: `Observability.GrafanaUrl`, `PrometheusUrl`, `LokiUrl`, `TempoUrl` (browser-facing URLs), plus Grafana dashboard UIDs; exposed read-only to any authenticated user through `GET /v1.0/api/server-info` so the dashboard never hard-codes them.  | claude 2026-10-10 Observability.* cluster settings with GARRISON_*_URL and *_INTERNAL_URL environment overrides
- [x] P13.14 Dashboard Home: an Observability section with one card per service (Grafana, Prometheus, Loki, Tempo) showing reachability (probed by the server, not the browser), version, and an "Open" link; cards are hidden when a URL is not configured, with a single "Configure observability" link to Settings instead.  | claude 2026-10-10 one card per configured service with server-side reachability, version, and Open link; one setup note when none are configured
- [x] P13.15 Dashboard deep links: Run detail links to its trace in Tempo (by trace ID recorded on the run) and its logs in Loki (`{app="garrison"} |= "<runId>"`); Nodes links to the Grafana "Workers and Harnesses" dashboard filtered to the node; Home KPIs link to the matching Grafana panels; Request History links to the HTTP dashboard.  | claude 2026-10-10 Run detail trace (Tempo Explore) and logs (Loki Explore), Nodes to garrison-workers with var-node, Home to garrison-overview, Request History to garrison-http, Analytics to garrison-runs with the range
- [x] P13.16 Record the W3C trace ID on every run (`runs.traceid` column, API, SDK models) so P13.15 deep links work without searching.  | claude 2026-10-10 run:create span for every run path (delegations join the parent trace), traceId on runs (migration 5), REST, MCP, A2A, SDKs
- [x] P13.17 Kubernetes: the observability component exposes Grafana (and optionally Prometheus) through the overlay ingress and `port-forward.sh`; Grafana admin credentials come from a generated secret and are shown by `generate-secrets` like the Garrison admin credentials.  | claude 2026-10-10 overlays k3s-observability and minikube-observability, OBSERVABILITY=1 in the deploy scripts, garrison-grafana secret, Grafana on port-forward 3000 and the ingress
- [x] P13.18 Fix metrics port-forwarding (G-11) so `kubectl port-forward` and in-pod `127.0.0.1` scrapes work alongside pod-IP scraping.  | claude 2026-10-10 server serves /metrics on 8700 and worker on 8710 by relaying the pod-IP Radiant listener (Telemetry.ServeMetricsOnServicePort); Prometheus scrapes those ports
- [x] P13.19 Docs (`docs/TELEMETRY.md`, `docs/KUBERNETES.md`) and Playwright coverage for the observability cards and deep links, including the "not configured" state.  | claude 2026-10-10 docs/TELEMETRY.md, KUBERNETES.md, DOCKER.md, CONFIGURATION.md; 9 Playwright and 15 unit tests for cards and links
- [x] P13.20 Telemetry coverage audit: inventory every REST route, MCP tool, A2A method, node-protocol call, background service (scheduler, deadline enforcer, lease reaper, retention, leader election, backplane, pause detector, control-node registry, blocked-run service, Codex auth refresher), database operation, outbound call (MCP server tests, A2A remote agents, token refresh, OTLP), and worker path (lease loop, heartbeat, executor, Kubernetes Job executor, run guards, event relay). Record the result as a coverage matrix in `docs/TELEMETRY.md` (metric, span, log, Grafana panel for each), and fail CI when a route or MCP tool has no entry (test that walks the route table and tool catalog).  | claude 2026-10-11 coverage matrix in docs/TELEMETRY.md generated from code (166 REST routes, 8 MCP tools plus agent tools, 6 A2A methods, 103 metrics, 12 background services, 13 coverage areas); TelemetryCoverageSuite fails CI on any route, tool, method, or metric without a row or panel
- [x] P13.21 Per-agent and per-model run metrics: add `tenant`, `agent`, `deployment`, `model` (served model) labels to run lifecycle, stage duration (queue, compile, claim, first token, streaming, execution, total), token (input, output, cached, reasoning), cost, outcome, guard, and repair metrics, server and worker side. Cardinality guard: `Telemetry.MaxLabelValues` per label (default 200, min 10, max 10000) folds the excess into `other`, with a counter of folded values.  | claude 2026-10-11 run metrics carry tenant, agent, deployment, harness, model; stages queue, claim, compile, startup, first_token, first_token_excl_delegation, streaming, execution, delegation_wait, total; tokens, cost, output rate, tool calls, guards, cancels, schema validations, repairs; `Telemetry.MaxLabelValues` (default 200) folds into `other`
- [x] P13.22 Per-route HTTP metrics: request count, duration histogram, request and response size, by route template (never raw path), method, status code, and tenant; in-flight gauge; auth failures and rate-limit rejections by reason.  | claude 2026-10-11 per route template, method, status, tenant; sizes, in-flight, auth failures, rate limits, authorization denials; client-aborted requests recorded as 499 `aborted`, not 5xx (benchmark D-2)
- [x] P13.23 Protocol metrics: MCP sessions (active, created, expired, cross-replica restores), tool call duration by tool and result; A2A method duration and task states; SSE streams active and events sent; delegation depth and denials; invocation wait durations and `cancelOnDisconnect` cancels.  | claude 2026-10-11 MCP sessions and tool latency, A2A methods and task states, SSE and WebSocket streams, delegation depth and denials, invocation waits, disconnect cancels
- [x] P13.24 Infrastructure metrics: database operation duration and errors by operation and provider, connection pool use; backplane publish and receive counts and lag; scheduler claim latency, queue depth by harness and agent, blocked runs by reason; lease expirations; leader changes; pause detections; node and control-node heartbeats and state transitions; Kubernetes Job executor create, pod start latency, PodFailed by reason, orphan cleanups; secret decrypt and Codex token refresh outcomes.  | claude 2026-10-11 database statements by provider, operation, table, errors, connections; backplane traffic and lag; background iterations; leader; heartbeats and transitions; queue depth per agent; blocked runs; Kubernetes executor; secret decrypts; Codex token refresh (wired 2026-10-11)
- [x] P13.25 Traces: a span for every route, MCP tool, A2A method, node-protocol call, background service iteration, database operation (with statement name, no values), outbound HTTP call, and worker run stage, linked across server, worker, and run pod by the run's `traceId`; exemplars on duration histograms so panels jump to traces.  | claude 2026-10-11 spans at central points (route hooks, ADO.NET driver, one outbound HTTP handler, one background-iteration helper); exemplars on duration histograms link to Tempo; run pods link through `run=`/`trace=` log fields instead of exporting spans
- [x] P13.26 Logs: structured key=value fields (`tenant`, `agent`, `deployment`, `run`, `trace`, `route`, `node`) on every log line that concerns them, with Alloy promoting `level`, `component`, and `tenant` to Loki labels; error and warning rate panels.  | claude 2026-10-11 structured fields on run, route, and node log lines; Alloy promotes level, component, tenant; error and warning panels
- [x] P13.27 Grafana: the `Garrison` folder gains one dashboard per section (Overview, HTTP API, Runs, Agents, Models and tokens, Workers, Kubernetes executor, Protocols (MCP, A2A, SSE), Scheduler and queue, Database, Control plane (replicas, leader, backplane), Security and auth, Integrations, Logs and traces). Agent and harness and model template variables on every relevant dashboard, per-agent panels for invocation and run time percentiles, TTFT, streaming time, queue time, token breakdowns, cost, outcomes, guard trips; trace and log links from every panel that has them. Dashboard UIDs listed in `server-info` and linked from the Garrison dashboard.  | claude 2026-10-11 14 dashboards, 266 panels in folder Garrison (overview, http, runs, agents, models, workers, kubernetes, protocols, scheduler, database, control-plane, security, integrations, logs) with tenant, agent, deployment, harness, model, node variables; server-info lists all 14; Home has a Grafana dashboards grid and agent detail links to the Agents dashboard
- [x] P13.28 Verification: a script that generates traffic across every route, protocol, and harness on a cluster, then asserts through the Prometheus, Loki, and Tempo APIs that every matrix entry produced data, and a headless check that every Grafana panel renders without "No data" or errors. Helm and Kustomize mirrors, Docker Compose observability profile, and docs updated.  | claude 2026-10-11 k8s/tests/telemetry-verify.{sh,bat}: 210 pass, 0 fail, 9 conditional skips on a throwaway k3d cluster; headless check of all 266 panels with no "No data"; overhead about 2 to 3 ms per claim, no change in run time (metrics only, without OTLP)

### Phase 14: Benchmarking (M3)

- [x] P14.1 `BENCHMARKING.md` with hypotheses (claim throughput, end-to-end overhead per run versus direct harness invocation, event latency, scale-out linearity).  | claude 2026-10-11 BENCHMARKING.md, hypotheses H1 to H6
- [x] P14.2 `src/Test.Benchmark` (assembly `Garrison.Benchmark`, no product references, typed client, `IsTestProject=false`).  | claude 2026-10-11 src/Test.Benchmark (assembly Garrison.Benchmark, own typed client, no product references, IsTestProject false), in the solution
- [x] P14.3 `benchmarks/` layout and `.gitignore`.  | claude 2026-10-11 benchmarks/ with README, .gitignore, baselines, config, datasets
- [x] P14.4 Isolated stack: K3S in Docker with non-default ports, pinned images.  | claude 2026-10-11 k3d stack with non-default ports and pinned images (benchmarks/k3d, benchmarks/k8s)
- [x] P14.5 Commands: `validate`, `ingest` (manifest apply at scale), `routing` (scheduling correctness), `e2e`, `load`, `resilience`, `compare`, `history`, `stub`.  | claude 2026-10-11 validate, ingest, routing, e2e, load, resilience, compare, history, stub
- [x] P14.6 Fake harness as the stub; a direct-invocation reference arm as the floor.  | claude 2026-10-11 fake harness stub and a direct-invocation reference arm
- [x] P14.7 Datasets: synthetic workloads, frozen live snapshot.  | claude 2026-10-11 synthetic-fleet and garrison-live datasets, regenerated byte for byte from sources; no public dataset fits (explained in BENCHMARKING.md)
- [x] P14.8 Reports with provenance (commit, dirtiness, image digests, dataset hash).  | claude 2026-10-11 reports record commit, dirtiness, image digests, dataset hash
- [x] P14.9 Confidence intervals and significance-gated compare.  | claude 2026-10-11 confidence intervals; compare exits 1 on significant regression, probe set mismatch, or kind mismatch, and treats any pass-to-fail flip in deterministic reports as a regression
- [x] P14.10 `ci-gate` with committed baselines in CI.  | claude 2026-10-11 .github/workflows/benchmark.yaml runs ci-gate (local Sqlite stack, fake harness, correctness only, about 40 s) against benchmarks/baselines; passed on GitHub for d9ce033
- [x] P14.11 `RESULTS.md` round 0 with defects found.  | claude 2026-10-11 benchmarks/RESULTS.md round 0: H1 latency met and throughput about 80 to 85 percent of slots, H2 17.7 ms added p50, H3 met, H4 1.93x and 2.66x, H6 met, H5 refuted by defects G-23 to G-26 and D-2
- [x] P14.12 `IMPROVEMENTS.md`.  | claude 2026-10-11 IMPROVEMENTS.md
- [x] P14.13 Scripts in `.sh` and `.bat` pairs.  | claude 2026-10-11 .sh and .bat pairs (the .bat files are untested, no Windows host)
- [x] P14.14 Definition of Done checklist in `BENCHMARKING.md` satisfied.  | claude 2026-10-11 Definition of Done in BENCHMARKING.md checked; deviations listed there
- [ ] P14.15 Control plane load to failure (AB-G8, extends P10.13 and the P14.5 `load` command): P10.13 ran at laptop size (300 runs, limited by worker slots), so the control plane's ceiling is unknown. Add a fake harness mode with a configurable event rate and run duration; run the 3 servers, 10 workers, 1,000 runs tier and a tier 10 times larger on hardware that can hold it; measure event inserts, queue wakeups, lease renewals, and contention on the per-deployment concurrency lock separately with the P13.24 metrics; publish maximum sustained runs, events per second, and claim latency per tier in `docs/SCALING.md`, reproducible from a script, with P14.10 gating regressions. A separate event log is considered only if these numbers show the database is the limit.

### Phase 15: Hardening, simulated user testing, and 1.0 release (M4)

- [ ] P15.1 Security review: threat model, secrets handling, token handling, SSRF on MCP test and remote agents, path traversal in file materialization, command injection review of argument templates.
- [ ] P15.2 Master key rotation with key versions.
- [ ] P15.3 Credential and run token expiry policies.
- [ ] P15.4 Dependency and image vulnerability scanning in CI.
- [ ] P15.5 Signed images and SBOMs.
- [ ] P15.6 Upgrade path tests from every 0.x release.
- [ ] P15.7 Full simulated user testing session per `SIMULATED_USER_TESTING.md` with report under `docs/testing/`.
- [ ] P15.8 Findings reviewed with the user; approved fixes verified on a fresh instance.
- [ ] P15.9 Documentation completeness review.
- [ ] P15.10 Performance targets met (from Phase 14 results).
- [ ] P15.11 Accessibility audit.
- [ ] P15.12 Localization review by native speakers for `de` and `ja`.
- [ ] P15.13 API stability review and OpenAPI freeze for 1.0.
- [ ] P15.14 SDK stability review.
- [ ] P15.15 Helm chart published to a chart repository.
- [ ] P15.16 Release automation (tags, images, packages, changelog).
- [ ] P15.17 Support policy and versioning documentation.
- [ ] P15.18 License and third-party notices.
- [ ] P15.19 1.0 version change. **(requires explicit user approval per `VERSIONING.md`)**
- [ ] P15.20 Launch materials (README refresh, screenshots, Docker Hub page).
- [ ] P15.21 Every release attaches the effect-safety chaos summary (P12.34) and the scale results (P14.15) as release artifacts (AB-A7, AB-G8).

---

## 19. Risks and Open Questions

| ID | Risk or question | Impact | Mitigation or owner |
|---|---|---|---|
| R-001 | Harness CLIs change flags and output formats between versions. | Broken runs after an image rebuild. | Pinned versions in the worker image, recorded fixtures, parser contract tests, `GenericJsonl` escape hatch, harness profiles editable without a release. |
| R-002 | Subscription tokens (`CLAUDE_CODE_OAUTH_TOKEN`, Codex `auth.json`) on a shared multi-user server may violate provider terms. | Legal and account risk for operators. | Supported per D-003 with a prominent documentation caveat; API keys recommended for shared deployments. |
| R-003 | Subprocess isolation shares the worker pod's kernel, network, and service account. | Untrusted prompts could affect other runs on the same worker. | Separate home and workspace per run, empty environment, no service account permissions in MVP; Phase 11 pod-per-run. |
| R-004 | Voltaic MCP on a second port complicates ingress and TLS. | Operational friction. | Ingress path routing for `/mcp`; documented; upstream request to Voltaic for an embeddable dispatcher (open question Q-001). |
| R-005 | Database becomes the bottleneck at high run and event volume. | Throughput ceiling. | Batched events, indexes, retention, backplane, benchmarks in Phase 14 before claiming numbers. |
| R-006 | Mux needs a model endpoint the cluster can reach. | Mux agent cannot run in MVP without one. | Deployment parameters for endpoint URL, model, and key; documented examples for OpenAI, Ollama in-cluster, and Conductor. |
| R-007 | Real-harness verification needs credentials the build agent should not copy into a cluster unasked. | MVP checks P9.8 to P9.10 need the user. | Fake harness covers plumbing; real-harness checks run locally with the user's existing logins or with keys the user provides. |
| Q-001 | Should Voltaic gain a public request dispatcher so MCP can share Watson's port? | Simplifies networking. | User decision; out of scope for Garrison M1. |
| Q-002 | Should node credentials be per-node (issued at registration with a join token) instead of one shared node credential? | Better revocation granularity. | Recommended for Phase 10: join token exchanged for a per-node credential. |
| Q-003 | Which model endpoint should the sample Mux agent default to? | Out-of-the-box experience. | Default to an OpenAI-compatible endpoint configured by `generate-secrets`; user to confirm. |
| R-008 | Legacy unsalted SHA-256 password hashes. | Resolved by G-2; old hashes upgrade transparently on sign-in. | PBKDF2-SHA256 with random salt and configurable iteration count implemented 2026-10-10. |
| Q-004 | Adopt salted PBKDF2-SHA256 for passwords despite the SHA-256 wording in `AUTHENTICATION.md`? | Resolved. | Adopted in G-2 on 2026-10-10; no decision pending. |

---

## 20. Appendices

### Appendix A: Built-in harness profile argument templates

Conditions are shown in brackets. All profiles deliver the task prompt on stdin unless noted.

**`builtin/claude-code`**

```
claude
-p
--output-format stream-json
--verbose
--setting-sources ""                                   (keeps login, drops hooks and CLAUDE.md)
--disable-slash-commands
--permission-mode {{deployment.parameters.permissionMode | default: "dontAsk"}}
--system-prompt-file {{run.configDir}}/system-prompt.md
[deployment.model]          --model {{deployment.model}}
[deployment.fallbackModel]  --fallback-model {{deployment.fallbackModel}}
[deployment.effort]         --effort {{deployment.effort}}
--max-turns {{deployment.maxTurns | default: 20}}
[deployment.maxBudgetUsd]   --max-budget-usd {{deployment.maxBudgetUsd}}
[resources.mcpServers]      --mcp-config {{run.configDir}}/mcp.json --strict-mcp-config
[deployment.parameters.allowedTools] --allowedTools {{deployment.parameters.allowedTools}}
[agent.outputSchema]        --json-schema {{agent.outputSchema | json}}
Environment: CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY from bound secret, DISABLE_AUTOUPDATER=1,
             CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1, MCP_TOOL_TIMEOUT, HOME={{run.homeDir}}
Files: system-prompt.md (System template), mcp.json (builtin/claude-code-mcp-config)
Parser: ClaudeStreamJson. Probe: claude --version
```

**`builtin/codex`**

```
codex exec
--json
--skip-git-repo-check
--ignore-user-config
-s {{deployment.parameters.sandbox | default: "workspace-write"}}
-C {{run.workspaceDir}}
[deployment.model]   -m {{deployment.model}}
-c project_doc_max_bytes=0
[deployment.effort]  -c model_reasoning_effort="{{deployment.effort}}"
-c model_instructions_file="{{run.configDir}}/system-prompt.md"
[each mcp server]    -c mcp_servers.{{name}}.url="{{url}}" -c mcp_servers.{{name}}.http_headers={...}
                     -c mcp_servers.{{name}}.required=true
[agent.outputSchema] --output-schema {{run.configDir}}/output-schema.json
-                                                       (read prompt from stdin)
Environment: CODEX_API_KEY or OPENAI_API_KEY from bound secret, or CODEX_HOME={{run.homeDir}}/.codex with
             auth.json materialized from a CodexAuthJson secret
Parser: CodexJsonl. Probe: codex --version
```

**`builtin/mux`**

```
mux
--print
--config-dir {{run.configDir}}/mux
-e garrison
--output-format jsonl
--yolo                                                  (or --approval-policy from parameters)
--sandbox {{deployment.parameters.sandbox | default: "workspace-write"}}
-w {{run.workspaceDir}}
[deployment.model]   -m {{deployment.model}}
--max-turns {{deployment.maxTurns | default: 20}}
--system-prompt {{run.configDir}}/system-prompt.md
[resources.mcpServers] --mcp-config {{run.configDir}}/mux-mcp.json --strict-mcp-config
--output-last-message {{run.configDir}}/last-message.txt
--no-session-persistence
Files: mux/endpoints.json (builtin/mux-endpoints: adapterType, baseUrl, model from deployment parameters,
       apiKey "${GARRISON_MUX_API_KEY}"), mux/settings.json (builtin/mux-settings), mux/subagents.json
Environment: GARRISON_MUX_API_KEY from bound secret, MUX_TELEMETRY_ENABLED=false, MCP bearer tokens as
             GARRISON_MCP_TOKEN_<n> referenced from mux-mcp.json
Parser: MuxJsonl, ResultSource: LastMessageFile. Probe: mux --version
```

**`builtin/gemini-cli`**

```
gemini -p " " -o stream-json --skip-trust --approval-mode yolo [-m {{deployment.model}}]
[resources.mcpServers] --allowed-mcp-server-names {{names}}
Environment: GEMINI_CLI_HOME={{run.configDir}}/gemini-home, GEMINI_SYSTEM_MD={{run.configDir}}/system-prompt.md,
             GEMINI_API_KEY from bound secret
Files: gemini-home/.gemini/settings.json (builtin/gemini-settings)
Parser: GeminiStreamJson. Probe: gemini --version
```

### Appendix B: Default ports

| Port | Component | Purpose |
|---|---|---|
| 8700 | Server | REST, A2A, WebSocket, SSE, OpenAPI |
| 8701 | Server | MCP (Voltaic) |
| 9464 | Server | Prometheus metrics |
| 8710 | Worker | Health |
| 9465 | Worker | Prometheus metrics |
| 80 | Dashboard | nginx (container) |
| 30870, 30871, 30880 | minikube NodePorts | Server, MCP, dashboard |

### Appendix C: Example server settings (`garrison.json`)

```json
{
  "CreatedUtc": "2026-10-09T00:00:00.000Z",
  "NodeId": null,
  "Rest": { "Hostname": "*", "Port": 8700, "Ssl": false, "PublicBaseUrl": null },
  "Mcp": { "Enable": true, "Hostname": "*", "Port": 8701, "Path": "/mcp", "PublicUrl": null, "MaxMessageSize": 16777216 },
  "Database": { "Type": "Sqlite", "Filename": "data/garrison.db", "Host": null, "Port": 0, "DatabaseName": "garrison",
                "Username": null, "Password": null, "ManageSchema": true, "MaxPoolSize": 100 },
  "Logging": { "ConsoleLogging": true, "FileLogging": false, "LogDirectory": "logs", "LogFilename": "garrison.log", "MinimumSeverity": 1 },
  "Auth": { "Issuer": "garrison", "SigningKey": "override-via-env", "TokenLifetimeMinutes": 60, "AdminApiKey": "override-via-env" },
  "Security": { "MasterKey": "override-via-env", "SignedRequestSkewSeconds": 300, "AuthRateLimitPerMinute": 30 },
  "RequestHistory": { "Enabled": true, "MaxRequestBodyBytes": 65536, "MaxResponseBodyBytes": 65536, "RetentionDays": 30 },
  "Telemetry": { "Enabled": true, "ServiceName": "garrison-server", "PrometheusEnable": true, "PrometheusPort": 9464, "OtlpEnable": false, "OtlpEndpoint": "http://127.0.0.1:4317" },
  "Cluster": { "ExpectedReplicas": 1 }
}
```

Cluster runtime settings (database-backed, D-014) include `Scheduling.LeaseDurationMs` (default 30000), `Scheduling.LeaseWaitMs` (20000), `Scheduling.NodeHeartbeatTimeoutMs` (20000), `Scheduling.EventPollMs` (250), `Runs.DefaultTimeoutSeconds` (1800), `Runs.MaxDelegationDepth` (3), `Runs.RetentionDays` (30), `Runs.EventRetentionDays` (14), `Audit.RetentionDays` (365), and feature flags.

### Appendix D: Example worker settings (`garrison-worker.json`)

```json
{
  "ServerUrl": "http://garrison-server:8700",
  "NodeName": null,
  "AccessKey": "override-via-env",
  "SecretKey": "override-via-env",
  "Labels": { "garrison.io/pool": "default" },
  "MaxConcurrentRuns": 4,
  "WorkRoot": "/workspaces",
  "HealthPort": 8710,
  "HeartbeatIntervalMs": 5000,
  "LeaseWaitMs": 20000,
  "EventFlushIntervalMs": 250,
  "EventBatchSize": 100,
  "EnvironmentAllowlist": [ "PATH", "LANG", "TZ", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY" ],
  "Telemetry": { "Enabled": true, "ServiceName": "garrison-worker", "PrometheusEnable": true, "PrometheusPort": 9465 }
}
```
