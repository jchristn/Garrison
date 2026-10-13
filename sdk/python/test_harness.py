#!/usr/bin/env python3
"""End-to-end harness for the Garrison Python SDK.

Usage: python test_harness.py [baseUrl] [accessKey] [secretKey]
Requires a running server and a worker able to run the builtin/fake harness profile.
"""

import re
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


def t_prices():
    price = client.model_prices.create({"name": f"sdk-py-price-{SUFFIX}", "model": f"fixture-py-{SUFFIX}", "harnessType": "Generic", "inputUsdPerMillion": 0.5, "outputUsdPerMillion": 2, "cachedInputUsdPerMillion": None, "reasoningUsdPerMillion": 0, "inputIncludesCachedTokens": False, "outputIncludesReasoningTokens": True})
    try:
        saved = client.model_prices.get(price["id"])
        require(saved["inputUsdPerMillion"] == 0.5 and saved["reasoningUsdPerMillion"] == 0 and not saved["inputIncludesCachedTokens"], "price fields")
        require(any(p["id"] == price["id"] for p in client.model_prices.list(search=price["name"])["objects"]), "price list")
        saved["outputUsdPerMillion"] = 3
        require(client.model_prices.update(price["id"], saved)["outputUsdPerMillion"] == 3, "price update")
    finally:
        client.model_prices.delete(price["id"])


def t_quotas():
    quota = client.usage_quotas.create({"name": f"sdk-py-quota-{SUFFIX}", "scope": "Agent", "resourceId": state["agent"], "dailyRunLimit": 100, "dailyCostUsdLimit": 0.125})
    try:
        require(quota["enforcementEnabled"] is False and client.usage_quotas.get(quota["id"])["dailyRunLimit"] == 100, "quota fields and default monitoring")
        usage = client.usage_quotas.usage(quota["id"])
        require(usage["runsUsed"] == 0 and usage["costAccountingComplete"] and usage["windowEndUtc"], "quota usage")
        quota["dailyRunLimit"] = None
        quota["enforcementEnabled"] = True
        updated = client.usage_quotas.update(quota["id"], quota)
        require(updated.get("dailyRunLimit") is None and updated["enforcementEnabled"], "explicit enforcement opt-in")
    finally:
        client.usage_quotas.delete(quota["id"])


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
    trace_id = run.get("traceId")
    require(isinstance(trace_id, str) and re.fullmatch(r"[0-9a-f]{32}", trace_id) is not None, f"traceId {trace_id}")


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


def t_conversation_start():
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-turns", "agentId": state["agent"],
                                            "harnessProfileId": state["fake"],
                                            "parameters": [{"name": "reportTurns", "value": "true"}]})
    state["conversation_deployment"] = deployment["id"]
    run = client.agents.invoke(state["agent"], "First turn from the Python SDK", wait=True, wait_seconds=90,
                               deployment_id=deployment["id"], start_conversation=True)
    require(run["status"] == "Succeeded", f"status {run['status']} {run.get('errorMessage')}")
    conversation_id = run.get("conversationId") or ""
    require(conversation_id.startswith("cnv_"), f"conversationId {conversation_id}")
    require(run.get("conversationTurn") == 1, f"conversationTurn {run.get('conversationTurn')}")
    require((run.get("resultText") or "").startswith("[turn 1] "), f"result {run.get('resultText')}")
    state["conversation"] = conversation_id


def t_conversation_continue():
    run = client.agents.invoke(state["agent"], "Second turn from the Python SDK", wait=True, wait_seconds=90,
                               conversation_id=state["conversation"])
    require(run["status"] == "Succeeded", f"status {run['status']} {run.get('errorMessage')}")
    require(run.get("conversationId") == state["conversation"], f"conversationId {run.get('conversationId')}")
    require(run.get("conversationTurn") == 2, f"conversationTurn {run.get('conversationTurn')}")
    require((run.get("resultText") or "").startswith("[turn 2] "), f"result {run.get('resultText')}")


