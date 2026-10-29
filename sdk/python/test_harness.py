#!/usr/bin/env python3
"""End-to-end harness for the Garrison Python SDK.

Usage: python test_harness.py [baseUrl] [accessKey] [secretKey]
Requires a running server and a worker able to run the builtin/fake harness profile.
"""

import hashlib
import json
import os
import re
import sys
import time
import traceback
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import requests

from garrison_sdk import (EFFECT_POLICIES, EGRESS_PROTOCOLS, FIELD_WARNING_CODES, RUN_BLOCKED_REASONS, TRUST_LEVELS, FieldWarning, GarrisonClient,
                          GarrisonError, sign_webhook, verify_webhook)

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
    require(any(p["name"] == "builtin/provider-api" and p["harnessType"] == "ProviderApi" and p["outputParser"] == "ProviderApiJsonl" for p in profiles), "optional provider profile")
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


def t_trust_level():
    require(TRUST_LEVELS == ("Trusted", "Untrusted") and "NoIsolatingWorker" in RUN_BLOCKED_REASONS, "trust constants")
    trusted = client.deployments.get(state["deployment"])
    require(trusted.get("trustLevel") == "Trusted", f"default trustLevel {trusted.get('trustLevel')}")
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-untrusted", "agentId": state["agent"], "harnessProfileId": state["fake"],
                                            "trustLevel": "Untrusted", "weight": 0})
    try:
        require(deployment["trustLevel"] == "Untrusted", f"trustLevel {deployment['trustLevel']}")
        run = client.runs.create("Untrusted input", agent_id=state["agent"], deployment_id=deployment["id"])
        read = client.runs.get(run["id"])
        require(read["trustLevel"] == "Untrusted" and read["executor"] == "KubernetesJob", f"run {read['trustLevel']} {read['executor']}")
        require(read["status"] == "Queued" and read["blockedReason"] == "NoIsolatingWorker", f"run {read['status']} {read['blockedReason']}")
        client.runs.cancel(run["id"])
    finally:
        client.deployments.delete(deployment["id"])


def t_effect_policy():
    require(EFFECT_POLICIES == ("AtMostOnce", "AtLeastOnce", "Journaled"), "effect policy constants")
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-effect", "agentId": state["agent"], "harnessProfileId": state["fake"],
                                            "weight": 0})
    try:
        require(deployment["effectPolicy"] == "AtMostOnce" and deployment["retryOnNodeLoss"] is False, f"default effectPolicy {deployment['effectPolicy']}")
        body = {k: v for k, v in deployment.items() if k != "retryOnNodeLoss"}
        body["effectPolicy"] = "AtLeastOnce"
        updated = client.deployments.update(deployment["id"], body)
        require(updated["effectPolicy"] == "AtLeastOnce" and updated["retryOnNodeLoss"] is True, f"updated effectPolicy {updated['effectPolicy']}")
        conflict = dict(body, effectPolicy="AtMostOnce", retryOnNodeLoss=True)
        try:
            client.deployments.update(deployment["id"], conflict)
            raise AssertionError("conflicting effectPolicy and retryOnNodeLoss accepted")
        except GarrisonError as e:
            require(e.status_code == 400 and "EffectPolicyConflict" in str(e.body), f"conflict {e.status_code} {e.body}")
        run = client.runs.create("Effect policy", agent_id=state["agent"], deployment_id=deployment["id"])
        require(run["effectPolicy"] == "AtLeastOnce", f"run effectPolicy {run.get('effectPolicy')}")
        client.runs.cancel(run["id"])
    finally:
        client.deployments.delete(deployment["id"])


def t_egress_rules():
    require(EGRESS_PROTOCOLS == ("TCP", "UDP"), "egress protocol constants")
    rule = {"cidr": "203.0.113.0/24", "port": 443, "protocol": "TCP"}
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-egress", "agentId": state["agent"], "harnessProfileId": state["fake"],
                                            "weight": 0, "egressRules": [rule]})
    try:
        read = client.deployments.get(deployment["id"])
        rules = read.get("egressRules") or []
        require(len(rules) == 1 and rules[0].get("cidr") == "203.0.113.0/24" and rules[0].get("port") == 443 and rules[0].get("protocol") == "TCP",
                f"egressRules {rules}")
        bad = dict(read, egressRules=[{"cidr": "203.0.113.7/24", "port": 443, "protocol": "TCP"}])
        try:
            client.deployments.update(deployment["id"], bad)
            raise AssertionError("CIDR with host bits accepted")
        except GarrisonError as e:
            require(e.status_code == 400 and "InvalidCidr" in str(e.body), f"bad cidr {e.status_code} {e.body}")
        run = client.runs.create("Egress allowlist", agent_id=state["agent"], deployment_id=deployment["id"])
        queued = client.runs.get(run["id"])
        require(queued["executor"] == "KubernetesJob", f"run executor {queued.get('executor')}")
        require(queued["status"] == "Queued" and queued["blockedReason"] == "NoIsolatingWorker", f"run {queued['status']} {queued['blockedReason']}")
        client.runs.cancel(run["id"])
    finally:
        client.deployments.delete(deployment["id"])


