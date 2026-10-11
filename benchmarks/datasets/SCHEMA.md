# Dataset format

Every Garrison benchmark dataset is one JSON file in the neutral format below. `Garrison.Benchmark validate` checks a file against every rule on this page; `generate` refuses to write a dataset that fails them. The C# model is in `src/Test.Benchmark/Datasets/`.

A dataset holds corpora. Each corpus is provisioned as its own **workspace**, a Garrison tenant named `bench-<dataset>-<corpus>-<hash>`, where the hash covers every item in the corpus. Change one item and the next run gets a fresh tenant; change nothing and the tenant is reused. Items are applied as one manifest, so a reused tenant is brought back in line with the corpus on every run. The ingest command always uses a new tenant, because it measures creation.

## Top level

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required. Lowercase letters, digits, and hyphens. Used in report file names. |
| `description` | string | What the dataset is. |
| `schemaVersion` | int | Must be 1. |
| `tier` | string | `live`, `synthetic`, `public`, or `local`. |
| `snapshotDate` | string | Required for `live`: the date the snapshot was frozen, `yyyy-MM-dd`. |
| `source` | string | How the file was produced. |
| `corpora` | array | At least one corpus. |

## Corpus

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required, unique in the dataset, lowercase letters, digits, and hyphens. |
| `description` | string | What the corpus exercises. |
| `command` | string | The command whose probes these are: `ingest`, `routing`, `e2e`, or `load` (a load corpus holds the workload agents of the load and resilience commands and may have no probes). |
| `items` | array | Manifest documents loaded into the workspace. |
| `probes` | array | Probes. A corpus with probes needs at least one negative probe. |

## Item

An item is one Garrison manifest document (`docs/MANIFESTS.md`).

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required, unique in the corpus. |
| `kind` | string | `Secret`, `PromptTemplate`, `HarnessProfile`, `McpServer`, `WorkspaceTemplate`, `Agent`, or `Deployment`. Must match the document's `kind`. |
| `name` | string | Must match the document's `metadata.name`. Unique per kind in the corpus. |
| `manifest` | string | One YAML document starting with `apiVersion: garrison/v1`, no `---` separator, at most 64 KiB. |

## Probe

A probe is one operation with a known correct outcome. It scores 1 when every expectation that is set holds, and 0 otherwise. A probe that could not be carried out (a transport error, an unexpected 5xx, a corpus that failed to load) also scores 0, is flagged as errored, and stays in every denominator.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required, unique in the corpus. |
| `type` | string | Required. What makes the probe hard: `node-selector`, `priority`, `truncation`, `unknown-agent`, `missing-executable`, and so on. Reports break pass rates down by type. |
| `category` | string | Required. The area it tests: `placement`, `blocking`, `ordering`, `validation`, `prompts`, `parsing`, `structured`, `failure`, `lifecycle`, `isolation`, `streaming`, `load-path`. |
| `negative` | bool | True when the correct outcome is a refusal, a clean failure, or nothing. A negative probe must expect one (an HTTP status of 400 or more, a failed status, a blocked reason, a failed manifest document, or invalid structured output); a positive probe must not. |
| `action` | string | What the probe does (below). |
| `agent` | string | The agent the probe invokes. It must be an `Agent` item of the corpus, unless the probe is negative (an unknown agent is a valid negative probe). |
| `input` | string | The input message. Deployments in the committed datasets render it unchanged as the task prompt, so the fake harness answers `Echo: ` plus its first 200 characters. |
| `inputRepeat` | int | Repeat `input` this many times (1 to 10000, default 1), for large inputs. The repeated input is at most 1,000,000 characters. |
| `parameters` | object | Per-run parameter overrides (string values). |
| `priority` | int | Run priority, -100 to 100. |
| `mode` | string | `create` (create without waiting, then follow by polling; also follows the event stream), `invoke` (invoke and wait on the server), or `wait` (create with `wait=true`). Default `create`. |
| `count` | int | Runs a `priority` or `no-overlap` probe starts (2 to 100). |
| `timeoutSeconds` | int | Longest wait for the probe's runs (1 to 3600, default 60). |
| `manifest` | string | `apply` probes: the manifest to apply. |
| `dryRun` | bool | `apply` probes: apply as a dry run. Negative apply probes use dry runs so a document that is wrongly accepted is not stored. |
| `directArguments` | array | `run` probes: fake harness arguments that reproduce the same work without Garrison (for example `["--format", "claude", "--delay-ms", "50"]`). The e2e command runs the harness directly with these arguments and the probe input on stdin: the reference arm and floor. |
| `expect` | object | The oracle (below). |