def t_conversation_read():
    conversation = client.conversations.get(state["conversation"])
    require(conversation["turnCount"] == 2, f"turnCount {conversation['turnCount']}")
    require(conversation.get("sessionId"), "sessionId empty")
    require(conversation["deploymentId"] == state["conversation_deployment"], f"deploymentId {conversation['deploymentId']}")
    require(conversation["busy"] is False, "busy")
    page = client.conversations.list(agent_id=state["agent"])
    require(any(c["id"] == state["conversation"] for c in page["objects"]), "conversation missing from list")
    turns = client.conversations.list_runs(state["conversation"])["objects"]
    require(len(turns) == 2, f"turns {len(turns)}")
    require([r["conversationTurn"] for r in turns] == [1, 2], f"turn order {[r['conversationTurn'] for r in turns]}")
    runs = client.runs.list(conversation_id=state["conversation"])
    require(runs["totalRecords"] == 2, f"runs by conversationId {runs['totalRecords']}")


def t_conversation_delete():
    client.conversations.delete(state["conversation"])
    try:
        client.conversations.get(state["conversation"])
        raise AssertionError("expected 404 after delete")
    except GarrisonError as e:
        require(e.status_code == 404, f"status {e.status_code}")
    try:
        client.agents.invoke(state["agent"], "Turn for a deleted conversation", conversation_id=state["conversation"])
        raise AssertionError("expected 404 continuing a deleted conversation")
    except GarrisonError as e:
        require(e.status_code == 404, f"status {e.status_code}")


def t_control_nodes():
    page = client.control_nodes.list()
    assert page.get("respondingNodeId"), "respondingNodeId empty"
    nodes = page["objects"]
    assert any(n["status"] == "Ready" for n in nodes), f"no Ready control node among {len(nodes)}"
    leaders = [n for n in nodes if n.get("isLeader")]
    assert len(leaders) == 1, f"leaders {len(leaders)}"
    read = client.control_nodes.get(nodes[0]["id"])
    assert read["id"] == nodes[0]["id"], f"read id {read['id']}"
    assert read.get("respondingNodeId") == page["respondingNodeId"], f"read respondingNodeId {read.get('respondingNodeId')}"
    overview = client.overview()
    assert any(c["status"] == "Ready" and c["count"] >= 1 for c in overview.get("controlNodesByStatus", [])), "overview controlNodesByStatus"
    assert overview.get("leaderNodeId"), "overview leaderNodeId empty"