def t_manifest():
    yaml = f"apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-py-manifest-{SUFFIX}\nspec:\n  description: Dry run only.\n"
    result = client.manifests.apply(yaml, dry_run=True)
    require(result["dryRun"], "not a dry run")
    require(result["failedCount"] == 0, f"failed {result['failedCount']}")
    require(result["items"][0]["warnings"] == [], f"unexpected warnings {result['items'][0]['warnings']}")
    clamped = client.manifests.apply(yaml.replace("description: Dry run only.", "description: Dry run only.\n  delegationMaxDepth: 99"),
                                     dry_run=True)
    warning = next((w for w in clamped["items"][0]["warnings"] if w["field"] == "delegationMaxDepth"), None)
    require(warning is not None and warning["code"] == "ValueClamped" and warning["given"] == "99" and warning["stored"] == "10",
            f"manifest warnings {clamped['items'][0]['warnings']}")


def t_clamp_warnings():
    require(FIELD_WARNING_CODES == ("ValueClamped",), "field warning codes")
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-clamp", "agentId": state["agent"], "harnessProfileId": state["fake"],
                                            "weight": 0, "maxAttempts": 99})
    try:
        require(deployment["maxAttempts"] == 10, f"stored maxAttempts {deployment['maxAttempts']}")
        warning: Optional[FieldWarning] = next((w for w in deployment.get("warnings", []) if w["field"] == "maxAttempts"), None)
        require(warning is not None and warning["code"] == "ValueClamped" and warning["given"] == "99" and warning["stored"] == "10"
                and warning["message"], f"create warnings {deployment.get('warnings')}")
        body = {k: v for k, v in deployment.items() if k != "warnings"}
        body["maxAttempts"] = 3
        updated = client.deployments.update(deployment["id"], body)
        require(updated["maxAttempts"] == 3 and "warnings" not in updated, f"update warnings {updated.get('warnings')}")
        require("warnings" not in client.deployments.get(deployment["id"]), "reads carry no warnings")
    finally:
        client.deployments.delete(deployment["id"])


def t_node_containerized():
    nodes = client.nodes.list()["objects"]
    require(len(nodes) > 0, "no nodes")
    require(all(isinstance(n.get("containerized"), bool) for n in nodes), "containerized missing")
    worker = next((n for n in nodes if n["name"] == "sdk-harness-worker"), None)
    require(worker is None or worker["containerized"] is False, f"harness worker containerized {worker and worker['containerized']}")


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


def t_run_transcript():
    markdown = client.runs.transcript_markdown(state["run"])
    require(f"sdk-py-{SUFFIX}" in markdown, "markdown lacks the agent name")
    require("Hello from the Python SDK" in markdown, "markdown lacks the input")
    transcript = client.runs.transcript(state["run"])
    require(transcript["schema"] == "garrison.transcript/v1" and transcript["kind"] == "Run", f"schema {transcript.get('schema')} kind {transcript.get('kind')}")
    require(transcript["runId"] == state["run"] and transcript["agentName"] == f"sdk-py-{SUFFIX}", f"run {transcript.get('runId')} agent {transcript.get('agentName')}")
    require(transcript["turnCount"] == 1 and len(transcript["turns"]) == 1, f"turns {transcript.get('turnCount')}")
    require(transcript["turns"][0].get("input") == "Hello from the Python SDK", f"turn input {transcript['turns'][0].get('input')}")
    require(transcript["includesThinking"] is False, "thinking included by default")


def t_input_schema():
    schema = {"type": "object", "properties": {"topic": {"type": "string"}, "count": {"type": "integer"}}, "required": ["topic"]}
    agent = client.agents.create({"name": f"sdk-py-{SUFFIX}-schema", "inputMode": "Structured", "inputSchemaJson": json.dumps(schema)})
    deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-schema-fake", "agentId": agent["id"], "harnessProfileId": state["fake"]})
    try:
        require("topic" in (agent.get("inputSchemaJson") or ""), "inputSchemaJson not stored")
        run = client.agents.invoke(agent["id"], json.dumps({"topic": "sdk", "count": 2}), wait=True, wait_seconds=90,
                                   input_content_type="application/json")
        require(run["status"] == "Succeeded", f"valid input status {run['status']} {run.get('errorMessage')}")
        try:
            client.agents.invoke(agent["id"], json.dumps({"count": "x"}), input_content_type="application/json")
            raise AssertionError("expected 400 for an input that breaks the schema")
        except GarrisonError as e:
            require(e.status_code == 400, f"status {e.status_code}")
            require(e.field_codes.get("input.topic") == "InputSchemaViolation", f"fieldCodes {e.field_codes}")
        try:
            client.agents.invoke(agent["id"], "plain words")
            raise AssertionError("expected 400 for an input that is not JSON")
        except GarrisonError as e:
            require(e.status_code == 400 and e.field_codes.get("input") == "InputNotJson", f"status {e.status_code} fieldCodes {e.field_codes}")
    finally:
        client.deployments.delete(deployment["id"])
        client.agents.delete(agent["id"])


