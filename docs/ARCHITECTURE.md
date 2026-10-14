# Architecture

Garrison is a control plane for headless agent harnesses. It accepts requests to run an agent over REST, MCP, or A2A, turns each request into a fully resolved command line, and hands that to a worker that pulls it. This page describes the parts, how a run moves through them, and the decisions that shape the design. `GARRISON_PLAN.md` has the full decision log.

## The parts

```text
                    clients: dashboard, SDKs, curl, MCP clients, A2A agents
                                       |
                 +---------------------+----------------------+
                 |  REST + SSE + WebSocket + A2A  :8700        |
                 |  MCP (proxy -> Voltaic loopback) :8701      |   control plane ("Command")
                 |  Prometheus                    :9464        |   N stateless replicas
                 +---------------------+----------------------+
                                       |
                              Sqlite or PostgreSQL
                  (state, leases, and the event backplane: LISTEN/NOTIFY or a polled table)
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

Each control-plane replica registers itself in `control_nodes` and heartbeats it every 5 seconds with its status (`Starting`, `Ready`, `Draining`, `Offline`), version, schema version, backplane, and activity (requests in flight, open streams, held long polls), the way workers heartbeat their `nodes` rows. `GET /v1.0/api/control-nodes` shows both kinds of node side by side with the workers, marks the replica that holds the leader lease, and names the replica that answered (`respondingNodeId`). See `docs/SCALING.md`.

The control plane is assembled from four modules, each registering its routes and services: identity (tenants, users, credentials, roles, permissions, assignments, sessions, audit, request history, settings), configuration (harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores, agents, deployments, manifests), runtime (runs, nodes, node pools, the scheduler, the node protocol, maintenance, WebSocket), and protocols (MCP and A2A). All HTTP is served by Watson 7. MCP is answered by Voltaic on a loopback port behind a small Garrison relay on the MCP port, which maps cluster-wide MCP session identifiers to Voltaic's in-process sessions so that any replica can serve any MCP session.

## The life of a run

1. **Request.** A caller invokes an agent through `POST .../agents/{id}/invoke`, the MCP tool `garrison_invoke_agent`, or the A2A method `SendMessage`. All three go through the same invoker. The caller is authenticated, and Execute on Agent is checked.
2. **Deployment selection.** The invoker picks one of the agent's active deployments, at random by weight unless the caller named one, and validates the run parameters against the deployment's allowed overrides. Delegated calls are checked against the delegation rules here. A delegated call that waits records the calling run as waiting on the child before the child is created, and fails at once with `DelegationCapacityExhausted` when waiting could leave no capacity to run it.
3. **Queued.** The run is written as `Queued`, with its requirements (harness type, node pool, node labels) copied from the deployment. If the caller sent an idempotency key that matches a run from the last 24 hours, that run is returned instead.
   While a run is queued, every read explains whether anyone can take it: `blockedReason` is `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool, tenant dedication, or node selector), or `NoIsolatingWorker` (an `Untrusted` run that no Ready node with its harness can isolate), and `null` otherwise. It is computed from a node snapshot reused for a few seconds, never stored, and the tenant overview counts such runs as `blockedRuns`.
