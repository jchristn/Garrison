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
- Mux 1.3.0 support (1.2.0 output still parses): the `failed` run status with the last error as the run's error, `NotCredentialed` for a model 401 or `config_unresolved_env`, cached and reasoning tokens and cost from `usage`, a warning when Mux falls back to its default context window, the `contextWindow` and `maxTokens` deployment parameters (also `MUX_CONTEXT_WINDOW` and `MUX_MAX_TOKENS` for the sample agent), and `--session-id` for agents with an output schema so the structured output repair can resume the session. Resume and native output schemas were verified against real Claude Code, Codex, and Mux.
- Worker metrics (leases, runs, duration, tokens, cost, completion reports) and a span per harness execution that joins the run's trace.
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
