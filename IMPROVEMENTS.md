# Garrison improvements found by the benchmark suite

Candidate changes the benchmark suite (`BENCHMARKING.md`, `benchmarks/`) turned up, ranked by value (the measured or estimated effect on a named metric) and simplicity (size and risk of the change). Each entry names the evidence, the metric that should move, and how to check it. When one is built, record the measured result here and in `benchmarks/RESULTS.md`, and run the next round with `compare` against round 0.

Defect fixes come first: tuning on top of a defect tunes the wrong thing. None of these were fixed during Phase 14; the suite was built by an agent asked not to change product code while two other agents were working in the tree.

## Ranked list

| Rank | ID | Change | Kind | Value | Simplicity | Metric that should move |
|---|---|---|---|---|---|---|
| 1 | I-01 | Size the shipped database pool below the shipped PostgreSQL `max_connections`, and make invocation waits stop holding up the pool | Defect D-4 | High: past capacity, one replica runs PostgreSQL out of connections and invokes fail with 500 | High for the defaults (pool 40 or `max_connections` 300, as `k8s/tests/overlay` already does); medium for the waits | open-loop failures at 60 to 90/s to 0 |
| 2 | I-02 | Keep the liveness probe answering under overload (serve it off the request path, or relax its timeout), and shed load with 503/429 before the database runs out | Defect D-5 | High: today overload restarts the only replica and ends every waiting call | Medium | open-loop 90/s: no restart, failures only as clean 503s |
| 3 | I-03 | Map database failures in authorization and the tenant check to a JSON 503 | Defect D-1 | High: clients and SDKs parse errors; HTML breaks them during any database blip | High: move two awaits inside the existing exception mapping, add one `catch` | resilience `database-restart` unclean errors 18 to 0 |
| 4 | I-04 | Record client-abandoned requests as cancelled, not 5xx | Defect D-2 | High: the HTTP error-rate panels and any alert on them fire once per run | High: check the cancelled token or response-sent state in the request telemetry hook | `node/watch` 5xx count per run 1 to 0 |
| 5 | I-05 | Stop writing request history header rows for node-protocol traffic (or sample it) | Cost | High: 58 to 91 `request_history_headers` inserts per run (round 0), the largest source of database writes under load, and part of what exhausts the pool in D-4 | Medium: a setting and a route filter in the request history capture | DB inserts per run; closed-loop throughput at 16 clients |
| 6 | I-06 | Resolve manifest references once per apply (memoize built-in profiles, templates, agents) | Cost | Medium: about 23 database operations per document, 16 of them reloading the same built-in harness profile; a re-apply that changes nothing is slower than the first apply | Medium: a per-apply cache in `ManifestService` and `Resolver` | ingest documents per second; re-apply latency |
| 7 | I-07 | Make manifest spec errors human | Defect D-3 (minor) | Low to medium | High: catch the serializer error per field and name the allowed values | apply probe message checks |
| 8 | I-08 | Say when a value was clamped (`maxAttempts: 99` is stored as 10 without a word) | Usability | Medium: a typo in a manifest silently changes behavior | High: a warning on the apply item and in the dry run's `changes` | apply probes can assert the warning |
| 9 | I-09 | Ablation sweep of the timing settings that bound overhead (`LeaseWaitMs`, worker `EventFlushIntervalMs`, `Scheduling.EventPollMs`) | Measurement | Medium | Medium: a `--settings` option that sets cluster settings per arm | serverOverheadMs, eventPersistMs, DB operations per run |
| 10 | I-10 | Trace-driven open-loop arrivals (Azure Functions 2019 invocation trace) via a `prepare` command | Measurement | Medium: bursty, heavy-tailed arrivals instead of fixed rates | Medium | open-loop p95 and p99 under bursts |
| 11 | I-11 | Placement dry run: which nodes could take this run, and why not the others | Product hook | Medium: routing probes could assert the reason per node | Medium: must share the claim query's filters | routing probe precision |
| 12 | I-12 | Count database operations per run | Product hook | Medium: cost per run without diffing server-wide counters | Medium | DB operations per run in every load report |
| 13 | I-13 | Raise slot efficiency: a slot is busy for exec plus about 40 ms of worker and server steps, and closed-loop throughput reached 80 to 85% of what 8 slots allow | Throughput | Medium | Unknown until profiled (lease long-poll turnaround after a completion is the first suspect) | closed-loop c8 and c16 throughput against slots / run time |

Status after round 1 (2026-10-12): I-01 (pool sizing and 503 `DatabaseBusy`; the invocation waits were not changed), I-02 (separate liveness listener), I-03 (JSON 503 `DatabaseUnavailable`), I-04 (fixed by P13.22), and I-07 (`ManifestInvalid`) are done. Open-loop 60 to 90 runs/s finished with 0 failures and no restarts, and `resilience database-restart` had 0 unclean errors (`benchmarks/RESULTS.md`, round 1).

## Evidence

### I-01 / D-4: the shipped pool can exhaust the shipped PostgreSQL

Round 0, open loop at 60/s on 2 workers (8 slots, ceiling about 59 runs/s): 204 of 1200 operations failed (203 `500 InternalError`) and completions stopped for about 50 seconds. A repro with logs (`load --mode open --rates 70,90`): at 90/s, 1073 of 2700 operations failed, PostgreSQL logged `FATAL: sorry, too many clients already`, and the server logged `POST .../agents/load-echo/invoke failed: Npgsql.PostgresException 53300`. `k8s/base/config/garrison.json` sets `Database.MaxPoolSize` to 100 (line 15) and `k8s/components/postgres/postgres.yaml` leaves `max_connections` at PostgreSQL's default of 100, so one replica's pool alone can use every connection; the `k8s/tests` overlay avoids this by setting `max_connections=300` and a pool of 40. Fix the defaults to satisfy the rule `docs/SCALING.md` states, then find out why a backlog of waiting invocations needs so many connections at once (each waiter re-reads its run every second). Check: the open-loop levels above capacity end with no 500s, only longer queues.

