"""Garrison REST client. Responses are returned as dictionaries with the server's camelCase field names."""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, List, Optional, Union, Literal, TypedDict
from urllib.parse import quote, urlencode

import requests

class ExecutorRequirements(TypedDict, total=False):
    """Optional deployment/run placement requirements; absent flags default false."""
    isolation: Literal["Process", "Container", "SandboxedRuntime"]
    egressControl: bool
    filesystemSnapshot: bool
    sessionContinuation: bool
    crossNodeRestore: bool
    coldStartClass: Optional[Literal["Immediate", "Cold", "Warm"]]


class ExecutorCapabilities(ExecutorRequirements, total=False):
    """One worker-reported executor with no implied advanced capabilities."""
    executor: Literal["Process", "KubernetesJob"]
    warmStart: bool


class FieldWarning(TypedDict, total=False):
    """A request field that was accepted but not stored as given (I-08), for example a number outside its range that was
    clamped. Create and update responses for agents, deployments, harness profiles, MCP servers, and workspace templates
    carry these in "warnings" only when something was not stored as given (reads never do), and every manifest apply item
    carries a "warnings" list (empty when there is nothing to report). Never stored on the resource itself."""
    field: str
    """Field name as the REST API spells it, for example "maxAttempts"."""
    code: str
    """Stable machine code from FIELD_WARNING_CODES; treat unknown codes as informational."""
    given: Optional[str]
    """The value the caller sent, as text; absent or None when there was none."""
    stored: Optional[str]
    """The value stored instead, as text; absent or None when nothing was stored."""
    message: str
    """Explanation naming the field, the given value, the allowed range, and the stored value."""


class TranscriptUsage(TypedDict, total=False):
    """Token, tool, cost, and duration totals of a transcript or one turn."""
    inputTokens: int
    outputTokens: int
    cachedTokens: int
    reasoningTokens: int
    toolCallCount: int
    costUsd: Optional[float]
    costEstimated: bool
    durationMs: Optional[int]


class TranscriptEntry(TypedDict, total=False):
    """One transcript event. type is AssistantText, Thinking (only with include_thinking), ToolCall, ToolResult, Warning,
    Error, or Lifecycle. Tool text is cut to the server limit (textTruncated). Secrets read [REDACTED]."""
    sequence: int
    timestampUtc: str
    type: str
    text: Optional[str]
    toolName: Optional[str]
    toolCallId: Optional[str]
    success: Optional[bool]
    code: Optional[str]
    textTruncated: bool


class TranscriptApproval(TypedDict, total=False):
    """An approval requested during a turn."""
    id: str
    kind: str
    toolName: str
    summary: Optional[str]
    inputPreview: Optional[str]
    status: str
    decision: Optional[str]
    decisionSource: Optional[str]
    decidedBy: Optional[str]
    reason: Optional[str]
    requestedUtc: str
    decidedUtc: Optional[str]


class TranscriptTurn(TypedDict, total=False):
    """One run of a transcript (a conversation has one per turn)."""
    turn: int
    runId: str
    agentName: str
    deploymentId: str
    kind: str
    status: str
    outcome: str
    callerName: Optional[str]
    model: Optional[str]
    input: Optional[str]
    inputContentType: Optional[str]
    createdUtc: str
    startedUtc: Optional[str]
    completedUtc: Optional[str]
    entries: List[TranscriptEntry]
    approvals: List[TranscriptApproval]
    result: Optional[str]
    errorMessage: Optional[str]
    usage: TranscriptUsage
    omittedEvents: int
    truncated: bool


class Transcript(TypedDict, total=False):
    """Run or conversation transcript (schema "garrison.transcript/v1"); kind is "Run" or "Conversation"."""
    schema: str
    kind: str
    tenantId: str
    runId: Optional[str]
    conversationId: Optional[str]
    agentName: str
    title: Optional[str]
    generatedUtc: str
    includesThinking: bool
    truncated: bool
    truncationNote: Optional[str]
    turnCount: int
    usage: TranscriptUsage
    turns: List[TranscriptTurn]


DEFAULT_BASE_URL = "http://127.0.0.1:8700"
TERMINAL_STATUSES = {"Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected"}
# Run executors: deployment "executor", node pool "defaultExecutor", run "executor", node "executors".
RUN_EXECUTORS = ("Process", "KubernetesJob")
# Deployment and run "trustLevel" (default Trusted). Untrusted runs need at least Container isolation: an unset deployment
# executor resolves to KubernetesJob, and a run no Ready worker can isolate stays Queued with blockedReason
# NoIsolatingWorker. Tenant "requireUntrustedDeployments" rejects Trusted deployments (field code TenantRequiresUntrusted).
TRUST_LEVELS = ("Trusted", "Untrusted")
# Deployment "egressRules" items: {"cidr": "203.0.113.0/24", "port": 443 or None for every port, "protocol": one of these}
# (default TCP). With rules, run pods reach only DNS, the Garrison MCP port, and the rules; an unset executor resolves to
# KubernetesJob and a run no Ready worker can enforce stays Queued with blockedReason NoIsolatingWorker.
EGRESS_PROTOCOLS = ("TCP", "UDP")
# Deployment and run "effectPolicy" (default AtMostOnce for new deployments): what happens to a run that was already
# Running when its worker was lost. AtMostOnce fails it with outcome NodeLost, AtLeastOnce requeues it while attempts
# remain, and Journaled behaves as AtMostOnce until the effect journal exists. The deprecated "retryOnNodeLoss" is still
# accepted (true is AtLeastOnce, false is AtMostOnce); sending both with different meanings is a 400 with field code
# EffectPolicyConflict, so drop "retryOnNodeLoss" from a deployment you read back before changing "effectPolicy".
EFFECT_POLICIES = ("AtMostOnce", "AtLeastOnce", "Journaled")
# FieldWarning["code"] values. ValueClamped: the value was outside its allowed range and the nearest allowed value was
# stored (for example deployment maxAttempts 99 is stored as 10).
FIELD_WARNING_CODES = ("ValueClamped",)
# Input schema field codes (GarrisonError.field_codes values) when an agent with "inputSchemaJson" is invoked with an
# input that is not JSON (key "input") or does not match the schema (key "input" or "input.<path>", for example
# "input.topic" or "input.tags[1]"). Saving an agent whose inputSchemaJson or outputSchemaJson is not a valid JSON
# Schema fails with InvalidJsonSchema.
INPUT_SCHEMA_FIELD_CODES = ("InputNotJson", "InputSchemaViolation", "InvalidJsonSchema")
# Transcript formats (runs.transcript_markdown / transcript, conversations.transcript_markdown / transcript).
TRANSCRIPT_FORMATS = ("markdown", "json")
# Node["containerized"] (bool, default False): whether the worker runs inside a container or pod, reported at registration.
# Run["blockedReason"] values, computed on read for Queued runs no Ready worker can take; None otherwise.
RUN_BLOCKED_REASONS = ("NoReadyWorker", "NoCapableWorker", "NoMatchingPool", "NoIsolatingWorker")

# Secret["status"] values. NeedsReauthentication means the provider rejected a CodexAuthJson login for good (refresh
# token reused, expired, or revoked); runs that bind it fail with outcome NotCredentialed until the value is replaced.
SECRET_STATUSES = ("Ok", "NeedsReauthentication")