def t_bundle_export():
    bundle = client.manifests.export(resources=[f"Agent/sdk-py-{SUFFIX}"], follow_references=True)
    require("kind: Bundle" in bundle, "no Bundle document")
    require("kind: Agent" in bundle and f"name: sdk-py-{SUFFIX}" in bundle, "agent missing from bundle")
    require(f"sdk-py-{SUFFIX}-fake" in bundle, "followReferences did not bring the deployment")
    require("builtin/fake" in bundle, "built-in requirement missing")
    dry = client.manifests.apply(bundle, dry_run=True)
    require(dry["failedCount"] == 0, f"bundle dry run failed {dry['failedCount']}")
    try:
        client.manifests.export(kinds=["NoSuchKind"])
        raise AssertionError("expected 400 UnknownKind")
    except GarrisonError as e:
        require(e.status_code == 400 and e.field_codes.get("kinds") == "UnknownKind", f"status {e.status_code} fieldCodes {e.field_codes}")


def t_conversation_transcript():
    transcript = client.conversations.transcript(state["conversation"])
    require(transcript["kind"] == "Conversation" and transcript["conversationId"] == state["conversation"], f"kind {transcript.get('kind')}")
    require(transcript["turnCount"] == 2 and len(transcript["turns"]) == 2, f"turns {transcript.get('turnCount')}")
    require(transcript["turns"][0]["turn"] == 1 and transcript["turns"][1]["turn"] == 2, "turn order")
    markdown = client.conversations.transcript_markdown(state["conversation"])
    require("First turn from the Python SDK" in markdown and "Second turn from the Python SDK" in markdown, "markdown lacks a turn")


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


def t_artifacts():
    store = client.artifact_stores.create({"name": f"sdk-py-artifacts-{SUFFIX}", "kind": "Filesystem", "pathPrefix": f"sdk-py-{SUFFIX}"})
    deployment = client.deployments.get(state["deployment"])
    try:
        configured = dict(deployment, artifactStoreId=store["id"], artifactGlobs=["reports/**/*.txt"], argumentOverrides=[{"position": 0, "template": "--output-last-message"}, {"position": 1, "template": "{{run.workspaceDir}}/reports/answer.txt"}])
        client.deployments.update(deployment["id"], configured)
        run = client.agents.invoke(state["agent"], "artifact SDK payload", wait=True, wait_seconds=30, deployment_id=deployment["id"])
        require(run["status"] == "Succeeded", "artifact run failed")
        rows = client.artifacts.list(runId=run["id"], storeId=store["id"])["objects"]
        require(len(rows) == 1, "one collected artifact")
        artifact = client.artifacts.get(rows[0]["id"])
        require(artifact["name"] == "reports/answer.txt", "artifact name")
        require(b"artifact SDK payload" in client.artifacts.download(artifact["id"]), "raw bytes")
        require(client.artifacts.download_url(artifact["id"])["expiresUtc"], "download expiry")
        try:
            client.artifacts.upload(run["id"], store["id"], artifact["name"], b"late upload", run["leaseEpoch"], run.get("repairAttempts", 0))
            raise AssertionError("terminal upload accepted")
        except GarrisonError as error:
            require(error.status_code == 409, "terminal upload fence")
        client.artifacts.delete(artifact["id"])
        require(not client.artifacts.list(runId=run["id"])["objects"], "deleted artifact")
    finally:
        client.deployments.update(deployment["id"], deployment)
        client.artifact_stores.delete(store["id"])


def t_stdio_mcp():
    node = next(n for n in client.nodes.list()["objects"] if n.get("supportsMcpTests") and n["status"] == "Ready")
    server = client.mcp_servers.create({"name": f"sdk-py-stdio-{SUFFIX}", "transport": "Stdio", "command": "garrison-fake-harness", "arguments": ["--mcp-stdio"], "requiredTools": ["fixture_status"]})
    try:
        result = client.mcp_servers.test(server["id"], node_id=node["id"])
        require(result["success"] and result["nodeId"] == node["id"] and "fixture_status" in result["tools"], "worker stdio diagnostic")
    finally:
        client.mcp_servers.delete(server["id"])


def _wait_pipeline(id, done, what, seconds=90):
    deadline = time.monotonic() + seconds
    while True:
        run = client.pipeline_runs.get(id, wait_seconds=10)
        if done(run):
            return run
        require(time.monotonic() < deadline, f"pipeline run {id} never reached {what} (status {run['status']})")
        time.sleep(0.2)


