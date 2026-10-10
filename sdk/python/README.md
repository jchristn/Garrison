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

`tenants`, `users`, `credentials`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `credential_scope_assignments`, `agents`, `deployments`, `harness_profiles`, `prompt_templates`, `mcp_servers`, `secrets`, `workspace_templates`, `artifact_stores`, `manifests`, `runs`, `nodes`, `node_pools`, `request_history`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls.

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
