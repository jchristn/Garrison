# Changelog

All notable changes to Garrison are recorded here. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org). Versions below 1.0 are alpha and may break compatibility in any release.

## [0.1.0-alpha] - Unreleased

The first build of Garrison: a multi-tenant control plane that runs headless agent harnesses on pull-based worker nodes and exposes them over REST, MCP, and A2A. This release is the MVP milestone in `GARRISON_PLAN.md`.

### Control plane

- Watson 7 host with per-feature route registrars, OpenAPI at `/openapi.json`, CORS, request history capture, and a central operation scope map that records the permission every route and MCP tool requires.
- Data layer for Sqlite and Postgresql with versioned, idempotent migrations, structured tables and child tables for every entity, and first-boot seeding.
- Authentication with bearer session tokens (AES-256 with a random IV plus HMAC), credential headers, AWS-style signed requests with replay protection, the administrator API key, and run tokens for delegation.
- RBAC with built-in and custom roles, permissions over resource types and operations, tenant and resource scoped assignments, explicit deny, credential owner ceilings, effective-permission inspection, and audit records for denials and privileged changes.
- Settings API that separates node-local file settings from cluster runtime settings stored in the database, with restart-required metadata and a restart endpoint.

- Multiple control-plane replicas behave like one (Phase 10): signed-request nonces, the token rate limit, and MCP sessions are shared through the database; an event backplane (Postgresql LISTEN/NOTIFY, or a polled table) wakes SSE, A2A, invoke, and lease long-poll waiters and invalidates settings and permission caches on every replica; deployment `maxConcurrentRuns` is exact under concurrent claims; idempotent run creation is atomic across replicas; tenant-dedicated node pools are filtered in the claim query. See `docs/SCALING.md`.
- MCP sessions work on every replica without sticky routing: Garrison serves the public MCP port and relays to Voltaic on a loopback port, replaying a session's handshake on a replica that has not seen it.
- Migrations and built-in seeding run under a database startup lock, one replica at a time. `GET /v1.0/api/health/live` (always 200 while the process runs) and `GET /v1.0/api/health/ready` (same as `/v1.0/api/health`: 503 while migrating, starting, degraded, or draining) split liveness from readiness.
- Graceful shutdown drains: readiness turns off, long polls, SSE (`server.draining`), A2A, WebSocket, and synchronous waits end, and in-flight requests get 15 seconds.
- Control-plane replicas are visible like worker nodes (P10.19): each replica registers a `control_nodes` row (migration 7) as `Starting`, heartbeats it every 5 seconds as `Ready` with its version, schema version, backplane, requests in flight, open SSE and WebSocket streams, and held lease long polls, turns `Draining` on SIGTERM and `Offline` on a clean exit; the leader marks rows silent for 30 seconds `Offline` and deletes rows `Offline` for 24 hours (cluster settings `ControlPlane.HeartbeatIntervalMs`, `OfflineAfterMs`, `OfflineRetentionHours`). `GET /v1.0/api/control-nodes` and `/{id}` (Read on `Node`) mark the leader (`isLeader`, `leaderEpoch`, from the coordination lease) and name the replica that answered (`respondingNodeId`); the overview adds `controlNodesByStatus` and `leaderNodeId`; Prometheus gets `garrison_control_nodes` by `status`. The C#, Python, JavaScript, and Go SDKs list and read control nodes.
- Connection pool settings (`Database.MinPoolSize`, `ConnectionTimeoutSeconds`, `CommandTimeoutSeconds`, `ConnectionIdleLifetimeSeconds`, and `GARRISON_DB_MAX_POOL_SIZE`), read-path indexes (migration 6), optional JSON Lines archival of runs and events before retention deletes them (`Archive.Directory`), and cluster-wide `garrison_runs_queued` and `garrison_runs_active` gauges.

### Configuration