### I-02 / D-5: overload restarts the server

In the same repro the kubelet logged `Liveness probe failed: command timed out ... /v1.0/api/health/live timed out after 4s` twice and restarted the only server (`k8s/base/server-deployment.yaml` lines 180 to 186: period 5 s, timeout 4 s, failure threshold 2). Its waiting invocations ended with 202 as the drain promises, and the new replica leased the 1,496 queued runs within a minute; but an overloaded server should slow down, not restart. Answer liveness without touching the request backlog, and reject new work with 503 or 429 before the database runs out. Check: the 90/s level completes with no restart.

### I-03 / D-1: HTML 500 pages while the database restarts

During `resilience database-restart` (round 0), 18 `GET .../runs/{id}` calls answered `500` with `Content-Type: text/html` and Watson's default page (`<title>It's me, not you</title>`) instead of the documented JSON error. `src/Garrison.Server/Routes/RouteRegistrar.cs` maps handler exceptions to JSON in `InvokeAsync` (line 248), but two database calls run before it and outside its `try`: the tenant existence check for administrators (`TenantMissingAsync`, called from the wrapper at line 183, defined at line 222) and the authorization decision (`_Authorization.AuthorizeAsync`, line 119). When PostgreSQL is down they throw `NpgsqlException`, which escapes to Watson. A database outage should also be a 503 (retryable) rather than a 500 everywhere: `InvokeAsync` maps it to `500 InternalError` today. Check: `benchmarks/bench.sh resilience --scenarios database-restart` reports 0 unclean errors and only 503s.

### I-04 / D-2: every run counts as a server error

In every load level, `garrison_http_request_duration_seconds{route="/v1.0/api/node/watch",status_class="5xx"}` grew by exactly one per run (for example 645 in a development c4 level with 645 runs, and 183 at c1 with 183 runs). The worker abandons its cancellation watch long poll whenever the set of runs it holds changes (`src/Garrison.Worker/Protocol/NodeProtocolClient.cs` line 128); the server's handler sees `context.Token` cancelled, and the request is recorded with Watson's default status 500 (`src/Garrison.Server/Services/RequestTelemetry.cs`, `Record`, which reads `context.Response.StatusCode`, line 91). The server logs nothing, so this is a measurement defect, not a failure, but it makes the HTTP dashboards and any 5xx-rate alert useless under load. That file is part of the in-progress telemetry work (P13.22), so the fix belongs there: record abandoned requests as `499` or a `cancelled` class, or not at all.

### I-05: request history writes 58 to 91 header rows per run

Round 0 closed-loop load on k3d, per successful run: 90.6 `insert` operations on `request_history_headers` at 1 client, 89.3 at 4, 63.6 at 8, and 57.5 at 16 (`garrison_db_operation_duration_seconds{operation="insert",table="request_history_headers"}`), out of 332, 317, 287, and 277 database operations per run in total (`db_client_operation_duration_seconds`, which includes background work). A run makes a handful of client requests but many node-protocol requests (lease long polls, watch, started, events, complete, heartbeats), each captured with every header. Excluding `/v1.0/api/node/*` from request history by default, or sampling it, removes most of those writes and some of the pressure behind D-4. Check: rerun `load` and compare database operations per run and throughput at 16 clients.

### I-06: manifest apply reloads the same references for every document

Ingest of the 2000-agent fleet (4040 documents, applied three times: dry run, apply, re-apply) made about 275,000 database operations, 12,000 reads of each of the eight `harness_profile*` tables (the one built-in `builtin/fake` profile, twice per deployment document per pass), and 22,000 reads of `prompt_templates`. Re-applying 4040 unchanged documents took 10.6 s against 8.6 s for creating them, in one request each. Memoizing resolved references for the duration of one apply should cut the per-document cost to the document's own rows. Check: `ingest --dataset benchmarks/.run/synthetic-fleet-2000.json --corpus fleet --batch-size 4040` documents per second and re-apply latency.

### I-08: silent clamping

The fleet corpus first had a probe that applied `maxAttempts: 99` and expected a 400, because `REST_API.md` documents the range as 1 to 10. Both the manifest apply and `POST .../deployments` accept it and store 10 (`Deployment.MaxAttempts` clamps with `Math.Clamp`). The two surfaces agree, so this is not a defect, and the probe was removed; but a caller gets no sign that the value they wrote is not the value in force.

### I-07 / D-3: an invalid enum in a manifest spec leaks internals

Applying a `Secret` with `kind: Generic` (the valid names are `GenericEnv` and `GenericFile`) fails with `Secret mux-api-key has an invalid spec: The JSON value could not be converted to Garrison.Core.Enums.SecretKindEnum. Path: $.kind | LineNumber: 0 | BytePositionInLine: 17.` (`src/Garrison.Core/Manifests/ManifestService.cs` line 606 passes the `JsonException` message through). It should name the field and the allowed values, the way the REST validation does.

### I-09 to I-13

These come from what the suite could not measure cleanly or explain yet. The stage breakdown shows where time goes but not what a different setting would buy (I-09); fixed-rate open loop never produces the bursts real callers send (I-10); routing probes can only check the outcome of placement, not its reasoning (I-11); database cost per run has to be inferred from server-wide counters that background work also moves (I-12); and closed-loop throughput at 8 and 16 clients was 80 to 85% of slots divided by slot time, with the host CPU not saturated (the direct arm reached 93 ops/s), so some time between a completion and the next lease is unexplained (I-13).
