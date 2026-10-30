"""Garrison REST client. Responses are returned as dictionaries with the server's camelCase field names."""

from __future__ import annotations

import hashlib
import hmac
import base64
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, List, Optional, Union, Literal, TypedDict
from urllib.parse import quote, urlencode

import requests

class RunDatabaseUsage(TypedDict):
    """Exact completed-scope SQL attempts; shared polling and telemetry writes are excluded."""
    tenantId: str
    runId: str
    operation: str
    statements: int
    reads: int
    writes: int
    errors: int
    transactions: int
    durationMicroseconds: int


class NodePlacementResponse(TypedDict):
    """Advisory node eligibility. Reasons contain stable codes, never other tenant run data."""
    nodeId: str
    eligible: bool
    reasons: List[str]


class RunPlacementResponse(TypedDict, total=False):
    """Read-only diagnostic; null optional fields may be omitted by the server. No capacity reservation."""
    runId: str
    takenUtc: str
    admissionRejection: Optional[str]
    reasons: List[str]
    nodes: List[NodePlacementResponse]
    eligible: bool


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


class EffectOperation(TypedDict):
    """Gateway intent metadata; does not contain raw arguments or secrets."""
    id: str
    tenantId: str
    runId: str
    leaseEpoch: int
    tool: str
    argumentDigest: str
    state: str
    resultReference: Optional[str]
    createdUtc: str


class MasterKeyRotationResponse(TypedDict):
    """Resumable encryption rotation pass counts, without key material."""
    keyVersion: int
    scanned: int
    rotated: int
    conflicts: int
    failed: int


class PromptPin(TypedDict):
    """AgentRevision["promptPins"] item: a prompt template pinned to a version for one role."""
    role: str
    templateId: str
    pinnedVersion: int


class AssetPin(TypedDict, total=False):
    """AgentRevision["assetPins"] item: an agent asset pinned to a version, or to its current version when version is None."""
    assetId: str
    version: Optional[int]


class AgentAsset(TypedDict, total=False):
    """A versioned agent asset. kind is one of AGENT_ASSET_KINDS; promptTemplateId is required for SystemPrompt assets;
    artifactStoreId None stores files in the Garrison database; currentVersion 0 means no version yet."""
    id: str
    tenantId: str
    name: str
    kind: str
    description: Optional[str]
    promptTemplateId: Optional[str]
    artifactStoreId: Optional[str]
    currentVersion: int
    tags: List[str]
    createdUtc: str
    lastUpdateUtc: str


class AgentAssetFile(TypedDict, total=False):
    """AgentAssetVersion["files"] item. sha256 is lowercase hex; contentBase64 is only present on upload."""
    path: str
    mediaType: Optional[str]
    sizeBytes: int
    sha256: str
    storageKey: str
    contentBase64: str


class ConversationFile(TypedDict, total=False):
    """A file in a conversation file space. sha256 is lowercase hex; deleted files appear only with include_deleted."""
    id: str
    tenantId: str
    fileSpaceId: str
    path: str
    currentVersion: int
    sizeBytes: int
    sha256: Optional[str]
    mediaType: Optional[str]
    deleted: bool
    createdUtc: str
    lastUpdateUtc: str


class ConversationFileVersion(TypedDict, total=False):
    """An immutable version of a conversation file. runId is None for API writes."""
    id: str
    tenantId: str
    fileId: str
    number: int
    sizeBytes: int
    sha256: Optional[str]
    mediaType: Optional[str]
    runId: Optional[str]
    leaseEpoch: int
    writtenBy: Optional[str]
    storageKey: Optional[str]
    createdUtc: str


class FileSpaceListing(TypedDict, total=False):
    """Files in a conversation or run file space. fileSpaceId is None until the space exists."""
    fileSpaceId: Optional[str]
    fileCount: int
    totalBytes: int
    files: List[ConversationFile]


class FileSpaceUploadResult(TypedDict, total=False):
    """Result of a file space write. conflict is True when baseVersion was stale; path is then the conflict name."""
    requestedPath: str
    path: str
    version: int
    conflict: bool
    sha256: Optional[str]


class FileDownloadUrl(TypedDict, total=False):
    """A short-lived download-only URL; fetching it needs no credentials."""
    url: str
    expiresUtc: str


class CapabilityRequirement(TypedDict, total=False):
    """A node label a run needs when its agent uses a capability, for example garrison.io/tool-pandoc=true."""
    key: str
    value: str


class CapabilityHints(TypedDict, total=False):
    """Cost and latency hints from recent finished runs. status is one of CAPABILITY_HINT_STATUSES; every value is None
    while it is Unknown."""
    status: str
    sampleSize: int
    medianDurationMs: Optional[int]
    p90DurationMs: Optional[int]
    meanCostUsd: Optional[float]
    windowDays: int
    computedUtc: Optional[str]


class CapabilityDescriptor(TypedDict, total=False):
    """One capability catalog entry. kind is one of CAPABILITY_KINDS, origin one of CAPABILITY_ORIGINS. tenantId is None
    for descriptors every tenant shares. Schemas are JSON Schema documents as JSON text."""
    id: str
    tenantId: Optional[str]
    name: str
    kind: str
    origin: str
    sourceKey: str
    sourceAgentId: Optional[str]
    sourceRevisionId: Optional[str]
    sourceMcpServerId: Optional[str]
    sourceToolName: Optional[str]
    sourceHarnessProfileId: Optional[str]
    sourceHarnessType: Optional[str]
    summary: Optional[str]
    inputSchemaJson: Optional[str]
    outputSchemaJson: Optional[str]
    tags: List[str]
    requirements: List[CapabilityRequirement]
    hints: CapabilityHints
    refreshWarning: Optional[str]
    lastRefreshedUtc: Optional[str]
    createdUtc: str
    lastUpdateUtc: str


class CapabilityServerRefresh(TypedDict, total=False):
    """Refresh outcome for one MCP server. error is set when its tool listing failed."""
    mcpServerId: str
    mcpServerName: str
    tools: int
    removed: int
    warned: int
    error: Optional[str]


class CapabilityRefreshResult(TypedDict, total=False):
    """Result of capabilities.refresh: descriptors created, refreshed, or removed per source."""
    agents: int
    harnessBuiltIns: int
    hints: int
    mcpServers: List[CapabilityServerRefresh]


class FanOutMember(TypedDict, total=False):
    """One member of a fan-out group: a child run with its state and, once finished, its result. status is a run status
    and outcome a run outcome (None until it finishes). resultText is cut at the server's gather limit and
    resultTruncated reports the cut. filesWritten holds paths the member wrote in the shared file space. tokens counts
    input plus output tokens."""
    label: str
    agent: str
    runId: str
    status: str
    outcome: Optional[str]
    resultText: Optional[str]
    resultTruncated: bool
    structuredOutputJson: Optional[str]
    errorMessage: Optional[str]
    filesWritten: List[str]
    costUsd: Optional[float]
    tokens: int


class FanOutGroup(TypedDict, total=False):
    """A group of child runs a run started with the garrison_fan_out MCP tool. fanOutGroupId has the prefix fog_. status
    is one of FAN_OUT_GROUP_STATUSES (every status but Running is final) and joinPolicy one of FAN_OUT_JOIN_POLICIES.
    pending lists labels of members still queued or running; failed lists those that failed, timed out, or were
    cancelled. costUsd and tokens total the members; maxCostUsd and maxTokens are the budget (absent when unset). Times
    are ISO 8601 UTC. summary, continuationMarker, and continuationInstruction are what a harness sees through
    garrison_gather and are normally absent here."""
    fanOutGroupId: str
    parentRunId: str
    status: str
    statusReason: Optional[str]
    joinPolicy: str
    quorum: int
    total: int
    finished: int
    succeeded: int
    pending: List[str]
    failed: List[str]
    members: List[FanOutMember]
    costUsd: float
    tokens: int
    maxCostUsd: Optional[float]
    maxTokens: Optional[int]
    deadlineUtc: Optional[str]
    createdUtc: str
    completedUtc: Optional[str]
    summary: Optional[str]
    continuationMarker: Optional[str]
    continuationInstruction: Optional[str]