# Run["conversationFallbackReason"] and Conversation["lastFallbackReason"] values: why a conversation turn started a fresh
# harness session seeded with the transcript of the earlier turns instead of resuming the conversation's session.
CONVERSATION_FALLBACK_REASONS = ("AffinityNodeLost", "AffinityWaitExpired", "WorkspaceLost", "SessionMissing",
                                 "HarnessChanged", "ResumeUnsupported", "ExecutorWithoutState")
# Permission approvals. Approval["status"], ["decision"] and ["timeoutDecision"], ["decisionSource"], and ["kind"];
# deployment "approvalDefaultAction" and approval rule "action" take APPROVAL_RULE_ACTIONS.
APPROVAL_STATUSES = ("Pending", "Approved", "Denied", "Expired", "Cancelled")
APPROVAL_DECISIONS = ("Allow", "Deny")
APPROVAL_SOURCES = ("Rule", "Default", "User", "Timeout", "Cancelled")
APPROVAL_RULE_ACTIONS = ("Allow", "Deny", "Ask")
APPROVAL_KINDS = ("Tool", "Command", "FileChange")
# Pipelines (ordered agent stages with optional review gates). PipelineRun["status"] and ["outcome"],
# PipelineRunStage["status"], PipelineReview["status"], ["decision"] (and stage "reviewTimeoutAction"), ["decisionSource"].
PIPELINE_RUN_STATUSES = ("Running", "AwaitingReview", "Cancelling", "Succeeded", "Failed", "Cancelled", "TimedOut")
PIPELINE_RUN_TERMINAL_STATUSES = {"Succeeded", "Failed", "Cancelled", "TimedOut"}
PIPELINE_RUN_OUTCOMES = ("None", "Succeeded", "StageFailed", "StageStartFailed", "ReviewRejected", "ReviewExpired",
                         "Cancelled", "TimedOut", "InternalError")
PIPELINE_STAGE_STATUSES = ("Pending", "Running", "AwaitingReview", "Succeeded", "Failed", "Cancelled")
PIPELINE_REVIEW_STATUSES = ("Pending", "Approved", "ChangesRequested", "Rejected", "Expired", "Cancelled")
PIPELINE_REVIEW_DECISIONS = ("Approve", "RequestChanges", "Reject")
PIPELINE_REVIEW_SOURCES = ("User", "Timeout", "Cancelled")
# Triggers (cron schedules and signed webhooks). Trigger["type"], ["targetType"], TriggerFire["source"] and ["outcome"].
# Run["kind"] is "Trigger" and Run["triggerId"] (and PipelineRun["triggerId"]) is set for runs a trigger started.
TRIGGER_TYPES = ("Cron", "Webhook")
TRIGGER_TARGET_TYPES = ("Agent", "Pipeline")
TRIGGER_FIRE_SOURCES = ("Cron", "Webhook", "Manual")
TRIGGER_FIRE_OUTCOMES = ("Started", "Failed", "Skipped")
# Notification endpoints. NotificationEndpoint["events"] items (Test is only sent by the test action and cannot be
# subscribed to) and NotificationDelivery["status"].
NOTIFICATION_EVENTS = ("RunSucceeded", "RunFailed", "RunCancelled", "RunTimedOut", "PipelineCompleted", "PipelineFailed",
                       "ApprovalRequested", "Test")
NOTIFICATION_DELIVERY_STATUSES = ("Pending", "Delivering", "Succeeded", "Failed")
WEBHOOK_SIGNATURE_HEADER = "X-Garrison-Signature"
WEBHOOK_DELIVERY_HEADER = "X-Garrison-Delivery"
WEBHOOK_EVENT_HEADER = "X-Garrison-Event"


def sign_webhook(secret: str, unix_seconds: int, body: bytes) -> str:
    """Build the X-Garrison-Signature header value: t=<unix>,v1=<lowercase hex HMAC-SHA256 of "<t>." + raw body>, keyed
    with the UTF-8 bytes of the signing secret. Senders of trigger webhooks use it."""
    if not secret:
        raise ValueError("secret is required")
    message = str(int(unix_seconds)).encode("ascii") + b"." + (body or b"")
    digest = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return f"t={int(unix_seconds)},v1={digest}"


def verify_webhook(header: Optional[str], secret: str, body: bytes, tolerance_seconds: int = 300) -> bool:
    """Verify an X-Garrison-Signature header against the raw body: any v1 value may match (constant-time comparison) and
    the timestamp must be within tolerance_seconds of now. Receivers of notifications use it."""
    if not header or not secret:
        return False
    timestamp: Optional[int] = None
    candidates: List[str] = []
    for part in header.split(","):
        name, sep, value = part.strip().partition("=")
        if not sep or not name:
            return False
        name, value = name.strip(), value.strip()
        if name == "t":
            if timestamp is not None or not value.isdigit():
                return False
            timestamp = int(value)
        elif name == "v1":
            if len(value) != 64:
                return False
            candidates.append(value.lower())
    if timestamp is None or not candidates:
        return False
    if abs(int(time.time()) - timestamp) > max(1, tolerance_seconds):
        return False
    expected = sign_webhook(secret, timestamp, body).split(",v1=", 1)[1]
    matched = False
    for candidate in candidates:
        if hmac.compare_digest(candidate, expected):
            matched = True
    return matched


class GarrisonError(Exception):
    """Raised when the API returns a non-success status. Carries the parsed error body when present."""

    def __init__(self, status_code: int, body: str):
        self.status_code = status_code
        self.body = body
        self.error: Optional[Dict[str, Any]] = None
        try:
            self.error = json.loads(body) if body else None
        except ValueError:
            self.error = None
        detail = ""
        if isinstance(self.error, dict):
            detail = f" {self.error.get('code', '')}: {self.error.get('message', '')}"
        elif body:
            detail = f": {body[:300]}"
        super().__init__(f"Garrison API returned {status_code}{detail}")

    @property
    def code(self) -> Optional[str]:
        return self.error.get("code") if isinstance(self.error, dict) else None

    @property
    def fields(self) -> Dict[str, str]:
        """Field messages of a validation error, keyed by field path (for example "input.topic"); empty otherwise."""
        value = self.error.get("fields") if isinstance(self.error, dict) else None
        return value if isinstance(value, dict) else {}

    @property
    def field_codes(self) -> Dict[str, str]:
        """Stable field codes of a validation error (for example {"input.topic": "InputSchemaViolation"}); empty otherwise."""
        value = self.error.get("fieldCodes") if isinstance(self.error, dict) else None
        return value if isinstance(value, dict) else {}


def _clean(params: Optional[Dict[str, Any]]) -> Dict[str, str]:
    if not params:
        return {}
    out: Dict[str, str] = {}
    for key, value in params.items():
        if value is None or value == "":
            continue
        if isinstance(value, bool):
            out[key] = "true" if value else "false"
        elif isinstance(value, datetime):
            out[key] = value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        else:
            out[key] = str(value)
    return out


