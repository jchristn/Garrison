# garrison-sdk (Python)

Python client for the Garrison REST API. Requires Python 3.9+ and `requests`.

## Install

```bash
pip install garrison-sdk          # or, from this folder: pip install -e .
```

## Quick start

```python
from garrison_sdk import GarrisonClient

client = GarrisonClient("http://127.0.0.1:8700")
client.login_with_keys("access_...", "secret_...")

run = client.agents.invoke("my-agent", "Summarize the release notes", wait=True, wait_seconds=120)
print(run["status"], run.get("resultText"))
```

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

`tenants`, `users`, `credentials`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `credential_scope_assignments`, `agents`, `deployments`, `harness_profiles`, `prompt_templates`, `mcp_servers`, `secrets`, `workspace_templates`, `artifact_stores`, `manifests`, `runs`, `analytics`, `nodes`, `node_pools`, `request_history`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls.

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
| `outputTokensPerSecond` | float or absent | Output throughput. |
| `reasoningTokens` | int, default 0 | Reasoning tokens reported by the harness. |
| `toolCallCount` | int, default 0 | Tool calls made during the run. |

The server omits fields it cannot measure, so read them with `run.get(...)`.

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

`analytics.runs(from_=None, to=None, interval=None, agent_id=None, harness_type=None, deployment_id=None, group_by=None, model=None)` accepts `datetime` values or ISO 8601 UTC strings for `from_` and `to`. `interval` is `minute`, `hour`, `day`, `week`, or `auto`. `model` keeps only runs whose served model equals the value, and `"unknown"` matches runs without a recorded model. `group_by` is `none`, `agent`, `harness`, `model`, or `harnessModel`; with `harnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-4-5`) and its label is `Harness / model`. The response carries `fromUtc`, `toUtc`, `interval`, `bucketSeconds` (authoritative bucket size), `truncated` (true when the 100,000 run cap was hit), `totals`, and `series` (each with `key`, `label`, and `buckets`). Totals and buckets share the same metrics: counts by outcome, token totals, `toolCalls`, `costUsd`, and latency averages and percentiles that are `None` when there are no samples. A range where `from_ >= to`, one that needs more than 400 buckets, or an invalid parameter raises `GarrisonError` with status 400.

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
```

## Errors

Non-success responses raise `GarrisonError` with `status_code`, `code`, `body`, and the parsed `error` payload.

## Test harness

```bash
python test_harness.py http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```