def _expect_status(status, fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except GarrisonError as e:
        require(e.status_code == status, f"status {e.status_code}, expected {status}")
        return
    raise AssertionError(f"expected {status}")


def t_approvals():
    pending = client.approvals.list(status="Pending", max_results=1)
    require(all(a["status"] == "Pending" for a in pending["objects"]), "non-pending approval in Pending list")
    require(pending["totalRecords"] >= len(pending["objects"]), f"totalRecords {pending['totalRecords']}")
    scoped = client.approvals.list(deployment_id=state["deployment"])
    require(len(scoped["objects"]) == 0, f"scratch deployment has {len(scoped['objects'])} approvals")
    _expect_status(404, client.approvals.get, f"apr_missing{SUFFIX}")
    _expect_status(404, client.approvals.decide, f"apr_missing{SUFFIX}", "Allow")


def t_approval_check():
    deployment = client.deployments.get(state["deployment"])
    require(deployment.get("approvalsEnabled") is False, f"approvalsEnabled {deployment.get('approvalsEnabled')}")
    require(deployment.get("approvalDefaultAction") == "Ask", f"approvalDefaultAction {deployment.get('approvalDefaultAction')}")
    require(deployment.get("approvalTimeoutSeconds") == 300, f"approvalTimeoutSeconds {deployment.get('approvalTimeoutSeconds')}")
    require(deployment.get("approvalTimeoutDecision") == "Deny", f"approvalTimeoutDecision {deployment.get('approvalTimeoutDecision')}")
    deployment["approvalRules"] = [{"action": "Allow", "pattern": "Bash(git status:*)"},
                                   {"action": "Deny", "pattern": "Bash(rm:*)", "description": "Python SDK harness rule."}]
    deployment["approvalDefaultAction"] = "Deny"
    deployment = client.deployments.update(state["deployment"], deployment)
    rules = deployment["approvalRules"]
    require(len(rules) == 2 and all(r["id"].startswith("dar_") for r in rules), f"rules {rules}")
    allowed = client.approvals.check(state["deployment"], "Bash", {"command": "git status --short"})
    require(allowed["action"] == "Allow" and allowed["source"] == "Rule", f"git status {allowed}")
    require(allowed["rulePattern"] == "Bash(git status:*)", f"rulePattern {allowed['rulePattern']}")
    require(allowed["approvalsEnabled"] is False, "approvalsEnabled true on a fake deployment")
    denied = client.approvals.check(state["deployment"], "Bash", {"command": "rm -rf build"})
    require(denied["action"] == "Deny" and denied["source"] == "Rule", f"rm {denied}")
    fallback = client.approvals.check(state["deployment"], "Edit", {"file_path": "src/app.py"})
    require(fallback["action"] == "Deny" and fallback["source"] == "Default", f"edit {fallback}")
    require(fallback.get("suggestedRule"), "suggestedRule empty")
    deployment["approvalsEnabled"] = True
    _expect_status(400, client.deployments.update, state["deployment"], deployment)
    run = client.runs.get(state["run"])
    require(run.get("pendingApprovals") == 0 and run.get("awaitingApproval") is False,
            f"run pendingApprovals {run.get('pendingApprovals')} awaitingApproval {run.get('awaitingApproval')}")


def t_cleanup():
    if "conversation_deployment" in state:
        client.deployments.delete(state["conversation_deployment"])
    if "deployment" in state:
        client.deployments.delete(state["deployment"])
    if "agent" in state:
        # Single-resource deletes answer 204 No Content (G-7), which the SDK returns as None.
        deleted = client.agents.delete(state["agent"])
        assert deleted is None, f"agent delete returned a body: {deleted!r}"


AUTH_HELP = (
    "Authentication failed (HTTP {status}): the server rejected access key {access}. The remaining checks need a "
    "signed-in client, so the harness stops here. Pass this server's keys as arguments: "
    "python test_harness.py <baseUrl> <accessKey> <secretKey>. Docker Compose and source builds default to "
    "access_garrison_default and secret_garrison_default_change_me; on Kubernetes read default-access-key and "
    "default-secret-key from Secret garrison-secrets (see README, \"Where the credentials come from\")."
)

for name, fn in [("health", t_health), ("token auth", t_token), ("signed request auth", t_signed),
                 ("model price CRUD", t_prices), ("builtin harness profiles", t_builtin), ("create agent and deployment", t_create), ("usage quota CRUD and meters", t_quotas),
                 ("invoke with wait", t_invoke), ("run timing metrics", t_run_metrics),
                 ("run analytics", t_analytics), ("run analytics grouped by harness", t_analytics_group),
                 ("run analytics grouped by harness and model", t_analytics_harness_model),
                 ("run analytics dimensions", t_analytics_dimensions), ("run analytics filtered by model", t_analytics_model),
                 ("run analytics rejects from >= to", t_analytics_invalid), ("stream events", t_stream), ("cancel run", t_cancel),
                 ("manifest dry run", t_manifest), ("list runs by agent", t_list_runs),
                 ("conversation start", t_conversation_start), ("conversation continue", t_conversation_continue),
                 ("conversation read and list", t_conversation_read), ("conversation delete", t_conversation_delete),
                 ("control nodes", t_control_nodes),
                 ("approvals list and read", t_approvals), ("approval rules and approval check", t_approval_check),
                 ("cleanup", t_cleanup)]:
    check(name, fn)
    if "auth_failed" in state:
        print()
        print(AUTH_HELP.format(status=state["auth_failed"], access=ACCESS))
        sys.exit(1)

print(f"\nPassed: {passed}  Failed: {len(failures)}")
for f in failures:
    print(f"  FAIL {f}")
sys.exit(0 if not failures else 1)
