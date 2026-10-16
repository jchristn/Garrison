# D063 continuation archive policy

The remaining archive-size gap is closed with explicit operator configuration and bounded regression coverage. No session-population requirement was added. The existing actual continuation and modest-scale evidence remains applicable; this work addresses the concrete catalog-sized archive failure.

## Changes

Three issues prevented a complete portable checkpoint from working correctly:

1. `Artifacts.MaxFileBytes` silently clamped an operator's value above 64 MiB, even when REST allowed the larger upload. The configurable ceiling is now **256 MiB**, shared by Core, server and C# SDK. The default remains **16 MiB**.
2. Filesystem and S3 downloads independently hardcoded another 64 MiB ceiling. All store kinds now check the configured file limit before content access. Filesystem/S3 reads still reject actual streamed lengths different from metadata; database content now receives the same recorded-length consistency check. Lowering the configured cap deliberately makes previously larger artifacts unavailable until the cap is raised again.
3. A successful harness exit followed by checkpoint capture/upload failure still used `succeeded=true` during workspace cleanup. `KeepOnFailure` could therefore delete diagnostic work. Cleanup now follows the final execution status. Failed/cancelled checkpoint work is retained when requested, while private HOME/config are removed for ordinary non-conversation execution. Successful and suspended-boundary cleanup semantics remain unchanged; conversation retention remains its separate lifecycle.

Continuation still preserves complete `work/`, `home/` and `config/`. It does not exclude account catalogs, caches or arbitrary session files. The **256 MiB uncompressed** and **100000-entry** snapshot guards, path/link checks, SHA-256, session identity and execution fencing remain enforced. Raising the compressed cap does not relax those independent guards.

## Verification

The isolated .NET 10 build completed with **zero warnings and zero errors**. The six new cases passed **6/6**:

| Case | Observed behavior |
|---|---|
| Settings and SDK bounds | Default 16 MiB retained; explicit 96 MiB survives settings serialization and C# SDK assignment; minimum 1 KiB and maximum 256 MiB remain bounded. |
| Download guards | Database, filesystem and S3 reject invalid/over-cap metadata before I/O; database payload/metadata length mismatch fails. No S3 service is contacted for this guard test. |
| Large complete HOME | An 80 MiB incompressible synthetic catalog, saved session, completed-work marker and private configuration are captured without exclusions. Defaults reject it; an explicit 96 MiB cap supports node upload, signed download and replacement-root restore with matching hashes. |
| Oversized checkpoint | Fails before transport, reports the configured bound, does not report a checkpoint, retains KeepOnFailure work and removes HOME/config. |
| Upload failure | Remains Failed/InternalError, retains work, removes HOME/config and reports no checkpoint. |
| Cancelled upload | Remains Cancelled/Cancelled rather than InternalError or Suspended; retains work and removes HOME/config. |

Measured fixture sizes:

- Catalog payload: **83886080 bytes** (80 MiB).
- Complete uncompressed snapshot: **83886374 bytes**.
- Compressed ZIP: **88474189 bytes**, including compression/container overhead.
- Explicit archive allowance: **100663296 bytes** (96 MiB).

The test deletes the original source tree before restoring at another root, compares the full catalog SHA-256 and archive SHA-256, and verifies saved history, private configuration and completed work. It also rejects a deliberately smaller uncompressed restore budget and verifies that neither a destination nor restore staging remains.

The default worker check rejects before invoking transport. The default server check directly exercises `ArtifactService.UploadInternalAsync` and requires its validation error plus absence of metadata/storage objects. An early HTTP denial can close a large request while its client is writing; a connection failure is never counted as proof of policy rejection. The raised-cap positive path transfers the actual archive over HTTP. A signed-download request also proves a real HTTP 400 when the cap is lowered, followed by HTTP 200 and full content with the 96 MiB policy restored.

No model was called and no real account catalog or credential was read. The data is synthetic; the test establishes archive policy and fidelity rather than asserting that every future third-party account catalog will fit a chosen cap.

Sanitized evidence:

- [Summary](../../benchmarks/evidence/d063/continuation/summary.json)
- [Six case results](../../benchmarks/evidence/d063/continuation/tests-net10.json)
- [Large archive sizes and digests](../../benchmarks/evidence/d063/continuation/large-home.json)
- [Oversize cleanup](../../benchmarks/evidence/d063/continuation/cleanup-oversize.json), [storage failure cleanup](../../benchmarks/evidence/d063/continuation/cleanup-upload.json), [cancellation cleanup](../../benchmarks/evidence/d063/continuation/cleanup-cancel.json)

Root-level combined .NET 8/10 and artifact/worker regressions are recorded separately after the source freeze.

## Operator configuration

See [archive size policy](../CONTINUATION.md#archive-size-policy) for the complete procedure. A 96 MiB allowance uses `Artifacts.MaxFileBytes=100663296` or `GARRISON_ARTIFACT_MAX_FILE_BYTES=100663296`. The existing 128 MiB REST ceiling accommodates that binary archive. Larger caps require matching REST and proxy/ingress body limits. Apply consistent settings to replicas and restart them so new assignments carry the policy; use matching candidate server and worker builds because older builds retain the 64 MiB clamp.

Account catalogs can change size. Choose explicit headroom, appropriate storage/timeout and sufficient memory; the implementation buffers archive/file bytes, so archive length is not a peak-memory estimate. Normal glob collection additionally obeys MaxTotalBytes; internal continuation archives use the per-file cap independently. A limit failure remains an actionable terminal failure, not a truncated or falsely successful suspension.

Reproduce with:

```bash
dotnet build src/Test.Automated/Test.Automated.csproj -f net10.0 \
  --artifacts-path /tmp/garrison-continuation-build
GARRISON_CONTINUATION_EVIDENCE=/tmp/garrison-continuation-evidence \
  dotnet /tmp/garrison-continuation-build/bin/Test.Automated/debug_net10.0/Test.Automated.dll \
  --suites continuation-archive
```

All fixture directories, storage objects and test services are cleaned up. The original Compose deployment is unchanged. Nothing was committed or published.
