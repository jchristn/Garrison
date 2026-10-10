# Architecture

Garrison is a control plane for headless agent harnesses. It accepts requests to run an agent over REST, MCP, or A2A, turns each request into a fully resolved command line, and hands that to a worker that pulls it. This page describes the parts, how a run moves through them, and the decisions that shape the design. `GARRISON_PLAN.md` has the full decision log.

## The parts

```text
                    clients: dashboard, SDKs, curl, MCP clients, A2A agents
                                       |
                 +---------------------+----------------------+
                 |  REST + SSE + WebSocket + A2A  :8700        |
                 |  MCP (Voltaic)                 :8701        |   control plane ("Command")
                 |  Prometheus                    :9464        |   N stateless replicas
                 +---------------------+----------------------+
                                       |
                              Sqlite or PostgreSQL
                                       ^
                 +---------------------+----------------------+
                 |  register, heartbeat, lease (long poll),   |   workers ("Post")
                 |  started, events, complete, drain           |   M replicas, pull only
                 |  health :8710                               |
                 +---------------------------------------------+
                         | spawns
                 claude / codex / mux / gemini / any CLI
```

| Component | Project | Responsibility |
|---|---|---|
| Control plane | `src/Garrison.Server` | Authentication, authorization, the REST, A2A, WebSocket, and MCP surfaces, scheduling, the node protocol, leader-elected maintenance |
| Core library | `src/Garrison.Core` | Models, the Sqlite and PostgreSQL data layer, security primitives, the template language, the invocation compiler, manifests, built-in seeding |
| Harness library | `src/Garrison.Harnesses` | Process runner, output parsers, outcome classification, secret scrubbing, MCP pre-flight, harness probes |
| Worker | `src/Garrison.Worker` | Registration, heartbeats, the lease loop, per-run directories, the process executor, event buffering, the health listener |
| Fake harness | `src/Garrison.FakeHarness` | A deterministic stand-in for Claude Code, Codex, and Mux used by tests and the smoke test |
| Dashboard | `dashboard/` | React operator console over the REST and WebSocket APIs |
| SDKs | `sdk/` | C#, Python, JavaScript and TypeScript, and Go clients |

The control plane is assembled from four modules, each registering its routes and services: identity (tenants, users, credentials, roles, permissions, assignments, sessions, audit, request history, settings), configuration (harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores, agents, deployments, manifests), runtime (runs, nodes, node pools, the scheduler, the node protocol, maintenance, WebSocket), and protocols (MCP and A2A). All HTTP is served by Watson 7, and MCP by Voltaic on its own port.

## The life of a run

1. **Request.** A caller invokes an agent through `POST .../agents/{id}/invoke`, the MCP tool `garrison_invoke_agent`, or the A2A method `SendMessage`. All three go through the same invoker. The caller is authenticated, and Execute on Agent is checked.
2. **Deployment selection.** The invoker picks one of the agent's active deployments, at random by weight unless the caller named one, and validates the run parameters against the deployment's allowed overrides. Delegated calls are checked against the delegation rules here.
3. **Queued.** The run is written as `Queued`, with its requirements (harness type, node pool, node labels) copied from the deployment. If the caller sent an idempotency key that matches a run from the last 24 hours, that run is returned instead.
4. **Claimed.** A worker's long-poll lease request finds candidate runs it is eligible for and claims one with a single compare-and-set update that also increments the run's fencing epoch. Only one claim can succeed.
5. **Compiled.** The claiming replica loads the deployment, profile, agent, prompt bindings, MCP servers, secrets, and workspace, issues a run token if the agent may delegate, and renders everything into an `ExecutionSpec`: executable, argument list, environment, files, stdin, parser, result source, success policy, timeouts, MCP checks, and the values to scrub. The template versions used are recorded on the run. A compile failure fails the run with `CompileFailed`.
6. **Leased.** The spec goes back to the worker in the lease response, with the epoch and lease expiry.
7. **Running.** The worker creates the run's directories, writes files, runs MCP pre-flight, starts the process, and reports `started`. It parses stdout into normalized events (text, tool calls, usage, results) and sends them in batches. Heartbeats extend the lease and carry back cancellation requests.
8. **Finished.** When the process exits, the worker classifies the outcome, reads the result, scrubs secrets, reports `complete`, and cleans up. The control plane stores the result, usage, cost, served model, exit code, and stderr tail, revokes the run token, and wakes anyone waiting.
9. **Delivered.** A waiting invoke returns the run. Streaming clients receive the final event over SSE, WebSocket, or A2A streaming.

