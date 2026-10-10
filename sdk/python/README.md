# garrison-sdk (Python)

Python client for the Garrison REST API. Requires Python 3.9+ and `requests`.

## Install

The package is not published to PyPI yet, so `pip install garrison-sdk` fails with "No matching distribution found". Install it from your checkout of the repository instead:

```bash
pip install /path/to/Garrison/sdk/python        # or, from the repository root: pip install ./sdk/python
```

Use `pip install -e ./sdk/python` if you want edits to the SDK source to take effect without reinstalling. An editable install writes `garrison_sdk.egg-info` into `sdk/python`; it is gitignored.

## Quick start

```python
from garrison_sdk import GarrisonClient

client = GarrisonClient("http://127.0.0.1:8700")
client.login("admin@garrison", "password")      # the same email and password you use in the dashboard

run = client.agents.invoke("my-agent", "Summarize the release notes", wait=True, wait_seconds=120)
print(run["status"], run.get("resultText"))
```

To sign in with an access key pair instead, call `client.login_with_keys(access_key, secret_key)`. See "Where the credentials come from" below.

## Where the credentials come from

Email and password sign-in works the same on every runtime: tenant `default`, user `admin@garrison`, and the administrator password. That password is `password` on Docker Compose and source builds unless `GARRISON_ADMIN_PASSWORD` was set before the first start. On Kubernetes it is whatever `GARRISON_ADMIN_PASSWORD` held when `k8s/scripts/generate-secrets.sh` ran (also `password` by default), stored in Secret `garrison-secrets`.

The seeded administrator access and secret keys depend on the runtime:

| Runtime | Access key | Secret key |
|---|---|---|
| Docker Compose and source builds | `access_garrison_default` (or `GARRISON_DEFAULT_ACCESS_KEY` in `docker/.env`) | `secret_garrison_default_change_me` (or `GARRISON_DEFAULT_SECRET_KEY`) |
| Kubernetes (Kustomize or Helm) | random, key `default-access-key` in Secret `garrison-secrets` | random, key `default-secret-key` in Secret `garrison-secrets` |

On Kubernetes, read them with:

```bash
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.default-access-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.default-secret-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.admin-password}' | base64 --decode; echo
```

You can also create a credential of your own in the dashboard (Access > Credentials); the secret key is shown once.

Responses are dictionaries with the server's camelCase field names, exactly as documented in `REST_API.md`.

## Authentication

| Method | Effect |
|---|---|
| `login(email, password, tenant_id=None)` | Issues a user token and switches to bearer authentication. |
| `login_with_keys(access_key, secret_key)` | Issues a credential token and switches to bearer authentication. |
| `use_token(token, tenant_id)` | Uses an existing token. |
| `use_access_key(access_key, secret_key, tenant_id)` | Sends the key pair on every request. |
| `use_signed_requests(access_key, secret_key, tenant_id)` | Signs every request with HMAC-SHA256. |
| `use_admin_api_key(api_key, tenant_id=None)` | Uses the platform admin API key. |

## Modules

`tenants`, `users`, `credentials`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `credential_scope_assignments`, `agents`, `deployments`, `harness_profiles`, `prompt_templates`, `mcp_servers`, `secrets`, `workspace_templates`, `artifact_stores`, `manifests`, `runs`, `analytics`, `nodes`, `control_nodes`, `node_pools`, `request_history`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls.

Control-plane replicas are read-only: `client.control_nodes.list(max_results, skip, search)` returns a page with `respondingNodeId` (the replica that answered), and `client.control_nodes.get(node_id)` reads one replica. Each record carries `status` (`Starting`, `Ready`, `Draining`, `Offline`), `version`, `schemaVersion`, `backplane`, `startedUtc`, `lastHeartbeatUtc`, `activeRequests`, `openStreams`, `heldLongPolls`, `isLeader`, and `leaderEpoch` (leader only). The tenant overview also returns `controlNodesByStatus` and `leaderNodeId`.

## Streaming run events

```python
run = client.runs.create("Hello", agent_name="my-agent")
for item in client.runs.stream(run["id"]):
    if "event" in item:
        print(item["event"]["eventType"], item["event"].get("text"))
    if "run" in item:
        print("finished:", item["run"]["status"])
```

The iterator ends after `run.completed`. `runs.events` polls, and `runs.wait_for_completion` waits for a terminal status.

## Run metrics

Run dictionaries carry timing and usage fields alongside `inputTokens`, `outputTokens`, `cachedTokens`, and `costUsd`:

| Field | Type | Meaning |
|---|---|---|
| `firstTokenUtc`, `lastTokenUtc` | ISO 8601 UTC string or absent | First and last model output event. |
| `timeToFirstTokenMs`, `streamingMs`, `executionMs`, `queueMs`, `totalMs` | int or absent | Durations in milliseconds. |
| `delegationWaitMs` | int or absent | Time the run spent waiting on child runs it started (delegation), measured from server timestamps of the runs whose `parentRunId` is this run. |
| `timeToFirstTokenExcludingDelegationMs` | int or absent | `timeToFirstTokenMs` minus the delegation wait that happened before the first token; never negative. Use it to compare delegating agents with agents that answer directly. |
| `outputTokensPerSecond` | float or `None` | Output throughput. Always present; `None` when it cannot be measured (no streaming window, or one shorter than 100 ms). |
| `reasoningTokens` | int, default 0 | Reasoning tokens reported by the harness. |
| `toolCallCount` | int, default 0 | Tool calls made during the run. |

