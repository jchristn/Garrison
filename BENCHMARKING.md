# Garrison benchmarking plan

This is the plan for Garrison's benchmark suite: what it measures and why, the hypotheses round 0 was run to confirm or refute, how every metric is computed, and how far the suite has come. It follows `~/Code/Agents/requirements/BENCHMARKING.md` and is GARRISON_PLAN.md Phase 14 (P14.1 to P14.14). The operator's guide is `benchmarks/README.md`; the numbers are in `benchmarks/RESULTS.md`; the fixes they point to are in `IMPROVEMENTS.md`.

## What the suite measures, and why

Garrison makes four claims that numbers can check:

1. **It puts runs in the right place.** A run goes only to a worker that has its harness, matches its deployment's node selector and pool, and respects the deployment's concurrency limit; a run nobody can take says why (`blockedReason`). Priority orders the queue.
2. **It adds little to a run.** Everything between "the caller asked" and "the harness started" (authentication, queueing, claiming, compiling the execution spec, leasing, preparing the workspace) and between "the harness exited" and "the caller has the answer" (event shipping, completion, the wake-up of a waiting request) is overhead the caller pays on every run.
3. **It scales out.** Workers pull work; adding workers adds capacity without any control-plane change (`docs/SCALING.md`).
4. **It survives failure.** A crashed worker's runs are requeued, a crashed control plane loses nothing, a database outage costs latency and not data, and every error is a clean JSON error (`docs/SCALING.md`, Failure handling; `REST_API.md`, Errors).

The plan's risk register names the database as the likely ceiling (R-005), and P15.10 wants performance targets from this phase. The suite therefore also measures cost per run in database operations, from the server's own metrics.

### How this differs from the sibling suites

The reference suites (Isis, Pneuma, AssistantHub) measure retrieval quality: their probes are questions, their oracles are relevance labels and judges, and their reference arms are BM25 and dense retrieval checked against published BEIR scores. Garrison is an orchestration platform, so most of their machinery maps onto something simpler and some of it has no counterpart.

| Requirement concept | In this suite |
|---|---|
| System under test | The Garrison control plane and its workers, reached over REST |
| Workspace | A tenant per corpus, named from the dataset, corpus, and a hash of its items |
| Item | One manifest document (agent, deployment, prompt template, harness profile, secret declaration) |
| Probe | One run, request, or apply with a known correct outcome |
| Oracle | Computed: expected status, outcome, result text (the fake harness echo is deterministic), node label, HTTP status and error code, event sequence integrity. No judge, so no judge calibration and no `labels/` |
| Stub | The fake harness (`src/Garrison.FakeHarness`): it stands in for Claude Code, Codex, and Mux, speaks their output formats, and has deterministic output and configurable timing, so the worker cannot tell the difference that matters to it |
| Reference arm and floor | Direct invocation: the same fake harness binary, arguments, and prompt, started by the harness with no Garrison in between. Garrison minus direct is the overhead per run |
| Quality command | `routing` (scheduling correctness); `e2e` adds the run flow (parsers, structured output, failures, cancellation, isolation, streaming) |
| Load path | `ingest`: manifest apply at scale, with reachability (every agent readable by name) and idempotence (a second apply changes nothing) |
| Public datasets | None fits (below) |

## Datasets

| Tier | Dataset | Size | What it covers |
|---|---|---|---|
| Synthetic | `synthetic-fleet` | 495 manifest documents in 4 corpora, 56 probes (18 negative) | Routing on two worker lanes; the run flow on every output parser; a load workload; a generated fleet of 200 agents, 200 deployments, and 40 shared templates (Zipf-distributed popularity) for ingest at scale. `generate --agents N` builds larger fleets on demand |
| Live | `garrison-live`, frozen 2026-10-11 | 15 shipped documents in 2 corpora, 8 probes (4 negative) | The quick start manifest and the bootstrap sample agents, substituted as the bootstrap Job does |
| Public | none | | |
| Local | none | | Garrison does not ingest unstructured content |

Both committed datasets are small (under 10,000 items) and deterministic, so both are in the CI gate.