### Actions

| Action | What it does | Typical expectations |
|---|---|---|
| `run` | Starts a run in `mode` and follows it to a terminal status, then reads its events. | `status`, `outcome`, `resultEcho` or `resultText`, `nodeLabelKey`/`nodeLabelValue`, `minEvents`, `eventTypes`, `contiguousEvents`, `outputSchemaValid`, `repairAttempts` |
| `request` | Sends the start request only and checks the answer; cancels a run that was wrongly created. | `httpStatus`, `errorCode`, `fieldCode` |
| `blocked` | Creates a run that no worker can take, waits for `blockedReason`, checks the run stays `Queued`, then cancels it and checks it ends `Cancelled`. | `blockedReason` |
| `cancel` | Creates a long run, waits until it is `Running`, cancels it, and times the cancel. | `status`, `outcome`, `maxCancelMs` |
| `idempotency` | Creates a run twice with one `Idempotency-Key` (must return the same run), then with the same key and different input (must answer 409 `IdempotencyKeyConflict`). | `status` |
| `cross-tenant` | Creates a run in the workspace, then reads it and its events through another tenant's path. | `httpStatus` (404) |
| `priority` | Starts one blocker run on a single-slot deployment, waits until it holds the slot, queues `count - 2` runs at priority 0 and then one at `priority`; the high-priority run must be leased first. | `status` |
| `no-overlap` | Starts `count` runs at once on a deployment with `maxConcurrentRuns: 1`; no run may be leased before the previous one completed. | `status` |
| `apply` | Applies `manifest` (optionally as a dry run). | `httpStatus`, `manifestFailed`, `manifestCreated`, `manifestUnchanged`, `manifestMessageContains` |
| `reachable` | Reads every `Agent` item of the corpus by name. Passes when all are readable. | none |

### Expectations

Every field that is set is checked; fields that are not set are not.

| Field | Checks |
|---|---|
| `httpStatus` | Status of the start request (or the cross-tenant read, or the apply). |
| `errorCode` | `code` of the error body. |
| `fieldCode` | One of the error body's `fieldCodes` values, for example `ParameterNotAllowed`. |
| `status`, `outcome` | Terminal run status and outcome. |
| `resultText` | Exact result text. |
| `resultEcho` | The result equals `Echo: ` plus the first 200 characters of the input, trimmed. Cannot be combined with `resultText`. |
| `resultContains` | The result contains this text. |
| `nodeLabelKey`, `nodeLabelValue` | The node that ran the run carries this label. Set both or neither. |
| `blockedReason` | `blocked` probes only. |
| `minEvents` | At least this many run events. |
| `eventTypes` | Each listed event type appears at least once. |
| `contiguousEvents` | Event sequences are exactly 1..n, and `lastEventSequence` equals n. |
| `maxCancelMs` | `cancel` probes only: most milliseconds from the cancel request to a terminal status. |
| `outputSchemaValid`, `repairAttempts` | Structured output validation results. |
| `manifestFailed`, `manifestCreated`, `manifestUnchanged`, `manifestMessageContains` | Apply results; the message check reads the first failed item. |

## Labels

The probes in the committed datasets were written by hand against the documented contract (`REST_API.md`, `docs/MANIFESTS.md`, `docs/SCALING.md`), in a separate pass from the items, and each one was checked by running it. They are good but not gold: where the documentation is silent, a probe states what a careful reader would expect, and `RESULTS.md` records every case where the product and a probe disagreed and which one was wrong.

## Files

| File | Tier | Built by |
|---|---|---|
| `synthetic-fleet.json` | synthetic | `datasets/synthetic/build.sh` (`generate --kind synthetic`) from `synthetic/sources.json`: hand-written routing, e2e, and load corpora, plus a generated fleet of 200 agents, 200 deployments, and 40 shared templates with Zipf-distributed template popularity (seed 20261011) |
| `garrison-live.json` | live, frozen 2026-10-11 | `datasets/live/build.sh` (`generate --kind live`) from `live/sources.json`: the quick start manifest and the bootstrap sample manifests, substituted the way the bootstrap Job does |
