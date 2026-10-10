#!/usr/bin/env python3
"""End-to-end harness for the Garrison Python SDK.

Usage: python test_harness.py [baseUrl] [accessKey] [secretKey]
Requires a running server and a worker able to run the builtin/fake harness profile.
"""

import sys
import time
import traceback
import uuid
from datetime import datetime, timedelta, timezone

from garrison_sdk import GarrisonClient, GarrisonError

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8700"
ACCESS = sys.argv[2] if len(sys.argv) > 2 else "access_garrison_default"
SECRET = sys.argv[3] if len(sys.argv) > 3 else "secret_garrison_default_change_me"
SUFFIX = uuid.uuid4().hex[:8]

passed = 0
failures = []
state = {}


def check(name, fn):
    global passed
    started = time.monotonic()
    try:
        fn()
        passed += 1
        print(f"PASS  {name} ({int((time.monotonic() - started) * 1000)}ms)")
    except Exception as e:  # noqa: BLE001 - harness reports every failure
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")
        if "--verbose" in sys.argv:
            traceback.print_exc()


def require(condition, message):
    if not condition:
        raise AssertionError(message)


client = GarrisonClient(BASE)
print(f"Garrison Python SDK harness against {BASE}")


def t_health():
    require(client.health()["status"] == "healthy", "not healthy")


def t_token():
    try:
        issued = client.login_with_keys(ACCESS, SECRET)
    except GarrisonError as e:
        if e.status_code in (401, 403):
            state["auth_failed"] = e.status_code
        raise
    require(issued.get("token"), "no token")
    state["tenant"] = issued.get("tenantId")
    require(client.token_details()["principalType"] == "Credential", "unexpected principal")


def t_signed():
    signed = GarrisonClient(BASE)
    signed.use_signed_requests(ACCESS, SECRET, state.get("tenant") or "default")
    require(signed.agents.list(max_results=5)["success"], "list failed")


def t_builtin():
    profiles = client.harness_profiles.builtin()
    fake = [p for p in profiles if p["name"] == "builtin/fake"]
    require(fake, "builtin/fake not found")
    state["fake"] = fake[0]["id"]


def t_create():
    agent = client.agents.create({"name": f"sdk-py-{SUFFIX}", "description": "Python SDK harness scratch agent."})
    state["agent"] = agent["id"]
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-fake", "agentId": agent["id"], "harnessProfileId": state["fake"]})
    state["deployment"] = deployment["id"]


def t_invoke():
    run = client.agents.invoke(state["agent"], "Hello from the Python SDK", wait=True, wait_seconds=90)
    require(run["status"] == "Succeeded", f"status {run['status']} {run.get('errorMessage')}")
    require((run.get("resultText") or "").startswith("Echo:"), f"result {run.get('resultText')}")
    state["run"] = run["id"]
    state["model"] = run.get("servedModel") or "unknown"


def t_run_metrics():
    run = client.runs.get(state["run"])
    ttft = run.get("timeToFirstTokenMs")
    execution = run.get("executionMs")
    require(ttft is not None and ttft >= 0, f"timeToFirstTokenMs {ttft}")
    require(execution is not None and execution >= 0, f"executionMs {execution}")
    require(run.get("toolCallCount", 0) >= 0, f"toolCallCount {run.get('toolCallCount')}")


def _window():
    now = datetime.now(timezone.utc)
    return now - timedelta(hours=1), now + timedelta(minutes=1)


def t_analytics():
    start, end = _window()
    result = client.analytics.runs(from_=start, to=end, interval="minute")
    require(result["totals"]["runs"] >= 1, f"totals.runs {result['totals']['runs']}")
    require(len(result["series"]) >= 1, "no series")
    for series in result["series"]:
        require(len(series["buckets"]) > 0, f"series {series['key']} has no buckets")
        require(all(b.get("startUtc") for b in series["buckets"]), f"series {series['key']} bucket without startUtc")


def t_analytics_group():
    start, end = _window()
    result = client.analytics.runs(from_=start, to=end, interval="auto", group_by="harness")
    require(len(result["series"]) >= 1, "no series")


def t_analytics_harness_model():
    start, end = _window()
    result = client.analytics.runs(from_=start, to=end, group_by="harnessModel")
    require(len(result["series"]) >= 1, "no series")
    for series in result["series"]:
        require("|" in series["key"], f"series key {series['key']}")
        require(" / " in series["label"], f"series label {series['label']}")