class AgenticAppMember(TypedDict, total=False):
    """One agent in an agentic app. agentId accepts an agent name on create and update; agentName is filled in on read.
    role is optional free text."""
    agentId: str
    agentName: Optional[str]
    role: Optional[str]


class AgenticAppEdge(TypedDict, total=False):
    """A call one member may make to another (a name is accepted for either end on create and update). fanOutAllowed
    (default True) lets the caller reach the callee through garrison_fan_out."""
    callerAgentId: str
    calleeAgentId: str
    fanOutAllowed: bool


class AgenticAppEnvironment(TypedDict, total=False):
    """The entry deployment the app uses in one environment (deploymentId None when none is assigned)."""
    environment: str
    deploymentId: Optional[str]


class AgenticApp(TypedDict, total=False):
    """A group of agents behind one chat UI at /apps/{slug}/. id has the prefix app_. name is unique in the tenant (1 to
    64 lowercase letters, digits, and hyphens); slug is unique across the cluster (409 AppSlugTaken) and defaults to the
    name. entryAgentId (an agent name is accepted on write) talks to end users. authMode is one of APP_AUTH_MODES
    (default AppUsers); Anonymous also needs anonymousEnabled. liveEnvironment (default dev) is the environment the app
    UI uses. The server checks that the entry agent is a member, edges connect members, every member is reachable from
    the entry agent, and the edges have no cycle."""
    id: str
    tenantId: str
    name: str
    slug: str
    description: Optional[str]
    entryAgentId: str
    liveEnvironment: str
    authMode: str
    anonymousEnabled: bool
    showOperatorDetail: bool
    displayName: Optional[str]
    logoAssetId: Optional[str]
    primaryColor: Optional[str]
    accentColor: Optional[str]
    welcomeText: Optional[str]
    members: List[AgenticAppMember]
    edges: List[AgenticAppEdge]
    environments: List[AgenticAppEnvironment]
    latestPublishedRevisionId: Optional[str]
    active: bool
    createdUtc: str
    lastUpdateUtc: str


class AppRevisionMember(TypedDict, total=False):
    """One member of an app revision with the published agent revision it pins."""
    agentId: str
    agentName: Optional[str]
    agentRevisionId: str
    agentRevisionNumber: Optional[int]


class AppRevision(TypedDict, total=False):
    """An app revision: every member's published agent revision pinned, with a copy of the edges. id has the prefix
    apv_; state is one of AGENT_REVISION_STATES."""
    id: str
    tenantId: str
    appId: str
    number: int
    state: str
    members: List[AppRevisionMember]
    edges: List[AgenticAppEdge]
    authorName: Optional[str]
    changeNote: Optional[str]
    publishedByName: Optional[str]
    publishedUtc: Optional[str]
    createdUtc: str


class AppDelegationMember(TypedDict, total=False):
    """One member's delegation policy derived from the app graph (desired*) next to its latest published revision's
    (published*, None when it has none). desiredMode is AllowList, or None for a member that calls nobody. drift marks a
    difference. After an apply, draftRevisionNumber names the draft written, or skippedReason (for example DraftConflict)
    says why the member was left alone."""
    agentId: str
    agentName: str
    desiredMode: str
    desiredAllowList: List[str]
    desiredMaxDepth: int
    publishedMode: Optional[str]
    publishedAllowList: List[str]
    publishedMaxDepth: Optional[int]
    drift: bool
    draftRevisionNumber: Optional[int]
    skippedReason: Optional[str]


class AppDelegationPlan(TypedDict, total=False):
    """Each member's delegation policy derived from the app graph. applied is True on the answer to an apply."""
    appId: str
    applied: bool
    members: List[AppDelegationMember]


class AppInfo(TypedDict, total=False):
    """Branding and sign-in mode of an app, from GET /v1.0/apps/{slug}. Needs no credentials."""
    slug: str
    displayName: str
    description: Optional[str]
    welcomeText: Optional[str]
    primaryColor: Optional[str]
    accentColor: Optional[str]
    logoUrl: Optional[str]
    authMode: str
    anonymousAllowed: bool
    showOperatorDetail: bool


class AppSessionResponse(TypedDict, total=False):
    """An app session. token has the prefix gas_ and works only on /v1.0/apps/{slug}/ for that app."""
    token: str
    expiresUtc: str
    principalName: str
    anonymous: bool


class AppTurnView(TypedDict, total=False):
    """One turn of an app conversation as an end user sees it."""
    runId: str
    turn: int
    message: str
    status: str
    answer: Optional[str]
    error: Optional[str]
    awaitingApproval: bool
    createdUtc: str
    completedUtc: Optional[str]


class AppConversationView(TypedDict, total=False):
    """An app conversation as its owner sees it. turns is empty in listings and filled when one conversation is read."""
    id: str
    title: Optional[str]
    turnCount: int
    busy: bool
    lastRunId: Optional[str]
    createdUtc: str
    lastActivityUtc: Optional[str]
    turns: List[AppTurnView]


class AppConversationStart(TypedDict, total=False):
    """Answer to starting an app conversation."""
    conversationId: str
    turn: AppTurnView


class AppFileChange(TypedDict, total=False):
    """One changed file in a files.changed event."""
    path: str
    version: int
    deleted: bool
    sha256: Optional[str]
    sizeBytes: int


class AppFilesChanged(TypedDict, total=False):
    """A files.changed event of an app conversation. The first event lists every current file."""
    conversationId: str
    changed: List[AppFileChange]


class StudioDraftItem(TypedDict, total=False):
    """One manifest document in a studio draft, keyed by kind and name. operation is one of STUDIO_DRAFT_OPERATIONS
    (Upsert creates or updates the resource; Delete deletes it when the draft is applied). document is the manifest YAML
    as written (empty for a Delete). baseHash is the hash of the live document the item started from, or None when the
    resource did not exist."""
    kind: str
    name: str
    operation: str
    document: str
    baseHash: Optional[str]
    lastUpdateUtc: str


class StudioDraftNode(TypedDict, total=False):
    """A canvas position of one graph node (nodeKey is kind/name, for example AgenticApp/research)."""
    nodeKey: str
    x: float
    y: float


class StudioDraft(TypedDict, total=False):
    """A studio draft: manifest documents a person or the agent architect edits before anyone asks to apply them. id has
    the prefix sdr_. status is one of STUDIO_DRAFT_STATUSES. version rises by one on every change, and every change names
    the version the caller read (409 DraftVersionConflict when it moved on). approvalId names the DraftApply approval while
    the draft waits for a decision; manifestApplyId names the manifest apply once applied. publishOnApply publishes the
    agents the draft creates or updates."""
    id: str
    tenantId: str
    title: str
    ownerUserId: Optional[str]
    ownerName: Optional[str]
    conversationId: Optional[str]
    targetApp: Optional[str]
    version: int
    status: str
    approvalId: Optional[str]
    publishOnApply: bool
    manifestApplyId: Optional[str]
    items: List[StudioDraftItem]
    layout: List[StudioDraftNode]
    createdUtc: str
    lastUpdateUtc: str


class StudioDraftDiffItem(TypedDict, total=False):
    """One item compared with live configuration. change is Create, Update, Delete, Unchanged, or Failed; changes lists
    the fields of an Update (field, before, after); message and errorCode say why an item failed. stale is True when the
    live resource changed after the draft was based on it."""
    kind: str
    name: str
    change: str
    changes: List[Dict[str, Any]]
    message: Optional[str]
    errorCode: Optional[str]
    stale: bool


class StudioDraftDiff(TypedDict, total=False):
    """A draft compared with live configuration (a manifest dry run). valid is True when nothing failed and nothing is
    stale."""
    draftId: str
    version: int
    valid: bool
    items: List[StudioDraftDiffItem]