def _conversation(body: Dict[str, Any], conversation_id: Optional[str], start_conversation: bool) -> Dict[str, Any]:
    if conversation_id:
        body["conversationId"] = conversation_id
    if start_conversation:
        body["startConversation"] = True
    return body


def _seg(value: str) -> str:
    if not value:
        raise ValueError("identifier is required")
    return quote(str(value), safe="")


class Transport:
    """HTTP transport: authentication, signing, JSON, errors, and server-sent events."""

    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 600.0, session: Optional[requests.Session] = None):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = session or requests.Session()
        self.mode = "none"
        self.token: Optional[str] = None
        self.access_key: Optional[str] = None
        self.secret_key: Optional[str] = None
        self.admin_api_key: Optional[str] = None
        self.tenant_id: Optional[str] = None

    def tenant_path(self, suffix: str) -> str:
        if not self.tenant_id:
            raise ValueError("set tenant_id on the client (or log in) before calling tenant-scoped APIs")
        return f"/v1.0/api/tenants/{_seg(self.tenant_id)}{suffix}"

    def _headers(self, method: str, path: str, query: str, body: Optional[bytes]) -> Dict[str, str]:
        headers: Dict[str, str] = {}
        if self.mode == "token" and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.mode == "keys":
            headers["x-access-key"] = self.access_key or ""
            headers["x-secret-key"] = self.secret_key or ""
        elif self.mode == "signed":
            date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            nonce = secrets.token_hex(16)
            canonical = "\n".join([
                method.upper(), path, query, self.tenant_id or "", date, nonce,
                hashlib.sha256(body or b"").hexdigest(),
            ])
            signature = hmac.new((self.secret_key or "").encode(), canonical.encode(), hashlib.sha256).hexdigest()
            headers.update({"x-access-key": self.access_key or "", "x-date": date, "x-nonce": nonce, "x-signature": signature})
            if self.tenant_id:
                headers["x-tenant-id"] = self.tenant_id
        elif self.mode == "admin":
            headers["x-api-key"] = self.admin_api_key or ""
            if self.tenant_id:
                headers["x-tenant-id"] = self.tenant_id
        return headers

    def _prepare(self, method: str, path: str, params: Optional[Dict[str, Any]], body: Any, content_type: Optional[str],
                 extra_headers: Optional[Dict[str, str]] = None):
        query = urlencode(_clean(params), quote_via=quote)
        data: Optional[bytes] = None
        headers: Dict[str, str] = {}
        if body is not None:
            if isinstance(body, (str, bytes)):
                data = body.encode() if isinstance(body, str) else body
                headers["Content-Type"] = content_type or "application/json"
            else:
                data = json.dumps(body).encode()
                headers["Content-Type"] = "application/json"
        if extra_headers:
            headers.update(extra_headers)
        headers.update(self._headers(method, path, query, data))
        url = self.base_url + path + (f"?{query}" if query else "")
        return url, data, headers

    def request(self, method: str, path: str, params: Optional[Dict[str, Any]] = None, body: Any = None,
                content_type: Optional[str] = None, raw: bool = False, headers: Optional[Dict[str, str]] = None) -> Any:
        url, data, headers = self._prepare(method, path, params, body, content_type, headers)
        response = self.session.request(method, url, data=data, headers=headers, timeout=self.timeout)
        if response.status_code >= 400:
            raise GarrisonError(response.status_code, response.text)
        if raw:
            return response.text
        if not response.content:
            return None
        return response.json()

    def request_bytes(self, path: str) -> bytes:
        url, data, headers = self._prepare("GET", path, None, None, None)
        response = self.session.request("GET", url, data=data, headers=headers, timeout=self.timeout)
        if response.status_code >= 400:
            raise GarrisonError(response.status_code, response.text)
        return response.content

    def stream(self, path: str, params: Optional[Dict[str, Any]] = None) -> Iterator[Dict[str, Any]]:
        url, _, headers = self._prepare("GET", path, params, None, None)
        headers["Accept"] = "text/event-stream"
        with self.session.get(url, headers=headers, stream=True, timeout=self.timeout) as response:
            if response.status_code >= 400:
                raise GarrisonError(response.status_code, response.text)
            event: Dict[str, Any] = {"event": None, "id": None, "data": []}
            for line in response.iter_lines(decode_unicode=True):
                if line is None:
                    continue
                if line == "":
                    if event["data"] or event["event"]:
                        yield {"event": event["event"] or "message", "id": event["id"], "data": "\n".join(event["data"])}
                    event = {"event": None, "id": None, "data": []}
                    continue
                if line.startswith(":"):
                    continue
                field, _, value = line.partition(":")
                value = value[1:] if value.startswith(" ") else value
                if field == "event":
                    event["event"] = value
                elif field == "id":
                    event["id"] = value
                elif field == "data":
                    event["data"].append(value)
            if event["data"]:
                yield {"event": event["event"] or "message", "id": event["id"], "data": "\n".join(event["data"])}


def _enum(max_results: Optional[int] = None, skip: Optional[int] = None, ordering: Optional[str] = None,
          search: Optional[str] = None, active_only: Optional[bool] = None, include_built_in: Optional[bool] = None) -> Dict[str, Any]:
    return {"maxResults": max_results, "skip": skip, "ordering": ordering, "search": search,
            "activeOnly": active_only, "includeBuiltIn": include_built_in}