4. **Claimed.** A worker's long-poll lease request finds candidate runs it is eligible for (harness, node pool, and tenant dedication are filtered in SQL) and claims one with a single compare-and-set update that also increments the run's fencing epoch. Only one claim can succeed. When the deployment has `maxConcurrentRuns`, claims for that deployment are serialized in the database and the update counts its active runs, so the limit is exact across replicas; a delegated run's ancestors in the same deployment that wait on a descendant are not counted. Delegated runs are claimed ahead of new top-level work, and a worker's child reserve takes only runs whose parent waits on them (see "Delegation capacity" in `docs/SCALING.md`). A long poll waiting on one replica is woken through the event backplane when a run is queued on another.
5. **Compiled.** The claiming replica loads the deployment, profile, agent, prompt bindings, MCP servers, secrets, and workspace, issues a run token if the agent may delegate or the deployment has permission approvals enabled, and renders everything into an `ExecutionSpec`: executable, argument list, environment, files, stdin, parser, result source, success policy, timeouts, MCP checks, and the values to scrub. The template versions used are recorded on the run. A compile failure fails the run with `CompileFailed`.
6. **Leased.** The spec goes back to the worker in the lease response, with the epoch and lease expiry.
7. **Running.** Before anything is launched, the worker passes the start gate: it reports `started` for its epoch and waits for the control plane's acknowledgement, which moves the run from Leased to Running. A worker that is refused (409 `StaleLease`) or cannot get the acknowledgement before its lease expires abandons the run without launching it, so a run that is still Leased has never started anywhere. The worker then creates the run's directories, writes files, runs MCP pre-flight, and starts the process. It parses stdout into normalized events (text, tool calls, usage, results) and sends them in batches. Heartbeats extend the lease. The run guards watch the same events and stop the harness when its text degenerates into repetition, grows past `maxAssistantChars`, or nothing happens for `noProgressSeconds` (see `docs/HARNESSES.md`). A run whose deployment uses the `KubernetesJob` executor follows the same steps inside a pod of its own: the worker creates a Job and a spec Secret, the pod's `garrison-worker run-one` does the work above, and the worker relays its nonce-prefixed stdout lines as events while it keeps the lease (`docs/KUBERNETES.md`, "Pod-per-run executor").
8. **Finished.** When the process exits, the worker classifies the outcome, reads the result, scrubs secrets, reports `complete`, and cleans up. The control plane stores the result, usage, cost, served model, exit code, and stderr tail, revokes the run token, and wakes anyone waiting.
9. **Delivered.** A waiting invoke returns the run. Streaming clients receive the final event over SSE, WebSocket, or A2A streaming.

Meanwhile the leader's maintenance loop (every 2 seconds) requeues or fails runs whose lease expired (a Leased run never started and is requeued while it has attempts left; a Running run is requeued only when its deployment sets `retryOnNodeLoss`, and otherwise fails with `NodeLost`; every requeue revokes the expired attempt's run tokens), enforces deadlines as a backstop to the worker (including the cluster cap `Runtime.MaxRunSeconds` for runs compiled with a later deadline), marks silent nodes `Lost` and silent control-plane replicas `Offline`, and prunes old records. Every 5 seconds it also looks for blocked queued runs: the first time a run is blocked for a given reason it appends one `Warning` run event saying why (the event carries a marker in its raw JSON so a new leader does not repeat it), and when the cluster setting `Runtime.FailBlockedAfterSeconds` is above 0 it fails runs that stay blocked that long with outcome `NoCapableWorker`. Because the control plane can write events before a worker sees the run, each lease tells the worker which sequence to number its events after (`eventSequenceStart`).

### Conversations

A conversation is a series of runs with one agent that share a harness session (plan P12.1). A turn names its conversation (`conversationId` on invoke, `contextId` over A2A). The control plane serializes turns with a compare-and-set on the conversation's active run, so a turn sent while the previous one is unfinished gets 409 `ConversationBusy`. A follow-up turn carries the session to resume and an affinity node, the worker that ran the last successful turn and holds the conversation's directories; other workers leave it queued until `Runtime.ConversationAffinityWaitMs` has passed or that worker stops being Ready. A turn claimed elsewhere, or one whose worker no longer has the directories (reported as `ConversationStateLost` and requeued), becomes a fallback: a fresh session whose prompt repeats the earlier turns from a prompt template. The `ConversationFallback` event, the run's `conversationFallbackReason`, and the conversation's fallback count record it. See Conversations in `REST_API.md`.
### Permission approvals

A deployment with `approvalsEnabled` puts its harness's permission requests through Garrison (P12.3). Claude Code calls the MCP tool `garrison_permission_prompt` through `--permission-prompt-tool`; for Codex app-server runs the worker calls it on the harness's behalf. The tool runs on whichever replica the MCP request reached: it evaluates the deployment's approval rules, records an `Approval`, and for Ask holds the call open until the approval is decided. A decision on any replica is a compare-and-set on the row plus an `ApprovalChanged` backplane message that wakes the held call. The run stays `Running` (with `awaitingApproval`) and keeps its slot; a future `Suspended` status (P12.39) would instead release the slot and resume the session when the decision arrives. The worker learns about approvals of its runs from the same watch long poll that delivers cancellations and records them as run events, because the worker is the only writer of a leased run's events.