class StudioGraphNode(TypedDict, total=False):
    """A node of a draft's graph. key is kind/name; kind is Agent or AgenticApp. inDraft marks nodes the draft holds,
    deleted those it deletes. entryOf and memberOf name the apps an agent is the entry of or belongs to. x and y are the
    canvas position, or None when the node was never placed. capabilities lists, for an agent the draft holds, the
    capabilities its document names (host tools such as pandoc)."""
    key: str
    kind: str
    name: str
    inDraft: bool
    deleted: bool
    entryOf: List[str]
    memberOf: List[str]
    capabilities: List[str]
    x: Optional[float]
    y: Optional[float]


# A call edge of one app in the draft, between agent names. fanOut (default True) allows garrison_fan_out. depth is the
# delegation depth the edge needs: one plus the longest chain of calls below the called member (minimum 1). Declared
# with the functional form because "from" is a Python keyword.
StudioGraphEdge = TypedDict("StudioGraphEdge", {"app": str, "from": str, "to": str, "fanOut": bool, "depth": int},
                            total=False)


class StudioGraph(TypedDict, total=False):
    """A draft's apps drawn as agents, apps, and call edges, at the draft version it was read at."""
    draftId: str
    version: int
    nodes: List[StudioGraphNode]
    edges: List[StudioGraphEdge]


class CompilePreviewResponse(TypedDict, total=False):
    """A compile preview with secret values redacted. deploymentId is the deployment that was compiled (another one
    when an environment was requested); agentRevisionId is the revision used, or None when the agent has none."""
    spec: Dict[str, Any]
    commandLine: str
    templateVersions: List[Dict[str, Any]]
    deploymentId: str
    agentRevisionId: Optional[str]


class ArchitectPromptEntry(TypedDict, total=False):
    """One prompt an architect deployment may use. isBuiltIn marks the shipped prompts; builtInKey matches a tenant clone
    to the built-in it came from. isDefault marks builtin/agent-architect. deployments names the architect deployments
    that bind the template."""
    id: str
    name: str
    description: Optional[str]
    isBuiltIn: bool
    builtInKey: Optional[str]
    currentVersion: int
    isDefault: bool
    deployments: List[str]


class ArchitectPromptSelection(TypedDict, total=False):
    """The System prompt an architect deployment uses. architectPromptVersion is the pinned version, or None to follow
    the template's current version (currentVersion)."""
    deploymentId: str
    architectPromptTemplateId: str
    architectPromptName: str
    architectPromptVersion: Optional[int]
    currentVersion: int


class Architect(TypedDict, total=False):
    """An agent architect: a tenant deployment that may edit studio drafts for the person it works for. id is the
    deployment identifier; agentId is normally the built-in agent-architect. architectPromptVersion is the pinned version,
    or None to follow the template's current version (architectPromptCurrentVersion). Timestamps are ISO 8601 UTC."""
    id: str
    tenantId: str
    name: str
    description: Optional[str]
    agentId: str
    agentName: Optional[str]
    harnessProfileId: str
    model: Optional[str]
    active: bool
    architectPromptTemplateId: str
    architectPromptName: str
    architectPromptVersion: Optional[int]
    architectPromptCurrentVersion: int
    # The secret the architect's harness signs in with (bound under the alias "credential"); all None when none is bound.
    credentialSecretId: Optional[str]
    credentialSecretName: Optional[str]
    credentialSecretKind: Optional[str]  # for example "AnthropicApiKey"
    configVersion: int
    isProtected: bool
    createdUtc: str
    lastUpdateUtc: str


class ArchitectRequest(TypedDict, total=False):
    """Create or change an agent architect. name and harnessProfileId are required; active defaults to True.
    architectPromptTemplateId is a System template identifier or name: None binds builtin/agent-architect on create and
    keeps the current prompt on update. architectPromptVersion pins a version (1 or more); None follows the current one."""
    name: str
    description: Optional[str]
    harnessProfileId: str
    model: Optional[str]
    active: bool
    architectPromptTemplateId: Optional[str]
    architectPromptVersion: Optional[int]
    # Identifier or name of an active tenant secret the harness signs in with, bound under the alias "credential"
    # (400 InvalidCredentialSecret otherwise). Missing or None binds none on create and keeps the current one on update;
    # an empty string on update removes it.
    credentialSecretId: Optional[str]


class HarnessToolProbe(TypedDict, total=False):
    """A harness profile "toolProbes" entry. name is 1 to 63 lowercase letters, digits, dots, and hyphens; executable is
    a bare file name on the worker's PATH; arguments holds at most one of HARNESS_TOOL_PROBE_ARGUMENTS."""
    name: str
    executable: str
    arguments: List[str]
    description: Optional[str]


class AgentAssetVersion(TypedDict, total=False):
    """An immutable version of an agent asset."""
    id: str
    tenantId: str
    assetId: str
    number: int
    totalBytes: int
    authorName: Optional[str]
    changeNote: Optional[str]
    files: List[AgentAssetFile]
    createdUtc: str


class AgentRevision(TypedDict, total=False):
    """Immutable (Published) or editable (Draft) snapshot of an agent's content. state is one of AGENT_REVISION_STATES."""
    id: str
    tenantId: str
    agentId: str
    number: int
    state: str
    contentHash: str
    displayName: Optional[str]
    description: Optional[str]
    inputMode: str
    inputSchemaJson: Optional[str]
    outputSchemaJson: Optional[str]
    delegationMode: str
    delegationMaxDepth: int
    delegationAllowRecursion: bool
    delegationAllowList: List[str]
    promptPins: List[PromptPin]
    assetPins: List[AssetPin]
    capabilities: List[str]
    tags: List[str]
    authorUserId: Optional[str]
    authorName: Optional[str]
    changeNote: Optional[str]
    publishedByUserId: Optional[str]
    publishedByName: Optional[str]
    publishedUtc: Optional[str]
    createdUtc: str
    lastUpdateUtc: str


AgentRevisionChange = TypedDict("AgentRevisionChange", {"field": str, "changeType": str, "from": Any, "to": Any})
AgentRevisionChange.__doc__ = """AgentRevisionDiff["changes"] item. changeType is one of REVISION_CHANGE_TYPES."""


class AgentRevisionDiff(TypedDict):
    """Field-level comparison of two revisions of one agent."""
    agentId: str
    fromRevisionId: str
    fromNumber: int
    toRevisionId: str
    toNumber: int
    identical: bool
    changes: List[AgentRevisionChange]


class TenantEnvironment(TypedDict):
    """One environment in the tenant's ordered promotion path."""
    name: str
    description: Optional[str]
    position: int


class TenantEnvironmentList(TypedDict):
    """The tenant's environments. isDefault is True when the tenant uses the built-in dev, staging, prod list."""
    environments: List[TenantEnvironment]
    isDefault: bool


class PromotionItem(TypedDict):
    """PromotionRecord["items"] item: one deployment whose revision pin changed."""
    deploymentId: str
    deploymentName: str
    agentId: str
    previousRevisionId: Optional[str]
    newRevisionId: Optional[str]


class PromotionRecord(TypedDict, total=False):
    """A promotion or rollback. kind is one of PROMOTION_KINDS and outcome one of PROMOTION_OUTCOMES."""
    id: str
    tenantId: str
    kind: str
    outcome: str
    agentId: Optional[str]
    appId: Optional[str]
    appRevisionId: Optional[str]
    agentRevisionId: Optional[str]
    sourceEnvironment: str
    targetEnvironment: str
    skippedEnvironments: List[str]
    rollbackOfId: Optional[str]
    rolledBackById: Optional[str]
    actorType: str
    actorId: Optional[str]
    actorName: Optional[str]
    note: Optional[str]
    items: List[PromotionItem]
    createdUtc: str


