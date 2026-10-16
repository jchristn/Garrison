# D063 bounded acceptance and scope reconciliation

The selected active work is complete under the user's revised acceptance scope. CI is optional for recovery; no arbitrary 10000-session continuation gate remains. P14.15 is deferred for time/resources and further P15.11 accessibility audit is removed from active scope. Existing measurements, accessibility fixes and automated checks remain.

## Completed work

- **P12.34:** six new local PostgreSQL cases exercise three independent control-plane service runtimes, two workers and an independent Node 22 HTTP mutation sink. Every policy passes leader loss plus worker partition and complete endpoint outage beyond lease expiry followed by fresh runtime recovery. Receipts verify conservative no-replay for AtMostOnce/Journaled and tagged permitted replay for AtLeastOnce. Leader epochs advance; healed stale workers cannot overwrite terminal state or add effects. See [recovery acceptance](D063_RECOVERY.md).
- **P12.39:** removed the prescribed population gate, retaining prior actual-CLI and 1000 SQLite/100 PostgreSQL process-population evidence. Fixed concrete archive policy gaps: Core/C# SDK accept an explicit file cap up to 256 MiB, default remains 16 MiB; downloads across all stores obey the configured bound, replacing a separate filesystem/S3 64 MiB ceiling; database bytes must match metadata length. An incompressible 80 MiB complete-HOME fixture passes node upload, signed download and cross-root restore at an explicit 96 MiB limit. Lower/default limits reject explicitly. Final-outcome cleanup preserves KeepOnFailure work after failed/cancelled checkpoint capture/upload and removes private HOME/config state. See [continuation policy](D063_CONTINUATION.md) and [operator configuration](../CONTINUATION.md#archive-size-policy).
- **P12.46:** three repeated approximately 4 MiB HTTPS rounds verify uncached/cold/warm clones and prepared archive transfer/restore with exact path/content/file-mode identity. Warm mirrors transfer zero pack bytes and 566 response-body bytes. Cold mirror overhead and larger archive costs are retained rather than hidden. This is a bounded shared-host transport experiment, not a WAN or fleet-capacity claim. See [cache acceptance](D063_CACHE.md).

## Final-source validation

The full solution builds for .NET 8 and .NET 10 with zero warnings/errors. Frozen final-source checks pass:

| Check | Result | Scope |
| --- | --- | --- |
| .NET 10 regression selection | 67/67 | Worker execution/protocol, artifacts, workspace cache and continuation across SQLite/PostgreSQL |
| .NET 8 regression selection | 41/41 | Artifacts, workspace cache, continuation and all six new archive-policy cases across the selected providers |
| New .NET 10 archive-policy suite | 6/6 | Explicit ranges, complete-HOME transport/restore, all-store download bounds/DB length, oversize/upload failure/cancellation cleanup |
| Local PostgreSQL recovery matrix | 6/6 | Two failure topologies under all three effect policies |
| HTTPS cache probe | 3/3 rounds | Four preparation/transfer paths per round; exact tree and mode identity |

Archive-policy tests use a SQLite-backed transport fixture and provider-independent worker/configuration checks. Selecting both providers does not imply the 80 MiB transport fixture ran against PostgreSQL. The provider-specific artifact/cache/continuation suites do run on both databases. The separate new recovery matrix uses PostgreSQL for shared-replica state.

[Final summary](../../benchmarks/evidence/d063/final-summary.json), [net10 cases](../../benchmarks/evidence/d063/final-net10.json), [net8 cases](../../benchmarks/evidence/d063/final-net8.json) and [binary provenance](../../benchmarks/evidence/d063/final-binary-provenance.json) retain the check scope and SHA-256 hashes. Domain reports retain their own sanitized results and reproduction steps. These are focused checks; prior D062/D060 broad backend, SDK, Postman and browser results remain historical evidence.

Shell/Python syntax, local report links, punctuation and git diff checks pass. No version, commit, push, publication or original Compose deployment changes were made. Private cache fixture processes, certificates, temporary data and builds were removed. The disposable PostgreSQL container and its anonymous volume were removed after final tests; the original five Compose services remain healthy.

## What remains

There are zero partial active tasks, 22 deferred tasks, one conditional task (P10.25), one skipped SDK-publication task (P6.20) and five dropped tasks. P10.25 resource-based scheduling remains conditional because existing measurements do not establish slot sizing as the bottleneck. No implementation is justified by that evidence yet.

The deferred work is optional orchestration/dashboard/evaluation functionality, simulated-user acceptance and review, performance capacity acceptance, and release/distribution/stability work. The exact IDs and dependencies are in [the current scope matrix](../REMAINING_PLAN_MATRIX.md). Hardware fault domains, WAN loss and production repository diversity are limits of local evidence, not newly added completion gates.