def t_pipelines():
    second = client.agents.create({"name": f"sdk-py-{SUFFIX}-editor", "description": "Python SDK harness pipeline stage."})
    second_deployment = client.deployments.create({"name": f"sdk-py-{SUFFIX}-editor", "agentId": second["id"], "harnessProfileId": state["fake"]})
    pipeline = None
    try:
        name = f"sdk-py-pipeline-{SUFFIX}"
        pipeline = client.pipelines.create({"name": name, "description": "Python SDK harness pipeline.", "stages": [
            {"name": "write", "agentId": state["agent"], "requiresReview": True, "maxRevisions": 1},
            {"name": "edit", "agentId": second["id"]}]})
        require(pipeline["id"].startswith("ppl_") and pipeline["version"] == 1 and len(pipeline["stages"]) == 2, "pipeline create")
        by_name = client.pipelines.get(name)
        require(by_name["id"] == pipeline["id"] and by_name["stages"][0]["requiresReview"], "pipeline get by name")
        by_name["description"] = "Updated by the Python SDK harness."
        updated = client.pipelines.update(pipeline["id"], by_name)
        require(updated["version"] == 2 and updated["description"] == by_name["description"], "pipeline update")
        require(any(p["id"] == pipeline["id"] for p in client.pipelines.list(search=name)["objects"]), "pipeline list")
        preview = client.pipelines.preview(pipeline["id"], "Sample input", ["Sample stage one output"])
        require(len(preview["stages"]) == 2 and all(s["success"] for s in preview["stages"]), f"pipeline preview {preview}")

        key = f"sdk-py-pipeline-key-{SUFFIX}"
        run = client.pipelines.start(pipeline["id"], "Write a haiku", wait=True, wait_seconds=30, idempotency_key=key)
        require(run["status"] == "AwaitingReview", f"start waited to {run['status']}")
        require(client.pipelines.start(pipeline["id"], "Write a haiku", idempotency_key=key)["id"] == run["id"], "idempotent start")
        _expect_status(409, client.pipelines.start, pipeline["id"], "Different input", idempotency_key=key)
        reviews = client.pipeline_reviews.list(status="Pending", pipeline_run_id=run["id"])["objects"]
        require(len(reviews) == 1 and reviews[0]["position"] == 1, "one pending review")
        require(client.pipeline_reviews.get(reviews[0]["id"])["status"] == "Pending", "review get")
        _expect_status(400, client.pipeline_reviews.decide, reviews[0]["id"], "RequestChanges")
        decided = client.pipeline_reviews.decide(reviews[0]["id"], "Approve", "Looks good from Python")
        require(decided["status"] == "Approved" and decided["decisionSource"] == "User", "review approved")
        _expect_status(409, client.pipeline_reviews.decide, reviews[0]["id"], "Reject")
        finished = _wait_pipeline(run["id"], lambda r: r["status"] in ("Succeeded", "Failed", "Cancelled", "TimedOut"), "a terminal status")
        require(finished["status"] == "Succeeded" and finished["outcome"] == "Succeeded", f"pipeline finished {finished['status']} {finished.get('errorMessage')}")
        require(len(finished["runs"]) == 2 and len(finished["reviews"]) == 1, "pipeline run detail")
        require(any(r["id"] == run["id"] for r in client.pipeline_runs.list(pipeline_id=pipeline["id"])["objects"]), "pipeline runs by pipeline")
        require(all(r["status"] == "Succeeded" for r in client.pipeline_runs.list(status="Succeeded", max_results=5)["objects"]), "pipeline runs by status")

        other = client.pipelines.start(pipeline["id"], "Write another")
        _expect_status(409, client.pipelines.delete, pipeline["id"])
        client.pipeline_runs.cancel(other["id"])
        _wait_pipeline(other["id"], lambda r: r["status"] == "Cancelled", "Cancelled")
        resumed = client.pipeline_runs.retry(other["id"])
        require(resumed["status"] in ("Running", "AwaitingReview"), f"retry status {resumed['status']}")
        client.pipeline_runs.cancel(other["id"])
        _wait_pipeline(other["id"], lambda r: r["status"] == "Cancelled", "Cancelled again")
        require(client.pipeline_runs.delete(other["id"]) is None, "pipeline run delete")
        _expect_status(404, client.pipeline_runs.get, other["id"])
        require(client.pipelines.delete(pipeline["id"]) is None, "pipeline delete")
        pipeline = None
        _expect_status(404, client.pipelines.get, name)
    finally:
        if pipeline is not None:
            try:
                client.pipelines.delete(pipeline["id"])
            except GarrisonError:
                pass
        client.deployments.delete(second_deployment["id"])
        client.agents.delete(second["id"])


def t_webhook_signature():
    body = b'{"a":1}'
    now = int(time.time())
    header = sign_webhook("whsec_test_secret_value", now, body)
    require(header.startswith(f"t={now},v1=") and len(header) == len(f"t={now},v1=") + 64, f"header shape {header}")
    require(verify_webhook(header, "whsec_test_secret_value", body), "verify own signature")
    second = f"t={now},v1={'0' * 64},v1=" + header.split(",v1=", 1)[1]
    require(verify_webhook(second, "whsec_test_secret_value", body), "verify second v1")
    require(not verify_webhook(header, "whsec_other_secret_value", body), "wrong secret")
    require(not verify_webhook(sign_webhook("whsec_test_secret_value", now - 3600, body), "whsec_test_secret_value", body), "stale")