DEFAULT_BASE_URL = "http://127.0.0.1:8700"
TERMINAL_STATUSES = {"Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected"}
# Run executors: deployment "executor", node pool "defaultExecutor", run "executor", node "executors".
RUN_EXECUTORS = ("Process", "KubernetesJob", "RemoteA2A", "RemoteMcp")
RUN_STATUSES = ("Queued", "Leased", "Running", "Cancelling", "Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected", "Suspended")
EFFECT_OPERATION_STATES = ("Authorized", "Dispatched", "Completed", "Unknown")
QUEUE_FULL_ERROR = "QueueFull"
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
# remain, and Journaled requires a safe known-coverage checkpoint. The deprecated "retryOnNodeLoss" is still
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
# NoToolWorker: the run's agent uses a harness built-in capability (such as pandoc) and no Ready worker that can run it
# reports that tool (node label garrison.io/tool-{name}=true).
RUN_BLOCKED_REASONS = ("NoReadyWorker", "NoCapableWorker", "NoMatchingPool", "NoIsolatingWorker", "NoToolWorker")

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
APPROVAL_SOURCES = ("Rule", "Default", "User", "Timeout", "Cancelled", "DurableResume")
APPROVAL_RULE_ACTIONS = ("Allow", "Deny", "Ask")
# DraftApply approvals apply a studio draft; they carry "draftId" and are not tied to a run.
APPROVAL_KINDS = ("Tool", "Command", "FileChange", "DraftApply")
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
# Run["kind"] values. Playground runs try an agent's draft revision on an ephemeral deployment in the reserved "draft"
# environment (PLAYGROUND_ENVIRONMENT); see Agents.playground_invoke and StudioDrafts.playground_invoke.
RUN_KINDS = ("Invoke", "Delegated", "Test", "Retry", "Pipeline", "Trigger", "Playground")
PLAYGROUND_ENVIRONMENT = "draft"
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
# Agent revisions and environment promotion. Agent["latestPublishedRevisionId"] and ["draftRevisionId"] are read only;
# Deployment["agentRevisionId"] (None runs the agent's live content) and ["environment"] (default "dev");
# Run["agentRevisionId"] records the revision a run used. AgentRevision["state"], AgentRevisionDiff change "changeType",
# PromotionRecord["kind"] and ["outcome"].
AGENT_REVISION_STATES = ("Draft", "Published")
REVISION_CHANGE_TYPES = ("Changed", "Added", "Removed")
PROMOTION_KINDS = ("Promote", "Rollback")
PROMOTION_OUTCOMES = ("Applied", "RolledBack")
DEFAULT_ENVIRONMENTS = ("dev", "staging", "prod")
# Agent assets. AgentAsset["kind"]; a run whose pinned asset file fails its SHA-256 check ends with outcome
# RUN_OUTCOME_ASSET_INTEGRITY_FAILED.
AGENT_ASSET_KINDS = ("SystemPrompt", "Skill", "ReferenceFile", "DocumentTemplate")
RUN_OUTCOME_ASSET_INTEGRITY_FAILED = "AssetIntegrityFailed"

# Conversation file spaces: the owner argument of every FileSpaces method.
FILE_SPACE_OWNERS = ("conversations", "runs")

# Capability catalog. CapabilityDescriptor["kind"], ["origin"], and CapabilityHints["status"]. Harness profile
# "toolProbes" entries take at most one argument from HARNESS_TOOL_PROBE_ARGUMENTS (default "--version").
CAPABILITY_KINDS = ("Agent", "McpTool", "HarnessBuiltIn")
CAPABILITY_ORIGINS = ("Derived", "Manual")
CAPABILITY_HINT_STATUSES = ("Unknown", "Known")
HARNESS_TOOL_PROBE_ARGUMENTS = ("--version", "-version", "-v", "-V", "version", "--help", "-h")

# Fan-out groups. FanOutGroup["status"] and ["joinPolicy"]. Run["fanOutGroupId"] names the group a child run belongs
# to (absent for runs garrison_fan_out did not start).
FAN_OUT_GROUP_STATUSES = ("Running", "Joined", "TimedOut", "BudgetExceeded", "Cancelled")
FAN_OUT_JOIN_POLICIES = ("All", "Any", "Quorum")

# Agentic apps. AgenticApp["authMode"]: TenantUsers (any active tenant user), AppUsers (users holding the built-in
# APP_USER_ROLE on the app; the default), or Anonymous (anyone, when anonymousEnabled is also true).
APP_AUTH_MODES = ("TenantUsers", "AppUsers", "Anonymous")
# Built-in role that lets a user use one app's chat UI. Assign it with resource scope on the app identifier; it grants
# nothing in the management API. Permissions name the app resource type as APP_RESOURCE_TYPE.
APP_USER_ROLE = "AppUser"
APP_RESOURCE_TYPE = "AgenticApp"

# Studio drafts. StudioDraft["status"]: Open (editable), PendingApproval (frozen while its DraftApply approval waits),
# Applied, or Discarded. StudioDraftItem["operation"]: Upsert or Delete. graph_operation "operation": one of
# STUDIO_GRAPH_OPERATIONS. Permissions name drafts as STUDIO_DRAFT_RESOURCE_TYPE.
STUDIO_DRAFT_STATUSES = ("Open", "PendingApproval", "Applied", "Discarded")
STUDIO_DRAFT_OPERATIONS = ("Upsert", "Delete")
STUDIO_GRAPH_OPERATIONS = ("AddMember", "RemoveMember", "Connect", "Disconnect", "SetEntry", "MoveNode")
STUDIO_DRAFT_RESOURCE_TYPE = "StudioDraft"
# Deployment["managementAccess"]: None (the default) or Drafts, which lets the deployment's run tokens edit the studio
# drafts of the person who started the run. A deployment of agent-architect always gets Drafts.
MANAGEMENT_ACCESS = ("None", "Drafts")


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