**Why no public dataset.** The requirement's catalog lists the Azure Public Dataset (Functions 2019 invocation traces), the Alibaba cluster trace, and the Google cluster data under workflow and scheduling. They are workloads, not benchmarks: no oracle, and no published result for a metric this suite reports. They would be useful for one thing, a realistic open-loop arrival pattern (bursty, diurnal, heavy-tailed run lengths) instead of the fixed rates the load command uses today. That is IMPROVEMENTS.md item I-10; until then no public number is compared, and `benchmarks/baselines.json` says so in every report. The only prior numbers to compare against are Garrison's own, in `docs/SCALING.md` (2026-10-10), and `baselines.json` carries them, marked as internal.

## Metrics

All percentiles are nearest-rank: the smallest observed value with at least p percent of the sample at or below it. Every interval is a 95% percentile bootstrap with 2000 resamples and seed 42 (`--resamples`, `--seed`); groups under 20 are marked indicative. Seeds derived from strings use FNV-1a.

| Metric | Definition | Source |
|---|---|---|
| Pass rate | Mean of per-outcome scores (1 when every expectation held, else 0). Errored outcomes score 0 and stay in the denominator. Per arm, per probe type, per category | Harness |
| Latency | Client-side, request sent to response read, for successful outcomes only. For create-mode probes, create sent to terminal status observed (poll interval 100 ms) | Harness |
| queueMs | Queued to leased: claim latency with no backlog, the backlog otherwise | Server timestamps on the run |
| executionMs | Harness process start to exit | Worker, monotonic clock |
| totalMs | Queued to completion received | Server timestamps |
| serverOverheadMs | totalMs minus executionMs: what the control plane and the worker's own steps add inside the server's view | Run fields |
| clientOverheadMs | Client latency minus executionMs: everything the caller pays beyond the harness | Harness and run fields |
| overheadMs | Garrison arm latency minus direct arm wall time, paired by probe and repeat | Harness |
| eventPersistMs | Per run, the median of event createdUtc (server) minus timestampUtc (worker), lifecycle events excluded | Run events |
| streamMs | Per run, the median of SSE arrival time minus event createdUtc, for events stored after the stream connected | Harness and run events |
| Throughput | Successful operations divided by the measured window including the drain; interval from per-second completion counts | Harness |
| Documents per second | Documents applied divided by the time spent in apply requests | Harness |
| Reachability | Agents readable by name after the apply divided by agent documents | Harness |
| Idempotence | Share of documents a second identical apply reports Unchanged | Harness |
| Recovery seconds | From the injected fault to the first successful creation after the last client-visible failure; for a worker crash, to the completion of the last run that needed another attempt | Harness and run fields |
| Stage breakdown | Difference of every histogram's `_sum` and `_count` between scrapes of `/metrics` before and after a phase | Server metrics |

Load runs have a 5-second untimed warmup per level, stop starting operations at the deadline and let in-flight ones finish, and offer an open-loop mode whose latency is measured from the scheduled send time. Closed loop hides stalls (coordinated omission), so latency claims come from open loop.

## Hypotheses

Written while the harness was being built, before the round 0 run. Smoke runs during development had already shown that every probe passed on the local stack and that local per-run overhead was tens of milliseconds, which shaped H2's threshold; the rest come from `docs/SCALING.md` and the code's documented intervals. Round 0's verdicts are in `benchmarks/RESULTS.md`; the short form is here.

