# Garrison Improvements: Amplify Strengths, Close Gaps

This document comes from an architecture debate that compared Garrison (commit `330be63`, v0.1.0-alpha) with Kubernetes and Google AX. The comparison looked only at how well each runs agentic workloads at scale. It ignored popularity, usage numbers and community support.

**The agreed framing:** Kubernetes and AX are execution substrates. Garrison is an agent control plane. Garrison's lead lies in:

- harnesses defined as data
- compilation on the control plane, with workers kept simple
- delegation tokens scoped to the delegation tree
- REST, MCP and A2A sharing one RBAC and tenant model
- correct claiming and fencing of runs
- weighted rollouts

Its gaps are:

- weak default isolation
- no durable suspend and resume
- no admission control per tenant or per delegation tree
- automatic retry that ignores side effects
- an unmeasured ceiling on the Postgres control plane

## Scoring

Each item is scored from 1 to 10 on three axes. **Total** is the sum of the three, out of 30.

| Axis | Meaning |
|---|---|
| **Simplicity** | How easy it is to integrate. 10 means small, local and low risk. 1 means it touches many subsystems or needs a new protocol. |
| **User value** | How much it improves outcomes for operators and agent authors running real workloads: safety, cost, reliability, throughput. |
| **Competitive value** | How much it widens Garrison's lead over Kubernetes and AX for agentic workloads, or closes a gap where they are ahead. |

When totals tie, the item with higher user value comes first.

---

## 1. Amplify Garrison's strengths