Meanwhile the leader's maintenance loop (every 2 seconds) requeues or fails runs whose lease expired, enforces deadlines as a backstop to the worker, marks silent nodes `Lost`, and prunes old records.

### Run states

```text
Pending -> Queued -> Leased -> Running -> Succeeded | Failed | TimedOut | Cancelled
              ^         |          |
              +---------+----------+   lease expired with attempts left (requeue)
           Queued/Leased/Running -> Cancelling -> Cancelled
```

`Rejected` exists in the status list for future admission control; nothing sets it in this release.

A run's `outcome` explains a `Failed` status: `HarnessFailed`, `NotInstalled`, `NotCredentialed`, `McpPreflightFailed`, `NodeLost`, `OutputLimitExceeded`, `CompileFailed`, and so on (see `docs/HARNESSES.md`).

## Design decisions

**Workers pull.** The control plane never opens a connection to a worker. Workers need only outbound access to the REST port, which makes them easy to run in other clusters, behind NAT, or on developer machines, and lets the two halves scale on their own.

**Compile on the control plane.** Workers receive a resolved spec and never read the database, render a template, or decrypt a stored secret. One component owns configuration semantics, worker upgrades rarely matter, and a compromised worker learns only what its own runs needed.

**Harnesses are data.** Command lines, environment, config files, and output parsing are described in harness profiles built from templates, so supporting a new CLI flag or a new CLI is a configuration change. Only output parsers are code.

**Every prompt is a template.** System prompts, task wrappers, delegation instructions, tool descriptions, and harness config files are versioned prompt templates, bound per deployment and recorded per run.

**Fencing over trust.** Leases expire and epochs increase on every claim, so correctness never depends on a worker noticing it lost a run. A stale worker's reports are refused.

**The database is the bus.** Events, status, settings, sessions, and leases go through the database rather than an in-memory bus, so any replica can serve any client. In-process signals only make the common case faster.

**Multi-tenant from the start.** Every tenant-owned row carries a tenant identifier, every query filters on the authenticated tenant, and cross-tenant reads answer 404.

**Structured storage.** Records are stored as columns and child tables, not JSON blobs, apart from a few deliberately unmanaged fields such as agent schemas and raw harness events.

## Data model

```text
Tenant
 +- User --- Credential
 |    \______ role assignments (tenant or resource scope) ___ Role --- Permission
 +- HarnessProfile (arguments, environment, files)            (built-ins shared)
 +- PromptTemplate (versions, variables)                       (built-ins shared)
 +- McpServer (headers, environment)   Secret   WorkspaceTemplate   ArtifactStore
 +- Agent (skills, delegation rules, schemas)
 |    +- Deployment (profile, prompt bindings, resource bindings, overrides,
 |                   parameters, allowed run overrides, node selector)
 +- Run (parameters, requirements, template versions) --- RunEvent
 +- AuditRecord, ManifestApply
NodePool (optional tenant dedication) --- Node (labels, capabilities)
RequestHistoryEntry, ClusterSetting, CoordinationLease, AuthSession
```

Identifiers are K-sortable strings with a type prefix (`agt_`, `run_`, `nod_`, and so on), so they sort by creation time and say what they refer to.

## Surfaces

| Surface | Reference |
|---|---|
| REST, SSE, node protocol | `REST_API.md`, OpenAPI at `/openapi.json` |
| WebSocket live updates | `WEBSOCKETS_API.md` |
| MCP | `MCP_API.md` |
| A2A | `A2A_API.md` |

All four use the same tenants, credentials, and RBAC.

## Further reading

`docs/HARNESSES.md` and `docs/PROMPTS.md` cover configuration; `docs/MANIFESTS.md` covers declarative configuration; `docs/SECURITY.md`, `docs/SCALING.md`, and `docs/TELEMETRY.md` cover operations; `docs/DOCKER.md` and `docs/KUBERNETES.md` cover deployment and `docs/QUICKSTART.md` a first multi-agent setup; `docs/DEVELOPMENT.md` covers building and testing.