| ID | Hypothesis | Round 0 |
|---|---|---|
| H1 | **Claim throughput and latency.** With idle slots, claim latency (queueMs) is under 50 ms at p50 and 200 ms at p95, and the control plane is not the throughput ceiling: with a backlog, fake-harness throughput reaches at least 85% of slots divided by mean run time until the machine's CPU saturates | Latency confirmed; throughput partly (80 to 85% of the slot limit) |
| H2 | **End-to-end overhead per run.** With no backlog, Garrison adds under 150 ms at p50 over invoking the same harness directly (overheadMs and clientOverheadMs), well under the 140 to 230 ms SCALING.md observed with three replicas | Confirmed: 17.7 ms paired p50 |
| H3 | **Event latency.** Events are stored within 300 ms (p95) of the worker stamping them (the worker flushes every 250 ms or 100 events), and an SSE subscriber sees each stored event within 1 s (p95), the poll fallback | Confirmed: 208 ms and 16 ms at p95 |
| H4 | **Scale-out linearity.** With a backlog, throughput with 2 and 3 workers is at least 1.8 and 2.6 times the 1-worker throughput | Confirmed: 1.93x and 2.66x |
| H5 | **Correctness under normal and failed operation.** Every routing and e2e probe passes; no run is lost or duplicated when a worker, the server, or the database crashes under load; every error response is a JSON error body | Refuted: D-1, and past capacity D-4 and D-5. Round 1: holds after the fixes (`benchmarks/RESULTS.md`) |
| H6 | **Load path.** The 440-document synthetic fleet applies in under 5 s with nothing failed, a re-apply reports everything Unchanged, and every agent is readable afterwards; a 4040-document fleet applies without timeouts | Confirmed |

## Product hooks

None were added. Garrison already exposes what the suite needs: per-run timing fields measured by the worker and the server (`timeToFirstTokenMs`, `executionMs`, `queueMs`, `totalMs`), event timestamps from both sides, `blockedReason`, the node that ran each run, and Prometheus histograms on `/metrics` (relayed on the REST port), which the in-progress telemetry work (P13.20 to P13.28) extends with per-route, per-table database, and scheduler metrics that the stage breakdown picks up automatically. Two hooks would sharpen the numbers and are in IMPROVEMENTS.md: a placement dry run ("which nodes could take this run, and why not the others") and a per-run database operation count.

## Delivery and status

| Task | Item | Status |
|---|---|---|
| P14.1 | This plan, with hypotheses | Done |
| P14.2 | `src/Test.Benchmark`, assembly and process `Garrison.Benchmark`, no product references, own typed client, `IsTestProject` false, in `src/Garrison.sln` | Done |
| P14.3 | `benchmarks/` layout and `.gitignore` | Done |
| P14.4 | Isolated stack: K3S in Docker (k3d `garrison-bench`), 37xxx loopback ports, pinned images, own kubeconfig | Done |
| P14.5 | Commands `validate`, `ingest`, `routing`, `e2e`, `load`, `resilience`, `compare`, `history`, `stub` (plus `generate`, `ci-gate`, `wait`) | Done |
| P14.6 | Fake harness as the stub; direct invocation as the reference arm and floor (e2e and load) | Done |
| P14.7 | Datasets: synthetic workloads and a frozen live snapshot, both with negative probes | Done |
| P14.8 | Reports with provenance: product commit with untracked-aware dirtiness, harness commit, image digests, dataset SHA-256, full command line and options | Done |
| P14.9 | Bootstrap confidence intervals; paired, significance-gated compare for every report kind | Done |
| P14.10 | `ci-gate` with committed baselines, in `.github/workflows/benchmark.yaml` on every push and pull request | Done |
| P14.11 | `benchmarks/RESULTS.md` round 0 with the defects found | Done |
| P14.12 | `IMPROVEMENTS.md` | Done |
| P14.13 | Every script as a `.sh` and `.bat` pair | Done |
| P14.14 | Definition of Done (below) | Done, with the departures listed below |

## Definition of Done

