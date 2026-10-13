# Run artifacts

Artifact collection is optional. Select a store and set `artifactGlobs` on a deployment, for example `["reports/**/*.json", "results/*.txt"]`. An empty list disables collection. Workers collect matching files after the harness exits and before workspace cleanup. Collection errors appear as `ArtifactCollectionWarning` events; they do not change the harness result.

Patterns are case-sensitive, relative to the workspace, and support `*`, `**`, and `?`. `**/` also matches zero directories. Absolute paths, parent traversal, and symlinks are excluded. Collection has bounded file counts, bytes, scan entries, and time. Cancellation skips or interrupts collection.

## Configure a store

Use Configuration > Artifact Stores or the tenant `artifact-stores` API:

- `Database` stores content alongside metadata. Suitable for small local installations.
- `Filesystem` stores content under `Artifacts.RootDirectory` (default `data/artifacts`). `pathPrefix` is an optional relative subdirectory; otherwise the store ID is used. Multiple server replicas must mount the same directory. Docker Compose already persists the default root in the server data volume.
- `S3` requires an existing `bucket`. `region` defaults to `us-east-1`; an empty `endpoint` uses AWS. Set an endpoint for Less3, Hydra, or another compatible service. `forcePathStyle` defaults to true; disable it if the service requires virtual-host addressing. `pathPrefix` optionally controls the object prefix.

For S3 credentials, create an encrypted `GenericEnv` secret containing JSON with `accessKey`, `secretKey`, and optional `sessionToken`, then select its `secretId`. Without a secret, the server uses the AWS credential chain. Credentials stay on the server. Workers upload through authenticated Garrison MCP, including from Kubernetes run pods under the existing network policy.

Stores cannot be deleted while artifacts or deployments reference them. Store kind, bucket, and endpoint cannot change while artifacts exist. Deleting a referenced credential is also blocked.

## Browse and download

Use Runs > Artifacts for the tenant browser or the Artifacts tab on a run. Metadata includes file name, media type, bytes, SHA-256, producing run, lease epoch, and repair attempt. Listing does not read file content.

Under `/v1.0/api/tenants/{tenantId}`:

| Method | Path | Behavior |
|---|---|---|
| GET | `/artifacts?runId=...&storeId=...` | Paged metadata; either filter is optional |
| GET | `/runs/{runId}/artifacts` | Metadata for one run |
| GET | `/artifacts/{id}` | One metadata record |
| GET | `/artifacts/{id}/content` | Authenticated binary download |
| POST | `/artifacts/{id}/download-url` | Download-only URL and UTC expiry |
| DELETE | `/artifacts/{id}` | Remove content and metadata |
| POST | `/runs/{runId}/artifacts` | Binary upload for an active lease/repair phase |

Uploads use `application/octet-stream` and query parameters `storeId`, `name`, `epoch`, `repairAttempt`, and optional `mediaType`. The name must match the deployment's configured globs and store. Stale leases, earlier repair attempts, cancellation, and terminal runs cannot create artifacts. Repeating the same upload is idempotent; different content for the same execution/file conflicts.

Download URLs grant access to one file until expiry; they cannot authenticate other API calls. Deleting the file invalidates its links. Links are served through Garrison rather than exposing provider credentials or filesystem paths. There is no automatic retention cleanup; operators explicitly delete artifacts.

## Limits and validation

Server settings under `Artifacts` apply after restart:

| Setting | Default | Range |
|---|---|---|
| `MaxFileBytes` | 16 MiB | 1 KiB to 64 MiB |
| `MaxTotalBytes` | 64 MiB | 1 KiB to 1 GiB |
| `MaxFiles` | 100 | 1 to 10,000 |
| `MaxScanEntries` | 100,000 | 1 to 1,000,000 |
| `CollectionTimeoutSeconds` | 30 | 1 to 300 |
| `DownloadLifetimeSeconds` | 900 | 30 to 3,600 |

Environment overrides use `GARRISON_ARTIFACT_` followed by `ROOT_DIRECTORY`, `MAX_FILE_BYTES`, `MAX_TOTAL_BYTES`, `MAX_FILES`, `MAX_SCAN_ENTRIES`, `COLLECTION_TIMEOUT_SECONDS`, or `DOWNLOAD_LIFETIME_SECONDS`.

Run `dotnet run --project src/Test.Automated -f net10.0 -- --suites artifacts` for collection, persistence, tenant, lease, and download tests. `scripts/check-artifact-s3.sh` checks real Less3 transfers using a disposable local container. The configurable adapter supports Hydra/AWS endpoints; those services have not been exercised against live accounts in this validation.
