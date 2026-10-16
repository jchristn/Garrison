# Placement and scheduling follow-up

## Implemented behavior

`GET /v1.0/api/tenants/{tenantId}/runs/{id}/placement` is a Run Read operation with tenant-scoped 404 behavior. It reads admitted placement requirements and shares the scheduler's pool, dedication, selector, executor-capability, harness, start-admission and affinity predicates. Per-node reasons distinguish inactive/not-ready nodes, missing harness/capabilities, pool/selector mismatch, affinity waiting and observed capacity. Global reasons explain start-admission rejection, deployment concurrency and enforced concurrent/token/cost quotas. Other tenants' dedicated nodes are omitted. It does not lease, compile, issue credentials or mutate the run. Remote runs require no hosted deployment; registration TTL and active state use the same admission predicate as dispatch. External health checks and compiler/provider network calls are not performed by this diagnostic.

Node capacity is an advisory database observation. Delegated children can use reserve eligibility when an active parent wait permits it. Concurrent changes, worker-local state, queue order and other claimers can change the next assignment. See [scaling](../SCALING.md#explain-a-runs-placement) for the full wire contract and limitations.

## Diagnosed synchronous wait stall

The prior SQLite failure was reproduced with 1020 waiting invocations, two workers and sixteen total slots. The actual Watson default is 1024 concurrent requests. Waiting invocations plus four worker long polls consumed that budget. Scheduler stages completed initial claim/compile work, then started/event/heartbeat reports stopped making progress; maintenance marked both workers Lost. This was a transport-capacity problem, not proof of SQLite admission lock contention.

`Scheduling.MaxSynchronousWaiters` now shares a non-blocking run/pipeline wait budget per replica: default 256, range 1 to 768. External work above that wait budget remains accepted and returns its existing run immediately, HTTP 202 for agent invocation and the existing HTTP 201 for pipeline creation. Clients poll that ID rather than submitting another invocation. Slots release in a finally block. `garrison_synchronous_wait_admission_total{result="admitted|fallback|delegation_denied"}` and `garrison_synchronous_waiters` expose budget pressure.

The baseline and fixed experiment each completed all 1020 runs. Quiet-tenant queue p95 changed from 26751/26684 ms to 2591/2597 ms. The fixed experiment held 256 waits and returned 764 accepted responses for polling; no worker was marked Lost. The benchmark driver explicitly counts these fallbacks and excludes early 202 response latency from terminal synchronous client latency. This is not a test holding all 1020 requests until terminal.

The fixture runs on the shared macOS development host, with one fresh SQLite control plane and two workers, eight slots each. It demonstrates elimination of the specific listener starvation mechanism. It is not a release throughput benchmark. SSE/watch clients are not governed by this invocation budget and still require ingress connection budgeting. Credential-free baseline/fixed reports and the profile summary are in [benchmarks/evidence/d061](../../benchmarks/evidence/d061/sqlite-waiter-profile.json).

## Validation

- Placement and bounded-wait tests pass 8/8 across SQLite and PostgreSQL, covering no epoch/lease mutation, tenant inventory privacy, selector/isolation capability reasons, capacity, affinity, quota gates, remote TTL/active state, disabled quotas, actual held waits, accepted fallback identity, worker protocol progress, and wait-slot release.
- All four SDK harnesses pass with new placement and exact per-run database attribution assertions: C# 45, Python 44, JavaScript 45, Go 45. All four interactive consoles pass. Log: `/tmp/garrison-d061-placement-sdk.log`.
- Full Postman collection: 370 items, 367 requests, 570 assertions, zero failures; three existing optional provider requests skipped. Includes the new placement and per-run database-usage routes. Raw reporter output is private because it contains generated fixture credentials: `/tmp/garrison-d061-placement-newman-results.json`.
- Source builds use isolated artifacts under `/tmp/garrison-placement-artifacts`. No original Compose services, volumes, or account data were changed by these fixtures.


## General request-history bracket

A seeded initial A/B choice (seed 42) selected off/on/on/off ABBA arms for `RequestHistory.Enabled`, each with five seconds of warmup and thirty seconds of measurement at concurrency 16. The fixture used PostgreSQL, three control-plane replicas and six fake CLI workers with sixteen slots each. All 4093 runs succeeded and all 4093 completed-scope database observations were available. Throughput was 33.61 to 34.25 runs/second; p95 latency was 678.69 to 696.70 ms. The history-on arms do not demonstrate a reliable throughput penalty or speedup within this short shared-host bracket. The header-insert counter changes from zero to approximately one batched INSERT per captured invocation. The original history-enabled setting was restored.

This bracket varied all HTTP request history. It did not isolate successful worker node-protocol capture, and is not presented as that I-05 acceptance experiment. Root isolated backend tests overlapped its first arm. Whole-server SQL deltas remain estimates; exact completed lifecycle scope counters exclude HTTP request-history capture. See [the general-history reports and summary](../../benchmarks/evidence/d061/request-history-summary.json). The reproducible tool is `benchmarks/request-history-ablation.sh`.

## PostgreSQL manifest ingestion

The generated 2000-agent corpus contains 4040 manifest documents. All 4040 were created, with zero failed documents and zero request errors, across 81 batches of 50. First apply processed 331.34 documents/second; batch apply latency p50 was 140.05 ms and p95 was 226.74 ms. Reapply reported 100% Unchanged, with batch latency p50 of 118.68 ms and p95 of 276.91 ms. Dry run took 2173.89 ms; all 2000 agents were reachable and all nine validation probes passed.

This is a shared-host provider/scale validation of the cached implementation. No legacy uncached binary was run, so it establishes no paired cache speedup; it also does not support comparing PostgreSQL directly with earlier SQLite observations. The dataset was generated with `generate --kind synthetic --agents 2000`; the exact dataset hash and observations are in [the ingest summary](../../benchmarks/evidence/d061/pg-ingest-summary.json).

## Successful node-protocol history capture (I-05)

A separate fresh PostgreSQL fixture isolated the intended setting. `RequestHistory.Enabled` stayed `true` throughout; only `RequestHistory.CaptureNodeProtocol` changed from `false` to `true`. Both flags were read before each arm and their original values were restored and verified afterward. Each arm used two seconds for setting convergence, five seconds of warmup, thirty seconds at concurrency 16, seed 42, three control-plane replicas and six workers with sixteen slots each. Other Garrison tests/load were stopped; unrelated development-host applications remained running.

| Successful node-protocol capture | Runs succeeded | Throughput | Client p95 | Batched header INSERTs per success, first-replica estimate | SQL statements per success, first-replica estimate |
|---|---:|---:|---:|---:|---:|
| Off | 1056 | 34.94/s | 658.13 ms | 1.00 | 170.79 |
| On | 1024 | 33.87/s | 686.43 ms | 4.83 | 179.67 |

All 2080 runs succeeded, with zero missing completed-scope database observations. The header/history counters demonstrate associated database work removed when successful node-protocol capture is off. A single short pair does not establish a statistically reliable production throughput or latency improvement. These whole-server first-replica estimates include background work and differ from exact completed run lifecycle scopes, which exclude HTTP request-history capture. The general-history ABBA above is retained separately and is not mislabeled as this node-protocol experiment.

See [the node-protocol summary](../../benchmarks/evidence/d061/node-history-summary.json), [explicit setting proof](../../benchmarks/evidence/d061/node-history-settings-proof.json), [capture off](../../benchmarks/evidence/d061/20261016-150309-load-synthetic-fleet-d062-node-history-off.json), and [capture on](../../benchmarks/evidence/d061/20261016-150350-load-synthetic-fleet-d062-node-history-on.json). The private scale stack was stopped and its disposable PostgreSQL volume removed after evidence capture; the original deployment was untouched.


## Resident delegation reservation guard

A resident synchronous child invocation must not use the external accepted-run fallback: returning a queued child and closing its wait handshake would remove child-reserve eligibility while the parent still occupies a regular execution slot. Run-principal resident child calls now reserve one shared wait slot before creating either handshake or child. Exhaustion fails fast with `DelegationCapacityExhausted` (REST 429 with Retry-After), creates neither resource, and records `garrison_synchronous_wait_admission_total{result="delegation_denied"}` plus the existing delegation-denial counter. It is not counted as an accepted `fallback`.

Admitted child calls use an internal already-reserved wait path. An outer finally releases the reservation across handshake errors, creation errors, idempotency retarget errors, wait cancellation, completion and timeout. The handshake remains live while waiting, so the child can use its worker reserve. Existing external accepted responses and durable checkpoint behavior remain unchanged. Streaming callers retain the existing explicit handshake ownership contract.

The additional `delegation-wait-budget` suite passes four cases across SQLite and PostgreSQL. It covers a real external invocation saturating the budget followed by zero child runs/handshakes on typed denial; distinct denial telemetry; failure after reservation during child creation; an idempotent retry retargeting the canonical child without duplication; cancellation releasing both resources; and actual fake CLI parent/child completion with one regular and one reserve slot. Together with placement/headroom tests, the final targeted run passes 12/12 with a zero-warning build. Explicit database-fault injection during idempotency retarget was not added; its cleanup shares the tested outer finally.