| Requirement | Status |
|---|---|
| `src/Test.Benchmark/` builds in the solution, has no reference to product assemblies, and runs under a distinct process name | Yes: `Garrison.Benchmark`, no `ProjectReference` or package reference at all |
| `benchmarks/` exists with the layout, and `.gitignore` excludes `data/`, `.run/`, and `results/*` | Yes; `docker/` is replaced by `k3d/` and `k8s/` (departure 1), and there is no `labels/` or `agent/` (no judge, no agent runs) |
| The isolated stack comes up with one command on non-default loopback ports, pinned to the shipped image versions | Yes: `k3d cluster create --config benchmarks/k3d/cluster.yaml` creates it and `stack-up.sh` deploys into it (departure 1) |
| `validate`, `ingest`, the quality command, the end-to-end command, `load`, and `compare` work with the standard exit codes | Yes (0, 1, 2, 3, 130) |
| At least one live and one synthetic dataset, both with negative probes, both passing `validate`; public datasets convert with a seeded `prepare` | Live and synthetic yes; no public dataset fits, so there is no `prepare` (departure 2) |
| Every fitting public dataset is used with a reference arm that reproduces a published score, or this plan says why none fits | This plan says why none fits; the direct arm reproduces the harness's own output exactly (every direct outcome passes the same oracle) |
| Reports are paired JSON and Markdown with complete provenance | Yes |
| Headline metrics carry confidence intervals; failures count against quality and are excluded from throughput; incomplete runs exit 3 | Yes |
| Load has a warmup, drains at the deadline, and offers an open-loop mode | Yes |
| A stub for every expensive dependency, and a reference arm or floor | Yes: the fake harness; direct invocation |
| `compare` is paired and significance-gated, covers every report kind, fails on mismatched probe sets, and saves its output | Yes |
| Every quality report shows `baselines.json` with the net difference, and `history` produces the per-type round table | Yes (the baselines are internal prior numbers; no published ones exist) |
| `ci-gate` runs a deterministic subset against committed baselines in CI on every push and pull request; anything that cannot run in CI is named in the README | Yes |
| Every script is a `.sh` and `.bat` pair with no hard-coded paths, ids, hosts, or secrets | Yes; the only credentials are the bench stack's obviously fake keys |
| `BENCHMARKING.md`, `benchmarks/README.md`, `benchmarks/RESULTS.md` (round 0 and its defects), and `IMPROVEMENTS.md` are written | Yes; committing them is the user's call (this phase was delivered uncommitted, by instruction) |

## Where the implementation departs from this plan

1. **K3S in Docker instead of Docker Compose.** The requirement describes `benchmarks/docker/compose.yaml`. GARRISON_PLAN.md P14.4 asks for K3S in Docker, because Garrison ships to Kubernetes and the interesting failures (a worker pod crash, a control-plane restart, PostgreSQL restarting under load, several workers on lanes) are Kubernetes behavior. The stack is `benchmarks/k3d/cluster.yaml` (one `k3d cluster create --config` command) plus the `benchmarks/k8s/` overlay on the shipped base. Image digests come from `kubectl get pods`, not `docker inspect`. The CI gate uses a second, lighter stack of local processes (`start-bench-server.sh`), because building the 2 GB worker image and running K3S on every push would make the gate slow and flaky.
2. **No public dataset and no `prepare` command.** See Datasets.
3. **No observability collector in the stack.** The requirement asks for the SUT's collector with a 1-second export. Garrison serves Prometheus text on `/metrics` directly (pull, not push), so the harness scrapes it before and after each phase with no export interval to wait for. Behind a Service with several replicas each scrape reaches one replica, so stage breakdowns are only clean with one server, which is the default.
4. **Deterministic gate rule.** The requirement's compare flags a regression only when a drop exceeds the tolerance and is significant. For reports marked deterministic, `compare` also flags any single probe that flips from pass to fail: on a 24-probe corpus one flip is a 4% drop that a bootstrap cannot call significant, yet a deterministic probe has no noise, so the flip is real.
5. **Run-level, not per-request, overrides.** There is no ablation sweep yet: Garrison's tunables that matter here (lease wait, event flush interval, poll intervals) are cluster settings, and the suite does not change them between arms. IMPROVEMENTS.md I-09 proposes sweeping them.
6. **The direct arm runs on the harness machine.** On the k3d stack the Garrison arm's harness runs in a Linux container in the Docker VM while the direct arm runs on the host, so the floor is a floor for the work, not for the container. `clientOverheadMs` (client latency minus the worker's own `executionMs`) is the container-fair overhead and is reported next to it.
7. **The root README has no Benchmarks section yet.** This phase was delivered by an agent restricted to its own files while two others edited the tree; adding the short section that links `benchmarks/README.md` is a one-line follow-up.