- Harness profiles that describe a headless invocation as data, with built-in profiles for Claude Code, Codex, Mux, Gemini CLI, a generic JSON-lines CLI, and a fake harness.
- Versioned prompt templates with a logic-light template language, live render preview, built-ins that can be cloned and reset, and recorded template versions on every run.
- MCP servers, encrypted secrets, workspace templates, artifact stores, agents with A2A cards, and deployments that bind them with overrides, placement, limits, and per-run parameters.
- Declarative manifests (`garrison/v1`) with dry run, apply, and export.

### Runtime

- Pull-based scheduling with an atomic compare-and-set claim, fencing epochs, lease heartbeats, and long-poll leasing.
- Leader election through a database lease, with a maintenance loop that requeues or fails runs whose node disappeared, enforces deadlines, marks silent nodes lost, and prunes old runs and events.
- Run lifecycle with cancellation, retry, idempotency keys, events streamed over SSE and WebSocket, and delegation limited by allowlist, depth, and recursion rules.
- Structured output validation: when an agent has an output schema, the control plane validates each run's final output against it (JsonSchema.Net), makes one repair attempt that resumes the harness session in the same lease with the `Repair` prompt template when the profile supports resume, and otherwise fails the run with `SchemaValidationFailed`. Runs carry `outputSchemaValid`, `schemaValidationErrors`, and `repairAttempts`.
- Run telemetry measured on the worker's clock: time to first token, streaming, execution, queue, and total time, output tokens per second, input, output, cached, and reasoning tokens, tool calls, cost, the served model (for Codex, read from its session file), and the time spent waiting on delegated runs with time to first token excluding it.
- Analytics API (`GET .../analytics/runs` and `.../dimensions`): gap-filled time buckets with averages and p50/p95, filters by agent, harness, deployment, and model, and grouping by agent, harness, model, or harness and model.
- Queued runs that no worker can take report why (`blockedReason`: no Ready worker, no worker with the harness, or no matching pool), with a one-time warning event and an optional fail-after setting.
- Claude Code output streams token by token (`--include-partial-messages`); Mux streams natively.
- Bounded, self-stopping runs (P3.15). Worker run guards for every harness, set per deployment (`repetitionGuard`, `maxAssistantChars`, `noProgressSeconds`, migration 8) over new cluster defaults (`Runtime.RepetitionGuard`, `Runtime.MaxAssistantChars`, `Runtime.NoProgressSeconds`): a run whose assistant text degenerates into one short repeated unit or into text with no letters or digits ends `RepetitionDetected`, one that writes more than 200,000 characters ends `OutputLimitExceeded`, and one with no text, thinking, tool call, or tool result for 300 seconds while no tool call is open ends `NoProgress`. A tripped guard emits one `RunGuardTriggered` warning, keeps the partial output as the result, and stops the harness with SIGTERM then SIGKILL after the kill grace, now sent to the harness's child processes too (libc `kill`, no `kill` binary needed). The cluster cap `Runtime.MaxRunSeconds` (default 3600) bounds every run's deadline, including a per-run `timeoutSeconds` override (now an allowed override field), and the deadline enforcer applies it to older runs.
- Cancellation reaches the harness in well under a second: workers hold a cancellation watch long poll (`POST /v1.0/api/node/watch`) that the control plane answers as soon as a held run is cancelled on any replica; the heartbeat stays the fallback. Cancelling a run cancels its delegated runs. Callers that go away cancel their runs: REST `wait=true` invoke, test, and create on client disconnect (`cancelOnDisconnect`, default true, opt out in the body or query), MCP `garrison_invoke_agent` on `notifications/cancelled` (relayed across replicas) or session close, and A2A blocking `SendMessage` and `SendStreamingMessage` on disconnect. The SDKs expose the new outcomes and `cancelOnDisconnect`.
- The fake harness gained `--ignore-sigterm`, `--loop-text`, `--spawn-child`, and `--tool-sleep-ms` for testing the stop path and the guards.
- Mux 1.3.0 support (1.2.0 output still parses): the `failed` run status with the last error as the run's error, `NotCredentialed` for a model 401 or `config_unresolved_env`, cached and reasoning tokens and cost from `usage`, a warning when Mux falls back to its default context window, the `contextWindow` and `maxTokens` deployment parameters (also `MUX_CONTEXT_WINDOW` and `MUX_MAX_TOKENS` for the sample agent), and `--session-id` for agents with an output schema so the structured output repair can resume the session. Resume and native output schemas were verified against real Claude Code, Codex, and Mux. The generated Mux `settings.json` turns off features meant for a person at a terminal: persistent memory (`memoryEnabled`, which added the `remember`, `recall`, and `forget` tools and a `## Memory` prompt section), user and project skills, task planning, `@path` file attachments (`fileMentionMaxBytes: 0`), and the setup wizard.
- Worker metrics (leases, runs, duration, tokens, cost, completion reports) and a span per harness execution that joins the run's trace.
- Observability integration (Phase 13): `Observability.*` cluster settings and `GARRISON_GRAFANA_URL`-style environment variables for Grafana, Prometheus, Loki, and Tempo, an `observability` block in server info, `GET /v1.0/api/observability/status` with cached server-side probes, a W3C `traceId` on every run (schema migration 5) shared by the `run:create`, `run:claim`, `run:compile`, and `harness <type> exec` spans, `run=<runId> trace=<traceId>` on every run log line, and `/metrics` relayed on the REST and worker health ports so `kubectl port-forward` works. The dashboard shows a card per service on Home and links runs, nodes, KPIs, request history, and analytics into Grafana.
- Worker node with capability probes, an isolated workspace and home directory per run, MCP pre-flight, output parsers for every built-in harness, secret scrubbing, buffered event delivery that survives control-plane outages, and drain on shutdown.

