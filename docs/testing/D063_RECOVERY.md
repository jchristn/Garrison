# D063 local recovery acceptance

P12.34 local acceptance passed: six new multi-control-plane cases passed in 69.7 seconds, complementing the retained 12 external-effect cases and 20 both-provider network/policy cases from D062. CI execution is optional and does not gate completion.

## What was exercised

Each case starts three independent control-plane service runtimes with separate HTTP endpoints sharing one isolated PostgreSQL schema. Two worker runtimes represent the isolated original worker and its healthy replacement. A separate Node 22.23.3 process accepts real HTTP mutation requests and records every receipt without deduplication. The mutation headers contain the stable operation/run identity and the actual compiled `{{run.attempt}}` value.

Two fault topologies run under every effect policy:

1. **Leader loss plus worker partition.** After the sink commits the first external effect, the original worker's control-plane traffic is blocked. The current maintenance leader stops. Two surviving replicas elect one new leader and recover the persisted execution according to its admitted effect policy.
2. **Complete endpoint outage and replacement.** After the same externally visible commit, all three control-plane runtimes stop. The test independently probes every original readiness endpoint and requires unavailability. All endpoints remain offline for at least six seconds, past the old five-second execution lease. Two fresh control-plane runtimes then open the persisted database, elect a leader and recover the run. This is a genuine all-endpoint outage, rather than a rolling replacement with an available old replica.

Every case requires the maintenance leader fencing epoch to advance from 1 to 2. After recovery, the original worker is retargeted to a live endpoint and its partition is healed. Its delayed traffic must leave the terminal status and execution epoch unchanged and must not produce another mutation.

| Policy | Leader loss + partition | All endpoints offline + replacement | Sink receipts | Final state |
| --- | --- | --- | --- | --- |
| AtMostOnce | PASS | PASS | Exactly one, attempt 1 | Failed / NodeLost, attempt 1 |
| Journaled | PASS | PASS | Exactly one, attempt 1 | Failed / NodeLost, attempt 1 |
| AtLeastOnce | PASS | PASS | Exactly two, attempts 1 and 2 | Succeeded, attempt 2 |

The Journaled cases deliberately perform raw external HTTP work without a safe journal checkpoint. Conservative failure is the expected protection against unproven replay. Existing effect-journal suites exercise the separate operation-state and checkpoint rules.

## Reproduce locally

Use .NET 10, Node 22 on `PATH`, Docker, and a disposable PostgreSQL 17 instance. The database below is a test fixture with public local-only credentials; it is separate from the original Compose database.

```bash
docker run -d --name garrison-local-recovery-pg --shm-size 256m -p 127.0.0.1:49937:5432 -e POSTGRES_DB=garrison -e POSTGRES_PASSWORD=garrison-d063-local-test-only postgres:17
GARRISON_TEST_PROVIDERS=postgresql GARRISON_TEST_PG_PORT=49937 GARRISON_TEST_PG_USERNAME=postgres GARRISON_TEST_PG_PASSWORD=garrison-d063-local-test-only GARRISON_RECOVERY_EVIDENCE=/tmp/recovery-receipts.jsonl dotnet run --project src/Test.Automated -f net10.0 -- --suites recovery-acceptance --results /tmp/recovery-results.json
```

Remove only the disposable fixture when finished: `docker rm -f -v garrison-local-recovery-pg`. Each test owns and disposes its workers, HTTP fault proxy, control-plane runtimes and independent sink process. The optional evidence destination contains receipts and bounded identity/state metadata, never credentials or execution specs.

## Evidence and implementation

- `benchmarks/evidence/d063/recovery-results.json`: six passing Touchstone cases with durations.
- `benchmarks/evidence/d063/recovery-receipts.json`: topology, leader epochs, final state and independent mutation receipts for every policy/case.
- `src/Test.Shared/Suites/RecoveryAcceptanceSuite.cs`: fault orchestration and safety assertions.
- `src/Test.Shared/Infrastructure/ExternalEffectExecutor.cs`: HTTP mutation and post-commit barrier.
- `src/Test.Shared/Infrastructure/ExternalEffectSink.cs`: independent sink process lifecycle with typed response contracts.
- `src/Test.Shared/Infrastructure/HttpPartitionProxy.cs`: controllable outage and endpoint retargeting.
- `k8s/tests/effect-safety/fixture.mjs`: non-deduplicating sink, now supporting an explicitly selected loopback port for local tests while preserving existing deployment defaults.

The isolated test build finished with zero warnings and errors. The sink ran on Node 22.23.3; the backend target was .NET 10. Original Garrison Compose services and data were not modified.

## Scope of the result

These are local runtime and real loopback HTTP failure tests. The three control-plane services run inside the test process; the mutation sink runs in a separate operating-system process. They verify persistent recovery across fresh service instances, singleton leader fencing, actual endpoint unavailability, lease expiry, independent external commit counts and stale-worker rejection. They do not claim physically separated machines or network zones, or operating-system crashes of all control planes. Those distinctions describe the evidence and are not additional P12.34 acceptance gates. CI may rerun the same tests when desired; local completion does not depend on it.