def _sse_lines(response: requests.Response) -> Iterator[str]:
    """Yield the lines of a server-sent event stream as soon as each arrives. iter_lines waits for a full chunk, which
    holds back small events on streams that stay open without chunked encoding."""
    raw = response.raw
    read = getattr(raw, "read1", None)
    buffer = b""
    while True:
        chunk = read(65536) if read is not None else raw.read(1)
        if not chunk:
            break
        buffer += chunk
        while True:
            index = buffer.find(b"\n")
            if index < 0:
                break
            line, buffer = buffer[:index], buffer[index + 1:]
            yield line.rstrip(b"\r").decode("utf-8", errors="replace")
    if buffer:
        yield buffer.rstrip(b"\r").decode("utf-8", errors="replace")


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

    def request_bytes(self, path: str, params: Optional[Dict[str, Any]] = None) -> bytes:
        url, data, headers = self._prepare("GET", path, params, None, None)
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
            for line in _sse_lines(response):
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

    def playground_invoke(self, agent: str, input: str, agent_revision_id: Optional[str] = None,
                          source_deployment_id: Optional[str] = None, conversation_id: Optional[str] = None,
                          wait: bool = True, wait_seconds: int = 120) -> Dict[str, Any]:
        """Run an agent's revision (ID or name) in the studio playground, on an ephemeral copy of one of its deployments
        in the reserved "draft" environment. agent_revision_id defaults to the agent's open draft revision, else its
        latest published one; source_deployment_id defaults to its dev deployment, else its first one. The run has
        kind "Playground". wait_seconds is clamped to 1 through 3600 by the server. Needs Execute on Agent."""
        body: Dict[str, Any] = {"input": input, "wait": wait, "waitSeconds": wait_seconds}
        if agent_revision_id:
            body["agentRevisionId"] = agent_revision_id
        if source_deployment_id:
            body["sourceDeploymentId"] = source_deployment_id
        if conversation_id:
            body["conversationId"] = conversation_id
        return self._t.request("POST", self._item(agent) + "/playground/invoke", body=body)

    def card(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/card")

    def register(self, agent: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._base() + "/register", body=agent)

    def revisions(self, agent: str, max_results: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        """List an agent's revisions, newest first, as an enumeration of AgentRevision. agent is an ID or name."""
        return self._t.request("GET", self._item(agent) + "/revisions", _enum(max_results, skip))

    def get_revision(self, agent: str, revision: Union[str, int]) -> AgentRevision:
        """Read one revision by arv_ ID or number."""
        return self._t.request("GET", self._item(agent) + f"/revisions/{_seg(str(revision))}")

    def save_draft(self, agent: str, content: Dict[str, Any]) -> AgentRevision:
        """Create or replace the agent's single open draft revision (201)."""
        return self._t.request("POST", self._item(agent) + "/revisions", body=content)

    def delete_revision(self, agent: str, revision: Union[str, int]) -> Any:
        """Delete a revision (204, returns None)."""
        return self._t.request("DELETE", self._item(agent) + f"/revisions/{_seg(str(revision))}")

    def publish_revision(self, agent: str, revision: Union[str, int], change_note: Optional[str] = None) -> AgentRevision:
        """Publish a draft revision, making it immutable."""
        return self._t.request("POST", self._item(agent) + f"/revisions/{_seg(str(revision))}/publish",
                               body={"changeNote": change_note})

    def diff_revisions(self, agent: str, from_: Union[str, int], to: Union[str, int]) -> AgentRevisionDiff:
        """Compare two revisions (IDs or numbers) field by field."""
        return self._t.request("GET", self._item(agent) + "/revisions/diff", {"from": str(from_), "to": str(to)})


class AgentAssets(Resource):
    """Agent assets: versioned system prompts, skills, reference files, and document templates. Assets are addressed by
    ID or name; versions by number. delete raises GarrisonError 409 (code AssetInUse) while a revision pins the asset."""

    def list(self, kind: Optional[str] = None, search: Optional[str] = None, max_results: Optional[int] = None,
             skip: Optional[int] = None, ordering: Optional[str] = None) -> Dict[str, Any]:  # type: ignore[override]
        """List assets as an enumeration of AgentAsset. kind is one of AGENT_ASSET_KINDS."""
        params = _enum(max_results, skip, ordering, search)
        params["kind"] = kind
        return self._t.request("GET", self._base(), params)

    def versions(self, asset: str) -> List[AgentAssetVersion]:
        """List an asset's versions, newest first (a plain list, not an enumeration)."""
        return self._t.request("GET", self._item(asset) + "/versions") or []

    def get_version(self, asset: str, number: int) -> AgentAssetVersion:
        """Read one version by number."""
        return self._t.request("GET", self._item(asset) + f"/versions/{int(number)}")

    def upload(self, asset: str, files: List[Dict[str, Any]], change_note: Optional[str] = None) -> AgentAssetVersion:
        """Upload a new version. Each file is {"path", "content" (bytes or str, str is UTF-8 encoded), "mediaType"?}
        and is base64-encoded here. Identical files return the current version instead of a new one."""
        encoded = []
        for item in files:
            content = item.get("content", b"")
            data = content.encode("utf-8") if isinstance(content, str) else bytes(content)
            entry: Dict[str, Any] = {"path": item["path"], "contentBase64": base64.b64encode(data).decode("ascii")}
            if item.get("mediaType"):
                entry["mediaType"] = item["mediaType"]
            encoded.append(entry)
        body: Dict[str, Any] = {"files": encoded}
        if change_note is not None:
            body["changeNote"] = change_note
        return self._t.request("POST", self._item(asset) + "/versions", body=body)

    def upload_raw(self, asset: str, path: str, content: Union[bytes, str], media_type: Optional[str] = None,
                   change_note: Optional[str] = None) -> AgentAssetVersion:
        """Upload a single-file version as raw bytes (str is UTF-8 encoded)."""
        data = content.encode("utf-8") if isinstance(content, str) else content
        return self._t.request("POST", self._item(asset) + "/versions",
                               {"path": path, "mediaType": media_type, "changeNote": change_note},
                               data, "application/octet-stream")

    def download_file(self, asset: str, number: int, path: str) -> bytes:
        """Download one file of a version as bytes."""
        return self._t.request_bytes(self._item(asset) + f"/versions/{int(number)}/files", {"path": path})


class FileSpaces:
    """Conversation file spaces: versioned files shared by a conversation's turns. Every method takes owner
    ("conversations" or "runs"; FILE_SPACE_OWNERS) and the conversation or run ID. Paths are relative, for example
    notes/a.md. Errors: 400 InvalidFilePath, 404, 413 FileTooLarge / FileSpaceFull / TooManyFiles."""

    def __init__(self, transport: "Transport"):
        self._t = transport

    def _files(self, owner: str, id: str) -> str:
        if owner not in FILE_SPACE_OWNERS:
            raise ValueError(f"owner must be one of {FILE_SPACE_OWNERS}, got {owner!r}")
        return self._t.tenant_path(f"/{owner}/{_seg(id)}/files")

    def list(self, owner: str, id: str, include_deleted: bool = False) -> FileSpaceListing:
        """List the files in the space."""
        return self._t.request("GET", self._files(owner, id), {"includeDeleted": "true" if include_deleted else "false"})

    def read(self, owner: str, id: str, path: str, version: Optional[int] = None) -> bytes:
        """Read a file's content as bytes (the current version unless version is given)."""
        params: Dict[str, Any] = {"path": path}
        if version is not None:
            params["version"] = str(int(version))
        return self._t.request_bytes(self._files(owner, id) + "/content", params)

    def read_text(self, owner: str, id: str, path: str, version: Optional[int] = None) -> str:
        """Read a file's content decoded as UTF-8."""
        return self.read(owner, id, path, version).decode("utf-8")

    def versions(self, owner: str, id: str, path: str) -> List[ConversationFileVersion]:
        """List a file's versions, newest first."""
        return self._t.request("GET", self._files(owner, id) + "/versions", {"path": path}) or []

    def write(self, owner: str, id: str, path: str, content: Union[bytes, str], base_version: Optional[int] = None,
              media_type: Optional[str] = None) -> FileSpaceUploadResult:
        """Write a file. str content is sent as text, bytes as base64. base_version 0 means the file must not exist; a
        stale base_version writes under a conflict name and returns conflict True. None skips the check."""
        body: Dict[str, Any] = {"path": path}
        if isinstance(content, str):
            body["content"] = content
        else:
            body["contentBase64"] = base64.b64encode(bytes(content)).decode("ascii")
        if media_type is not None:
            body["mediaType"] = media_type
        if base_version is not None:
            body["baseVersion"] = int(base_version)
        return self._t.request("POST", self._files(owner, id), body=body)

    def write_raw(self, owner: str, id: str, path: str, content: Union[bytes, str], base_version: Optional[int] = None,
                  media_type: Optional[str] = None) -> FileSpaceUploadResult:
        """Write a file as a raw application/octet-stream body (str is UTF-8 encoded)."""
        data = content.encode("utf-8") if isinstance(content, str) else content
        params: Dict[str, Any] = {"path": path, "mediaType": media_type}
        if base_version is not None:
            params["baseVersion"] = str(int(base_version))
        return self._t.request("POST", self._files(owner, id), params, data, "application/octet-stream")

    def delete(self, owner: str, id: str, path: str) -> Any:
        """Delete a file (204, returns None)."""
        return self._t.request("DELETE", self._files(owner, id), {"path": path})

    def download_url(self, owner: str, id: str, path: str, version: Optional[int] = None) -> FileDownloadUrl:
        """Issue a short-lived download-only URL that needs no credentials."""
        params: Dict[str, Any] = {"path": path}
        if version is not None:
            params["version"] = str(int(version))
        return self._t.request("POST", self._files(owner, id) + "/download-url", params)


class Capabilities(Resource):
    """Capability catalog: agents (from their latest published revision), MCP server tools, and harness built-ins, plus
    manual descriptors. get takes an ID (cap_...) or a name. create, update, and delete work on manual descriptors only;
    derived ones raise GarrisonError 409 CapabilityDerived. create and update raise 400 InvalidJsonSchema for a schema
    that is not JSON Schema and 409 NameConflict for a duplicate manual name."""

    def list(self, kind: Optional[str] = None, tag: Optional[str] = None,  # type: ignore[override]
             search: Optional[str] = None) -> Dict[str, Any]:
        """List descriptors as an enumeration of CapabilityDescriptor (every match in one page). kind is one of
        CAPABILITY_KINDS; search matches the name or summary, ignoring case."""
        return self._t.request("GET", self._base(), {"kind": kind, "tag": tag, "search": search})

    def refresh(self, mcp_server_id: Optional[str] = None) -> CapabilityRefreshResult:
        """Refresh derived descriptors now (agents, harness built-ins, MCP server tools, hints), or only one MCP
        server's tools when mcp_server_id is given (404 when it names no active server)."""
        return self._t.request("POST", self._base() + "/refresh", {"mcpServerId": mcp_server_id})


class Apps(Resource):
    """Agentic apps: groups of agents behind one chat UI. list, get (identifier or name), create, update, and delete need
    Read, Create, Update, and Delete on AgenticApp. An agent that belongs to an app cannot be deleted (409 AgentInUse)."""

    def delegation(self, id: str) -> AppDelegationPlan:
        """Each member's delegation policy derived from the graph, with drift against its latest published revision."""
        return self._t.request("GET", self._item(id) + "/delegation")

    def apply_delegation(self, id: str) -> AppDelegationPlan:
        """Write the graph's policy into a draft revision of each drifting member (nothing is published). A member whose
        open draft already changes its delegation another way is skipped with skippedReason DraftConflict."""
        return self._t.request("POST", self._item(id) + "/delegation")

    def revisions(self, id: str) -> List[AppRevision]:
        """The app's revisions, newest first."""
        return self._t.request("GET", self._item(id) + "/revisions") or []

    def create_revision(self, id: str, change_note: Optional[str] = None) -> AppRevision:
        """Take a draft app revision pinning every member's latest published revision and copying the edges (201).
        Raises GarrisonError 409 NoPublishedRevision when a member has none."""
        return self._t.request("POST", self._item(id) + "/revisions", body={"changeNote": change_note} if change_note else {})

    def get_revision(self, id: str, revision: Union[str, int]) -> AppRevision:
        """Read an app revision by identifier (apv_) or number."""
        return self._t.request("GET", self._item(id) + f"/revisions/{_seg(str(revision))}")

    def publish_revision(self, id: str, revision: Union[str, int]) -> AppRevision:
        """Publish a draft app revision (identifier or number). Raises GarrisonError 409 RevisionPublished when it already
        is."""
        return self._t.request("POST", self._item(id) + f"/revisions/{_seg(str(revision))}/publish")

    def promote(self, id: str, source_environment: str, target_environment: Optional[str] = None,
                app_revision: Optional[Union[str, int]] = None, allow_skip: bool = False, note: Optional[str] = None) -> PromotionRecord:
        """Promote a published app revision (default the latest) from source_environment to the next environment (or
        target_environment). Every member's pin moves to every deployment of that member in the target environment
        together, under one promotion record; roll it back with promotions.rollback. Raises GarrisonError 409
        NoTargetDeployments naming a member without a deployment there. Needs Execute on Promotion for the target."""
        body: Dict[str, Any] = {"sourceEnvironment": source_environment, "allowSkip": allow_skip}
        if target_environment:
            body["targetEnvironment"] = target_environment
        if app_revision is not None:
            body["appRevision"] = str(app_revision)
        if note:
            body["note"] = note
        return self._t.request("POST", self._item(id) + "/promote", body=body)


class AppGateway:
    """Client for an agentic app's end-user gateway at /v1.0/apps/{slug}/.

    It needs no management credentials: start a session with an email and password, or anonymously when the app
    allows it, and the session token (prefix gas_) is kept and sent as a bearer token. The token works only on this
    app's gateway and reaches only the conversations its owner started (anything else is 404). Errors raise
    GarrisonError: 401 InvalidCredentials, AppSignInRequired, AnonymousDisabled, or an expired session; 403
    AppAccessDenied; 409 AppNotDeployed, ConversationBusy, or AppRateLimited. Not thread-safe while a session starts.

    Example:
        gateway = AppGateway("http://127.0.0.1:8700", "support-triage")
        gateway.start_session()
        started = gateway.start_conversation("My invoice was charged twice.")
        turn = gateway.wait_for_turn(started["conversationId"], started["turn"]["runId"])
        print(turn["answer"])
    """

    def __init__(self, base_url: str = DEFAULT_BASE_URL, slug: str = "", timeout: float = 600.0,
                 session: Optional[requests.Session] = None):
        if not slug:
            raise ValueError("slug is required")
        self.slug = slug
        self.transport = Transport(base_url, timeout, session)
        self.session: Optional[AppSessionResponse] = None

    @property
    def token(self) -> Optional[str]:
        """The session token sent as Authorization: Bearer, or None before a session starts."""
        return self.transport.token

    @token.setter
    def token(self, value: Optional[str]) -> None:
        self.transport.token = value
        self.transport.mode = "token" if value else "none"

    def _p(self, suffix: str = "") -> str:
        return f"/v1.0/apps/{_seg(self.slug)}{suffix}"

    def _c(self, id: str, suffix: str = "") -> str:
        return self._p(f"/conversations/{_seg(id)}{suffix}")

    def info(self) -> AppInfo:
        """Branding and how to sign in. Needs no session."""
        return self.transport.request("GET", self._p())

    def logo_url(self) -> str:
        """Absolute URL of the app's logo image (404 when the app has none)."""
        return self.transport.base_url + self._p("/logo")

    def logo(self) -> bytes:
        """The app's logo image bytes. Raises GarrisonError 404 when the app has none."""
        return self.transport.request_bytes(self._p("/logo"))

    def start_session(self, email: Optional[str] = None, password: Optional[str] = None) -> AppSessionResponse:
        """Start a session with an email and password, or with neither for an anonymous session (only when the app's
        authMode is Anonymous and anonymous use is enabled). The token is kept for later calls."""
        previous = self.token
        self.token = None
        try:
            body = {"email": email, "password": password} if email is not None else None
            started: AppSessionResponse = self.transport.request("POST", self._p("/session"), body=body)
        except Exception:
            self.token = previous
            raise
        self.token = started["token"]
        self.session = started
        return started

    def end_session(self) -> None:
        """Sign out and forget the token."""
        self.transport.request("DELETE", self._p("/session"))
        self.token = None
        self.session = None

    def conversations(self) -> List[AppConversationView]:
        """The session owner's conversations in the app."""
        return self.transport.request("GET", self._p("/conversations")) or []

    def start_conversation(self, message: str) -> AppConversationStart:
        """Start a conversation with the app's entry agent on the live environment's entry deployment."""
        return self.transport.request("POST", self._p("/conversations"), body={"message": message})

    def conversation(self, id: str) -> AppConversationView:
        """One of the owner's conversations with its turns."""
        return self.transport.request("GET", self._c(id))

    def send(self, id: str, message: str) -> AppTurnView:
        """Send the next message; raises GarrisonError 409 ConversationBusy while the previous turn runs."""
        return self.transport.request("POST", self._c(id, "/messages"), body={"message": message})

    def stream_turn(self, id: str, run_id: str, after_sequence: int = 0) -> Iterator[Dict[str, Any]]:
        """Yield {'event', 'id', 'data'} items for a turn until turn.completed. data is the parsed JSON: a run event for
        turn.event, a turn for turn.status and turn.completed. after_sequence resumes after a turn.event id."""
        for message in self.transport.stream(self._c(id, f"/turns/{_seg(run_id)}/stream"), {"afterSequence": after_sequence}):
            if message["event"] not in ("turn.event", "turn.status", "turn.completed"):
                continue
            yield {"event": message["event"], "id": message["id"], "data": json.loads(message["data"]) if message["data"] else None}
            if message["event"] == "turn.completed":
                return

    def wait_for_turn(self, id: str, run_id: str, timeout_seconds: float = 120.0, poll_seconds: float = 0.5) -> AppTurnView:
        """Poll the conversation until the turn with run_id reaches a terminal status or the timeout elapses; returns the
        turn as it stands then."""
        deadline = time.monotonic() + timeout_seconds
        while True:
            view = self.conversation(id)
            turn = next((t for t in view.get("turns", []) if t.get("runId") == run_id), None)
            if turn is not None and (turn.get("status") in TERMINAL_STATUSES or time.monotonic() >= deadline):
                return turn
            if time.monotonic() >= deadline:
                raise TimeoutError(f"turn {run_id} was not listed in conversation {id}")
            time.sleep(poll_seconds)

    def files(self, id: str) -> FileSpaceListing:
        """List the conversation's files."""
        return self.transport.request("GET", self._c(id, "/files"))

    def read_file(self, id: str, path: str, version: Optional[int] = None) -> bytes:
        """Read a file's content (the current version, or the given version)."""
        return self.transport.request_bytes(self._c(id, "/files/content"), {"path": path, "version": version})

    def file_versions(self, id: str, path: str) -> List[ConversationFileVersion]:
        """A file's versions, newest first."""
        return self.transport.request("GET", self._c(id, "/files/versions"), {"path": path}) or []

    def download_url(self, id: str, path: str, version: Optional[int] = None) -> FileDownloadUrl:
        """A short-lived download URL for a file (the current version, or the given version)."""
        return self.transport.request("POST", self._c(id, "/files/download-url"), {"path": path, "version": version})

    def stream_files(self, id: str) -> Iterator[AppFilesChanged]:
        """Yield files.changed events for the conversation; the first lists every current file. The stream stays open
        until the caller stops iterating or the server closes it."""
        for message in self.transport.stream(self._c(id, "/files/stream")):
            if message["event"] == "files.changed" and message["data"]:
                yield json.loads(message["data"])


class StudioDrafts:
    """Studio drafts: manifest documents designed before anything changes in live configuration, applied only after a
    person allows the DraftApply approval request_apply creates (decide it with approvals.decide). Every change names the
    draft version the caller read and raises GarrisonError 409 DraftVersionConflict when the draft moved on, or 409
    DraftNotOpen when it is not Open. Also manages agent architects and reads and sets the prompts of architect
    deployments."""

    def __init__(self, transport: Transport):
        self._t = transport

    def _base(self) -> str:
        return self._t.tenant_path("/studio/drafts")

    def _item(self, id: str) -> str:
        return f"{self._base()}/{_seg(id)}"

    def list(self, mine: bool = False, search: Optional[str] = None, max_results: Optional[int] = None,
             skip: Optional[int] = None, ordering: Optional[str] = None) -> Dict[str, Any]:
        """A page of drafts, newest change first. mine=True returns only your own."""
        query = _enum(max_results, skip, ordering, search)
        if mine:
            query["mine"] = "true"
        return self._t.request("GET", self._base(), query)

    def create(self, title: Optional[str] = None, from_app: Optional[str] = None) -> StudioDraft:
        """Start a draft (201), empty or, with from_app (app identifier or name), holding the app and everything it
        references. Starting from an app also needs Read on AgenticApp."""
        body: Dict[str, Any] = {}
        if title:
            body["title"] = title
        if from_app:
            body["fromApp"] = from_app
        return self._t.request("POST", self._base(), body=body)

    def get(self, id: str) -> StudioDraft:
        return self._t.request("GET", self._item(id))

    def delete(self, id: str) -> Any:
        """Discard a draft; a pending apply approval is cancelled."""
        return self._t.request("DELETE", self._item(id))

    def put_item(self, id: str, kind: str, name: str, version: int, document: str = "",
                 operation: Optional[str] = None) -> StudioDraft:
        """Create or replace one item at the version you read. operation is Upsert (the default; document is one manifest
        document whose kind and name match) or Delete. Raises GarrisonError 400 with codes UnsupportedKind,
        InvalidDocument, DocumentMismatch, or DeleteNotSupported."""
        body: Dict[str, Any] = {"version": int(version), "document": document}
        if operation:
            body["operation"] = operation
        return self._t.request("PUT", self._item(id) + f"/items/{_seg(kind)}/{_seg(name)}", body=body)

    def remove_item(self, id: str, kind: str, name: str, version: int) -> StudioDraft:
        """Remove one item at the version you read."""
        return self._t.request("DELETE", self._item(id) + f"/items/{_seg(kind)}/{_seg(name)}", {"version": int(version)})

    def diff(self, id: str) -> StudioDraftDiff:
        """Compare each item with live configuration (a manifest dry run of the draft)."""
        return self._t.request("GET", self._item(id) + "/diff")

    def validate(self, id: str) -> StudioDraftDiff:
        """Validate the draft; the same comparison as diff."""
        return self._t.request("POST", self._item(id) + "/validate")

    def request_apply(self, id: str, version: int) -> Dict[str, Any]:
        """Ask a person to approve applying the draft (201). Returns the DraftApply Approval and moves the draft to
        PendingApproval. Raises GarrisonError 400 DraftStale, DraftInvalid, or DraftEmpty."""
        return self._t.request("POST", self._item(id) + "/request-apply", body={"version": int(version)})

    def graph(self, id: str) -> StudioGraph:
        """The draft's apps as a graph of agents, apps, and call edges."""
        return self._t.request("GET", self._item(id) + "/graph")

    def graph_operation(self, id: str, request: Optional[Dict[str, Any]] = None, **fields: Any) -> StudioGraph:
        """Apply one graph operation and return the graph. Pass the body as request, as keyword arguments, or both
        (keywords win): version (required), operation (one of STUDIO_GRAPH_OPERATIONS), app (defaults to the draft's
        target app), agent, role, from_ (or "from" in request), to, fanOut, nodeKey, x, and y. Raises GarrisonError 400
        with codes NotAMember, SelfEdge, NoSuchEdge, or AppDeleted."""
        body: Dict[str, Any] = dict(request or {})
        for key, value in fields.items():
            body["from" if key == "from_" else key] = value
        return self._t.request("POST", self._item(id) + "/graph-operations", body=body)

    def playground_invoke(self, id: str, input: str, agent: Optional[str] = None, conversation_id: Optional[str] = None,
                          wait: bool = True, wait_seconds: int = 120) -> Dict[str, Any]:
        """Try the draft in the playground: its document for agent (name or ID; default the target app's entry agent)
        is written as that agent's draft revision, then run on an ephemeral deployment in the "draft" environment. Live
        configuration does not change. Returns the Run (kind "Playground"). Needs Update on StudioDraft and on
        AgentRevision. Raises GarrisonError 400 AgentNotLive for an agent the draft creates (apply it first)."""
        body: Dict[str, Any] = {"input": input, "wait": wait, "waitSeconds": wait_seconds}
        if agent:
            body["agent"] = agent
        if conversation_id:
            body["conversationId"] = conversation_id
        return self._t.request("POST", self._item(id) + "/playground/invoke", body=body)

    def _architect(self, deployment_id: str) -> str:
        return self._t.tenant_path(f"/studio/architects/{_seg(deployment_id)}")

    def list_architects(self, max_results: Optional[int] = None, skip: Optional[int] = None, ordering: Optional[str] = None,
                        search: Optional[str] = None, active_only: Optional[bool] = None) -> Dict[str, Any]:
        """A page of agent architects (EnumerationResult of Architect): deployments of the built-in agent-architect and
        deployments granted managementAccess Drafts. search matches part of the name. Needs Read on Deployment."""
        return self._t.request("GET", self._t.tenant_path("/studio/architects"), _enum(max_results, skip, ordering, search, active_only))

    def get_architect(self, deployment_id: str) -> Architect:
        """An agent architect by deployment identifier or name. Raises GarrisonError 404 when the deployment is not an
        architect."""
        return self._t.request("GET", self._architect(deployment_id))

    def create_architect(self, request: ArchitectRequest) -> Architect:
        """Create an agent architect (201): a deployment of the built-in agent-architect with draft access, bound to the
        chosen prompt (builtin/agent-architect when none is named). Raises GarrisonError 400 for a missing name or harness
        profile or InvalidArchitectPrompt, or 409 NameConflict or ArchitectAgentMissing."""
        return self._t.request("POST", self._t.tenant_path("/studio/architects"), body=dict(request))

    def update_architect(self, deployment_id: str, request: ArchitectRequest) -> Architect:
        """Change an architect's name, description, harness profile, model, active flag, and prompt. A missing or None
        architectPromptTemplateId keeps the current prompt; other deployment settings are kept."""
        return self._t.request("PUT", self._architect(deployment_id), body=dict(request))

    def delete_architect(self, deployment_id: str) -> None:
        """Delete an agent architect (its deployment). Drafts are kept."""
        self._t.request("DELETE", self._architect(deployment_id))

    def list_architect_prompts(self, max_results: Optional[int] = None, skip: Optional[int] = None,
                               search: Optional[str] = None) -> Dict[str, Any]:
        """A page of architect prompts (EnumerationResult of ArchitectPromptEntry): built-ins first, then the tenant's
        clones of them, then its other System templates. The order is fixed; search matches part of the name."""
        return self._t.request("GET", self._t.tenant_path("/studio/architect-prompts"), _enum(max_results, skip, None, search))

    def get_architect_prompt(self, deployment_id: str) -> ArchitectPromptSelection:
        """The prompt an architect deployment (identifier or name) uses."""
        return self._t.request("GET", self._t.tenant_path(f"/studio/architects/{_seg(deployment_id)}/prompt"))

    def set_architect_prompt(self, deployment_id: str, template_id: str, version: Optional[int] = None) -> ArchitectPromptSelection:
        """Choose the prompt an architect deployment uses (template identifier or name); takes effect on its next turn.
        version pins a template version; None follows the current one. Raises GarrisonError 400 NotAnArchitectDeployment
        or InvalidArchitectPrompt."""
        return self._t.request("PUT", self._t.tenant_path(f"/studio/architects/{_seg(deployment_id)}/prompt"),
                               body={"architectPromptTemplateId": template_id, "architectPromptVersion": version})


class FanOutGroups:
    """Fan-out groups: child runs a run started with the garrison_fan_out MCP tool. Groups are only created by runs, so
    this client reads and cancels them. A group that does not exist or belongs to another tenant raises GarrisonError
    404."""

    def __init__(self, transport: Transport):
        self._t = transport

    def list_by_run(self, run_id: str) -> List[FanOutGroup]:
        """List the fan-out groups a run started, oldest first (404 when the run does not exist)."""
        return self._t.request("GET", self._t.tenant_path(f"/runs/{_seg(run_id)}/fan-out-groups")) or []

    def get(self, group_id: str) -> FanOutGroup:
        """Read a fan-out group with its members' state and results."""
        return self._t.request("GET", self._t.tenant_path(f"/fan-out-groups/{_seg(group_id)}"))

    def cancel(self, group_id: str) -> FanOutGroup:
        """Cancel a fan-out group; members still running are cancelled. Returns the group as it stands afterwards."""
        return self._t.request("POST", self._t.tenant_path(f"/fan-out-groups/{_seg(group_id)}/cancel"))


class Environments:
    """The tenant's ordered environment list (promotion path)."""

    def __init__(self, transport: Transport):
        self._t = transport

    def get(self) -> TenantEnvironmentList:
        return self._t.request("GET", self._t.tenant_path("/environments"))

    def update(self, body: TenantEnvironmentList) -> TenantEnvironmentList:
        return self._t.request("PUT", self._t.tenant_path("/environments"), body=body)


class Promotions:
    """Promote a published agent revision between environments, and roll promotions back."""

    def __init__(self, transport: Transport):
        self._t = transport

    def _p(self, suffix: str = "") -> str:
        return self._t.tenant_path("/promotions" + suffix)

    def list(self, agent_id: Optional[str] = None, app_id: Optional[str] = None, max_results: Optional[int] = None,
             skip: Optional[int] = None) -> Dict[str, Any]:
        """Enumeration of PromotionRecord, optionally filtered by agent or app."""
        params = _enum(max_results, skip)
        params.update({"agentId": agent_id, "appId": app_id})
        return self._t.request("GET", self._p(), params)

    def get(self, id: str) -> PromotionRecord:
        return self._t.request("GET", self._p(f"/{_seg(id)}"))

    def promote(self, agent_id: str, source_environment: str, target_environment: Optional[str] = None,
                agent_revision_id: Optional[str] = None, allow_skip: bool = False, note: Optional[str] = None) -> PromotionRecord:
        """Pin the target environment's deployments of the agent to a published revision (201). The target defaults to the
        environment after the source; agent_revision_id defaults to the revision the source environment runs (or the
        latest published one); allow_skip permits jumping over intermediate environments."""
        body: Dict[str, Any] = {"agentId": agent_id, "sourceEnvironment": source_environment, "allowSkip": allow_skip}
        if target_environment:
            body["targetEnvironment"] = target_environment
        if agent_revision_id:
            body["agentRevisionId"] = agent_revision_id
        if note:
            body["note"] = note
        return self._t.request("POST", self._p(), body=body)

    def rollback(self, id: str, note: Optional[str] = None) -> PromotionRecord:
        """Restore the pins a promotion replaced (201). Returns the new Rollback record."""
        return self._t.request("POST", self._p(f"/{_seg(id)}/rollback"), body={"note": note})



class Deployments(Resource):
    def compile_preview(self, id: str, input: str = "Hello from the compile preview.", parameters: Optional[Dict[str, str]] = None,
                        agent_revision_id: Optional[str] = None, environment: Optional[str] = None) -> CompilePreviewResponse:
        """Compile the deployment with sample input; secret values are redacted. agent_revision_id compiles with another
        revision of the agent, such as a draft (also needs Read on AgentRevision). environment compiles the same agent's
        deployment in that environment instead (GarrisonError 400 NoDeploymentInEnvironment when there is none). The
        response names the deploymentId compiled and the agentRevisionId used."""
        body: Dict[str, Any] = {"input": input, "parameters": parameters or {}}
        if agent_revision_id:
            body["agentRevisionId"] = agent_revision_id
        if environment:
            body["environment"] = environment
        return self._t.request("POST", self._item(id) + "/compile-preview", body=body)

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

    def placement(self, id: str) -> RunPlacementResponse:
        """Explain current placement without leasing or reserving capacity."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/placement"))

    def database_usage(self, id: str) -> List[RunDatabaseUsage]:
        """Read database statement totals by completed run lifecycle operation."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/database-usage"))

    def operations(self, id: str) -> List[EffectOperation]:
        """Read tenant-scoped effect intent metadata in creation order."""
        return self._t.request("GET", self._p(f"/{_seg(id)}/operations"))

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

    def rotate_master_key(self) -> MasterKeyRotationResponse:
        """Re-encrypt stored credentials and secrets with the configured active key (system administrator only)."""
        return self._t.request("POST", "/v1.0/api/settings/keys/rotate")

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
        self.environments = Environments(t)
        self.promotions = Promotions(t)
        self.agent_assets = AgentAssets(t, "agent-assets")
        self.file_spaces = FileSpaces(t)
        self.capabilities = Capabilities(t, "capabilities")
        self.fan_out_groups = FanOutGroups(t)
        self.apps = Apps(t, "apps")
        self.studio_drafts = StudioDrafts(t)

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

    def app_gateway(self, slug: str) -> AppGateway:
        """An end-user gateway client for the app with this slug, on the same server. It starts with no session and never
        sends this client's management credentials."""
        return AppGateway(self.transport.base_url, slug, self.transport.timeout)

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