### Cancellation

A cancel request (REST, MCP `garrison_cancel_run`, A2A `CancelTask`, or a caller going away) cancels the run's pending permission approvals, moves a queued run straight to `Cancelled` and a leased or running run to `Cancelling`, then wakes the worker that holds it. Each worker keeps one long poll open, `POST /v1.0/api/node/watch`, naming the runs it is executing; the control plane answers it as soon as one of them is cancelled, on any replica, because the cancel publishes a node signal over the event backplane. The worker then sends the harness and its child processes SIGTERM and, after the profile's `killGraceSeconds`, SIGKILL. The heartbeat (every 5 seconds by default) still carries cancellations, as a fallback for workers or control planes without the watch. In the test suite a cancel request turns into a `Cancelled` run in under 100 ms for a harness that exits on SIGTERM, and in about 1.1 seconds for one that ignores SIGTERM with a 1-second grace.

Cancelling a run cancels the runs it delegated that have not finished, and their delegated runs, down the whole tree. Callers that stop waiting cancel their runs as well, so an abandoned request does not keep a model busy until its deadline:

- REST `invoke`, deployment `test`, and `POST .../runs` with `wait=true`: the client disconnecting (Watson reports the closed connection) cancels the run, unless the request set `cancelOnDisconnect` to false. A wait that simply times out returns 202 and leaves the run alone.
- MCP `garrison_invoke_agent`: Voltaic cancels the tool call when the client sends `notifications/cancelled` for it or deletes or closes the session, and the call cancels its run. A `notifications/cancelled` that reaches a different replica than the one running the call is relayed over the backplane.
- A2A blocking `SendMessage` and `SendStreamingMessage`: the client disconnecting before the task finishes cancels it. Re-subscribing to a task (`SubscribeToTask`) and closing that stream does not.

A control-plane replica that is shutting down never cancels runs on its callers' behalf; they keep running and can be read from another replica.

### Run states

```text
Pending -> Queued -> Leased -> Running -> Succeeded | Failed | TimedOut | Cancelled
              ^         |          |
              +---------+----------+   lease expired with attempts left (requeue; a Running run only with retryOnNodeLoss)
           Queued/Leased/Running -> Cancelling -> Cancelled
           Queued -> Failed (outcome NoCapableWorker, only when Runtime.FailBlockedAfterSeconds > 0)
           Leased -> Rejected (outcome Rejected: admission refused when the run is claimed)
```

`Rejected` means the run was accepted but never started. When a worker claims a run, the control plane checks admission again before it compiles the run: if the run's tenant, agent, or deployment was deactivated or deleted while the run waited in the queue, the run ends `Rejected` with outcome `Rejected` and an error message that names what changed, instead of starting or failing to compile. The worker never sees it. A request that is refused up front (an inactive agent, no active deployment) still answers 409 and creates no run.

A run's `outcome` explains a `Failed` status: `HarnessFailed`, `NotInstalled`, `NotCredentialed`, `McpPreflightFailed`, `NodeLost`, `OutputLimitExceeded`, `RepetitionDetected`, `NoProgress`, `PodFailed`, `CompileFailed`, and so on (see `docs/HARNESSES.md`).

## Design decisions

**Workers pull.** The control plane never opens a connection to a worker. Workers need only outbound access to the REST port, which makes them easy to run in other clusters, behind NAT, or on developer machines, and lets the two halves scale on their own.

**Compile on the control plane.** Workers receive a resolved spec and never read the database, render a template, or decrypt a stored secret. One component owns configuration semantics, worker upgrades rarely matter, and a compromised worker learns only what its own runs needed.

**Harnesses are data.** Command lines, environment, config files, and output parsing are described in harness profiles built from templates, so supporting a new CLI flag or a new CLI is a configuration change. Only output parsers are code.

**Every prompt is a template.** System prompts, task wrappers, delegation instructions, tool descriptions, and harness config files are versioned prompt templates, bound per deployment and recorded per run.

**Fencing over trust.** Leases expire and epochs increase on every claim, so correctness never depends on a worker noticing it lost a run. A stale worker's reports are refused.