The server omits most fields it cannot measure, so read them with `run.get(...)`. A few keys are always present and are `None` when there is nothing to report: `outputTokensPerSecond`, `blockedReason`, `outputSchemaValid`, and `schemaValidationErrors`. `run.get(...)` handles both cases.

`run["blockedReason"]` is computed by the server when a run is read. It is `None` unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `blockedRuns`. See "Blocked runs" in `REST_API.md`.

Runs stopped by a worker run guard end `Failed` with outcome `RepetitionDetected` (the assistant text degenerated into a short repeated unit or into text with no letters or digits), `OutputLimitExceeded` (more assistant text than the deployment's `maxAssistantChars`), or `NoProgress` (nothing happened for `noProgressSeconds`). The partial output is in `run["resultText"]`, and the run has one `Warning` event with code `RunGuardTriggered`. A waiting invoke cancels its run when the connection drops; pass `cancel_on_disconnect=False` to `agents.invoke` or `runs.create` to keep the run going. See "Run guards" and "Cancellation" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `run["outputSchemaValid"]` is `True` or `False` after validation and `None` when nothing was validated, `run["schemaValidationErrors"]` holds the first few errors of a failed validation, and `run["repairAttempts"]` (0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with outcome `SchemaValidationFailed`. See "Structured output validation" in `REST_API.md`.

## Run analytics

```python
from datetime import datetime, timedelta, timezone

now = datetime.now(timezone.utc)
result = client.analytics.runs(from_=now - timedelta(days=1), to=now, interval="hour", group_by="agent")
print(result["totals"]["runs"], result["totals"]["costUsd"])
for series in result["series"]:
    for bucket in series["buckets"]:
        print(series["label"], bucket["startUtc"], bucket["runs"], bucket["timeToFirstTokenMsP95"])
```

`analytics.runs(from_=None, to=None, interval=None, agent_id=None, harness_type=None, deployment_id=None, group_by=None, model=None)` accepts `datetime` values or ISO 8601 UTC strings for `from_` and `to`. `interval` is `minute`, `hour`, `day`, `week`, or `auto`. `model` keeps only runs whose served model equals the value, and `"unknown"` matches runs without a recorded model. `group_by` is `none`, `agent`, `harness`, `model`, or `harnessModel`; with `harnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-5-5`) and its label is `Harness / model`. The response carries `fromUtc`, `toUtc`, `interval`, `bucketSeconds` (authoritative bucket size), `truncated` (true when the 100,000 run cap was hit), `totals`, and `series` (each with `key`, `label`, and `buckets`). Totals and buckets share the same metrics: counts by outcome, token totals, `toolCalls`, `costUsd`, and latency averages and percentiles that are `None` when there are no samples. Besides `timeToFirstTokenMsAvg`, `timeToFirstTokenMsP50`, and `timeToFirstTokenMsP95`, the metrics include `timeToFirstTokenExcludingDelegationMsAvg`, `timeToFirstTokenExcludingDelegationMsP50`, `timeToFirstTokenExcludingDelegationMsP95`, and `delegationWaitMsAvg`, so agents that delegate can be compared with agents that answer directly. A range where `from_ >= to`, one that needs more than 400 buckets, or an invalid parameter raises `GarrisonError` with status 400.

To fill filter pickers, `analytics.dimensions(from_=None, to=None)` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` and returns the distinct values among runs in the range (default: the last 24 hours):

```python
dims = client.analytics.dimensions(from_=now - timedelta(days=7), to=now)
for model in dims["models"]:
    report = client.analytics.runs(from_=now - timedelta(days=7), to=now, model=model)
    print(model, report["totals"]["runs"])
```

The result is `{"agents": [{"id", "name"}], "harnesses": [str], "deployments": [{"id", "name", "agentId"}], "models": [str], "truncated": bool}`. Lists are sorted by name, and `"unknown"` in `models` stands for runs without a recorded model.

## Manifests

```python
result = client.manifests.apply(open("agents.yaml").read(), dry_run=True)
for item in result["items"]:
    print(item["kind"], item["name"], item["result"], item.get("message"))
    for change in item.get("changes", []):
        print("  ", change["field"], change.get("before"), "->", change.get("after"))
```

Each item reports what the apply did, or for a dry run what it would do. Items that are (or would be) `Updated` carry `changes`, a list of `{"field", "before", "after"}` with values as strings truncated to 200 characters.

## Errors

Non-success responses raise `GarrisonError` with `status_code`, `code`, `body`, and the parsed `error` payload. Validation failures carry field details in `error["fields"]`. The settings routes return 400 with `error["errors"]`, an object keyed by setting path (for example `Audit.RetentionDays`) whose values say what is wrong; nothing is saved when any value is rejected.

## Test harness

```bash
python test_harness.py http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```

The arguments are the base URL, an access key, and a secret key. The values above are the Docker Compose and source-build defaults; on Kubernetes pass the keys from Secret `garrison-secrets` (see "Where the credentials come from"). When the server rejects the keys, the harness stops after the first check with one message that says so, instead of running the remaining checks.