def t_triggers():
    webhook = None
    cron = None
    try:
        webhook = client.triggers.create({"name": f"sdk-py-hook-{SUFFIX}", "type": "Webhook", "agentId": state["agent"]})
        secret = webhook.get("signingSecret")
        require(webhook["id"].startswith("trg_") and secret and secret.startswith("whsec_") and webhook["signingSecretLast4"] == secret[-4:], "webhook create")
        read = client.triggers.get(webhook["name"])
        require(read["id"] == webhook["id"] and "signingSecret" not in read and read["runAsType"] == "Credential", "get hides the secret")
        delivery = f"sdk-py-delivery-{SUFFIX}"
        fire = client.triggers.deliver_webhook(webhook["id"], secret, '{"event":"push"}', delivery_id=delivery)
        require(fire["outcome"] == "Started" and fire.get("runId") and not fire.get("duplicate") and fire["deliveryId"] == delivery,
                f"signed delivery started a run: {fire}")
        repeat = client.triggers.deliver_webhook(webhook["id"], secret, '{"event":"push"}', delivery_id=delivery)
        require(repeat.get("duplicate") and repeat["id"] == fire["id"], "repeated delivery returns the same fire")
        run = client.runs.get(fire["runId"])
        require(run.get("triggerId") == webhook["id"] and run["kind"] == "Trigger", "run carries the trigger")
        require(any(r["id"] == fire["runId"] for r in client.runs.list(trigger_id=webhook["id"])["objects"]), "runs by trigger")
        try:
            client.triggers.deliver_webhook(webhook["id"], "whsec_wrong_secret_for_this_trigger", "{}")
            raise AssertionError("bad signature accepted")
        except GarrisonError as e:
            require(e.status_code == 401 and e.code == "InvalidSignature", f"bad signature: {e}")
        fires = client.triggers.list_fires(webhook["id"], outcome="Started")
        require(len(fires["objects"]) == 1 and fires["objects"][0]["id"] == fire["id"], "fire history")
        rotated = client.triggers.rotate_secret(webhook["id"])
        require(rotated.get("signingSecret") and rotated["signingSecret"] != secret, "rotate secret")
        cron = client.triggers.create({"name": f"sdk-py-cron-{SUFFIX}", "type": "Cron", "agentId": state["agent"],
                                       "cronExpression": "0 9 * * 1-5", "timeZone": "America/New_York"})
        require(cron.get("nextFireUtc") and "signingSecret" not in cron, "cron next fire")
        require(any(t["id"] == cron["id"] for t in client.triggers.list(type="Cron")["objects"]), "list by type")
    finally:
        if webhook:
            client.triggers.delete(webhook["id"])
        if cron:
            client.triggers.delete(cron["id"])


def t_notifications():
    try:
        client.notification_endpoints.create({"name": f"sdk-py-local-{SUFFIX}", "url": "http://127.0.0.1:9/x", "events": ["RunFailed"]})
        raise AssertionError("loopback URL accepted")
    except GarrisonError as e:
        codes = (e.error or {}).get("fieldCodes") or {}
        require(e.status_code == 400 and codes.get("url") == "DestinationBlocked", f"loopback refused: {e} {codes}")
    endpoint = client.notification_endpoints.create({"name": f"sdk-py-notify-{SUFFIX}", "url": "https://example.invalid/hook",
                                                     "events": ["RunSucceeded", "RunFailed"]})
    try:
        require(endpoint["id"].startswith("nep_") and endpoint.get("signingSecret") and len(endpoint["events"]) == 2, "endpoint create")
        read = client.notification_endpoints.get(endpoint["name"])
        require("signingSecret" not in read and read.get("signingSecretLast4"), "get hides the secret")
        test = client.notification_endpoints.test(endpoint["id"])
        require(test["event"] == "Test" and test["attempts"] == 1 and test["status"] in ("Pending", "Failed"), f"test delivery {test}")
        require(any(d["id"] == test["id"] for d in client.notification_endpoints.list_deliveries(endpoint["id"])["objects"]), "delivery log")
        one = client.notification_endpoints.get_delivery(endpoint["id"], test["id"])
        require('"event":"Test"' in one["payload"], "delivery payload")
        read["active"] = False
        require(not client.notification_endpoints.update(endpoint["id"], read)["active"], "endpoint update")
    finally:
        client.notification_endpoints.delete(endpoint["id"])


def t_effect_operations():
    usage = client.runs.database_usage(state["run"])
    require(any(row["statements"] > 0 for row in usage) and all(row["runId"] == state["run"] and row["tenantId"] == state["tenant"] for row in usage), "per-run database attribution")
    placement = client.runs.placement(state["run"])
    require(placement["runId"] == state["run"] and "RunNotQueued" in placement["reasons"] and not placement["eligible"], "terminal placement diagnostic")
    operations = client.runs.operations(state["run"])
    require(isinstance(operations, list) and all(op["tenantId"] == state["tenant"] for op in operations), "journal metadata")
    try:
        client.runs.operations("run_missing_sdk")
        raise AssertionError("unknown journal accepted")
    except GarrisonError as error:
        require(error.status_code == 404, "unknown journal must be 404")