class Resource:
    """Standard list/get/create/update/delete for a tenant-scoped collection."""

    def __init__(self, transport: Transport, segment: str):
        self._t = transport
        self._segment = segment

    def _base(self) -> str:
        return self._t.tenant_path(f"/{self._segment}")

    def _item(self, id: str) -> str:
        return f"{self._base()}/{_seg(id)}"

    def list(self, max_results: Optional[int] = None, skip: Optional[int] = None, ordering: Optional[str] = None,
             search: Optional[str] = None, active_only: Optional[bool] = None, include_built_in: Optional[bool] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._base(), _enum(max_results, skip, ordering, search, active_only, include_built_in))

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id))

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._base(), body=body)

    def update(self, id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("PUT", self._item(id), body=body)

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", self._item(id))


class UsageQuotas(Resource):
    """Daily UTC quotas. Unknown cost is visible and does not independently block admission."""

    def usage(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/usage")


class Pipelines(Resource):
    """Pipeline definitions: ordered agent stages with optional human review gates. get, update, and delete accept an
    identifier or a name. update replaces the stages and advances the version; started pipeline runs keep their
    snapshot. delete raises GarrisonError 409 PipelineInUse while pipeline runs are active."""

    def start(self, pipeline: str, input: str, input_content_type: Optional[str] = None, priority: int = 0,
              wait: bool = False, wait_seconds: int = 60, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """Start a pipeline. Needs Pipeline Execute and Agent Execute on every stage agent. With wait=True the call
        returns when the pipeline run ends or waits for a review, or after wait_seconds (0 to 600). A repeated
        idempotency_key (sent as the Idempotency-Key header) returns the same pipeline run; reusing it with a different
        pipeline or input raises GarrisonError 409 IdempotencyKeyConflict."""
        body: Dict[str, Any] = {"input": input, "priority": priority, "wait": wait, "waitSeconds": wait_seconds}
        if input_content_type:
            body["inputContentType"] = input_content_type
        headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
        return self._t.request("POST", self._item(pipeline) + "/start", body=body, headers=headers)

    def preview(self, pipeline: str, input: str = "", sample_outputs: Optional[List[str]] = None) -> Dict[str, Any]:
        """Render every stage prompt from a sample input and sample stage outputs (secrets redacted). Returns
        {pipelineId, pipelineName, stages: [{position, stageName, agentName, deploymentId, deploymentName, success,
        prompt, errorCode, errorMessage}]}."""
        return self._t.request("POST", self._item(pipeline) + "/preview", body={"input": input, "sampleOutputs": sample_outputs or []})


class PipelineRuns:
    """Pipeline runs: list, read (with stages, stage run summaries, and reviews), cancel, retry, and delete."""

    def __init__(self, transport: Transport):
        self._t = transport

    def _p(self, suffix: str = "") -> str:
        return self._t.tenant_path("/pipeline-runs" + suffix)

    def list(self, pipeline_id: Optional[str] = None, status: Optional[str] = None, caller_id: Optional[str] = None,
             from_utc: Optional[datetime] = None, to_utc: Optional[datetime] = None, max_results: Optional[int] = None,
             skip: Optional[int] = None, ordering: Optional[str] = None) -> Dict[str, Any]:
        """List pipeline runs, newest first. status is one of PIPELINE_RUN_STATUSES."""
        return self._t.request("GET", self._p(), {
            "pipelineId": pipeline_id, "status": status, "callerId": caller_id, "fromUtc": from_utc, "toUtc": to_utc,
            "maxResults": max_results, "skip": skip, "ordering": ordering})

    def get(self, id: str, wait_seconds: Optional[int] = None) -> Dict[str, Any]:
        """Read a pipeline run. wait_seconds (1 to 600) waits until it ends or waits for a review."""
        return self._t.request("GET", self._p(f"/{_seg(id)}"), {"waitSeconds": wait_seconds})

    def cancel(self, id: str) -> Dict[str, Any]:
        """Cancel an active pipeline run, its pending review, and its current stage run. Raises GarrisonError 409
        PipelineRunFinished when it already ended."""
        return self._t.request("POST", self._p(f"/{_seg(id)}/cancel"))

    def retry(self, id: str) -> Dict[str, Any]:
        """Resume a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped. Raises GarrisonError 409
        PipelineRunNotRetryable otherwise."""
        return self._t.request("POST", self._p(f"/{_seg(id)}/retry"))

    def delete(self, id: str) -> Any:
        """Delete a finished pipeline run and its reviews (stage runs are kept). Raises GarrisonError 409
        PipelineRunActive while it is active."""
        return self._t.request("DELETE", self._p(f"/{_seg(id)}"))

    def wait_for_completion(self, id: str, timeout: float = 300.0, wait_seconds: int = 30) -> Dict[str, Any]:
        """Wait until the pipeline run reaches a terminal status (PIPELINE_RUN_TERMINAL_STATUSES) or timeout elapses.
        A pipeline run waiting for a review keeps waiting until someone decides it."""
        deadline = time.monotonic() + timeout
        while True:
            run = self.get(id)
            remaining = deadline - time.monotonic()
            if run.get("status") in PIPELINE_RUN_TERMINAL_STATUSES or remaining <= 0:
                return run
            if run.get("status") == "AwaitingReview":
                time.sleep(min(0.5, remaining))
            else:
                self.get(id, wait_seconds=max(1, min(wait_seconds, int(remaining))))


class PipelineReviews:
    """Pipeline stage reviews (authorized as Approval Read and Update)."""

    def __init__(self, transport: Transport):
        self._t = transport

    def _p(self, suffix: str = "") -> str:
        return self._t.tenant_path("/pipeline-reviews" + suffix)

    def list(self, status: Optional[str] = None, pipeline_run_id: Optional[str] = None, pipeline_id: Optional[str] = None,
             run_id: Optional[str] = None, decision_source: Optional[str] = None, from_utc: Optional[datetime] = None,
             to_utc: Optional[datetime] = None, max_results: Optional[int] = None, skip: Optional[int] = None,
             ordering: Optional[str] = None) -> Dict[str, Any]:
        """List reviews, newest first. status is one of PIPELINE_REVIEW_STATUSES, decision_source one of
        PIPELINE_REVIEW_SOURCES."""
        return self._t.request("GET", self._p(), {
            "status": status, "pipelineRunId": pipeline_run_id, "pipelineId": pipeline_id, "runId": run_id,
            "decisionSource": decision_source, "fromUtc": from_utc, "toUtc": to_utc, "maxResults": max_results,
            "skip": skip, "ordering": ordering})

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}"))

    def decide(self, id: str, decision: str, comment: Optional[str] = None) -> Dict[str, Any]:
        """Decide a pending review. decision is one of PIPELINE_REVIEW_DECISIONS: Approve (the comment reaches the next
        stage as review notes), RequestChanges (comment required; the stage runs again with it), or Reject (the
        pipeline run fails). Raises GarrisonError 409 ReviewNotPending or RevisionLimitReached."""
        body: Dict[str, Any] = {"decision": decision}
        if comment is not None:
            body["comment"] = comment
        return self._t.request("POST", self._p(f"/{_seg(id)}/decide"), body=body)


class Triggers(Resource):
    """Triggers: cron schedules and signed webhooks that start an agent run or a pipeline run. get/update/delete take an
    identifier or a name. Create and update need Execute on the target; the trigger runs as the caller. A Webhook trigger's
    "signingSecret" is returned only by create and rotate_secret."""

    def list(self, max_results: Optional[int] = None, skip: Optional[int] = None, ordering: Optional[str] = None,
             search: Optional[str] = None, active_only: Optional[bool] = None, include_built_in: Optional[bool] = None,
             type: Optional[str] = None) -> Dict[str, Any]:
        """List triggers; type is one of TRIGGER_TYPES."""
        params = _enum(max_results, skip, ordering, search, active_only, include_built_in)
        params["type"] = type
        return self._t.request("GET", self._base(), params)

    def rotate_secret(self, trigger: str) -> Dict[str, Any]:
        """Replace a webhook trigger's signing secret; the new one is in the returned "signingSecret" only."""
        return self._t.request("POST", self._item(trigger) + "/rotate-secret")

    def fire(self, trigger: str, body: Optional[str] = None, content_type: Optional[str] = None) -> Dict[str, Any]:
        """Fire a trigger now. The optional payload reaches the input template as webhook.body. Returns the fire."""
        return self._t.request("POST", self._item(trigger) + "/fire", body={"body": body, "contentType": content_type})

    def list_fires(self, trigger: str, outcome: Optional[str] = None, max_results: Optional[int] = None,
                   skip: Optional[int] = None) -> Dict[str, Any]:
        """List a trigger's fires, newest first; outcome is one of TRIGGER_FIRE_OUTCOMES."""
        return self._t.request("GET", self._item(trigger) + "/fires", {"outcome": outcome, "maxResults": max_results, "skip": skip})

    def deliver_webhook(self, trigger_id: str, signing_secret: str, body: Union[bytes, str],
                        content_type: str = "application/json", delivery_id: Optional[str] = None) -> Dict[str, Any]:
        """Deliver a signed webhook to a Webhook trigger as an external sender would (signed with sign_webhook at the
        current time). A repeated delivery_id returns the earlier fire with "duplicate" true. Raises GarrisonError 401
        InvalidSignature, 409 TriggerInactive, or 413."""
        data = body.encode("utf-8") if isinstance(body, str) else body
        headers = {WEBHOOK_SIGNATURE_HEADER: sign_webhook(signing_secret, int(time.time()), data)}
        if delivery_id:
            headers[WEBHOOK_DELIVERY_HEADER] = delivery_id
        return self._t.request("POST", self._item(trigger_id) + "/webhook", body=data, content_type=content_type, headers=headers)


class NotificationEndpoints(Resource):
    """Notification endpoints: URLs that receive signed JSON notifications for run, pipeline, and approval events.
    "signingSecret" is returned only by create and rotate_secret. Receivers check each request with verify_webhook and
    ignore repeated X-Garrison-Delivery values (delivery is at least once)."""

    def rotate_secret(self, endpoint: str) -> Dict[str, Any]:
        """Replace the signing secret; the new one is in the returned "signingSecret" only."""
        return self._t.request("POST", self._item(endpoint) + "/rotate-secret")

    def test(self, endpoint: str) -> Dict[str, Any]:
        """Send a test notification now; returns the delivery after its first attempt."""
        return self._t.request("POST", self._item(endpoint) + "/test")

    def list_deliveries(self, endpoint: str, status: Optional[str] = None, max_results: Optional[int] = None,
                        skip: Optional[int] = None) -> Dict[str, Any]:
        """List an endpoint's deliveries, newest first; status is one of NOTIFICATION_DELIVERY_STATUSES."""
        return self._t.request("GET", self._item(endpoint) + "/deliveries", {"status": status, "maxResults": max_results, "skip": skip})

    def get_delivery(self, endpoint: str, delivery_id: str) -> Dict[str, Any]:
        """Read one delivery with its payload and last attempt."""
        return self._t.request("GET", self._item(endpoint) + f"/deliveries/{_seg(delivery_id)}")


class Users(Resource):
    def permissions(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/permissions")


class Credentials(Resource):
    """Credentials. create() returns {credential, accessKey, secretKey}; the secret is shown once."""

    def rotate(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/rotate")

    def permissions(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/permissions")


class Roles(Resource):
    def clone(self, id: str, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/clone", body={"name": name, "description": description})


class Agents(Resource):
    def invoke(self, agent: str, input: str, wait: bool = True, wait_seconds: int = 60, parameters: Optional[Dict[str, str]] = None,
               deployment_id: Optional[str] = None, priority: int = 0, cancel_on_disconnect: Optional[bool] = None,
               conversation_id: Optional[str] = None, start_conversation: bool = False,
               input_content_type: Optional[str] = None) -> Dict[str, Any]:
        """Invoke an agent by identifier or name. With wait=True the finished run is returned when it completes in time.
        A waiting call that disconnects cancels its run unless cancel_on_disconnect is False. start_conversation=True
        starts a conversation (the run's conversationId names it); conversation_id sends the next turn of one, and raises
        GarrisonError 409 ConversationBusy while the previous turn is unfinished. For an agent with an "inputSchemaJson",
        input must be a JSON document that matches it (send json.dumps(value) with input_content_type="application/json");
        otherwise GarrisonError 400 is raised and field_codes maps "input" (InputNotJson) or "input.<path>"
        (InputSchemaViolation) to the failure."""
        body = {"input": input, "wait": wait, "waitSeconds": wait_seconds, "parameters": parameters or {}, "priority": priority}
        if input_content_type:
            body["inputContentType"] = input_content_type
        if deployment_id:
            body["deploymentId"] = deployment_id
        if cancel_on_disconnect is not None:
            body["cancelOnDisconnect"] = cancel_on_disconnect
        return self._t.request("POST", self._item(agent) + "/invoke", body=_conversation(body, conversation_id, start_conversation))

    def card(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/card")

    def register(self, agent: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._base() + "/register", body=agent)


class Deployments(Resource):
    def compile_preview(self, id: str, input: str = "Hello from the compile preview.", parameters: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/compile-preview", body={"input": input, "parameters": parameters or {}})

    def test(self, id: str, input: str, wait: bool = True, wait_seconds: int = 60, conversation_id: Optional[str] = None,
             start_conversation: bool = False) -> Dict[str, Any]:
        body: Dict[str, Any] = {"input": input, "wait": wait, "waitSeconds": wait_seconds}
        return self._t.request("POST", self._item(id) + "/test", body=_conversation(body, conversation_id, start_conversation))


class HarnessProfiles(Resource):
    def builtin(self) -> List[Dict[str, Any]]:
        return self._t.request("GET", "/v1.0/api/harness-profiles/builtin")

    def clone(self, id: str, name: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/clone", body={"name": name})


class PromptTemplates(Resource):
    def versions(self, id: str) -> List[Dict[str, Any]]:
        return self._t.request("GET", self._item(id) + "/versions")

    def version(self, id: str, version: int) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + f"/versions/{int(version)}")

    def restore(self, id: str, version: int) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + f"/restore/{int(version)}")

    def clone(self, id: str, name: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/clone", body={"name": name})

    def reset(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/reset")

    def render(self, id: str, context: Optional[Dict[str, Any]] = None, deployment_id: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/render", body={"context": context, "deploymentId": deployment_id})

    def render_content(self, content: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._base() + "/render", body={"content": content, "context": context})


class McpServers(Resource):
    def test(self, id: str, node_id: Optional[str] = None) -> Dict[str, Any]:
        """List HTTP tools, or test stdio on the explicitly selected worker."""
        return self._t.request("POST", self._item(id) + "/test", {"nodeId": node_id})


class Secrets(Resource):
    """Secrets (metadata only; values are write-only).

    Each secret carries ``status`` (one of SECRET_STATUSES), ``statusMessage``, ``statusUtc``, ``refreshedUtc`` (when the
    control plane last refreshed a Codex login itself), and ``accessTokenExpiresUtc`` (CodexAuthJson only). A secret
    with status NeedsReauthentication returns to Ok when set_value, rotate, or update sets a new value.
    """

    def set_value(self, id: str, value: str) -> Dict[str, Any]:
        return self._t.request("PUT", self._item(id) + "/value", body={"value": value})

    def rotate(self, id: str, value: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/rotate", body={"value": value})


class Manifests:
    def __init__(self, transport: Transport):
        self._t = transport

    def apply(self, content: str, dry_run: bool = False, allow_secret_values: bool = False) -> Dict[str, Any]:
        """Apply YAML or JSON manifests (multi-document)."""
        stripped = content.lstrip()
        content_type = "application/json" if stripped.startswith(("{", "[")) else "application/yaml"
        return self._t.request("POST", self._t.tenant_path("/manifests/apply"),
                               {"dryRun": dry_run, "allowSecretValues": True if allow_secret_values else None},
                               body=content, content_type=content_type)

    def export(self, kinds: Optional[List[str]] = None, resources: Optional[List[str]] = None,
               follow_references: bool = False, include_built_in: bool = False) -> str:
        """Export a multi-document YAML bundle that apply accepts unchanged. With no kinds and no resources every
        tenant-owned resource is exported. kinds names whole kinds (for example ["Agent", "Pipeline"]); resources names
        single records as "Kind/name" (for example ["Agent/triage"]). follow_references also exports what the selection
        depends on; include_built_in adds referenced built-ins. Secret values are never exported: the leading Bundle
        document lists requiredSecrets, requiredArtifactStores, and requiredBuiltIns. Raises GarrisonError 400 (field
        codes UnknownKind, InvalidSelector) or 404 when a selected resource does not exist."""
        params: Dict[str, Any] = {
            "kinds": ",".join(kinds) if kinds else None,
            "resources": ",".join(resources) if resources else None,
            "followReferences": True if follow_references else None,
            "includeBuiltIn": True if include_built_in else None}
        return self._t.request("GET", self._t.tenant_path("/manifests/export"), params, raw=True)

    def applies(self, max_results: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path("/manifests/applies"), _enum(max_results, skip))

    def get_apply(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path(f"/manifests/applies/{_seg(id)}"))


class Artifacts:
    """Artifact metadata, authenticated bytes, signed links, and active-run uploads."""

    def __init__(self, transport: Transport):
        self._t = transport

    def _base(self) -> str:
        return self._t.tenant_path("/artifacts")

    def list(self, **query) -> Dict[str, Any]:
        return self._t.request("GET", self._base(), query)

    def get(self, artifact_id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._base() + "/" + _seg(artifact_id))

    def download(self, artifact_id: str) -> bytes:
        return self._t.request_bytes(self._base() + "/" + _seg(artifact_id) + "/content")

    def download_url(self, artifact_id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._base() + "/" + _seg(artifact_id) + "/download-url")

    def delete(self, artifact_id: str):
        return self._t.request("DELETE", self._base() + "/" + _seg(artifact_id))

    def upload(self, run_id: str, store_id: str, name: str, content: bytes, epoch: int,
               repair_attempt: int = 0, media_type: str = "application/octet-stream") -> Dict[str, Any]:
        return self._t.request("POST", self._t.tenant_path("/runs/" + _seg(run_id) + "/artifacts"),
                               {"storeId": store_id, "name": name, "epoch": epoch, "repairAttempt": repair_attempt, "mediaType": media_type},
                               content, "application/octet-stream")


class Runs:
    def __init__(self, transport: Transport):
        self._t = transport

    def _p(self, suffix: str = "") -> str:
        return self._t.tenant_path("/runs" + suffix)

    def create(self, input: str, agent_id: Optional[str] = None, agent_name: Optional[str] = None, deployment_id: Optional[str] = None,
               parameters: Optional[Dict[str, str]] = None, priority: int = 0, wait: bool = False, wait_seconds: int = 60,
               cancel_on_disconnect: Optional[bool] = None, conversation_id: Optional[str] = None,
               start_conversation: bool = False) -> Dict[str, Any]:
        body = {"agentId": agent_id, "agentName": agent_name, "deploymentId": deployment_id, "input": input,
                "parameters": parameters or {}, "priority": priority, "wait": wait, "waitSeconds": wait_seconds,
                "cancelOnDisconnect": cancel_on_disconnect}
        body = {k: v for k, v in body.items() if v is not None}
        return self._t.request("POST", self._p(), body=_conversation(body, conversation_id, start_conversation))

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}"))

    def list(self, status: Optional[str] = None, agent_id: Optional[str] = None, deployment_id: Optional[str] = None,
             harness_type: Optional[str] = None, node_id: Optional[str] = None, parent_run_id: Optional[str] = None,
             root_run_id: Optional[str] = None, outcome: Optional[str] = None, from_utc: Optional[datetime] = None,
             to_utc: Optional[datetime] = None, max_results: Optional[int] = None, skip: Optional[int] = None,
             ordering: Optional[str] = None, caller_id: Optional[str] = None, conversation_id: Optional[str] = None,
             trigger_id: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._p(), {"triggerId": trigger_id,
            "status": status, "agentId": agent_id, "deploymentId": deployment_id, "harnessType": harness_type, "nodeId": node_id,
            "parentRunId": parent_run_id, "rootRunId": root_run_id, "outcome": outcome, "fromUtc": from_utc, "toUtc": to_utc,
            "maxResults": max_results, "skip": skip, "ordering": ordering, "callerId": caller_id,
            "conversationId": conversation_id})

    def cancel(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._p(f"/{_seg(id)}/cancel"))

    def retry(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._p(f"/{_seg(id)}/retry"))

    def events(self, id: str, after_sequence: int = 0, limit: int = 500) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}/events"), {"afterSequence": after_sequence, "limit": limit})

    def stream(self, id: str, after_sequence: int = 0) -> Iterator[Dict[str, Any]]:
        """Yield {'name', 'event'|'run', 'data'} items until run.completed (the last item carries the final run)."""
        for message in self._t.stream(self._p(f"/{_seg(id)}/events/stream"), {"afterSequence": after_sequence}):
            item: Dict[str, Any] = {"name": message["event"], "data": message["data"]}
            if message["event"] == "run.event":
                item["event"] = json.loads(message["data"])
            elif message["event"] == "run.completed":
                item["run"] = json.loads(message["data"])
            yield item
            if message["event"] == "run.completed":
                return

    def children(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}/children"))

    def transcript_markdown(self, id: str, include_thinking: bool = False) -> str:
        """Download a run's transcript as Markdown (secrets redacted). Raises GarrisonError 404 for an unknown run."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/transcript"),
                               {"format": "markdown", "includeThinking": include_thinking}, raw=True)

    def transcript(self, id: str, include_thinking: bool = False) -> Transcript:
        """Download a run's transcript as the typed JSON document (schema garrison.transcript/v1)."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/transcript"),
                               {"format": "json", "includeThinking": include_thinking})

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", self._p(f"/{_seg(id)}"))

    def wait_for_completion(self, id: str, timeout: float = 300.0, poll_interval: float = 0.5) -> Dict[str, Any]:
        deadline = time.monotonic() + timeout
        while True:
            run = self.get(id)
            if run.get("status") in TERMINAL_STATUSES or time.monotonic() >= deadline:
                return run
            time.sleep(poll_interval)


class Conversations:
    """Multi-turn conversations with one agent. Start one with start_conversation=True on agents.invoke, runs.create, or
    deployments.test, and continue it with conversation_id. Each turn is a run."""

    def __init__(self, transport: Transport):
        self._t = transport

    def _p(self, suffix: str = "") -> str:
        return self._t.tenant_path("/conversations" + suffix)

    def list(self, agent_id: Optional[str] = None, context_id: Optional[str] = None, caller_id: Optional[str] = None,
             search: Optional[str] = None, max_results: Optional[int] = None, skip: Optional[int] = None,
             ordering: Optional[str] = None) -> Dict[str, Any]:
        """List conversations. Returns an enumeration result whose objects are conversations."""
        return self._t.request("GET", self._p(), {
            "agentId": agent_id, "contextId": context_id, "callerId": caller_id, "search": search,
            "maxResults": max_results, "skip": skip, "ordering": ordering})

    def get(self, id: str) -> Dict[str, Any]:
        """Read a conversation. Raises GarrisonError 404 when it does not exist."""
        return self._t.request("GET", self._p(f"/{_seg(id)}"))

    def delete(self, id: str) -> Any:
        """Delete a conversation (its runs are kept). Raises GarrisonError 409 ConversationBusy while a turn is unfinished."""
        return self._t.request("DELETE", self._p(f"/{_seg(id)}"))

    def list_runs(self, id: str, max_results: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        """List a conversation's turns (runs), oldest first."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/runs"), {"maxResults": max_results, "skip": skip})

    def transcript_markdown(self, id: str, include_thinking: bool = False) -> str:
        """Download a conversation's transcript (every turn, oldest first) as Markdown."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/transcript"),
                               {"format": "markdown", "includeThinking": include_thinking}, raw=True)

    def transcript(self, id: str, include_thinking: bool = False) -> Transcript:
        """Download a conversation's transcript (every turn, oldest first) as the typed JSON document."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/transcript"),
                               {"format": "json", "includeThinking": include_thinking})


class Approvals:
    """Permission approvals: list, read, decide, and evaluate a deployment's approval rules (approval check)."""

    def __init__(self, transport: Transport):
        self._t = transport

    def list(self, status: Optional[str] = None, run_id: Optional[str] = None, root_run_id: Optional[str] = None,
             agent_id: Optional[str] = None, deployment_id: Optional[str] = None, decision_source: Optional[str] = None,
             from_utc: Optional[datetime] = None, to_utc: Optional[datetime] = None, max_results: Optional[int] = None,
             skip: Optional[int] = None, ordering: Optional[str] = None) -> Dict[str, Any]:
        """GET /v1.0/api/tenants/{tenantId}/approvals. status is one of APPROVAL_STATUSES, decision_source one of
        APPROVAL_SOURCES. For a pending count, pass status="Pending", max_results=1 and read totalRecords."""
        return self._t.request("GET", self._t.tenant_path("/approvals"), {
            "status": status, "runId": run_id, "rootRunId": root_run_id, "agentId": agent_id,
            "deploymentId": deployment_id, "decisionSource": decision_source, "fromUtc": from_utc, "toUtc": to_utc,
            "maxResults": max_results, "skip": skip, "ordering": ordering})

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path(f"/approvals/{_seg(id)}"))

    def decide(self, id: str, decision: str, reason: Optional[str] = None, remember: bool = False,
               rule_pattern: Optional[str] = None) -> Dict[str, Any]:
        """Decide a pending approval: decision is "Allow" or "Deny". remember=True also adds a matching rule to the
        approval's deployment (rule_pattern, or the approval's suggestedRule) and needs Update on that deployment.
        Raises GarrisonError (409, code ApprovalNotPending) when the approval was already decided."""
        body = {"decision": decision, "reason": reason, "remember": remember, "rulePattern": rule_pattern}
        return self._t.request("POST", self._t.tenant_path(f"/approvals/{_seg(id)}/decide"),
                               body={k: v for k, v in body.items() if v is not None})

    def check(self, deployment_id: str, tool_name: str, input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Evaluate a deployment's approval rules against a sample tool call without recording anything. input uses
        Claude Code tool input names (command, cwd, url, file_path, notebook_path, path, paths, pattern, query).
        Returns {action, source, ruleId, rulePattern, suggestedRule, approvalsEnabled}."""
        body: Dict[str, Any] = {"toolName": tool_name}
        if input is not None:
            body["input"] = input
        return self._t.request("POST", self._t.tenant_path(f"/deployments/{_seg(deployment_id)}/approval-check"), body=body)


class Analytics:
    """Tenant analytics. Responses are dictionaries with the server's camelCase field names."""

    INTERVALS = ("minute", "hour", "day", "week", "auto")
    GROUP_BY = ("none", "agent", "harness", "model", "harnessModel")

    def __init__(self, transport: Transport):
        self._t = transport

    def runs(self, from_: Optional[Union[datetime, str]] = None, to: Optional[Union[datetime, str]] = None,
             interval: Optional[str] = None, agent_id: Optional[str] = None, harness_type: Optional[str] = None,
             deployment_id: Optional[str] = None, group_by: Optional[str] = None,
             model: Optional[str] = None) -> Dict[str, Any]:
        """Run analytics over a time range: GET /v1.0/api/tenants/{tenantId}/analytics/runs.

        from_ and to accept a datetime (converted to UTC) or an ISO 8601 UTC string. interval is minute, hour,
        day, week, or auto. model keeps only runs whose served model equals the value; "unknown" matches runs
        without a recorded model. group_by is none, agent, harness, model, or harnessModel (series key
        "Harness|model", label "Harness / model"). Omitted parameters use the server defaults.
        Returns {fromUtc, toUtc, interval, bucketSeconds, truncated, totals, series: [{key, label, buckets}]}.
        Raises GarrisonError (400) when from_ >= to, when the range needs more than 400 buckets, or when a
        parameter is invalid.
        """
        return self._t.request("GET", self._t.tenant_path("/analytics/runs"), {
            "from": from_, "to": to, "interval": interval, "agentId": agent_id, "harnessType": harness_type,
            "deploymentId": deployment_id, "model": model, "groupBy": group_by})

    def dimensions(self, from_: Optional[Union[datetime, str]] = None,
                   to: Optional[Union[datetime, str]] = None) -> Dict[str, Any]:
        """Distinct filter values among runs in a range: GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions.

        from_ and to behave as in runs (default: the last 24 hours). Returns {agents: [{id, name}], harnesses:
        [str], deployments: [{id, name, agentId}], models: [str], truncated}. "unknown" in models stands for
        runs without a recorded model. Raises GarrisonError (400) when from_ >= to or a timestamp is invalid.
        """
        return self._t.request("GET", self._t.tenant_path("/analytics/runs/dimensions"), {"from": from_, "to": to})


class Global:
    """Platform-level collection (tenants, nodes, node pools)."""

    def __init__(self, transport: Transport, path: str):
        self._t = transport
        self._path = path

    def list(self, max_results: Optional[int] = None, skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._path, _enum(max_results, skip, None, search))

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", f"{self._path}/{_seg(id)}")

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._path, body=body)

    def update(self, id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("PUT", f"{self._path}/{_seg(id)}", body=body)

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", f"{self._path}/{_seg(id)}")


class Nodes(Global):
    def cordon(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", f"{self._path}/{_seg(id)}/cordon")

    def uncordon(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", f"{self._path}/{_seg(id)}/uncordon")

    def drain(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", f"{self._path}/{_seg(id)}/drain")


class ControlNodes:
    """Control-plane replicas (control nodes). Read-only: each replica maintains its own record.

    Records carry id, name, hostname, address, version, schemaVersion, backplane, status (Starting, Ready, Draining,
    Offline), startedUtc, lastHeartbeatUtc, activeRequests, openStreams, heldLongPolls, isLeader, and leaderEpoch (leader
    only). Both calls carry respondingNodeId, the node ID of the replica that answered.
    """

    def __init__(self, transport: Transport):
        self._t = transport
        self._path = "/v1.0/api/control-nodes"

    def list(self, max_results: Optional[int] = None, skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._path, _enum(max_results, skip, None, search))

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", f"{self._path}/{_seg(id)}")


class RequestHistory:
    def __init__(self, transport: Transport):
        self._t = transport

    def list(self, **filters: Any) -> Dict[str, Any]:
        """Filters: method, statusCode, pathContains, fromUtc, toUtc, pageNumber, pageSize, tenantId, userId."""
        return self._t.request("GET", "/v1.0/api/request-history", filters)

    def summary(self, from_utc: datetime, to_utc: datetime, bucket_minutes: int = 15) -> Dict[str, Any]:
        return self._t.request("GET", "/v1.0/api/request-history/summary", {"fromUtc": from_utc, "toUtc": to_utc, "bucketMinutes": bucket_minutes})

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", f"/v1.0/api/request-history/{_seg(id)}")

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", f"/v1.0/api/request-history/{_seg(id)}")

    def delete_many(self, **filters: Any) -> Dict[str, Any]:
        return self._t.request("DELETE", "/v1.0/api/request-history", filters)


class Audit:
    def __init__(self, transport: Transport):
        self._t = transport

    def list(self, **filters: Any) -> Dict[str, Any]:
        """Filters: eventType, principalId, result, fromUtc, toUtc, pageNumber, pageSize."""
        return self._t.request("GET", self._t.tenant_path("/audit"), filters)

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path(f"/audit/{_seg(id)}"))

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", self._t.tenant_path(f"/audit/{_seg(id)}"))

    def delete_many(self, **filters: Any) -> Dict[str, Any]:
        return self._t.request("DELETE", self._t.tenant_path("/audit"), filters)


class Settings:
    def __init__(self, transport: Transport):
        self._t = transport

    def get(self) -> Dict[str, Any]:
        return self._t.request("GET", "/v1.0/api/settings")

    def update(self, values: List[Dict[str, Any]]) -> Dict[str, Any]:
        """values: [{"path": "...", "value": "..."}]"""
        return self._t.request("PUT", "/v1.0/api/settings", body={"values": values})

    def restart(self) -> Dict[str, Any]:
        return self._t.request("POST", "/v1.0/api/settings/restart")

    def test_database(self) -> Dict[str, Any]:
        return self._t.request("POST", "/v1.0/api/settings/database/test")


class GarrisonClient:
    """Garrison API client. Authenticate with login(), login_with_keys(), use_access_key(), use_signed_requests(),
    use_token(), or use_admin_api_key(), then use the module attributes."""

    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 600.0, session: Optional[requests.Session] = None):
        t = Transport(base_url, timeout, session)
        self.transport = t
        self.tenants = Global(t, "/v1.0/api/tenants")
        self.users = Users(t, "users")
        self.credentials = Credentials(t, "credentials")
        self.roles = Roles(t, "roles")
        self.permissions = Resource(t, "permissions")
        self.role_permissions = Resource(t, "role-permissions")
        self.user_role_assignments = Resource(t, "user-role-assignments")
        self.credential_scope_assignments = Resource(t, "credential-scope-assignments")
        self.agents = Agents(t, "agents")
        self.deployments = Deployments(t, "deployments")
        self.harness_profiles = HarnessProfiles(t, "harness-profiles")
        self.prompt_templates = PromptTemplates(t, "prompt-templates")
        self.mcp_servers = McpServers(t, "mcp-servers")
        self.secrets = Secrets(t, "secrets")
        self.workspace_templates = Resource(t, "workspace-templates")
        self.artifact_stores = Resource(t, "artifact-stores")
        self.artifacts = Artifacts(t)
        self.model_prices = Resource(t, "model-prices")
        self.usage_quotas = UsageQuotas(t, "usage-quotas")
        self.pipelines = Pipelines(t, "pipelines")
        self.pipeline_runs = PipelineRuns(t)
        self.pipeline_reviews = PipelineReviews(t)
        self.triggers = Triggers(t, "triggers")
        self.notification_endpoints = NotificationEndpoints(t, "notification-endpoints")
        self.manifests = Manifests(t)
        self.runs = Runs(t)
        self.conversations = Conversations(t)
        self.approvals = Approvals(t)
        self.analytics = Analytics(t)
        self.nodes = Nodes(t, "/v1.0/api/nodes")
        self.control_nodes = ControlNodes(t)
        self.node_pools = Global(t, "/v1.0/api/node-pools")
        self.request_history = RequestHistory(t)
        self.audit = Audit(t)
        self.settings = Settings(t)

    @property
    def tenant_id(self) -> Optional[str]:
        return self.transport.tenant_id

    @tenant_id.setter
    def tenant_id(self, value: Optional[str]) -> None:
        self.transport.tenant_id = value

    def _issue(self, body: Dict[str, Any]) -> Dict[str, Any]:
        previous = self.transport.mode
        self.transport.mode = "none"
        try:
            issued = self.transport.request("POST", "/v1.0/token", body={k: v for k, v in body.items() if v is not None})
        except Exception:
            self.transport.mode = previous
            raise
        self.use_token(issued["token"], issued.get("tenantId"))
        return issued

    def login(self, email: str, password: str, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        return self._issue({"email": email, "password": password, "tenantId": tenant_id})

    def login_with_keys(self, access_key: str, secret_key: str) -> Dict[str, Any]:
        return self._issue({"accessKey": access_key, "secretKey": secret_key})

    def use_token(self, token: str, tenant_id: Optional[str]) -> None:
        self.transport.mode, self.transport.token, self.transport.tenant_id = "token", token, tenant_id

    def use_access_key(self, access_key: str, secret_key: str, tenant_id: str) -> None:
        t = self.transport
        t.mode, t.access_key, t.secret_key, t.tenant_id = "keys", access_key, secret_key, tenant_id

    def use_signed_requests(self, access_key: str, secret_key: str, tenant_id: str) -> None:
        t = self.transport
        t.mode, t.access_key, t.secret_key, t.tenant_id = "signed", access_key, secret_key, tenant_id

    def use_admin_api_key(self, api_key: str, tenant_id: Optional[str] = None) -> None:
        t = self.transport
        t.mode, t.admin_api_key, t.tenant_id = "admin", api_key, tenant_id

    def token_details(self) -> Dict[str, Any]:
        return self.transport.request("GET", "/v1.0/token/details")

    def refresh(self) -> Dict[str, Any]:
        issued = self.transport.request("POST", "/v1.0/token/refresh")
        self.use_token(issued["token"], issued.get("tenantId") or self.tenant_id)
        return issued

    def logout(self) -> None:
        self.transport.request("DELETE", "/v1.0/token")
        self.transport.mode, self.transport.token = "none", None

    def health(self) -> Dict[str, Any]:
        return self.transport.request("GET", "/v1.0/api/health")

    def server_info(self) -> Dict[str, Any]:
        return self.transport.request("GET", "/v1.0/api/server-info")

    def overview(self) -> Dict[str, Any]:
        return self.transport.request("GET", self.transport.tenant_path("/overview"))

    def queue_summary(self) -> List[Dict[str, Any]]:
        return self.transport.request("GET", self.transport.tenant_path("/queue/summary"))
