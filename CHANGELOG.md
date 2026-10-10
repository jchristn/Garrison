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
- Worker metrics (leases, runs, duration, tokens, cost, completion reports) and a span per harness execution that joins the run's trace.
- Worker node with capability probes, an isolated workspace and home directory per run, MCP pre-flight, output parsers for every built-in harness, secret scrubbing, buffered event delivery that survives control-plane outages, and drain on shutdown.

### Protocols

- MCP server on Voltaic with agent discovery, invocation, and run tracking tools whose descriptions are prompt templates.
- A2A gateway with one agent card per agent and JSON-RPC send, stream, get, list, cancel, and subscribe.

### Delivery

- Container images for the server, worker (with Claude Code, Codex, Mux, and the fake harness), and dashboard.
- Kubernetes assets: Kustomize base, overlays for minikube, K3S, and production, a PostgreSQL component, a smoke test, a Helm chart, and deployment scripts.
- React operator console, SDKs for C#, Python, JavaScript and TypeScript, and Go, a Postman collection, and API documentation.