**The database is the bus.** Events, status, settings, sessions, leases, signed-request nonces, rate limit counters, and MCP sessions go through the database rather than an in-memory bus, so any replica can serve any client. An event backplane (PostgreSQL LISTEN/NOTIFY by default, or a polled table) carries small hints between replicas: a run changed, work was queued, settings or permissions changed, an MCP session closed. Hints only make waiters look at the database sooner; every waiter still re-reads the database on its own interval, so a lost hint costs latency, never correctness. `docs/SCALING.md` lists every piece of in-memory state and why it is safe.

**One migrator.** Replicas take a database startup lock (a PostgreSQL advisory lock) before migrating and seeding, so replicas starting together never race; the others wait, answering liveness but not readiness, until the schema is current.

**Multi-tenant from the start.** Every tenant-owned row carries a tenant identifier, every query filters on the authenticated tenant, and cross-tenant reads answer 404.

**Passwords are slow to guess.** User passwords are stored as PBKDF2-HMAC-SHA256 with a random 16-byte salt and 600,000 iterations (`Auth.PasswordHashIterations`), encoded as `pbkdf2-sha256$<iterations>$<salt>$<hash>` so the algorithm and work factor can change later without a migration. Hashes from earlier builds (unsalted SHA-256) still sign in, and the first successful sign-in replaces them; a hash with fewer iterations than configured is upgraded the same way. Comparisons are constant time, and an unknown or inactive account costs the same verification time as a real one, so response times do not reveal which accounts exist. Credential secret keys are not hashed: they are encrypted, because signed requests need the secret itself.

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
ControlNode (one per control-plane replica, keyed by its node ID)
RequestHistoryEntry, ClusterSetting, CoordinationLease, AuthSession
```

Identifiers are K-sortable strings with a type prefix (`agt_`, `run_`, `nod_`, and so on), so they sort by creation time and say what they refer to. Control nodes are the exception: a replica's row is keyed by its node ID (the pod name in Kubernetes), so a restarted process with the same name reuses its row.

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


## Executor capability negotiation

Workers register an `executorCapabilities` record per executor. The server preserves legacy `executors` names for older clients; bare names make no advanced capability promise. Current Process workers report Process isolation, Immediate startup, and session continuation for harness profiles that support resume. Kubernetes workers report Container isolation and Cold startup, plus `warmStart=true` when their enabled warm pool has the necessary RBAC. This supports both cold Jobs and single-use warm Pods. Neither executor currently claims egress enforcement, filesystem snapshots, or cross-node restore.

Deployments specify `requiredCapabilities`. Defaults retain existing placement. Set `executor: "KubernetesJob"` when requiring Container isolation. Isolation matches at least the required level; boolean flags must be supported and an optional startup class matches exactly. Session continuation also requires a harness profile with `supportsResume`. Requirements are copied into the run at admission, so changing a deployment does not change queued work.

A deployment's `trustLevel` (P11.14) feeds the same path. `ExecutorCapabilityRules.Effective` is the only place it becomes a placement requirement: `Untrusted` raises the isolation to at least Container on top of `requiredCapabilities`, and `ExecutorCapabilityRules.Admit` stores the result, the resolved executor (an unset executor on an `Untrusted` deployment resolves to KubernetesJob), and the trust level on the run. Candidate selection, the atomic claim, the delegated child reserve, and blocked-run detection then match the stored run columns, so trust composes with every other requirement and no claim path can skip it. `Untrusted` runs that no Ready worker can isolate report `NoIsolatingWorker`.

Capability predicates run in SQL before candidate limits, preventing unsupported work from hiding eligible runs. The lease update checks the current persisted report again. Unsupported requirements leave the run queued with `NoCapableWorker` and an explanation naming the requirements. Registration validates capability enum values and rejects duplicate reports. Reports describe a trusted worker's supported behavior; they are not independent security attestations.

Migration 17 stores requirements and reports in typed columns, including whether an executor has reported capabilities. It upgrades existing deployments and runs without imposing new requirements and preserves old worker names without inventing promises. The deployment editor exposes all requirements under execution; the worker table offers an optional capability column. Optional quotas and cost accounting retain their existing behavior.