def t_control_plane_contracts():
    administrator = GarrisonClient(BASE)
    administrator.use_admin_api_key(os.getenv("GARRISON_SDK_ADMIN_API_KEY", "garrisonadmin"), state["tenant"])
    scratch = administrator.tenants.create({"name": f"sdk-py-weight-{SUFFIX}", "schedulingWeight": 7})
    try:
        require(scratch["schedulingWeight"] == 7, "tenant weight create")
        require(administrator.tenants.update(scratch["id"], {"schedulingWeight": 3})["schedulingWeight"] == 3, "tenant weight update")
    finally:
        administrator.tenants.delete(scratch["id"])
    rotated = administrator.settings.rotate_master_key()
    require(rotated["keyVersion"] >= 1 and rotated["failed"] == 0 and rotated["conflicts"] == 0, "rotation pass")
    repeated = administrator.settings.rotate_master_key()
    require(repeated["rotated"] == 0 and repeated["failed"] == 0, "rotation idempotence")
    broker_metadata = client.secrets.create({"name": f"sdk-py-broker-{SUFFIX}", "kind": "LeaseBroker", "brokerResource": "tenant-scoped-fixture", "brokerAudience": "fixture"})
    try:
        read = client.secrets.get(broker_metadata["id"])
        require(read["brokerResource"] == "tenant-scoped-fixture" and read["brokerAudience"] == "fixture" and not read.get("valueEncrypted"), "provider metadata round trip")
        try:
            client.secrets.set_value(read["id"], "forbidden-static-value")
            raise AssertionError("broker static value accepted")
        except GarrisonError as error:
            require(error.status_code == 400, "broker static values must be rejected")
    finally:
        client.secrets.delete(broker_metadata["id"])
    pinned = client.harness_profiles.create({"name": f"sdk-py-session-{SUFFIX}", "harnessType": "Generic", "executable": "garrison-fake-harness", "sessionFormat": "sdk-fixture-v1"})
    try:
        require(client.harness_profiles.get(pinned["id"])["sessionFormat"] == "sdk-fixture-v1", "session format round trip")
    finally:
        client.harness_profiles.delete(pinned["id"])
    remote = client.agents.create({"name": f"sdk-py-remote-{SUFFIX}", "kind": "Remote", "remoteProtocol": "A2A", "remoteEndpointUrl": "http://127.0.0.1:9/a2a"})
    try:
        try:
            client.agents.invoke(remote["id"], "fixture", deployment_id=state["deployment"])
            raise AssertionError("remote deployment override accepted")
        except GarrisonError as error:
            require(error.status_code == 409 and error.error["code"] == "RemoteDeploymentUnsupported", "remote admission")
    finally:
        client.agents.delete(remote["id"])
    require(client.deployments.get(state["deployment"])["suspensionEnabled"] is False, "suspension defaults to opt out")


def t_revisions_promotion():
    agent = client.agents.create({"name": f"sdk-py-{SUFFIX}-studio", "description": "Python SDK harness revision agent."})
    dev = client.deployments.create({"name": f"sdk-py-{SUFFIX}-studio-dev", "agentId": agent["id"], "harnessProfileId": state["fake"]})
    staging = client.deployments.create({"name": f"sdk-py-{SUFFIX}-studio-staging", "agentId": agent["id"],
                                         "harnessProfileId": state["fake"], "environment": "staging"})
    try:
        require(dev.get("environment") == "dev", f"dev deployment environment {dev.get('environment')!r}")
        require(dev.get("agentRevisionId") is None, "dev deployment should be unpinned")
        require(staging.get("agentRevisionId") is None, "staging deployment should start unpinned")
        draft = client.agents.save_draft(agent["id"], {"description": "Changed by the Python SDK harness."})
        require(draft["state"] == "Draft", f"draft state {draft['state']}")
        require(client.agents.get(agent["id"]).get("draftRevisionId") == draft["id"], "agent draftRevisionId not set")
        published = client.agents.publish_revision(agent["id"], draft["id"], change_note="sdk harness")
        require(published["state"] == "Published", f"published state {published['state']}")
        require(client.agents.get(agent["id"]).get("latestPublishedRevisionId") == published["id"], "latestPublishedRevisionId not set")
        listed = client.agents.revisions(agent["id"])["objects"]
        require(any(r["id"] == published["id"] for r in listed), "published revision not listed")
        require(client.agents.get_revision(agent["id"], published["number"])["id"] == published["id"], "read by number failed")
        promotion = client.promotions.promote(agent["id"], "dev")
        require(promotion["kind"] == "Promote" and promotion["targetEnvironment"] == "staging", f"promotion {promotion}")
        pinned = client.deployments.get(staging["id"]).get("agentRevisionId")
        require(pinned == published["id"], f"staging pinned to {pinned!r}, expected {published['id']}")
        require(client.promotions.get(promotion["id"])["id"] == promotion["id"], "promotion read failed")
        require(any(p["id"] == promotion["id"] for p in client.promotions.list(agent_id=agent["id"])["objects"]), "promotion not listed")
        rollback = client.promotions.rollback(promotion["id"], note="sdk harness rollback")
        require(rollback["kind"] == "Rollback", f"rollback kind {rollback['kind']}")
        restored = client.deployments.get(staging["id"]).get("agentRevisionId")
        require(restored is None, f"staging pin after rollback {restored!r}")
        envs = client.environments.get()
        names = [e["name"] for e in sorted(envs["environments"], key=lambda e: e["position"])]
        require(envs["isDefault"] is True and names == ["dev", "staging", "prod"], f"environments {envs}")
    finally:
        client.deployments.delete(staging["id"])
        client.deployments.delete(dev["id"])
        client.agents.delete(agent["id"])