def t_analytics_dimensions():
    start, end = _window()
    dims = client.analytics.dimensions(from_=start, to=end)
    require(any(a["id"] == state["agent"] for a in dims["agents"]), "scratch agent missing from dimensions")
    require(any(d["id"] == state["deployment"] and d["agentId"] == state["agent"] for d in dims["deployments"]),
            "scratch deployment missing from dimensions")
    require(len(dims["harnesses"]) >= 1, "no harnesses")
    require(state["model"] in dims["models"], f"model {state['model']} missing from {dims['models']}")
    require(isinstance(dims["truncated"], bool), "truncated is not a bool")


def t_analytics_model():
    start, end = _window()
    matched = client.analytics.runs(from_=start, to=end, agent_id=state["agent"], model=state["model"])
    require(matched["totals"]["runs"] >= 1, f"model {state['model']} matched {matched['totals']['runs']} runs")
    none = client.analytics.runs(from_=start, to=end, agent_id=state["agent"], model="garrison-sdk-no-such-model")
    require(none["totals"]["runs"] == 0, f"unknown model matched {none['totals']['runs']} runs")


def t_analytics_invalid():
    start, end = _window()
    try:
        client.analytics.runs(from_=end, to=start)
    except GarrisonError as e:
        require(e.status_code == 400, f"status {e.status_code}")
        return
    raise AssertionError("expected 400 for from >= to")


def t_stream():
    run = client.runs.create("Stream this please", agent_id=state["agent"])
    events, final = 0, None
    for item in client.runs.stream(run["id"]):
        if "event" in item:
            events += 1
        if "run" in item:
            final = item["run"]
    require(final is not None, "no run.completed")
    require(final["status"] == "Succeeded", f"status {final['status']}")
    require(events > 0, "no events")


def t_cancel():
    run = client.runs.create("Cancel me", agent_id=state["agent"])
    try:
        client.runs.cancel(run["id"])
    except GarrisonError as e:
        if e.status_code != 409:
            raise
    final = client.runs.wait_for_completion(run["id"], timeout=60)
    require(final["status"] in ("Cancelled", "Succeeded"), f"status {final['status']}")


def t_manifest():
    yaml = f"apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-py-manifest-{SUFFIX}\nspec:\n  description: Dry run only.\n"
    result = client.manifests.apply(yaml, dry_run=True)
    require(result["dryRun"], "not a dry run")
    require(result["failedCount"] == 0, f"failed {result['failedCount']}")


def t_list_runs():
    page = client.runs.list(agent_id=state["agent"])
    require(page["totalRecords"] >= 3, f"total {page['totalRecords']}")
    require(all(r["agentId"] == state["agent"] for r in page["objects"]), "foreign runs")


def t_cleanup():
    if "deployment" in state:
        client.deployments.delete(state["deployment"])
    if "agent" in state:
        client.agents.delete(state["agent"])


AUTH_HELP = (
    "Authentication failed (HTTP {status}): the server rejected access key {access}. The remaining checks need a "
    "signed-in client, so the harness stops here. Pass this server's keys as arguments: "
    "python test_harness.py <baseUrl> <accessKey> <secretKey>. Docker Compose and source builds default to "
    "access_garrison_default and secret_garrison_default_change_me; on Kubernetes read default-access-key and "
    "default-secret-key from Secret garrison-secrets (see README, \"Where the credentials come from\")."
)

for name, fn in [("health", t_health), ("token auth", t_token), ("signed request auth", t_signed),
                 ("builtin harness profiles", t_builtin), ("create agent and deployment", t_create),
                 ("invoke with wait", t_invoke), ("run timing metrics", t_run_metrics),
                 ("run analytics", t_analytics), ("run analytics grouped by harness", t_analytics_group),
                 ("run analytics grouped by harness and model", t_analytics_harness_model),
                 ("run analytics dimensions", t_analytics_dimensions), ("run analytics filtered by model", t_analytics_model),
                 ("run analytics rejects from >= to", t_analytics_invalid), ("stream events", t_stream), ("cancel run", t_cancel),
                 ("manifest dry run", t_manifest), ("list runs by agent", t_list_runs), ("cleanup", t_cleanup)]:
    check(name, fn)
    if "auth_failed" in state:
        print()
        print(AUTH_HELP.format(status=state["auth_failed"], access=ACCESS))
        sys.exit(1)

print(f"\nPassed: {passed}  Failed: {len(failures)}")
for f in failures:
    print(f"  FAIL {f}")
sys.exit(0 if not failures else 1)