### Protocols

- MCP server on Voltaic with agent discovery, invocation, and run tracking tools whose descriptions are prompt templates. Only system administrators see the `tenantId` argument; run-token sessions and other callers act in their own tenant, and the descriptions tell models to leave optional arguments out.
- A2A gateway with one agent card per agent and JSON-RPC send, stream, get, list, cancel, and subscribe. Cards advertise `Rest.ExternalBaseUrl`; reusing a `messageId` with different content returns 409.
- Agents can be addressed by name or ID on every agent route, with authorization checked against the resolved agent.

### Defaults

- First start seeds tenant `default` with the administrator `admin@garrison` and password `password` (`GARRISON_ADMIN_EMAIL`, `GARRISON_ADMIN_PASSWORD`). Change them before the server is reachable by anyone else.

### Delivery

- Container images for the server, worker (with Claude Code, Codex, Mux, and the fake harness), and dashboard.
- Kubernetes assets: Kustomize base, overlays for minikube, K3S, and production, a PostgreSQL component, a smoke test, a Helm chart, and deployment scripts.
- Docker Compose stack (`docker/compose.yaml`) with one server, two workers, the dashboard, PostgreSQL, and a bootstrap container, plus `docker/update` (rebuild and recreate) and `docker/factory/reset` (delete all data and start fresh).
- React operator console: nine-hub navigation with tabs, run telemetry columns and a telemetry panel, an Analytics page with charts by agent, harness, and model, CSV, PNG, SVG, and JSON export on every chart, explainer panels for related objects, a useful tooltip on every control, and nine languages (English, German, Japanese, Spanish, French, Italian, Simplified Chinese, Traditional Chinese, and Cantonese) with RTL readiness.
- SDKs for C#, Python, JavaScript and TypeScript, and Go, a Postman collection, and API documentation.
- A quick start (`docs/QUICKSTART.md`) with a multi-agent sample manifest (`examples/multi-agent.yaml`) and a validation script (`examples/validate.sh`, `validate.bat`) that checks REST, MCP, A2A, streaming, delegation, telemetry, and analytics and prints PASS or FAIL per check.