def t_file_spaces():
    # The conversation cases delete their conversation, so this case starts its own.
    started = client.agents.invoke(state["agent"], "File space turn from the Python SDK", wait=True, wait_seconds=90,
                                   deployment_id=state["conversation_deployment"], start_conversation=True)
    cid = started.get("conversationId") or ""
    require(cid.startswith("cnv_"), f"conversationId {cid}")
    text = "# Notes\n\nWritten by the Python SDK harness.\n"
    first = client.file_spaces.write("conversations", cid, "notes/a.md", text, base_version=0, media_type="text/markdown")
    require(first["version"] == 1 and not first["conflict"] and first["path"] == "notes/a.md", f"first write {first}")
    second = client.file_spaces.write("conversations", cid, "notes/a.md", "conflicting edit\n", base_version=0)
    require(second["conflict"] and second["path"] != "notes/a.md", f"stale write {second}")
    listing = client.file_spaces.list("conversations", cid)
    paths = [f["path"] for f in listing.get("files") or []]
    require("notes/a.md" in paths and second["path"] in paths, f"listing {paths}")
    require(listing.get("fileSpaceId"), "listing fileSpaceId")
    require(any(v["number"] == 1 for v in client.file_spaces.versions("conversations", cid, "notes/a.md")), "version 1 not listed")
    content = client.file_spaces.read("conversations", cid, "notes/a.md")
    require(content == text.encode("utf-8"), "content differs")
    link = client.file_spaces.download_url("conversations", cid, "notes/a.md", version=1)
    fetched = requests.get(link["url"], timeout=30)
    require(fetched.status_code == 200 and fetched.content == content, f"download url status {fetched.status_code}")
    client.file_spaces.delete("conversations", cid, second["path"])
    after = [f["path"] for f in client.file_spaces.list("conversations", cid).get("files") or []]
    require(second["path"] not in after, "conflict file not deleted")
    turns = client.conversations.list_runs(cid)["objects"]
    require(turns, "no conversation turns")
    run = client.runs.get(turns[0]["id"])
    require(run.get("fileSpaceId"), f"run fileSpaceId {run.get('fileSpaceId')}")
    by_run = [f["path"] for f in client.file_spaces.list("runs", run["id"]).get("files") or []]
    require("notes/a.md" in by_run, f"run listing {by_run}")


def t_agent_assets():
    asset = client.agent_assets.create({"name": f"sdk-py-{SUFFIX}-asset", "kind": "Skill", "description": "Python SDK harness asset."})
    agent = None
    try:
        require(asset["kind"] == "Skill" and asset.get("currentVersion", 0) == 0, f"asset {asset}")
        content = b"# SDK skill\n\nCreated by the Python SDK harness.\n"
        files = [{"path": "SKILL.md", "content": content, "mediaType": "text/markdown"}]
        first = client.agent_assets.upload(asset["id"], files, change_note="sdk harness")
        require(first["number"] == 1, f"first version {first['number']}")
        skill = next((f for f in first["files"] if f["path"] == "SKILL.md"), None)
        require(skill is not None and skill["sha256"].lower() == hashlib.sha256(content).hexdigest(), f"sha256 {skill}")
        again = client.agent_assets.upload(asset["id"], files, change_note="sdk harness")
        require(again["number"] == 1, f"identical upload returned version {again['number']}")
        require(client.agent_assets.download_file(asset["id"], 1, "SKILL.md") == content, "downloaded bytes differ")
        require(any(v["number"] == 1 for v in client.agent_assets.versions(asset["id"])), "version not listed")
        require(client.agent_assets.get_version(asset["id"], 1)["number"] == 1, "get version failed")
        require(client.agent_assets.get(asset["id"])["currentVersion"] == 1, "currentVersion not 1")
        listed = client.agent_assets.list(kind="Skill", search=asset["name"])["objects"]
        require(any(a["id"] == asset["id"] for a in listed), "asset not listed")
        agent = client.agents.create({"name": f"sdk-py-{SUFFIX}-asset-agent", "description": "Python SDK harness asset agent."})
        draft = client.agents.save_draft(agent["id"], {"description": "Pins an asset.", "assetPins": [{"assetId": asset["id"]}]})
        published = client.agents.publish_revision(agent["id"], draft["id"], change_note="sdk harness")
        require(any(p["assetId"] == asset["id"] for p in published.get("assetPins") or []), f"assetPins {published.get('assetPins')}")
        in_use = False
        try:
            client.agent_assets.delete(asset["id"])
        except GarrisonError as e:
            in_use = e.status_code == 409 and e.code == "AssetInUse"
        require(in_use, "deleting a pinned asset should fail with 409 AssetInUse")
    finally:
        if agent is not None:
            client.agents.delete(agent["id"])
        client.agent_assets.delete(asset["id"])