| Rank | Item | Simplicity | User value | Competitive value | Total |
|---|---|---|---|---|---|
| 1 | [A1. Budgets per delegation tree](#a1-budgets-per-delegation-tree) | 6 | 9 | 9 | **24** |
| 2 | [A2. Tool and credential gateway with lease-epoch fencing](#a2-tool-and-credential-gateway-with-lease-epoch-fencing) | 4 | 8 | 9 | **21** |
| 3 | [A3. Declarative harness output mapping](#a3-declarative-harness-output-mapping) | 6 | 7 | 8 | **21** |
| 4 | [A4. Executor capability contract](#a4-executor-capability-contract) | 6 | 7 | 8 | **21** |
| 5 | [A5. Reproducible re-run and compiled-spec diff](#a5-reproducible-re-run-and-compiled-spec-diff) | 7 | 7 | 7 | **21** |
| 6 | [A6. Canary promotion and rollback driven by run analytics](#a6-canary-promotion-and-rollback-driven-by-run-analytics) | 6 | 7 | 7 | **20** |
| 7 | [A7. Chaos suite that checks safety as well as liveness](#a7-chaos-suite-that-checks-safety-as-well-as-liveness) | 7 | 6 | 6 | **19** |

### A1. Budgets per delegation tree

**What it is.** Each delegation tree carries limits on tokens, cost in USD, wall-clock time, total run count and fan-out. A child run inherits what remains of its parent's budget and spends from it. When a tree runs out, it fails with a typed `BudgetExhausted` outcome.

**Why it matters.** Runaway fan-out is the defining failure mode of multi-agent systems. Garrison already decides which delegations are allowed, through depth limits, cycle detection, allowlists and the human initiator's permissions acting as a ceiling. It does not yet limit how much a tree can consume. Neither Kubernetes nor AX understands delegation at all, so this extends a capability only Garrison has. It also partly covers P12.6.

**Plan.**
1. Add budget fields to `Deployment` and to the run-token claims. Store the remaining budget on the root run.
2. When a child is admitted, reserve an estimated amount from the root by a compare-and-set debit, so concurrent children cannot overspend. Settle against actual usage when the child finishes, using reported cost, or P12.7 price estimation where the harness does not report cost.
3. Pass the remaining budget down to `--max-budget-usd` where the harness supports it.
4. Show used and remaining budget for the tree in the run detail view and in analytics.

**Validation.**
- Unit tests for concurrent debits: N children admitted at once never overspend.
- An integration test where a recursive fan-out agent is cut off at the configured cost and run count, with a clean `BudgetExhausted` status throughout the tree.
- Settlement drift (estimated versus actual), checked against a recorded corpus of runs.

### A2. Tool and credential gateway with lease-epoch fencing

**What it is.** A gateway on the control plane for MCP tools that Garrison serves and for credentials it brokers. Every call carries the run token. The gateway rejects the call if the token's lease epoch is not the run's current epoch.

**Why it matters.** Fencing today stops a stale worker from reporting completion. It does not stop that worker's effects. Checking the epoch at the gateway moves the fencing token to the point where the effect happens. That extends Garrison's run-identity model, which is one of its strongest assets, into an area where Kubernetes and AX offer nothing. This is also the enforcement point for the effect protocol in G4.

**Plan.**
1. Add the current `leaseEpoch` to run-token claims, and cache the current epoch on each server replica, invalidated through `LISTEN/NOTIFY`.
2. Route Garrison-served MCP tools and brokered credentials (git tokens, API keys) through the gateway, and check the epoch on every call.
3. Make brokered credentials short-lived and bound to the epoch, so a stale worker's copy stops working.
4. Document the limits: an epoch check cannot recall a request that was dispatched before the lease expired, so such requests are tracked as `dispatched` and resolved through the G4 protocol.

**Validation.**
- Partition a worker in the chaos harness, let its lease expire, and confirm that its later gateway calls are rejected while the replacement attempt's calls succeed.
- Benchmark gateway latency, with p99 overhead per call held to a budget (for example under 5 ms within the same region).

### A3. Declarative harness output mapping

**What it is.** A declarative mapping from a harness's JSONL output to Garrison event types (assistant text, tool call, tool result, usage, session ID, final result). It would be defined in the harness profile and go beyond today's `generic-jsonl` parser. A WASM parser could be added later as an escape hatch.

**Why it matters.** Describing harnesses as data is Garrison's moat. Neither Kubernetes nor AX can describe "how to drive Claude Code versus Codex headless." Output parsing is the last piece that still needs a code change and a release. Once it is declarative, a new harness or a harness format change becomes a configuration change.

**Plan.**
1. Define a mapping schema: match rules on JSON paths, field extraction, and event-type assignment.
2. Re-implement one built-in parser (for example Mux) as a declarative mapping to prove the schema is expressive enough.
3. Add a "test this profile" endpoint that runs sample output through the mapping and shows the resulting events.
4. Make mapping versions part of the compiled spec that is recorded on each run.

**Validation.**
- The golden tests (`Golden/*.json`) produce identical event streams whether a built-in parser or its declarative equivalent is used.
- Onboard a new harness end to end without changing any C# code.

### A4. Executor capability contract

**What it is.** A formal contract in which each executor declares what it can do:

- filesystem snapshot
- harness session continuation
- process checkpoint
- cross-node restore
- isolation level (process, container, gVisor or Kata)
- network egress control
- cold-start class

Scheduling and lifecycle features ask for capabilities rather than for executor types.

**Why it matters.** The `ExecutionSpec` and the fenced pod-line protocol are already a clean seam between the control plane and the substrate. Making that seam explicit lets Garrison sit on top of any substrate (Process, KubernetesJob, AX, a future microVM executor) without depending on any one of them. The debate found that AX's documented "suspend" sends SIGTERM to the process and keeps the workspace, which is not a live checkpoint. A contract like this keeps that kind of difference visible instead of hidden.

**Plan.**
1. Define an `ExecutorCapabilities` record, and have each executor report it when it registers.
2. Let deployments declare required capabilities (for example `isolation >= container`, `resume = session`), and have admission place runs only on matching pools.
3. Implement the contract for Process and KubernetesJob. Prototype an AX adapter against it, as an experiment rather than a dependency.

**Validation.**
- Admission refuses to place a deployment that requires container isolation onto a Process-only pool.
- A conformance test suite for each executor checks every declared capability (for example, the snapshot round-trip preserves `work/` and `home/` byte for byte).

### A5. Reproducible re-run and compiled-spec diff

**What it is.** Two features built on the template versions that each run already records:

- Re-run a past run with exactly the same compiled spec.
- Show a diff between two runs' compiled specs (prompt, harness args, environment keys, MCP configuration).

**Why it matters.** Compiling on the control plane already produces a precise, versioned record of what each run executed. Exposing it turns "why did this agent behave differently today?" from guesswork into a diff. Kubernetes and AX have no equivalent for agent configuration.

**Plan.**
1. Persist the compiled spec, or a content hash plus the versions needed to rebuild it, for each run, with secrets left as references.
2. Add a `POST /runs/{id}/rerun` endpoint with a "pin versions" option.
3. Add a compiled-spec diff to the dashboard, next to the per-run analytics.

**Validation.**
- Re-running a run whose templates have since changed produces a spec that is byte-identical to the original.
- A diff between runs from two prompt versions shows exactly the changed template sections.

### A6. Canary promotion and rollback driven by run analytics

**What it is.** Automated progressive rollout. Garrison already supports weighted traffic splits between deployments and records per-run time to first token, cost, tool calls and success. This item adds policies that shift weight toward a candidate, or roll back, based on those metrics.

**Why it matters.** Changing a model, harness or prompt is the riskiest routine operation in agent operations. Garrison is the only one of the three systems that has both the traffic split and agent-level metrics, so it can close that loop on its own.

**Plan.**
1. Define a rollout policy: steps (for example 5%, 25%, 50%, 100%), a minimum number of runs per step, and guard metrics (success rate, cost per run, p95 duration, structured-output repair rate).
2. Have the leader evaluate guards after each step and promote, hold or roll back.
3. Write an audit entry for every weight change.

**Validation.**
- A simulated candidate that triples cost is rolled back automatically at the first step.
- A healthy candidate reaches 100% within the expected number of runs.

### A7. Chaos suite that checks safety as well as liveness

**What it is.** Extend the existing chaos test (7 forced pod kills, 300 runs, 0 stuck) so it also checks that effects are not duplicated. Publish its results, along with the scale test results from G9, as release artifacts.

**Why it matters.** The current result proves liveness, not safety. Part of it depends on `RetryOnNodeLoss` restarting runs that were mid-execution. Rigor around failure is a strength to amplify, and published evidence that covers safety is something AX's documentation does not offer.

**Plan.**
1. Add an "effect sink" test service that records every mutation together with its operation ID and attempt.
2. Run the chaos scenarios under each effect policy (see G1) and assert the policy's guarantee: no duplicates under `at-most-once`, and every duplicate tagged under `at-least-once`.
3. Run the suite in CI on a schedule and attach a summary to each release.

**Validation.** The suite fails on today's `RetryOnNodeLoss=true` behaviour and passes once G1 and G4 ship. This proves the test can detect the problem.

---

## 2. Close gaps, limitations and shortcomings

| Rank | Item | Simplicity | User value | Competitive value | Total |
|---|---|---|---|---|---|
| 1 | [G1. Effect policy to replace `RetryOnNodeLoss`](#g1-effect-policy-to-replace-retryonnodeloss) | 7 | 8 | 7 | **22** |
| 2 | [G2. Isolated execution by default for untrusted input](#g2-isolated-execution-by-default-for-untrusted-input) | 5 | 9 | 8 | **22** |
| 3 | [G3. Durable continuation (`Suspended` state)](#g3-durable-continuation-suspended-state) | 2 | 10 | 9 | **21** |
| 4 | [G4. Effect intent protocol for mediated tools](#g4-effect-intent-protocol-for-mediated-tools) | 3 | 8 | 9 | **20** |
| 5 | [G5. Bulk event ingestion](#g5-bulk-event-ingestion) | 9 | 6 | 4 | **19** |
| 6 | [G6. Fixing the delegation deadlock with bounded slot lending](#g6-fixing-the-delegation-deadlock-with-bounded-slot-lending) | 5 | 8 | 6 | **19** |
| 7 | [G7. Tenant fair share and admission quotas](#g7-tenant-fair-share-and-admission-quotas) | 4 | 8 | 7 | **19** |
| 8 | [G8. Load testing the control plane to failure](#g8-load-testing-the-control-plane-to-failure) | 6 | 7 | 6 | **19** |
| 9 | [G9. Warm pools of run pods](#g9-warm-pools-of-run-pods) | 4 | 7 | 7 | **18** |
| 10 | [G10. Workspace and artifact caching](#g10-workspace-and-artifact-caching) | 5 | 7 | 6 | **18** |
| 11 | [G11. Coalescing text deltas before they are stored](#g11-coalescing-text-deltas-before-they-are-stored) | 7 | 6 | 4 | **17** |
| 12 | [G12. Capacity based on resources instead of slots](#g12-capacity-based-on-resources-instead-of-slots) | 4 | 7 | 6 | **17** |

### G1. Effect policy to replace `RetryOnNodeLoss`

**What it is.** Replace the boolean `Deployment.RetryOnNodeLoss` with a per-deployment effect policy:

- `at-most-once` (the default): an unclean loss of a `Running` run moves it to a new `NeedsReconciliation` state.
- `at-least-once`: the deployment explicitly accepts duplicate effects, so the run is requeued.
- `journaled`: the run is requeued automatically only when every effect went through the mediated path (G4) and no intent has an unknown outcome.

**Why it matters.** `MaintenanceService.cs:669` already requeues `Running` runs whose lease expired when `RetryOnNodeLoss` is set. That restarts a harness that was mid-execution on another node, with no record of which external effects already happened. A duplicate `git push`, message or payment is a correctness bug, not a performance issue. This is the cheapest high-value safety fix available.

**Plan.**
1. Add an `EffectPolicy` enum to `Deployment` and to the manifest `DeploymentSpec`. Migrate `true` to `at-least-once` and `false` to `at-most-once`.
2. Add the `NeedsReconciliation` run status, with dashboard and API actions to *requeue*, *mark failed* or *mark succeeded*.
3. Check the `Leased` → requeue path: confirm that the worker cannot start the harness process before it reports `Running`. If it can, apply the same gate to `Leased`.
4. Have `journaled` initially behave like `at-most-once` until G4 ships.

**Validation.**
- Kill a worker in the chaos test while a run is `Running` under each policy, and check the resulting state.
- The A7 effect sink shows zero duplicates under `at-most-once`.
- A migration test confirms that existing deployments keep their behaviour.

### G2. Isolated execution by default for untrusted input

**What it is.** Make the KubernetesJob executor (non-root, read-only root filesystem, dropped capabilities, NetworkPolicy, optional gVisor or Kata) the default whenever a deployment accepts untrusted input. Narrow default egress from "443 to anywhere" to an allowlist for each deployment.

**Why it matters.** The default Process executor has no filesystem, network or user namespace. Concurrent runs can read each other's directories and the worker's credentials, as `SECURITY.md` itself says. For multi-tenant agent workloads, isolation is a precondition. This is the area where Kubernetes and AX are ahead by default.

**Plan.**
1. Add a `trustLevel` to deployments (`trusted`, `untrusted`). Admission refuses to place `untrusted` runs on executors without container isolation (this uses the A4 capabilities).
2. Generate a NetworkPolicy for each deployment from an egress allowlist (model API hosts, the git host, the Garrison server), with a gateway-only option once A2 exists.
3. Give the Process executor best-effort hardening: a separate OS user per slot and `0700` run directories. Label it "trusted only."
4. Update `SECURITY.md` and the quickstart so the secure path is the obvious one.

**Validation.**
- A red-team test suite: a run tries to read another run's `work/`, read the worker's credentials, and reach a host that is not on the allowlist. Every attempt must fail under the default for untrusted runs.
- Admission tests check that untrusted runs are placed correctly.

### G3. Durable continuation (`Suspended` state)

**What it is.** A `Suspended` run state that releases both the slot and the lease. It snapshots `work/`, `home/` (which holds the harness session files) and `config/` to the artifact store, and resumes on any node through harness session resume (`--resume`, `codex exec resume`). The suspend points are:

- approvals (P12.3)
- A2A `input-required`
- waits on child runs

This covers P12.1, P12.2 and P12.8.

**Why it matters.** Agents spend most of their wall-clock time idle, waiting on humans, CI or other agents. Today every waiting agent holds a slot. At scale that limits throughput more than anything else, and it is the root cause of the delegation deadlock (G6). AX claims Suspend and Resume. Garrison can match its documented behaviour (stop the process, keep the workspace, resume the session) with primitives it already has.

**Plan.**
1. Build the P12.8 artifact store (Filesystem and S3) first.
2. Add the `Suspended` status and a resume trigger (an approval decision, an A2A message, or a child finishing).
3. Snapshot and restore through the A4 contract. Use `session` continuation where the executor and harness support it, and otherwise fail suspension cleanly.
4. **Ship together with G1 and G4.** Resuming is safe only when no effect has an ambiguous outcome. Resuming from the session is preferred over restarting from scratch, because the transcript records which actions already happened.
5. Treat vendor session file formats as an external dependency. Pin a format version per harness profile and test it in CI.

**Validation.**
- Suspend a Claude Code run and a Codex run in the middle of a task, kill the original node, resume on another node, and confirm that the session continues without repeating completed tool calls.
- A density test: 10,000 suspended runs hold zero slots.
- Measure snapshot size and resume latency for each harness.

### G4. Effect intent protocol for mediated tools

**What it is.** For tools that go through Garrison (A2):

- Persist an **intent before dispatch**, with a stable operation ID, an argument digest, the run identity and the attempt epoch.
- Track the operation's state as `authorized` → `dispatched` → `completed`. An intent with no definite outcome is **unknown**.
- The operation ID stays the same across recovery. The epoch identifies which attempt was authorized.

Arbitrary shell commands and direct network calls have unknown coverage, which blocks automatic recovery after an unclean failure unless the policy is `at-least-once`.

**Why it matters.** A journal built from worker telemetry cannot prove that an effect did *not* happen: the worker can die after the external commit but before it ships the event. Only a record written before dispatch makes recovery decisions sound. Exactly-once-or-reconcile semantics for agent tool calls would be a clear differentiator, since neither Kubernetes nor AX addresses it.

**Plan.**
1. Add an `operations` table (operation ID, run ID, epoch, tool, argument digest, state, result reference).
2. Have the gateway write the intent, dispatch, then record the outcome. Pass the operation ID as an idempotency key to destinations that support one.
3. Classify tools using MCP annotations (`idempotentHint`, `destructiveHint`) and harness profile metadata. Any tool that is not classified counts as effectful.
4. Implement the `journaled` policy (G1): recover automatically only when there are no `unknown` operations and no effects with unknown coverage since the last checkpoint.

**Validation.**
- Fault-injection tests that kill the worker before dispatch, after dispatch, and after completion but before reporting. The resulting state must be `authorized`, `unknown` and `completed` respectively, and only the first case may re-execute automatically.
- The A7 effect sink shows no duplicates under `journaled`.

### G5. Bulk event ingestion

**What it is.** Replace the one-`INSERT`-per-event loop in `AdoRunEventMethods.InsertBatchAsync` with a single multi-row `INSERT … VALUES (…),(…) ON CONFLICT DO NOTHING`, or with `COPY` into a staging table followed by a merge.

**Why it matters.** Event append volume is the most likely first bottleneck on the control plane. Workers already batch over HTTP, but the database still does one round trip per event. This fix is small and local, and it should come before any talk of a separate event log.

**Plan.**
1. Build a parameterized multi-row insert, chunked to stay within parameter limits. Keep sequence-based deduplication through `ON CONFLICT`.
2. Apply the equivalent change to every supported database driver, or keep the per-row path as a fallback for drivers without bulk support.
3. Add a metric for event insert latency per batch.

**Validation.**
- A microbenchmark measuring events per second for batches of 1, 10 and 100 rows, before and after.
- Existing ordering and deduplication tests pass unchanged.

### G6. Fixing the delegation deadlock with bounded slot lending

**What it is.** A parent that is waiting synchronously on a child enters an explicit wait state and lends its slot to the child, within bounds. The worker's physical limit is the `SemaphoreSlim(MaxConcurrentRuns)` in `WorkerHost.cs:220`. The bounds are:

- a bounded reserve for children
- a cap on parents that stay resident while waiting
- the parent reacquiring a slot before it continues
- the waiting parent's memory and pod still counting against capacity

Beyond those bounds, the parent must suspend (G3).

**Why it matters.** With N slots, N parents each waiting on a queued child can block every child forever, even with shallow, acyclic and fully permitted delegation. Exact per-deployment concurrency limits can cause the same thing. This is a correctness bug in the feature that sets Garrison apart.

**Plan.**
1. Add a wait handshake to the delegation path: the parent's state is recorded as `WaitingOnChild` before the child is admitted.
2. Give the worker a separate child-reserve semaphore and a cap on resident waiters. Have the server's `maxConcurrentRuns` check exclude ancestors that are waiting on a descendant in the same deployment.
3. When the reserve is exhausted, either fail fast with a typed error or (after G3) suspend the parent.

**Validation.**
- A deadlock reproduction test: 4 slots, 4 parents, each delegating to a child, must finish.
- A property test with random delegation trees under small slot counts must always finish or fail with a typed error, never hang.
- The number of resident processes never exceeds the configured cap.

### G7. Tenant fair share and admission quotas

**What it is.** Admission control with fair-share scheduling per tenant (for example deficit round-robin or weighted fair queuing over the queue) and quotas for each tenant, agent and deployment on runs, concurrency, tokens and cost (P12.6). Quotas are enforced both at admission and at every delegation hop.

**Why it matters.** Today the queue is ordered by priority and per-deployment concurrency, with nothing that prevents one tenant's delegation storm from starving the others. Kubernetes has `ResourceQuota` and priority with preemption. Garrison needs the equivalent for agents to be credible as a multi-tenant system.

**Plan.**
1. Add quota entities and an admission check, and reuse the A1 debit mechanism for tokens and cost.
2. Change the claim query so it selects across tenants by fair-share weight, not only by global priority.
3. Report quota rejections as typed errors through REST, MCP and A2A.

**Validation.** A load test with one noisy tenant submitting 100 times the work of the others. Quiet tenants' p95 time in the queue stays within a target, and the noisy tenant is throttled at its quota.

### G8. Load testing the control plane to failure

**What it is.** Run the planned scale test (3 servers, 10 workers, 1,000 runs), then 10 times larger, and publish where it breaks. Measure independently:

- event inserts
- queue wake-ups
- lease renewals
- contention on the per-deployment concurrency lock

Then tune targeted queue notifications and adaptive fallback polling intervals.

**Why it matters.** The measured figure (16 slots on a laptop) was limited by the workers, so the control plane's ceiling is unknown. Garrison already has push hints through `LISTEN/NOTIFY` with 10 ms coalescing. The work is to measure and tune, not to replace Postgres. A separate event log should be adopted only if the data shows it is needed, and only after ordering, fencing and recovery for runs that never finish have been defined.

**Plan.**
1. Build a load generator with a synthetic harness that emits a configurable event rate and run duration.
2. Add a metric to each subsystem and a dashboard for each (in line with P13.20–P13.28).
3. Tune: target notifications at node pools, back off fallback polling when idle, and shard the deployment concurrency counters.
4. Publish a `SCALING.md` table of maximum sustained runs, events per second and claim latency at each tier.

**Validation.** The published numbers can be reproduced from a script in the repository, and the test fails in CI if throughput drops by more than X% from the baseline.

### G9. Warm pools of run pods

**What it is.** A pool of pre-started, pre-imaged run pods for each node pool and harness image. A pod claims its run spec once it has started, instead of a new Job being created for each run.

**Why it matters.** Making pod-per-run the default (G2) adds several seconds of cold start and puts load on etcd for every run, which is exactly the problem AX was designed to avoid. Warm pools keep isolation affordable for short runs.

**Plan.**
1. Have a warm-pool controller in the KubernetesJob executor keep N idle pods ready, each long-polling for a spec over the existing fenced pod-line protocol.
2. Use each pod for one run only, then recycle it, so no state leaks between runs.
3. Scale pool size from queue depth and recent arrival rate.

**Validation.**
- p50 and p95 time from claim to first event, warm versus cold. The target is under 1 s when warm.
- Count etcd writes per run, before and after.
- Isolation tests (G2) pass for pods from the warm pool.

### G10. Workspace and artifact caching

**What it is.** Cache git repositories (bare mirrors, or reference clones on each node), dependency directories and WorkspaceTemplate outputs, keyed by content hash. This is built on the P12.8 artifact store.

**Why it matters.** Cloning a large repository for every run is waste that grows linearly with the number of runs. AX's Workspace pre-wires repositories, MCP servers and skills, with readiness gating, so this is an area where Garrison is behind.

**Plan.**
1. Keep a git mirror cache on each node, and clone with `--reference` or worktrees.
2. Store prepared workspaces as snapshots keyed by template version and commit, in the artifact store.
3. Track cache hit rate per deployment.

**Validation.** Measure workspace preparation time and bytes transferred per run on a large repository, cold versus warm. A correctness check confirms that cached workspaces are byte-identical to fresh ones.

### G11. Coalescing text deltas before they are stored

**What it is.** Merge assistant text deltas at token level into larger chunks (by time or size window) before they are stored. Raw deltas still go to live subscribers through the SSE and notification backplane.

**Why it matters.** Streaming at token level multiplied by the number of concurrent runs is the largest source of event write volume. Coalescing reduces write volume at the source, and live viewers see no difference.

**Plan.**
1. Separate the "persist" path from the "broadcast" path in `RunEventService`.
2. Coalesce consecutive `AssistantText` events on a window (for example 250 ms or 2 KB), with no coalescing across tool events.
3. Make the window configurable for each deployment.

**Validation.**
- Rows stored per run drop by an order of magnitude on a streaming workload.
- Live SSE output is unchanged.
- Reconstructed transcripts are identical to the uncoalesced version.

### G12. Capacity based on resources instead of slots

**What it is.** Workers advertise CPU and memory capacity. Deployments declare resource requests for each run. Placement in Process mode packs runs by resources rather than by the fixed `MaxConcurrentRuns`.

**Why it matters.** Counting slots forces operators to size every worker for the worst case. Kubernetes bin-packs by resource requests, and Garrison should match it in Process mode as well as in KubernetesJob mode.

**Plan.**
1. Add `cpu` and `memory` requests to deployments, and capacity to worker registration.
2. Have workers accept or decline claims based on resources still available, keeping `MaxConcurrentRuns` as a hard upper limit.
3. Optionally enforce limits with cgroups on Linux.

**Validation.** A mixed workload of small and large runs reaches higher utilization with the same out-of-memory rate (zero) as slot-based sizing, measured on the G8 load harness.

---

## Recommended sequence

The ranking above reflects the scores. The order of dependencies agreed in the debate is:

1. **Safety and admission:** G1, G2, G6, G7, A1, plus the quick wins G5 and G11.
2. **Continuation:** G3 shipped together with G4 and A2. A5 and A7 support this phase.
3. **Measurement:** G8, before any decision to adopt a separate event bus.
4. **Substrate and efficiency:** A4 (including an experimental AX adapter), G9, G10, G12. A3 and A6 can proceed in parallel at any point.