def t_capabilities():
    catalog = client.capabilities.list()
    require(catalog.get("totalRecords") == len(catalog["objects"]), f"totalRecords {catalog.get('totalRecords')}")
    mine = next((d for d in catalog["objects"] if d["kind"] == "Agent" and d.get("sourceAgentId") == state["agent"]), None)
    require(mine is not None, "test agent has no Agent descriptor")
    require(mine["origin"] == "Derived" and mine.get("sourceRevisionId") and mine["id"].startswith("cap_"), f"agent descriptor {mine}")
    require(all(d["kind"] == "Agent" for d in client.capabilities.list(kind="Agent")["objects"]), "kind filter")
    name = f"sdk-py-{SUFFIX}-cap"
    tag = f"sdk-py-{SUFFIX}-tag"
    schema = '{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}'
    created = client.capabilities.create({"name": name, "kind": "McpTool", "summary": "Manual descriptor from the Python SDK harness.",
                                          "inputSchemaJson": schema, "tags": [tag],
                                          "requirements": [{"key": "garrison.io/sdk-fixture", "value": "true"}]})
    try:
        require(created["origin"] == "Manual" and created["sourceKey"] == "manual:" + created["id"], f"manual descriptor {created}")
        require(tag in created["tags"] and any(r["key"] == "garrison.io/sdk-fixture" for r in created["requirements"]), "tags and requirements")
        require(client.capabilities.get(created["id"])["name"] == name, "read by id")
        require(client.capabilities.get(name)["id"] == created["id"], "read by name")
        tagged = client.capabilities.list(tag=tag)["objects"]
        require(len(tagged) == 1 and tagged[0]["id"] == created["id"], f"tag filter returned {len(tagged)}")
        bad_code = None
        try:
            client.capabilities.create({"name": name + "-bad", "kind": "McpTool", "inputSchemaJson": "[1,2]"})
        except GarrisonError as e:
            bad_code = e.code if e.status_code == 400 else f"{e.status_code} {e.code}"
        require(bad_code == "InvalidJsonSchema", f"invalid schema code {bad_code}")
        duplicate_code = None
        try:
            client.capabilities.create({"name": name, "kind": "McpTool"})
        except GarrisonError as e:
            duplicate_code = e.code if e.status_code == 409 else f"{e.status_code} {e.code}"
        require(duplicate_code == "NameConflict", f"duplicate name code {duplicate_code}")
        updated = client.capabilities.update(created["id"], {**created, "summary": "Updated by the Python SDK harness."})
        require(updated["summary"] == "Updated by the Python SDK harness." and tag in updated["tags"], f"update {updated}")
        refreshed = client.capabilities.refresh()
        require(all(isinstance(refreshed.get(k), int) for k in ("agents", "harnessBuiltIns", "hints")), f"refresh {refreshed}")
        require(isinstance(refreshed.get("mcpServers"), list) and all(s.get("mcpServerId") for s in refreshed["mcpServers"]), "refresh servers")
    finally:
        client.capabilities.delete(created["id"])
    missing = None
    try:
        client.capabilities.get(created["id"])
    except GarrisonError as e:
        missing = e.status_code
    require(missing == 404, f"deleted descriptor read returned {missing}")


def t_fan_out_groups():
    groups = client.fan_out_groups.list_by_run(state["run"])
    require(groups == [], f"expected no fan-out groups, got {len(groups)}")
    _expect_status(404, client.fan_out_groups.get, "fog_missing")
    _expect_status(404, client.fan_out_groups.cancel, "fog_missing")


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
                 ("invoke with wait", t_invoke), ("run transcript (Markdown and JSON)", t_run_transcript),
                 ("input schema enforcement", t_input_schema), ("run timing metrics", t_run_metrics),
                 ("run analytics", t_analytics), ("run analytics grouped by harness", t_analytics_group),
                 ("run analytics grouped by harness and model", t_analytics_harness_model),
                 ("run analytics dimensions", t_analytics_dimensions), ("run analytics filtered by model", t_analytics_model),
                 ("run analytics rejects from >= to", t_analytics_invalid), ("stream events", t_stream), ("cancel run", t_cancel),
                 ("untrusted deployment queues without isolation", t_trust_level),
                 ("effect policy default, update, and conflict", t_effect_policy),
                 ("egress allowlist round trip, validation, and queueing", t_egress_rules),
                 ("manifest dry run", t_manifest), ("manifest bundle export", t_bundle_export), ("clamped values return ValueClamped warnings", t_clamp_warnings),
                 ("nodes report containerized", t_node_containerized), ("list runs by agent", t_list_runs),
                 ("conversation start", t_conversation_start), ("conversation continue", t_conversation_continue),
                 ("conversation read and list", t_conversation_read),
                 ("conversation transcript", t_conversation_transcript), ("conversation delete", t_conversation_delete),
                 ("control nodes", t_control_nodes),
                 ("approvals list and read", t_approvals), ("approval rules and approval check", t_approval_check),
                 ("artifact collection and binary download", t_artifacts), ("stdio MCP worker diagnostic", t_stdio_mcp),
                 ("pipelines, runs, and reviews", t_pipelines), ("webhook signature helper", t_webhook_signature),
                 ("webhook and cron triggers", t_triggers), ("notification endpoints", t_notifications), ("effect operation metadata", t_effect_operations), ("scheduling, pinned sessions, remote admission, and key rotation", t_control_plane_contracts), ("agent revisions and promotion", t_revisions_promotion), ("agent assets", t_agent_assets), ("conversation file spaces", t_file_spaces), ("capability catalog", t_capabilities), ("fan-out groups", t_fan_out_groups), ("cleanup", t_cleanup)]:
    check(name, fn)
    if "auth_failed" in state:
        print()
        print(AUTH_HELP.format(status=state["auth_failed"], access=ACCESS))
        sys.exit(1)

print(f"\nPassed: {passed}  Failed: {len(failures)}")
for f in failures:
    print(f"  FAIL {f}")
sys.exit(0 if not failures else 1)
