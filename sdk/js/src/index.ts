/**
 * Garrison SDK for JavaScript and TypeScript (Node 18+ and browsers).
 *
 * Responses are plain objects with the server's camelCase field names. The interfaces below type the most
 * commonly used fields; every object may carry additional fields documented in REST_API.md.
 */

export const DEFAULT_BASE_URL = "http://127.0.0.1:8700";
export const TERMINAL_STATUSES = ["Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected"];

export type Json = Record<string, any>;

export interface EnumerationResult<T> {
  success: boolean;
  maxResults: number;
  skip: number;
  totalRecords: number;
  recordsRemaining: number;
  endOfResults: boolean;
  timestampUtc: string;
  objects: T[];
}

export interface EnumerationQuery {
  maxResults?: number;
  skip?: number;
  ordering?: "CreatedDescending" | "CreatedAscending" | "NameAscending" | "NameDescending";
  search?: string;
  activeOnly?: boolean;
  includeBuiltIn?: boolean;
}

export interface TokenResponse { token: string; expiresUtc: string; tenantId?: string; sessionId: string; principalType: string; }

/** Control-plane replica status. */
export type ControlNodeStatus = "Starting" | "Ready" | "Draining" | "Offline";

/** A control-plane replica (control node). isLeader and leaderEpoch come from the coordination lease. */
export interface ControlNode extends Json {
  id: string;
  name: string;
  hostname?: string;
  address?: string;
  version?: string;
  schemaVersion: number;
  backplane?: string;
  status: ControlNodeStatus;
  startedUtc: string;
  lastHeartbeatUtc: string;
  activeRequests: number;
  openStreams: number;
  heldLongPolls: number;
  isLeader: boolean;
  /** Present on the leader only. */
  leaderEpoch?: number;
  /** Node ID of the replica that answered; present on single-record reads. */
  respondingNodeId?: string;
}

/** A page of control nodes, with the node ID of the replica that answered. */
export interface ControlNodeListResponse extends EnumerationResult<ControlNode> {
  respondingNodeId: string;
}

/** Warning codes in FieldWarning.code. ValueClamped: the value was outside its allowed range and the nearest allowed value was stored. */
export type FieldWarningCode = "ValueClamped";

/**
 * A request field that was accepted but not stored as given (I-08), for example a number outside its range that was
 * clamped. Returned in the warnings array of create and update responses for agents, deployments, harness profiles,
 * MCP servers, and workspace templates, and on manifest apply items. Never stored on the resource itself.
 */
export interface FieldWarning {
  /** Field name as the REST API spells it, for example maxAttempts. */
  field: string;
  /** Stable machine code, for example ValueClamped. Treat unknown codes as informational. */
  code: FieldWarningCode | string;
  /** The value the caller sent, as text; null or absent when there was none. */
  given?: string | null;
  /** The value stored instead, as text; null or absent when nothing was stored. */
  stored?: string | null;
  /** Human-readable explanation naming the field, the given value, the allowed range, and the stored value. */
  message: string;
}

/** Present only on create and update responses, and only when a value was not stored as given; reads never carry it. */
export interface WithWarnings {
  warnings?: FieldWarning[];
}

export interface Agent extends Json, WithWarnings {
  remoteProtocol?: "A2A" | "Mcp" | null;
  remoteEndpointUrl?: string | null;
  remoteCredentialSecretId?: string | null;
  registrationTtlSeconds?: number;
  lastRegisteredUtc?: string | null;
  mcpToolName?: string | null;

  id: string; tenantId: string; name: string; displayName?: string; description?: string; kind?: string;
  delegationMode?: string; skills?: Json[]; tags?: string[];
  /** "Text" (default) or "Structured"; the A2A card advertises application/json for Structured or schema agents. */
  inputMode?: "Text" | "Structured";
  /**
   * JSON Schema text for the input. When set, every invocation's input must be a JSON document that matches it; otherwise
   * the server answers 400 with fieldCodes "input" (InputNotJson) or "input.<path>" (InputSchemaViolation). Saving a
   * value that is not a valid JSON Schema fails with field code InvalidJsonSchema.
   */
  inputSchemaJson?: string | null;
  /** JSON Schema text the final output is validated against. */
  outputSchemaJson?: string | null;
  /** Read-only: newest published revision (arv_ identifier), or null when none was published. */
  latestPublishedRevisionId?: string | null;
  /** Read-only: the single open draft revision, or null when there is none. */
  draftRevisionId?: string | null;
}

/** Agent revision lifecycle state. */
export type AgentRevisionState = "Draft" | "Published";
/** How one field differs between two revisions. */
export type RevisionChangeType = "Changed" | "Added" | "Removed";
/** Promotion record kind. */
export type PromotionKind = "Promote" | "Rollback";
/** Promotion record outcome; RolledBack once a later rollback reversed it. */
export type PromotionOutcome = "Applied" | "RolledBack";

/** A prompt template pinned by a revision. pinnedVersion null follows the latest template version. */
export interface AgentRevisionPromptPin { role: string; templateId: string; pinnedVersion: number | null; }

/** An agent asset pinned by a revision. version null (or omitted) follows the asset's current version. */
export interface AgentRevisionAssetPin { assetId: string; version?: number | null; }

/** Kind of agent asset. SystemPrompt assets require promptTemplateId. */
export type AgentAssetKind = "SystemPrompt" | "Skill" | "ReferenceFile" | "DocumentTemplate";
export const AGENT_ASSET_KINDS: readonly AgentAssetKind[] = ["SystemPrompt", "Skill", "ReferenceFile", "DocumentTemplate"];

/** A versioned agent asset. artifactStoreId null stores files in the Garrison database; currentVersion 0 means none yet. */
export interface AgentAsset extends Json {
  id: string; tenantId: string; name: string; kind: AgentAssetKind; description?: string | null;
  promptTemplateId?: string | null; artifactStoreId?: string | null; currentVersion: number; tags?: string[];
  createdUtc: string; lastUpdateUtc: string;
}

/** A file in an asset version. sha256 is lowercase hex; contentBase64 is only present on upload. */
export interface AgentAssetFile {
  path: string; mediaType?: string | null; sizeBytes: number; sha256: string; storageKey?: string | null; contentBase64?: string | null;
}

/** An immutable version of an agent asset. */
export interface AgentAssetVersion extends Json {
  id: string; tenantId: string; assetId: string; number: number; totalBytes: number;
  authorName?: string | null; changeNote?: string | null; files: AgentAssetFile[]; createdUtc: string;
}

/** Owner of a file space: a conversation, or a run whose file space is used. */
export type FileSpaceOwner = "conversations" | "runs";

/** A file in a conversation file space. sha256 is lowercase hex; deleted files appear only with includeDeleted. */
export interface ConversationFile extends Json {
  id: string; tenantId: string; fileSpaceId: string; path: string; currentVersion: number; sizeBytes: number;
  sha256?: string | null; mediaType?: string | null; deleted: boolean; createdUtc: string; lastUpdateUtc: string;
}

/** An immutable version of a conversation file. runId is null for API writes. */
export interface ConversationFileVersion extends Json {
  id: string; tenantId: string; fileId: string; number: number; sizeBytes: number; sha256?: string | null;
  mediaType?: string | null; runId?: string | null; leaseEpoch: number; writtenBy?: string | null; storageKey?: string | null; createdUtc: string;
}

/** Files in a conversation or run file space. fileSpaceId is null until the space exists. */
export interface FileSpaceListing extends Json { fileSpaceId?: string | null; fileCount: number; totalBytes: number; files: ConversationFile[]; }

/** Result of a file space write. conflict is true when baseVersion was stale; path is then the conflict name. */
export interface FileSpaceUploadResult extends Json { requestedPath: string; path: string; version: number; conflict: boolean; sha256?: string | null; }

/** A short-lived download-only URL; fetching it needs no credentials. */
export interface FileDownloadUrl extends Json { url: string; expiresUtc: string; }

/** Options for a file space write. baseVersion 0 means the file must not exist yet; omit it to overwrite unconditionally. */
export interface FileSpaceWriteOptions { baseVersion?: number; mediaType?: string; }

/** Kinds of capability catalog entries. */
export const CAPABILITY_KINDS = ["Agent", "McpTool", "HarnessBuiltIn"] as const;
/** One of {@link CAPABILITY_KINDS}. */
export type CapabilityKind = typeof CAPABILITY_KINDS[number];
/** Derived descriptors follow their source; Manual ones are written through the API. */
export type CapabilityOrigin = "Derived" | "Manual";
/** Unknown until enough runs finish, then Known. */
export type CapabilityHintStatus = "Unknown" | "Known";

/** A node label a run needs when its agent uses a capability, for example garrison.io/tool-pandoc=true. */
export interface CapabilityRequirement { key: string; value: string; }

/** Cost and latency hints from recent finished runs. Every value is null while status is Unknown. */
export interface CapabilityHints {
  status: CapabilityHintStatus; sampleSize: number; medianDurationMs?: number | null; p90DurationMs?: number | null;
  meanCostUsd?: number | null; windowDays: number; computedUtc?: string | null;
}

/**
 * One capability catalog entry: an agent, an MCP tool, or a harness built-in. tenantId is null for descriptors every
 * tenant shares. Schemas are JSON Schema documents as JSON text.
 */
export interface CapabilityDescriptor extends Json {
  id: string; tenantId?: string | null; name: string; kind: CapabilityKind; origin: CapabilityOrigin; sourceKey: string;
  sourceAgentId?: string | null; sourceRevisionId?: string | null; sourceMcpServerId?: string | null; sourceToolName?: string | null;
  sourceHarnessProfileId?: string | null; sourceHarnessType?: string | null; summary?: string | null;
  inputSchemaJson?: string | null; outputSchemaJson?: string | null; tags: string[]; requirements: CapabilityRequirement[];
  hints: CapabilityHints; refreshWarning?: string | null; lastRefreshedUtc?: string | null; createdUtc: string; lastUpdateUtc: string;
}

/**
 * Who may use an agentic app's chat UI. TenantUsers: any active user of the app's tenant. AppUsers (the default): tenant
 * users holding the built-in {@link APP_USER_ROLE} role on the app. Anonymous: anyone with the URL, but only when
 * anonymousEnabled is also true; signed-in users still work.
 */
export const APP_AUTH_MODES = ["TenantUsers", "AppUsers", "Anonymous"] as const;
/** One of {@link APP_AUTH_MODES}. */
export type AppAuthMode = typeof APP_AUTH_MODES[number];
/**
 * Built-in role that lets a user use one agentic app's chat UI. Assign it with resource scope on the app identifier; it
 * grants nothing in the management API.
 */
export const APP_USER_ROLE = "AppUser";
/** Resource type name of agentic apps in permissions and the operation scope map. */
export const APP_RESOURCE_TYPE = "AgenticApp";

/** One agent in an agentic app. agentId accepts an agent name on create and update; agentName is filled in on read. */
export interface AgenticAppMember { agentId: string; agentName?: string | null; role?: string | null; }

/**
 * A call one member may make to another (a name is accepted for either end on create and update). fanOutAllowed
 * (default true) lets the caller reach the callee through garrison_fan_out.
 */
export interface AgenticAppEdge { callerAgentId: string; calleeAgentId: string; fanOutAllowed?: boolean; }

/** The entry deployment the app uses in one environment (deploymentId null when none is assigned). */
export interface AgenticAppEnvironment { environment: string; deploymentId?: string | null; }

/**
 * A group of agents behind one chat UI at /apps/{slug}/. id has the prefix app_. name is unique in the tenant (1 to 64
 * lowercase letters, digits, and hyphens); slug is unique across the cluster (409 AppSlugTaken) and defaults to the
 * name. entryAgentId (a name is accepted on write) talks to end users. liveEnvironment (default dev) is the environment
 * the app UI uses. The server checks that the entry agent is a member, edges connect members, every member is reachable
 * from the entry agent, and the edges have no cycle.
 */
export interface AgenticApp extends Json {
  id: string; tenantId: string; name: string; slug: string; description?: string | null; entryAgentId: string;
  liveEnvironment: string; authMode: AppAuthMode; anonymousEnabled: boolean; showOperatorDetail: boolean;
  displayName?: string | null; logoAssetId?: string | null; primaryColor?: string | null; accentColor?: string | null; welcomeText?: string | null;
  members: AgenticAppMember[]; edges: AgenticAppEdge[]; environments: AgenticAppEnvironment[];
  latestPublishedRevisionId?: string | null; active: boolean; createdUtc: string; lastUpdateUtc: string;
}

/** One member of an app revision with the published agent revision it pins. */
export interface AppRevisionMember { agentId: string; agentName?: string | null; agentRevisionId: string; agentRevisionNumber?: number | null; }

/** An app revision: every member's published agent revision pinned, with a copy of the edges. id has the prefix apv_. */
export interface AppRevision extends Json {
  id: string; tenantId: string; appId: string; number: number; state: AgentRevisionState;
  members: AppRevisionMember[]; edges: AgenticAppEdge[]; authorName?: string | null; changeNote?: string | null;
  publishedByName?: string | null; publishedUtc?: string | null; createdUtc: string;
}

/**
 * One member's delegation policy derived from the app graph (desired*) next to its latest published revision's
 * (published*, absent when it has none). desiredMode is AllowList, or None for a member that calls nobody. drift marks a
 * difference. After an apply, draftRevisionNumber names the draft written, or skippedReason (for example DraftConflict)
 * says why the member was left alone.
 */
export interface AppDelegationMember {
  agentId: string; agentName: string; desiredMode: string; desiredAllowList: string[]; desiredMaxDepth: number;
  publishedMode?: string | null; publishedAllowList: string[]; publishedMaxDepth?: number | null; drift: boolean;
  draftRevisionNumber?: number | null; skippedReason?: string | null;
}

/** Each member's delegation policy derived from the app graph. applied is true on the answer to an apply. */
export interface AppDelegationPlan { appId: string; applied: boolean; members: AppDelegationMember[]; }

/** Body of an app promotion. appRevision is an identifier or number (default the latest published app revision). */
export interface AppPromotionRequest {
  sourceEnvironment: string; targetEnvironment?: string; appRevision?: string | number; allowSkip?: boolean; note?: string;
}

/** Branding and sign-in mode of an app, from GET /v1.0/apps/{slug}. Needs no credentials. */
export interface AppInfo {
  slug: string; displayName: string; description?: string | null; welcomeText?: string | null; primaryColor?: string | null;
  accentColor?: string | null; logoUrl?: string | null; authMode: AppAuthMode; anonymousAllowed: boolean; showOperatorDetail: boolean;
}

/** An app session. token has the prefix gas_ and works only on /v1.0/apps/{slug}/ for that app. */
export interface AppSessionResponse { token: string; expiresUtc: string; principalName: string; anonymous: boolean; }

/** One turn of an app conversation as an end user sees it. */
export interface AppTurnView {
  runId: string; turn: number; message: string; status: RunStatus; answer?: string | null; error?: string | null;
  awaitingApproval: boolean; createdUtc: string; completedUtc?: string | null;
}

/** An app conversation as its owner sees it. turns is empty in listings and filled when one conversation is read. */
export interface AppConversationView {
  id: string; title?: string | null; turnCount: number; busy: boolean; lastRunId?: string | null;
  createdUtc: string; lastActivityUtc?: string | null; turns: AppTurnView[];
}

/** Answer to starting an app conversation. */
export interface AppConversationStart { conversationId: string; turn: AppTurnView; }

/**
 * One server-sent event of an app turn stream. turn.event carries a visible run event (its id is the event sequence);
 * turn.status and turn.completed carry the turn. turn.completed is the last event.
 */
export type AppTurnStreamEvent =
  | { event: "turn.event"; id?: string; data: RunEvent }
  | { event: "turn.status"; id?: string; data: AppTurnView }
  | { event: "turn.completed"; id?: string; data: AppTurnView };

/** One changed file in a files.changed event. */
export interface AppFileChange { path: string; version: number; deleted: boolean; sha256?: string | null; sizeBytes: number; }
/** A files.changed event of an app conversation. The first event of a stream lists every current file. */
export interface AppFilesChanged { conversationId: string; changed: AppFileChange[]; }

/** Options for {@link AppGatewayClient.streamTurn}. */
export interface AppTurnStreamOptions {
  /** Resume after this event id (a turn.event sequence) instead of from the start. */
  lastEventId?: string;
  /** Reconnect attempts in a row without receiving an event before giving up. Default 5; 0 disables reconnecting. */
  maxReconnects?: number;
  /** Milliseconds to wait before reconnecting. Default 1000. */
  reconnectDelayMs?: number;
}

/** Draft states. Open is editable; PendingApproval is frozen while its DraftApply approval waits; Applied and Discarded are final. */
export const STUDIO_DRAFT_STATUSES = ["Open", "PendingApproval", "Applied", "Discarded"] as const;
/** One of {@link STUDIO_DRAFT_STATUSES}. */
export type StudioDraftStatus = typeof STUDIO_DRAFT_STATUSES[number];
/** What a draft item does on apply: Upsert creates or updates the resource, Delete deletes it (Agent, Deployment, Pipeline, AgenticApp only). */
export const STUDIO_DRAFT_OPERATIONS = ["Upsert", "Delete"] as const;
/** One of {@link STUDIO_DRAFT_OPERATIONS}. */
export type StudioDraftOperation = typeof STUDIO_DRAFT_OPERATIONS[number];
/** Graph operations on a draft's apps. MoveNode changes only the canvas layout. */
export const STUDIO_GRAPH_OPERATIONS = ["AddMember", "RemoveMember", "Connect", "Disconnect", "SetEntry", "MoveNode"] as const;
/** One of {@link STUDIO_GRAPH_OPERATIONS}. */
export type StudioGraphOperation = typeof STUDIO_GRAPH_OPERATIONS[number];
/** What a deployment's run tokens may do in the management plane. Drafts lets the agent architect edit studio drafts for the person it works for, never apply them. */
export const MANAGEMENT_ACCESS_LEVELS = ["None", "Drafts"] as const;
/** One of {@link MANAGEMENT_ACCESS_LEVELS}. */
export type ManagementAccess = typeof MANAGEMENT_ACCESS_LEVELS[number];
/** Resource type name of studio drafts in permissions and the operation scope map. */
export const STUDIO_DRAFT_RESOURCE_TYPE = "StudioDraft";

/**
 * One manifest document in a draft, keyed by kind and name. document is the manifest YAML as written (empty for a
 * Delete). baseHash is the hash of the live document the item started from, or null when the resource did not exist.
 */
export interface StudioDraftItem { kind: string; name: string; operation: StudioDraftOperation; document: string; baseHash?: string | null; lastUpdateUtc: string; }

/** A node position on the draft canvas. nodeKey is kind/name, for example Agent/researcher. */
export interface StudioDraftNode { nodeKey: string; x: number; y: number; }

/**
 * A studio draft: manifest documents edited before anything changes in live configuration. id has the prefix sdr_.
 * version rises by one on every change, and every change names the version the caller read (409 DraftVersionConflict
 * otherwise). approvalId names the DraftApply approval while one exists; manifestApplyId the apply record once Applied.
 */
export interface StudioDraft extends Json {
  id: string; tenantId: string; title: string; ownerUserId?: string | null; ownerName?: string | null;
  conversationId?: string | null; targetApp?: string | null; version: number; status: StudioDraftStatus;
  approvalId?: string | null; publishOnApply: boolean; manifestApplyId?: string | null;
  items: StudioDraftItem[]; layout: StudioDraftNode[]; createdUtc: string; lastUpdateUtc: string;
}

/** Options for {@link StudioDrafts.list}. mine lists only your own drafts. */
export interface StudioDraftListQuery extends EnumerationQuery { mine?: boolean; }

/** Body of {@link StudioDrafts.create}. fromApp (identifier or name) exports an app and everything it references into the draft. */
export interface StudioDraftCreateRequest { title?: string; fromApp?: string; conversationId?: string; }

/**
 * One item of a draft diff. change is Create, Update (changes lists the fields), Delete, Unchanged, or Failed (message
 * and errorCode say why). stale is true when the live resource changed after the draft was based on it.
 */
export interface StudioDraftDiffItem { kind: string; name: string; change: string; changes: ManifestFieldChange[]; message?: string | null; errorCode?: string | null; stale: boolean; }

/** A draft compared with live configuration. valid is true when nothing failed and nothing is stale. */
export interface StudioDraftDiff { draftId: string; version: number; valid: boolean; items: StudioDraftDiffItem[]; }

/**
 * A node of a draft graph: an app or an agent. key is kind/name. entryOf and memberOf name apps. capabilities lists, for
 * an agent the draft holds, the capabilities its document names (host tools such as pandoc). x and y are null until placed.
 */
export interface StudioGraphNode { key: string; kind: string; name: string; inDraft: boolean; deleted: boolean; entryOf: string[]; memberOf: string[]; capabilities: string[]; x?: number | null; y?: number | null; }

/** A call edge of an app in a draft graph. depth is the delegation depth the edge needs: one plus the longest chain of calls below the called member (minimum 1). */
export interface StudioGraphEdge { app: string; from: string; to: string; fanOut: boolean; depth: number; }

/** A draft's apps as a graph, at the draft version it was drawn from. */
export interface StudioGraph { draftId: string; version: number; nodes: StudioGraphNode[]; edges: StudioGraphEdge[]; }

/**
 * One graph operation. version is the draft version you read. app defaults to the draft's target app. AddMember and
 * RemoveMember take agent (and role); Connect takes from, to, and fanOut; Disconnect takes from and to; SetEntry takes
 * agent; MoveNode takes nodeKey, x, and y.
 */
export interface StudioGraphOperationRequest {
  version: number; operation: StudioGraphOperation; app?: string; agent?: string; role?: string;
  from?: string; to?: string; fanOut?: boolean; nodeKey?: string; x?: number; y?: number;
}

/**
 * A prompt an architect deployment can use. Built-ins come first, then the tenant's clones of them (builtInKey set),
 * then other tenant System templates. deployments names the architect deployments that bind it.
 */
export interface ArchitectPromptEntry { id: string; name: string; description?: string | null; isBuiltIn: boolean; builtInKey?: string | null; currentVersion: number; isDefault: boolean; deployments: string[]; }

/** The prompt an architect deployment uses. architectPromptVersion is null when it follows the template's current version. */
export interface ArchitectPromptSelection { deploymentId: string; architectPromptTemplateId: string; architectPromptName: string; architectPromptVersion?: number | null; currentVersion: number; }

/** States of a fan-out group. Every state other than Running is final. */
export const FAN_OUT_GROUP_STATUSES = ["Running", "Joined", "TimedOut", "BudgetExceeded", "Cancelled"] as const;
/** One of {@link FAN_OUT_GROUP_STATUSES}. */
export type FanOutGroupStatus = typeof FAN_OUT_GROUP_STATUSES[number];
/**
 * Fan-out join policies. All joins when every member finished; Any when one member succeeded (or every member finished
 * without one succeeding); Quorum when quorum members succeeded (or the quorum can no longer be met).
 */
export const FAN_OUT_JOIN_POLICIES = ["All", "Any", "Quorum"] as const;
/** One of {@link FAN_OUT_JOIN_POLICIES}. */
export type FanOutJoinPolicy = typeof FAN_OUT_JOIN_POLICIES[number];

/**
 * One member of a fan-out group: a child run with its state and, once finished, its result. status is a run status and
 * outcome a run outcome (absent until it finishes). resultText is cut at the server's gather limit and resultTruncated
 * reports the cut. filesWritten holds paths the member wrote in the shared file space. tokens counts input plus output.
 */
export interface FanOutMember {
  label: string; agent: string; runId: string; status: RunStatus; outcome?: RunOutcome | null;
  resultText?: string | null; resultTruncated: boolean; structuredOutputJson?: string | null; errorMessage?: string | null;
  filesWritten: string[]; costUsd?: number | null; tokens: number;
}

/**
 * A group of child runs a run started with the garrison_fan_out MCP tool. fanOutGroupId has the prefix fog_. pending
 * lists labels of members still queued or running; failed lists those that failed, timed out, or were cancelled.
 * costUsd and tokens total the members; maxCostUsd and maxTokens are the budget (absent when unset). Times are ISO 8601
 * UTC. summary, continuationMarker, and continuationInstruction are what a harness sees through garrison_gather and are
 * normally absent here.
 */
export interface FanOutGroup {
  fanOutGroupId: string; parentRunId: string; status: FanOutGroupStatus; statusReason?: string | null;
  joinPolicy: FanOutJoinPolicy; quorum: number; total: number; finished: number; succeeded: number;
  pending: string[]; failed: string[]; members: FanOutMember[]; costUsd: number; tokens: number;
  maxCostUsd?: number | null; maxTokens?: number | null; deadlineUtc?: string | null; createdUtc: string; completedUtc?: string | null;
  summary?: string | null; continuationMarker?: string | null; continuationInstruction?: string | null;
}

/** Content of a manual capability descriptor for create and update. */
export interface CapabilityDescriptorInput extends Json {
  name: string; kind: CapabilityKind; summary?: string | null; inputSchemaJson?: string | null; outputSchemaJson?: string | null;
  tags?: string[]; requirements?: CapabilityRequirement[]; sourceAgentId?: string | null; sourceMcpServerId?: string | null; sourceToolName?: string | null;
}

/** Filters for capabilities.list. search matches the name or summary, ignoring case. */
export interface CapabilityListQuery { kind?: CapabilityKind; tag?: string; search?: string; }

/** Refresh outcome for one MCP server. error is set when its tool listing failed. */
export interface CapabilityServerRefresh { mcpServerId: string; mcpServerName: string; tools: number; removed: number; warned: number; error?: string | null; }

/** Result of capabilities.refresh: descriptors created, refreshed, or removed per source. */
export interface CapabilityRefreshResult { agents: number; harnessBuiltIns: number; hints: number; mcpServers: CapabilityServerRefresh[]; }

/** One file to upload. String content is UTF-8 encoded. */
export interface AgentAssetUpload { path: string; content: Uint8Array | string; mediaType?: string; }

/** Immutable (Published) or editable (Draft) snapshot of an agent's content. */
export interface AgentRevision extends Json {
  id: string; tenantId: string; agentId: string; number: number; state: AgentRevisionState; contentHash: string;
  displayName?: string | null; description?: string | null; inputMode?: "Text" | "Structured";
  inputSchemaJson?: string | null; outputSchemaJson?: string | null;
  delegationMode?: string; delegationMaxDepth?: number; delegationAllowRecursion?: boolean; delegationAllowList?: string[];
  promptPins?: AgentRevisionPromptPin[]; assetPins?: AgentRevisionAssetPin[]; capabilities?: string[]; tags?: string[];
  authorUserId?: string | null; authorName?: string | null; changeNote?: string | null;
  publishedByUserId?: string | null; publishedByName?: string | null; publishedUtc?: string | null;
  createdUtc: string; lastUpdateUtc: string;
}

/** One differing field between two revisions. */
export interface AgentRevisionChange { field: string; changeType: RevisionChangeType; from?: string | null; to?: string | null; }

/** Field-level comparison of two revisions of one agent. */
export interface AgentRevisionDiff {
  agentId: string; fromRevisionId: string; fromNumber: number; toRevisionId: string; toNumber: number;
  identical: boolean; changes: AgentRevisionChange[];
}

/** Body of a revision publish. */
export interface RevisionPublishRequest { changeNote?: string; }

/** One named environment in the tenant's promotion order. */
export interface TenantEnvironment { name: string; description?: string | null; position: number; }

/** Ordered tenant environments. isDefault is true when the tenant uses the built-in dev, staging, prod list. */
export interface TenantEnvironmentList { environments: TenantEnvironment[]; isDefault?: boolean; }

/** Promote an agent revision from one environment to another. targetEnvironment defaults to the next environment in order. */
export interface PromotionRequest {
  agentId: string; sourceEnvironment: string; targetEnvironment?: string; agentRevisionId?: string; allowSkip?: boolean; note?: string;
}

/** Body of a promotion rollback. */
export interface PromotionRollbackRequest { note?: string; }

/** One deployment a promotion re-pinned. Null revision ids mean unpinned (follows the latest published revision). */
export interface PromotionItem {
  deploymentId: string; deploymentName: string; agentId: string; previousRevisionId: string | null; newRevisionId: string | null;
}

/** Audit record of a promotion or rollback. */
export interface PromotionRecord extends Json {
  id: string; tenantId: string; kind: PromotionKind; outcome: PromotionOutcome;
  agentId?: string | null; appId?: string | null; appRevisionId?: string | null; agentRevisionId?: string | null;
  sourceEnvironment?: string | null; targetEnvironment: string; skippedEnvironments?: boolean;
  rollbackOfId?: string | null; rolledBackById?: string | null;
  actorType?: string | null; actorId?: string | null; actorName?: string | null; note?: string | null;
  items: PromotionItem[]; createdUtc: string;
}

/** Field codes for input schema failures (GarrisonError.fieldCodes values). */
export const INPUT_SCHEMA_FIELD_CODES = ["InputNotJson", "InputSchemaViolation", "InvalidJsonSchema"] as const;

/** Transcript download formats. */
export type TranscriptFormat = "markdown" | "json";

/** Token, tool, cost, and duration totals of a transcript or one turn. */
export interface TranscriptUsage {
  inputTokens: number; outputTokens: number; cachedTokens: number; reasoningTokens: number; toolCallCount: number;
  costUsd?: number; costEstimated: boolean; durationMs?: number;
}

/** One transcript event; Thinking appears only with includeThinking. Secrets read [REDACTED]. */
export interface TranscriptEntry {
  sequence: number; timestampUtc: string;
  type: "AssistantText" | "Thinking" | "ToolCall" | "ToolResult" | "Warning" | "Error" | "Lifecycle";
  text?: string; toolName?: string; toolCallId?: string; success?: boolean; code?: string; textTruncated: boolean;
}

/** An approval requested during a turn. */
export interface TranscriptApproval {
  id: string; kind: string; toolName: string; summary?: string; inputPreview?: string; status: string; decision?: string;
  decisionSource?: string; decidedBy?: string; reason?: string; requestedUtc: string; decidedUtc?: string;
}

/** One run of a transcript (a conversation has one per turn). */
export interface TranscriptTurn {
  turn: number; runId: string; agentName: string; deploymentId: string; kind: string; status: string; outcome: string;
  callerName?: string; model?: string; input?: string; inputContentType?: string;
  createdUtc: string; startedUtc?: string; completedUtc?: string;
  entries: TranscriptEntry[]; approvals: TranscriptApproval[];
  result?: string; errorMessage?: string; usage: TranscriptUsage;
  /** Events the run recorded that are no longer stored (retention). */
  omittedEvents: number;
  truncated: boolean;
}

/** Run or conversation transcript, schema "garrison.transcript/v1". */
export interface Transcript {
  schema: string; kind: "Run" | "Conversation"; tenantId: string; runId?: string; conversationId?: string;
  agentName: string; title?: string; generatedUtc: string; includesThinking: boolean;
  truncated: boolean; truncationNote?: string; turnCount: number; usage: TranscriptUsage; turns: TranscriptTurn[];
}

/** Manifest bundle export selectors. With no kinds and no resources every tenant-owned resource is exported. */
export interface ManifestExportOptions {
  /** Whole kinds, for example ["Agent", "Pipeline"]. */
  kinds?: string[];
  /** Single records as "Kind/name", for example ["Agent/triage"]. */
  resources?: string[];
  /** Also export what the selection depends on. Default false. */
  followReferences?: boolean;
  /** Include referenced built-in prompt templates and harness profiles. Default false. */
  includeBuiltIn?: boolean;
}

/** How a worker executes a run: as a subprocess of the worker, or in its own Kubernetes Job (pod per run). */
export type RunExecutor = "Process" | "KubernetesJob" | "RemoteA2A" | "RemoteMcp";

/** Executors, in declaration order. */
export const RUN_EXECUTORS: readonly RunExecutor[] = ["Process", "KubernetesJob", "RemoteA2A", "RemoteMcp"] as const;
/** Deployment and run trustLevel values; Trusted is the default. */
export const TRUST_LEVELS: readonly TrustLevel[] = ["Trusted", "Untrusted"] as const;
/** Egress rule protocols; TCP is the default. */
export const EGRESS_PROTOCOLS: readonly EgressProtocol[] = ["TCP", "UDP"] as const;
/** Deployment and run effectPolicy values; AtMostOnce is the default for new deployments. */
export const EFFECT_POLICIES: readonly EffectPolicy[] = ["AtMostOnce", "AtLeastOnce", "Journaled"] as const;

/**
 * Requests and limits for the run pod of a KubernetesJob run, as Kubernetes quantities (for example "500m", "2",
 * "512Mi", "4Gi"). Null or absent values use the worker's defaults. Ignored for Process runs.
 */
export type ExecutorIsolation = "Process" | "Container" | "SandboxedRuntime";
export type ExecutorColdStart = "Immediate" | "Cold" | "Warm";
/** Optional executor requirements. Defaults make no advanced capability demand. */
export interface ExecutorRequirements {
  isolation?: ExecutorIsolation;
  egressControl?: boolean;
  filesystemSnapshot?: boolean;
  sessionContinuation?: boolean;
  crossNodeRestore?: boolean;
  coldStartClass?: ExecutorColdStart | null;
}
/** One worker-reported executor. Missing fields make no capability promise. */
export interface ExecutorCapabilities extends ExecutorRequirements { executor: RunExecutor; warmStart?: boolean; }

export interface RunPodResources {
  cpuRequest?: string | null; cpuLimit?: string | null; memoryRequest?: string | null; memoryLimit?: string | null;
  ephemeralStorageRequest?: string | null; ephemeralStorageLimit?: string | null;
}

/** Workspace kinds. PersistentVolume mounts a PersistentVolumeClaim at the workspace path (KubernetesJob runs only). */
export type WorkspaceKind = "Empty" | "GitRepository" | "Seeded" | "PersistentVolume";

/** Configuration for database, filesystem, or S3-compatible artifact storage. Credentials stay server-side. */
export interface ArtifactStore extends Json {
  id: string; tenantId: string; name: string; kind: "Database" | "Filesystem" | "S3";
  pathPrefix?: string | null; bucket?: string | null; endpoint?: string | null; region?: string;
  secretId?: string | null; forcePathStyle?: boolean; active?: boolean;
}
/** Metadata only; file bytes are downloaded separately. */
export interface Artifact extends Json {
  id: string; tenantId: string; runId: string; artifactStoreId: string; name: string; mediaType: string;
  sizeBytes: number; sha256: string; location: string; leaseEpoch: number; repairAttempt: number; createdUtc: string;
}
export interface ArtifactDownload { url: string; expiresUtc: string; }

export interface Deployment extends Json, WithWarnings {
  /** Workspace-relative directory where the conversation file space is mounted for runs. Default "files". */
  fileSpaceMountPath?: string;
  /** Opt in to durable suspension on resumable harnesses. */
  suspensionEnabled?: boolean;
  id: string; tenantId: string; agentId: string; name: string; harnessProfileId: string; model?: string;
  /** Pinned agent revision; null follows the latest published revision (or live agent content when none). */
  agentRevisionId?: string | null;
  /** Environment name, default "dev". */
  environment?: string;
  /** Executor; null uses the node pool's defaultExecutor, then Process. */
  executor?: RunExecutor | null;
  requiredCapabilities?: ExecutorRequirements;
  /** Trust level, default Trusted. Untrusted runs need at least Container isolation (an unset executor resolves to KubernetesJob). */
  trustLevel?: TrustLevel;
  /**
   * Egress allowlist, at most 64 rules; empty or omitted means no allowlist. With rules, run pods reach only DNS, the
   * Garrison MCP port, and the rules; an unset executor resolves to KubernetesJob, and a run no Ready worker can
   * enforce stays Queued with blockedReason NoIsolatingWorker.
   */
  egressRules?: DeploymentEgressRule[];
  /** Effect policy, default AtMostOnce: what happens to a run that was already Running when its worker was lost. AtMostOnce fails it with NodeLost, AtLeastOnce requeues it while attempts remain, Journaled requires a safe current-epoch checkpoint. */
  effectPolicy?: EffectPolicy;
  /** @deprecated Use effectPolicy. Read-only view: true only for AtLeastOnce. Still accepted on input (true AtLeastOnce, false AtMostOnce); sending it with a disagreeing effectPolicy is a 400 (EffectPolicyConflict), so omit it when you change effectPolicy. */
  retryOnNodeLoss?: boolean;
  /** Empty disables automatic artifact collection. */
  artifactGlobs?: string[];
  artifactStoreId?: string;
  /** Run pod requests and limits for KubernetesJob runs. */
  podResources?: RunPodResources;
  /** Permission approvals. Only Claude Code profiles and Codex profiles with CodexAppServer delivery accept true. Default false. */
  approvalsEnabled?: boolean;
  /** What happens to a request no rule matches. Default Ask. */
  approvalDefaultAction?: ApprovalRuleAction;
  /** Seconds a pending approval waits for a person (10 to 3600, default 300). */
  approvalTimeoutSeconds?: number;
  /** Decision applied when a pending approval expires. Default Deny. */
  approvalTimeoutDecision?: ApprovalDecision;
  /** Approval rules in display order (at most 500). Deny beats Ask, Ask beats Allow. */
  approvalRules?: DeploymentApprovalRule[];
  /** What the deployment's run tokens may do in the management plane. Default None; deployments of agent-architect always get Drafts. */
  managementAccess?: ManagementAccess;
  /** On create only: the architect prompt (template identifier or name) to bind as the System prompt. Omitted binds builtin/agent-architect. */
  architectPromptTemplateId?: string | null;
  /** On create only: the architect prompt version to pin, or null to follow its current version. */
  architectPromptVersion?: number | null;
}

/** State of a permission approval. Pending is the only state that can change. */
export type ApprovalStatus = "Pending" | "Approved" | "Denied" | "Expired" | "Cancelled";
/** What the harness is told. */
export type ApprovalDecision = "Allow" | "Deny";
/** Who or what decided an approval. */
export type ApprovalSource = "Rule" | "Default" | "User" | "Timeout" | "Cancelled" | "DurableResume";
/** Action of an approval rule or of the deployment default. */
export type ApprovalRuleAction = "Allow" | "Deny" | "Ask";
/** Where a request came from: a Claude Code tool call, a Codex command (evaluated as Bash), or a Codex file change (evaluated as Edit). */
/** DraftApply asks a person to apply a studio draft; it is not tied to a run. */
export type ApprovalKind = "Tool" | "Command" | "FileChange" | "DraftApply";

/** One approval rule of a deployment. pattern uses Claude Code rule syntax, for example Bash(git status:*) or mcp__github__*. */
export interface DeploymentApprovalRule extends Json {
  /** dar_ identifier, stable across updates; omit or leave empty for a new rule. */
  id?: string;
  deploymentId?: string;
  /** Default Ask. */
  action?: ApprovalRuleAction;
  pattern: string;
  /** Optional .NET regular expression over the tool input JSON. */
  inputPattern?: string | null;
  description?: string | null;
}

/** A permission request a harness relayed to Garrison and its decision. */
export interface Approval extends Json {
  id: string; tenantId: string; runId: string; rootRunId?: string | null; agentId: string; agentName: string; deploymentId: string;
  leaseEpoch: number; harnessType: string; kind: ApprovalKind; toolName: string; toolCallId?: string | null;
  /** The studio draft a DraftApply approval would apply, or null for tool approvals. */
  draftId?: string | null;
  /** Redacted tool input JSON, at most 4000 characters. */
  inputPreview?: string | null;
  /** One-line summary (command, URL, paths, or query), redacted, at most 500 characters. */
  summary?: string | null;
  /** A rule pattern that would cover this request, used when deciding with remember. */
  suggestedRule?: string | null;
  status: ApprovalStatus;
  /** Null while Pending. */
  decision?: ApprovalDecision | null;
  /** Null while Pending. */
  decisionSource?: ApprovalSource | null;
  ruleId?: string | null; rulePattern?: string | null; rememberedRuleId?: string | null;
  decidedBy?: string | null; decidedById?: string | null; reason?: string | null;
  timeoutDecision: ApprovalDecision;
  requestedUtc: string; decidedUtc?: string | null;
  /** Set on approvals waiting for a person. */
  expiresUtc?: string | null;
  /** Milliseconds between request and decision; null while Pending. */
  waitMs?: number | null;
  createdUtc: string; lastUpdateUtc: string;
}

/** Pipeline run status. Succeeded, Failed, Cancelled, and TimedOut are terminal. */
export type PipelineRunStatus = "Running" | "AwaitingReview" | "Cancelling" | "Succeeded" | "Failed" | "Cancelled" | "TimedOut";
/** Why a pipeline run ended (None while it is active). */
export type PipelineRunOutcome = "None" | "Succeeded" | "StageFailed" | "StageStartFailed" | "ReviewRejected" | "ReviewExpired" | "Cancelled" | "TimedOut" | "InternalError";
/** Status of one stage of a pipeline run. */
export type PipelineStageStatus = "Pending" | "Running" | "AwaitingReview" | "Succeeded" | "Failed" | "Cancelled";
/** Status of a pipeline stage review. */
export type PipelineReviewStatus = "Pending" | "Approved" | "ChangesRequested" | "Rejected" | "Expired" | "Cancelled";
/** A review decision. Also the action a stage applies when its review times out (Approve or Reject). */
export type PipelineReviewDecision = "Approve" | "RequestChanges" | "Reject";
/** Who decided a review: a person, the stage's review timeout, or cancellation of the pipeline run. */
export type PipelineReviewSource = "User" | "Timeout" | "Cancelled";
/** Terminal pipeline run statuses. */
export const PIPELINE_TERMINAL_STATUSES: readonly PipelineRunStatus[] = ["Succeeded", "Failed", "Cancelled", "TimedOut"] as const;

/** What starts a trigger. */
export type TriggerType = "Cron" | "Webhook";
/** What a trigger starts. */
export type TriggerTargetType = "Agent" | "Pipeline";
/** Why a trigger fired. */
export type TriggerFireSource = "Cron" | "Webhook" | "Manual";
/** Result of one trigger fire. */
export type TriggerFireOutcome = "Started" | "Failed" | "Skipped";
export const TRIGGER_TYPES: readonly TriggerType[] = ["Cron", "Webhook"] as const;
export const TRIGGER_FIRE_OUTCOMES: readonly TriggerFireOutcome[] = ["Started", "Failed", "Skipped"] as const;

/** A cron schedule or signed webhook that starts an agent run or a pipeline run. Fires run as the principal that last saved it. */
export interface Trigger extends Json {
  id?: string; tenantId?: string; name: string; description?: string | null;
  /** Cron or Webhook; cannot change after creation. */
  type: TriggerType;
  /** Agent (default) or Pipeline. */
  targetType?: TriggerTargetType;
  agentId?: string | null; deploymentId?: string | null; pipelineId?: string | null;
  /** Task prompt template that renders the run input; null uses builtin/trigger-input. */
  inputTemplateId?: string | null;
  priority?: number;
  /** Five-field cron expression (Cron triggers). */
  cronExpression?: string | null;
  /** IANA time zone of the cron expression. Default UTC. */
  timeZone?: string;
  active?: boolean;
  /** Webhook signing secret: present only in the create and rotateSecret responses. */
  signingSecret?: string | null;
  signingSecretLast4?: string | null; signingSecretRotatedUtc?: string | null;
  runAsType?: string; runAsId?: string | null; runAsName?: string | null;
  lastFireUtc?: string | null; lastFireOutcome?: TriggerFireOutcome | null; nextFireUtc?: string | null; fireCount?: number;
  createdUtc?: string; lastUpdateUtc?: string;
}

/** One fire of a trigger and the run or pipeline run it started. */
export interface TriggerFire extends Json {
  id: string; tenantId: string; triggerId: string; triggerName: string; source: TriggerFireSource;
  deliveryId?: string | null; scheduledUtc: string; firedUtc: string; outcome: TriggerFireOutcome;
  runId?: string | null; pipelineRunId?: string | null; errorCode?: string | null; errorMessage?: string | null;
  /** True when this answer repeats an earlier fire for the same webhook delivery identifier. */
  duplicate?: boolean;
  createdUtc: string;
}

/** Optional body of a manual fire; the payload reaches the input template as webhook.body. */
export interface TriggerFireRequest { body?: string; contentType?: string; }

/** Event a notification endpoint can subscribe to (Test is only sent by the test action). */
export type NotificationEvent = "RunSucceeded" | "RunFailed" | "RunCancelled" | "RunTimedOut" | "PipelineCompleted" | "PipelineFailed" | "ApprovalRequested" | "Test";
export const NOTIFICATION_EVENTS: readonly NotificationEvent[] = ["RunSucceeded", "RunFailed", "RunCancelled", "RunTimedOut", "PipelineCompleted", "PipelineFailed", "ApprovalRequested", "Test"] as const;
/** State of a notification delivery. */
export type NotificationDeliveryStatus = "Pending" | "Delivering" | "Succeeded" | "Failed";

/** A URL that receives signed JSON notifications for subscribed events. */
export interface NotificationEndpoint extends Json {
  id?: string; tenantId?: string; name: string; description?: string | null;
  /** http or https; loopback and private addresses need Notifications.AllowPrivateDestinations, link-local is always refused. */
  url: string;
  events: NotificationEvent[];
  agentId?: string | null; deploymentId?: string | null;
  includeResultText?: boolean; resultTextMaxChars?: number; active?: boolean;
  /** Signing secret: present only in the create and rotateSecret responses. */
  signingSecret?: string | null;
  signingSecretLast4?: string | null; signingSecretRotatedUtc?: string | null;
  createdUtc?: string; lastUpdateUtc?: string;
}

/** One notification to one endpoint: the outbox entry and its delivery log record. */
export interface NotificationDelivery extends Json {
  id: string; tenantId: string; endpointId: string; event: NotificationEvent; subjectType: string; subjectId?: string | null;
  status: NotificationDeliveryStatus; attempts: number; maxAttempts: number; nextAttemptUtc?: string | null;
  lastStatusCode?: number | null; lastError?: string | null; lastAttemptUtc?: string | null; lastDurationMs: number;
  deliveredUtc?: string | null; payload: string; createdUtc: string; lastUpdateUtc: string;
}

export const WEBHOOK_SIGNATURE_HEADER = "X-Garrison-Signature";
export const WEBHOOK_DELIVERY_HEADER = "X-Garrison-Delivery";
export const WEBHOOK_EVENT_HEADER = "X-Garrison-Event";

function webhookBytes(body: string | Uint8Array): Uint8Array {
  return typeof body === "string" ? new TextEncoder().encode(body) : body;
}

/**
 * Build the X-Garrison-Signature header value: t=<unix>,v1=<lowercase hex HMAC-SHA256 of "<t>." + raw body>, keyed with the
 * UTF-8 bytes of the signing secret. Senders of trigger webhooks use it.
 */
export async function signWebhook(secret: string, unixSeconds: number, body: string | Uint8Array): Promise<string> {
  if (!secret) throw new Error("secret is required");
  const crypto = await subtle();
  const t = Math.trunc(unixSeconds).toString();
  const prefix = new TextEncoder().encode(t + ".");
  const payload = webhookBytes(body);
  const message = new Uint8Array(prefix.length + payload.length);
  message.set(prefix, 0);
  message.set(payload, prefix.length);
  const key = await crypto.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `t=${t},v1=${hex(await crypto.sign("HMAC", key, message))}`;
}

/**
 * Verify an X-Garrison-Signature header against the raw body: any v1 value may match (constant-time comparison) and the
 * timestamp must be within toleranceSeconds of now. Receivers of notifications use it.
 */
export async function verifyWebhook(header: string | null | undefined, secret: string, body: string | Uint8Array, toleranceSeconds = 300): Promise<boolean> {
  if (!header || !secret) return false;
  let timestamp: number | undefined;
  const candidates: string[] = [];
  for (const part of header.split(",")) {
    const item = part.trim();
    const equals = item.indexOf("=");
    if (equals <= 0) return false;
    const name = item.slice(0, equals).trim();
    const value = item.slice(equals + 1).trim();
    if (name === "t") {
      if (timestamp !== undefined || !/^\d+$/.test(value)) return false;
      timestamp = Number(value);
    } else if (name === "v1") {
      if (value.length !== 64) return false;
      candidates.push(value.toLowerCase());
    }
  }
  if (timestamp === undefined || candidates.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > Math.max(1, toleranceSeconds)) return false;
  const expected = (await signWebhook(secret, timestamp, body)).split(",v1=")[1];
  let matched = false;
  for (const candidate of candidates) {
    let diff = 0;
    for (let i = 0; i < 64; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff === 0) matched = true;
  }
  return matched;
}

/** A run parameter override applied to a pipeline stage's runs. */
export interface PipelineStageParameter extends Json { id?: string; stageId?: string; tenantId?: string; name: string; value: string; }

/** One ordered stage of a pipeline: an agent, optional deployment and handoff template pins, retries, and review settings. */
export interface PipelineStage extends Json {
  id?: string; pipelineId?: string; tenantId?: string;
  /** 1-based; assigned from the order of the stages list. */
  position?: number;
  name: string; description?: string | null;
  agentId: string;
  /** Null uses the agent's weighted deployment selection. */
  deploymentId?: string | null;
  /** PipelineStage template that renders the stage prompt; null uses the deployment binding, then builtin/pipeline-stage. */
  handoffTemplateId?: string | null;
  /** Pinned template version; null uses the current version. */
  handoffTemplateVersion?: number | null;
  /** Characters of each earlier output handed to this stage. Default 16000, 1000 to 200000. */
  outputCharLimit?: number;
  /** Attempts before the stage fails. Default 1, 1 to 5. */
  maxAttempts?: number;
  /** Advance to the next stage even when this stage fails. Default false. */
  continueOnFailure?: boolean;
  /** Wait for a person to review the stage's output. Default false. */
  requiresReview?: boolean;
  /** Seconds a review waits before reviewTimeoutAction applies; 0 (default) waits forever. */
  reviewTimeoutSeconds?: number;
  /** Approve or Reject (default) when the review times out. */
  reviewTimeoutAction?: PipelineReviewDecision;
  /** RequestChanges decisions allowed. Default 3, 0 to 10. */
  maxRevisions?: number;
  parameters?: PipelineStageParameter[];
}

/** Ordered agent stages with optional human review gates. */
export interface Pipeline extends Json {
  id: string; tenantId: string; name: string; description?: string | null;
  /** Increments on every update; pipeline runs keep the version they started with. */
  version: number;
  /** Overall limit including review waits; 0 means no limit. */
  maxDurationSeconds: number;
  active: boolean; isProtected: boolean; createdUtc: string; lastUpdateUtc: string;
  stages: PipelineStage[];
}

/** A parameter snapshot of a pipeline run stage. */
export interface PipelineRunStageParameter extends Json { id: string; runStageId: string; tenantId: string; name: string; value: string; }

/** A stage of a pipeline run: the stage definition snapshot at start plus its progress. */
export interface PipelineRunStage extends Json {
  id: string; pipelineRunId: string; tenantId: string; position: number; name: string; description?: string | null;
  agentId: string; agentName: string; deploymentId?: string | null;
  handoffTemplateId?: string | null; handoffTemplateVersion?: number | null;
  outputCharLimit: number; maxAttempts: number; continueOnFailure: boolean; requiresReview: boolean;
  reviewTimeoutSeconds: number; reviewTimeoutAction: PipelineReviewDecision; maxRevisions: number;
  status: PipelineStageStatus; executions: number; attempts: number; revisions: number;
  currentRunId?: string | null; lastRunId?: string | null; blockedReason?: string | null; nextAttemptUtc?: string | null;
  startedUtc?: string | null; completedUtc?: string | null;
  parameters: PipelineRunStageParameter[];
}

/** A stage run of a pipeline run, as listed in the pipeline run detail. */
export interface PipelineStageRunSummary extends Json {
  runId: string; position: number; execution: number; agentName: string;
  status: string; outcome?: string | null; errorMessage?: string | null; createdUtc: string; completedUtc?: string | null;
}

/** A human review gate on a pipeline stage execution. */
export interface PipelineReview extends Json {
  id: string; tenantId: string; pipelineRunId: string; pipelineId: string; pipelineName: string;
  runStageId: string; position: number; stageName: string;
  /** The stage run under review. */
  runId: string;
  execution: number;
  status: PipelineReviewStatus;
  decision?: PipelineReviewDecision | null;
  decisionSource?: PipelineReviewSource | null;
  comment?: string | null; decidedBy?: string | null; decidedById?: string | null;
  timeoutAction: PipelineReviewDecision;
  requestedUtc: string; expiresUtc?: string | null; decidedUtc?: string | null; createdUtc: string; lastUpdateUtc: string;
}

/** One execution of a pipeline. Detail reads carry stages, reviews, and stage run summaries. */
export interface PipelineRun extends Json {
  id: string; tenantId: string; pipelineId: string; pipelineName: string; pipelineVersion: number;
  status: PipelineRunStatus; outcome: PipelineRunOutcome;
  /** 1-based position of the current (or last) stage. */
  currentPosition: number;
  stageCount: number; inputText: string; inputContentType: string;
  callerType: string; callerId?: string | null; callerName?: string | null; idempotencyKey?: string | null;
  priority: number; finalRunId?: string | null; errorMessage?: string | null; deadlineUtc?: string | null;
  cancelRequested: boolean; startedUtc?: string | null; completedUtc?: string | null; createdUtc: string; lastUpdateUtc: string;
  /** Trigger that started this pipeline run, or null. */
  triggerId?: string | null;
  stages: PipelineRunStage[];
  reviews: PipelineReview[];
  runs: PipelineStageRunSummary[];
}

/** Start a pipeline. */
export interface PipelineStartRequest {
  /** The caller's input; every stage receives it as its task. */
  input: string;
  /** Default text/plain. */
  inputContentType?: string;
  /** Priority of the stage runs. Default 0. */
  priority?: number;
  /** Wait until the pipeline run ends or waits for a review. Default false. */
  wait?: boolean;
  /** Seconds to wait when wait is true. Default 60, at most 600. */
  waitSeconds?: number;
}

/** Options of pipelines.start that travel outside the request body. */
export interface PipelineStartOptions {
  /** Sent as the Idempotency-Key header: a repeated start with the same key and input returns the same pipeline run. */
  idempotencyKey?: string;
}

/** Render every stage prompt from sample input and sample stage outputs. */
export interface PipelinePreviewRequest {
  input?: string;
  /** Sample output of each earlier stage, by position (index 0 is stage 1). Missing entries use a placeholder. */
  sampleOutputs?: string[];
}

/** A rendered stage prompt (secrets redacted), or the error that prevented rendering it. */
export interface PipelinePreviewStage extends Json {
  position: number; stageName: string; agentName: string; deploymentId?: string | null; deploymentName?: string | null;
  success: boolean; prompt?: string | null; errorCode?: string | null; errorMessage?: string | null;
}

/** Pipeline preview result. */
export interface PipelinePreviewResponse extends Json { pipelineId: string; pipelineName: string; stages: PipelinePreviewStage[]; }

/** Pipeline run list filter. */
export interface PipelineRunFilter {
  pipelineId?: string; status?: PipelineRunStatus; callerId?: string; fromUtc?: string | Date; toUtc?: string | Date;
  maxResults?: number; skip?: number; ordering?: string;
}

/** Pipeline review list filter. */
export interface PipelineReviewFilter {
  status?: PipelineReviewStatus; pipelineRunId?: string; pipelineId?: string; runId?: string; decisionSource?: PipelineReviewSource;
  fromUtc?: string | Date; toUtc?: string | Date; maxResults?: number; skip?: number; ordering?: string;
}

/** A decision on a pending pipeline review. */
export interface PipelineReviewDecideRequest {
  decision: PipelineReviewDecision;
  /** At most 8000 characters. Required for RequestChanges (the feedback); Approve notes reach the next stage. */
  comment?: string;
}

/** Approval list filter. */
export interface ApprovalFilter {
  status?: ApprovalStatus; runId?: string; rootRunId?: string; agentId?: string; deploymentId?: string;
  decisionSource?: ApprovalSource; fromUtc?: string | Date; toUtc?: string | Date;
  maxResults?: number; skip?: number; ordering?: string;
}

/** A decision on a pending approval. */
export interface ApprovalDecideRequest {
  decision: ApprovalDecision;
  /** At most 4000 characters; shown to the harness when denying. */
  reason?: string;
  /** Also add a matching rule to the approval's deployment (needs Update on the deployment). Default false. */
  remember?: boolean;
  /** Pattern of the remembered rule; defaults to the approval's suggestedRule. */
  rulePattern?: string;
}

/** Tool input fields approval rules look at. Names follow Claude Code tool inputs (file_path, notebook_path). */
export interface ApprovalToolInput {
  command?: string; cwd?: string; url?: string; file_path?: string; notebook_path?: string; path?: string;
  paths?: string[]; pattern?: string; query?: string;
}

/** A sample tool call to evaluate against a deployment's approval rules. */
export interface ApprovalCheckRequest { toolName: string; input?: ApprovalToolInput; }

/** What a deployment's approval rules would do with a request. Nothing is recorded. */
export interface ApprovalCheckResponse {
  action: ApprovalRuleAction;
  /** Rule when a rule matched, Default when the deployment default applied. */
  source: "Rule" | "Default";
  ruleId?: string | null; rulePattern?: string | null; suggestedRule?: string | null;
  approvalsEnabled: boolean;
}

/** A node pool. defaultExecutor applies to deployments in the pool that set no executor (null means Process). */
export interface NodePool extends Json {
  id: string; name: string; description?: string | null; tenants?: string[]; defaultExecutor?: RunExecutor | null;
}

/** A worker node. executors lists what it can run (Process, and KubernetesJob when it can create Jobs). */
export interface WorkerNode extends Json {
  id: string; name: string; status: string; nodePoolId?: string | null; executors?: RunExecutor[]; executorCapabilities?: ExecutorCapabilities[];
  /** Whether the worker runs inside a container or pod (reported at registration). Default false. */
  containerized?: boolean;
}

/** A workspace template. persistentVolumeClaim names the claim for PersistentVolume workspaces. */
export interface WorkspaceTemplate extends Json, WithWarnings {
  id: string; tenantId: string; name: string; kind: WorkspaceKind; persistentVolumeClaim?: string | null;
}

/** The arguments a harness tool probe may pass (at most one; default "--version"). */
export const HARNESS_TOOL_PROBE_ARGUMENTS = ["--version", "-version", "-v", "-V", "version", "--help", "-h"] as const;
/** One of {@link HARNESS_TOOL_PROBE_ARGUMENTS}. */
export type HarnessToolProbeArgument = typeof HARNESS_TOOL_PROBE_ARGUMENTS[number];

/**
 * A tool a harness can use when its host has it installed, such as pandoc. Workers run the probe and report the tool as
 * the node label garrison.io/tool-{name}=true; each probe becomes a HarnessBuiltIn capability. name is 1 to 63 lowercase
 * letters, digits, dots, and hyphens; executable is a bare file name on the worker's PATH.
 */
export interface HarnessToolProbe { name: string; executable: string; arguments?: HarnessToolProbeArgument[]; description?: string | null; }

/** A harness profile. toolProbes holds at most 32 probes with unique names. */
export interface HarnessProfile extends Json, WithWarnings { id: string; name: string; harnessType: string; executable: string; sessionFormat?: string | null; toolProbes?: HarnessToolProbe[]; }

/** An MCP server definition. */
export interface McpServer extends Json, WithWarnings {
  id: string; tenantId: string; name: string; transport: string; toolTimeoutSeconds?: number;
}

export type RunStatus = "Queued" | "Leased" | "Running" | "Cancelling" | "Succeeded" | "Failed" | "Cancelled" | "TimedOut" | "Rejected" | "Suspended";
export const RUN_STATUSES: readonly RunStatus[] = ["Queued", "Leased", "Running", "Cancelling", "Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected", "Suspended"] as const;
export const QUEUE_FULL_ERROR = "QueueFull" as const;
/** Why a run was created. Playground runs try an agent's draft revision on an ephemeral deployment in the reserved "draft" environment. */
export type RunKind = "Invoke" | "Delegated" | "Test" | "Retry" | "Pipeline" | "Trigger" | "Playground";
export const RUN_KINDS: readonly RunKind[] = ["Invoke", "Delegated", "Test", "Retry", "Pipeline", "Trigger", "Playground"] as const;
/** The reserved environment playground deployments live in; users cannot create deployments in it. */
export const PLAYGROUND_ENVIRONMENT = "draft" as const;
export type EffectOperationState = "Authorized" | "Dispatched" | "Completed" | "Unknown";
export const EFFECT_OPERATION_STATES: readonly EffectOperationState[] = ["Authorized", "Dispatched", "Completed", "Unknown"] as const;
/** Read-only placement diagnostics; eligibility never reserves capacity. */
export interface NodePlacementResponse { nodeId: string; eligible: boolean; reasons: string[]; }
export interface RunPlacementResponse { runId: string; takenUtc: string; admissionRejection?: string | null; reasons: string[]; nodes: NodePlacementResponse[]; eligible: boolean; }
/** Exact completed-scope SQL attempts; shared polling and telemetry writes are excluded. */
export interface RunDatabaseUsage { tenantId: string; runId: string; operation: string; statements: number; reads: number; writes: number; errors: number; transactions: number; durationMicroseconds: number; }
export interface EffectOperation { id: string; tenantId: string; runId: string; leaseEpoch: number; tool: string; argumentDigest: string; state: EffectOperationState; resultReference?: string | null; createdUtc: string; }
export interface MasterKeyRotationResponse { keyVersion: number; scanned: number; rotated: number; conflicts: number; failed: number; }
export interface Tenant extends Json { id: string; name: string; schedulingWeight: number; requireUntrustedDeployments?: boolean; }
export interface TenantRequest extends Json { name?: string; schedulingWeight?: number; requireUntrustedDeployments?: boolean; }

export interface Run extends Json {
  id: string; tenantId: string; agentId: string; agentName: string; deploymentId: string; status: RunStatus; outcome: string;
  /** Agent revision the run executed, or null when it ran live agent content. */
  agentRevisionId?: string | null;
  /** Why the run was created. */
  kind?: RunKind;
  /** Executor the run needs, resolved when it was created. */
  executor?: RunExecutor;
  requiredCapabilities?: ExecutorRequirements;
  /** Deployment trust level when the run was admitted. */
  trustLevel?: TrustLevel;
  /** Deployment effect policy when the run was admitted; later deployment changes do not affect this run. */
  effectPolicy?: EffectPolicy;
  inputText?: string; resultText?: string; errorMessage?: string; inputTokens: number; outputTokens: number;
  costUsd?: number; createdUtc: string; startedUtc?: string; completedUtc?: string; depth: number; parentRunId?: string;
  cachedTokens?: number;
  /** Total reasoning tokens reported by the harness (0 when not reported). */
  reasoningTokens?: number;
  /** Number of tool calls the run made (0 when none). */
  toolCallCount?: number;
  /** UTC timestamp of the first model output event; absent when the run produced no output. */
  firstTokenUtc?: string | null;
  /** UTC timestamp of the last model output event; absent when the run produced no output. */
  lastTokenUtc?: string | null;
  /** Milliseconds from start to the first output event; absent when not measurable. */
  timeToFirstTokenMs?: number | null;
  /** Milliseconds between the first and last output events; absent when not measurable. */
  streamingMs?: number | null;
  /** Milliseconds from harness process start to exit; absent when not measurable. */
  executionMs?: number | null;
  /** Milliseconds from creation to start; absent when not measurable. */
  queueMs?: number | null;
  /** Milliseconds from queued to completed (server clock); absent when not measurable. */
  totalMs?: number | null;
  /**
   * Milliseconds the run spent waiting on child runs it started (delegation), measured from server timestamps of the
   * runs whose parentRunId is this run; absent when not measurable.
   */
  delegationWaitMs?: number | null;
  /** timeToFirstTokenMs minus the delegation wait that happened before the first token, never negative; absent when not measurable. */
  timeToFirstTokenExcludingDelegationMs?: number | null;
  /** Output tokens per second while streaming; always present, null when not measurable. */
  outputTokensPerSecond?: number | null;
  /** Model the harness reported serving the run; absent when the harness did not report one. */
  servedModel?: string | null;
  /**
   * W3C trace ID (32 lowercase hexadecimal characters) of the trace the run was created and compiled in, for finding
   * its spans in Tempo and its logs in Loki; null for runs created before trace IDs were recorded.
   */
  traceId?: string | null;
  /**
   * Computed by the server on read: why the queued run cannot be handed to any worker right now, or null when it is
   * not Queued or some Ready worker could run it.
   */
  blockedReason?: RunBlockedReason | null;
  /**
   * Whether the final output validated against the agent's output schema; null when the agent has no output schema or
   * nothing was validated.
   */
  outputSchemaValid?: boolean | null;
  /** The first few errors of the most recent failed schema validation, separated by "; "; null otherwise. */
  schemaValidationErrors?: string | null;
  /** Structured output repairs started for the run: 0 or 1. */
  repairAttempts?: number;
  /** Permission approvals of this run waiting for a person (read-only). */
  pendingApprovals?: number;
  /** True while pendingApprovals is above zero. The run stays Running. */
  awaitingApproval?: boolean;
  /** Total milliseconds spent waiting for approvals decided by a person or a timeout; null when it never waited. */
  approvalWaitMs?: number | null;
  /** Conversation this run is a turn of, or null for a run outside any conversation. */
  conversationId?: string | null;
  /** File space the run reads and writes (its conversation's space for a conversation turn), or null when it has none. */
  fileSpaceId?: string | null;
  /** Turn number within the conversation, starting at 1; 0 for runs outside a conversation. */
  conversationTurn?: number;
  /** Harness session this turn resumes on its affinity node, or null when the turn starts a new session. */
  resumeSessionId?: string | null;
  /** Node this turn prefers because it holds the conversation's directories, or null. */
  affinityNodeId?: string | null;
  /** End of the affinity wait (UTC); after it any capable node may claim the turn. Null when the run has no affinity. */
  affinityUntilUtc?: string | null;
  /** Why this turn started a fresh session from the transcript instead of resuming, or null. */
  conversationFallbackReason?: ConversationFallbackReason | null;
  /** Pipeline run this run is a stage of, or null for runs outside a pipeline. */
  pipelineRunId?: string | null;
  /** Position of the pipeline stage this run executes, starting at 1; 0 outside a pipeline. */
  pipelinePosition?: number;
  /** Execution number of the pipeline stage (retries, revisions, and resumes increase it); 0 outside a pipeline. */
  pipelineExecution?: number;
  /** Trigger that started this run (kind Trigger), or null. */
  triggerId?: string | null;
  /** Fan-out group this run is a member of, or null when it was not started by garrison_fan_out. */
  fanOutGroupId?: string | null;
}

/**
 * Why a conversation turn started a fresh harness session seeded with the transcript of the earlier turns instead of
 * resuming the conversation's session (Run.conversationFallbackReason, Conversation.lastFallbackReason).
 */
export const CONVERSATION_FALLBACK_REASONS = [
  "AffinityNodeLost", "AffinityWaitExpired", "WorkspaceLost", "SessionMissing", "HarnessChanged", "ResumeUnsupported",
  "ExecutorWithoutState"
] as const;

/** One of {@link CONVERSATION_FALLBACK_REASONS}. */
export type ConversationFallbackReason = typeof CONVERSATION_FALLBACK_REASONS[number];

/**
 * A multi-turn conversation with one agent. Each turn is a run; a follow-up turn resumes the harness session the earlier
 * turns built. Turns are serialized: a turn sent while another is unfinished fails with 409 ConversationBusy.
 */
export interface Conversation extends Json {
  /** Identifier (prefix cnv_). */
  id: string;
  tenantId: string; agentId: string; agentName: string;
  /** Deployment every turn runs on, chosen for the first turn. Empty until the first turn is created. */
  deploymentId: string;
  harnessType: string;
  /** Client-supplied A2A context identifier the conversation was created for, or null. */
  contextId?: string | null;
  /** Agentic app whose chat UI started the conversation, or null. */
  appId?: string | null;
  /** First line of the first turn's input (at most 200 characters), or null. */
  title?: string | null;
  callerType: string; callerId?: string | null; callerName?: string | null;
  /** Harness session the next turn resumes, or null before the first successful turn. */
  sessionId?: string | null;
  sessionHarnessProfileId?: string | null;
  /** Node holding the conversation's workspace and home directories, or null. */
  affinityNodeId?: string | null;
  affinityNodeName?: string | null;
  /** Run of the turn in progress (or the last one started); check busy to know whether it is unfinished. */
  activeRunId?: string | null;
  lastRunId?: string | null;
  /** Turns created (every run, whatever its outcome). */
  turnCount: number;
  /** Turns that fell back to the transcript instead of resuming. */
  fallbackCount: number;
  lastFallbackReason?: ConversationFallbackReason | null;
  lastFallbackUtc?: string | null;
  lastActivityUtc?: string | null;
  /** Computed on read: true while a turn is unfinished, so a new turn or a delete would get 409 ConversationBusy. */
  busy: boolean;
  active: boolean; isProtected: boolean; createdUtc: string; lastUpdateUtc: string;
}

/** Filters for GET /v1.0/api/tenants/{tenantId}/conversations. Every field is optional. */
export interface ConversationFilter {
  agentId?: string; contextId?: string; callerId?: string; search?: string;
  maxResults?: number; skip?: number; ordering?: string;
}

/**
 * Run outcome codes (Run.outcome). SchemaValidationFailed means the final output did not validate against the agent's
 * output schema, after the one repair attempt or at once when the harness cannot resume. PodFailed means the run pod of a
 * KubernetesJob run failed outside the harness (unschedulable, image pull, OOMKilled, evicted, or no completion).
 * ConversationStateLost means a conversation turn could not resume because its directories were gone on the affinity
 * node and the fallback requeue was not possible. AssetIntegrityFailed means a pinned agent asset file did not match its
 * recorded SHA-256 digest on the worker.
 */
export const RUN_OUTCOMES = [
  "None", "Succeeded", "HarnessFailed", "NotInstalled", "NotCredentialed", "McpPreflightFailed", "NodeLost",
  "OutputLimitExceeded", "SchemaValidationFailed", "TimedOut", "Cancelled", "StaleLease", "CompileFailed",
  "WorkspaceFailed", "Rejected", "NoCapableWorker", "InternalError",
  "RepetitionDetected", "NoProgress", "PodFailed", "ConversationStateLost", "AssetIntegrityFailed"
] as const;

/** One of {@link RUN_OUTCOMES}. */
export type RunOutcome = typeof RUN_OUTCOMES[number];

/**
 * Why a queued run cannot be handed to any worker right now. NoToolWorker: the run's agent uses a harness built-in
 * capability (such as pandoc) and no Ready worker that can run it reports that tool (node label garrison.io/tool-{name}=true).
 */
export type RunBlockedReason = "NoReadyWorker" | "NoCapableWorker" | "NoMatchingPool" | "NoIsolatingWorker" | "NoToolWorker";
/** Deployment and run trust level. Tenant requireUntrustedDeployments rejects Trusted deployments (TenantRequiresUntrusted). */
export type TrustLevel = "Trusted" | "Untrusted";
/** Protocol of a deployment egress rule. */
export type EgressProtocol = "TCP" | "UDP";

/**
 * One deployment egress allowlist rule. The server rejects an invalid CIDR (InvalidCidr), a port outside 1 to 65535
 * (PortOutOfRange), more than 64 rules (TooManyEgressRules), Process executor with rules (EgressRulesNeedKubernetesJob),
 * and Warm cold start with rules (EgressRulesNeedColdStart).
 */
export interface DeploymentEgressRule {
  /** Destination CIDR network address, for example "203.0.113.0/24" or "2001:db8::/32". Host names are not accepted. */
  cidr: string;
  /** Destination port, 1 to 65535; null or omitted allows every port. */
  port?: number | null;
  /** Protocol, default TCP. */
  protocol?: EgressProtocol;
}
/** Deployment and run effect policy: what happens to a started run whose worker was lost. Journaled requires a safe current-epoch checkpoint. */
export type EffectPolicy = "AtMostOnce" | "AtLeastOnce" | "Journaled";

/**
 * Health of a stored credential (Secret.status). NeedsReauthentication means the provider rejected a CodexAuthJson
 * login for good (refresh token reused, expired, or revoked): runs that bind it fail with outcome NotCredentialed and an
 * errorMessage starting "SecretNeedsReauthentication:" until the secret's value is replaced with a fresh login.
 */
export const SECRET_STATUSES = ["Ok", "NeedsReauthentication"] as const;

/** One of {@link SECRET_STATUSES}. */
export type SecretStatus = typeof SECRET_STATUSES[number];

/** Secret metadata. The value is write-only and never returned. */
export interface Secret extends Json {
  brokerResource?: string | null; brokerAudience?: string | null;
  id: string; tenantId: string; name: string; description?: string; kind: string; valueLast4?: string;
  fingerprint?: string; keyVersion: number; expiresUtc?: string; rotatedUtc?: string; active: boolean; isProtected: boolean;
  /** Ok, or NeedsReauthentication when the stored login must be replaced. */
  status: SecretStatus;
  /** Why the secret is in its current status (the provider error), or absent when Ok. */
  statusMessage?: string;
  /** When the status left Ok, or absent. */
  statusUtc?: string;
  /** When the control plane last refreshed this Codex login itself, or absent. */
  refreshedUtc?: string;
  /** Expiry of the stored ChatGPT access token (CodexAuthJson only), or absent. */
  accessTokenExpiresUtc?: string;
  createdUtc: string; lastUpdateUtc: string;
}

export interface RunEvent extends Json {
  id: string; runId: string; sequence: number; eventType: string; timestampUtc: string; text?: string;
  toolName?: string; toolCallId?: string; success?: boolean; inputTokens?: number; outputTokens?: number;
}

export interface RunStreamItem { name: string; data: string; event?: RunEvent; run?: Run; }

/**
 * Studio playground request. agentRevisionId defaults to the agent's open draft revision, else its latest published one
 * (agent route only). sourceDeploymentId names the deployment whose settings the playground copies; default the agent's
 * dev deployment, else its first one (agent route only). agent names the agent to run for a studio draft; default the
 * target app's entry agent. wait defaults to true; waitSeconds defaults to 120 and the server clamps it to 1 through 3600.
 */
export interface PlaygroundInvokeRequest {
  input: string; agent?: string; agentRevisionId?: string; sourceDeploymentId?: string; conversationId?: string;
  wait?: boolean; waitSeconds?: number;
}

/**
 * Compile preview options. agentRevisionId compiles with another revision of the agent, such as a draft (needs Read on
 * AgentRevision). environment compiles the same agent's deployment in that environment instead (400
 * NoDeploymentInEnvironment when there is none).
 */
export interface CompilePreviewOptions { agentRevisionId?: string; environment?: string; }

/** A compile preview with secret values redacted. deploymentId is the deployment compiled; agentRevisionId the revision used. */
export interface CompilePreviewResponse extends Json {
  spec: Json; commandLine: string; templateVersions: Json[]; deploymentId: string; agentRevisionId?: string | null;
}

export interface InvokeOptions {
  wait?: boolean; waitSeconds?: number; parameters?: Record<string, string>; deploymentId?: string; priority?: number;
  /** When waiting, cancel the run if the connection drops first (server default true). */
  cancelOnDisconnect?: boolean;
  /**
   * Continue this conversation: the run becomes its next turn. Rejects with GarrisonError 409 ConversationBusy while the
   * previous turn is unfinished (turns are refused, not queued) and 404 when the conversation does not exist.
   */
  conversationId?: string;
  /** Start a new conversation with this run as its first turn; the returned run's conversationId names it. */
  startConversation?: boolean;
  /** Input content type, for example "application/json" for a structured input. */
  inputContentType?: string;
}

export interface RunFilter {
  status?: string; agentId?: string; deploymentId?: string; harnessType?: string; nodeId?: string; parentRunId?: string;
  rootRunId?: string; outcome?: string; callerId?: string; fromUtc?: string | Date; toUtc?: string | Date;
  /** Only the turns of this conversation. */
  conversationId?: string;
  /** Only runs this trigger started. */
  triggerId?: string;
  maxResults?: number; skip?: number; ordering?: string;
}

/** Bucket size for run analytics. */
export type AnalyticsInterval = "minute" | "hour" | "day" | "week" | "auto";

/** Series grouping for run analytics. harnessModel keys each series "Harness|model" and labels it "Harness / model". */
export type AnalyticsGroupBy = "none" | "agent" | "harness" | "model" | "harnessModel";

/** Query for GET /v1.0/api/tenants/{tenantId}/analytics/runs. Every field is optional. */
export interface RunAnalyticsQuery {
  /** Range start (ISO 8601 UTC). */
  from?: string | Date;
  /** Range end (ISO 8601 UTC); must be after from. */
  to?: string | Date;
  interval?: AnalyticsInterval;
  agentId?: string;
  harnessType?: string;
  deploymentId?: string;
  /** Only runs whose served model equals this value; "unknown" matches runs without a recorded model. */
  model?: string;
  groupBy?: AnalyticsGroupBy;
}

/** Aggregated run metrics for a bucket or for the whole range. Averages and percentiles are null without samples. */
export interface RunAnalyticsMetrics {
  runs: number; succeeded: number; failed: number; cancelled: number; timedOut: number;
  inputTokens: number; outputTokens: number; cachedTokens: number; reasoningTokens: number; toolCalls: number;
  costUsd: number;
  timeToFirstTokenMsAvg: number | null; timeToFirstTokenMsP50: number | null; timeToFirstTokenMsP95: number | null;
  /** Time to first token excluding time spent waiting on delegated child runs. */
  timeToFirstTokenExcludingDelegationMsAvg: number | null;
  timeToFirstTokenExcludingDelegationMsP50: number | null;
  timeToFirstTokenExcludingDelegationMsP95: number | null;
  /** Average time runs spent waiting on child runs they started. */
  delegationWaitMsAvg: number | null;
  streamingMsAvg: number | null; executionMsAvg: number | null; executionMsP95: number | null;
  queueMsAvg: number | null; outputTokensPerSecondAvg: number | null;
}

/** One time bucket of run metrics. */
export interface RunAnalyticsBucket extends RunAnalyticsMetrics {
  /** Bucket start (ISO 8601 UTC). */
  startUtc: string;
}

/** One series: "all" for groupBy none, an agent ID for agent, a harness type for harness, a served model (or "unknown") for model, "Harness|model" for harnessModel. */
export interface RunAnalyticsSeries {
  key: string;
  label: string;
  buckets: RunAnalyticsBucket[];
}

/** Response from the run analytics endpoint. */
export interface RunAnalytics {
  fromUtc: string;
  toUtc: string;
  /** minute, hour, day, week, or auto when the chosen bucket matches none of those. */
  interval: string;
  /** Authoritative bucket size in seconds. */
  bucketSeconds: number;
  /** True when the 100,000-run cap was hit. */
  truncated: boolean;
  totals: RunAnalyticsMetrics;
  series: RunAnalyticsSeries[];
}

/** Query for GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions. Defaults to the last 24 hours. */
export interface RunAnalyticsDimensionsQuery {
  /** Range start (ISO 8601 UTC). */
  from?: string | Date;
  /** Range end (ISO 8601 UTC); must be after from. */
  to?: string | Date;
}

/** An agent with runs in the range. name falls back to the ID when the run did not record one. */
export interface RunAnalyticsAgentDimension { id: string; name: string; }

/** A deployment with runs in the range. name falls back to the ID when the deployment no longer exists. */
export interface RunAnalyticsDeploymentDimension { id: string; name: string; agentId: string; }

/** Distinct filter values among runs in a range. Lists are sorted by name. */
export interface RunAnalyticsDimensions {
  agents: RunAnalyticsAgentDimension[];
  /** Harness types, for example ClaudeCode or Generic. */
  harnesses: string[];
  deployments: RunAnalyticsDeploymentDimension[];
  /** Served models; "unknown" stands for runs without a recorded model. */
  models: string[];
  /** True when the 100,000-run cap was hit. */
  truncated: boolean;
}

/** One changed field of an Updated manifest item. Values are strings truncated to 200 characters; null when absent. */
export interface ManifestFieldChange {
  field: string;
  before?: string | null;
  after?: string | null;
}

/** Result for one manifest document. */
export interface ManifestApplyItem extends Json {
  position: number; kind: string; name: string;
  /** Created, Updated, Unchanged, Failed, or Validated. */
  result: string;
  resourceId?: string; message?: string;
  /** Stable code of a failed document, for example ManifestInvalid; absent otherwise. */
  errorCode?: string;
  /** Path of the field that failed, for example documents[1].spec.kind. */
  errorField?: string;
  /** Field-level changes for items that are (or, in a dry run, would be) Updated; empty or absent otherwise. */
  changes?: ManifestFieldChange[];
  /** Values in this document that were accepted but not stored as written (for example code ValueClamped); empty when there is nothing to report. */
  warnings?: FieldWarning[];
}

/** Result of a manifest apply or dry run. */
export interface ManifestApply extends Json {
  id: string; dryRun: boolean; failedCount: number;
  items: ManifestApplyItem[];
}

export class GarrisonError extends Error {
  readonly statusCode: number;
  readonly body: string;
  readonly error?: Json;

  constructor(statusCode: number, body: string) {
    let parsed: Json | undefined;
    try { parsed = body ? JSON.parse(body) : undefined; } catch { parsed = undefined; }
    super(`Garrison API returned ${statusCode}` + (parsed ? ` ${parsed.code ?? ""}: ${parsed.message ?? ""}` : body ? `: ${body.slice(0, 300)}` : ""));
    this.name = "GarrisonError";
    this.statusCode = statusCode;
    this.body = body;
    this.error = parsed;
  }

  get code(): string | undefined { return this.error?.code; }
  /** Field-level validation details keyed by field path, when the server returned them. */
  get fields(): Record<string, string> | undefined { return this.error?.fields; }
  /** Machine codes of validation errors keyed by field path (for example url: DestinationBlocked). */
  get fieldCodes(): Record<string, string> | undefined { return this.error?.fieldCodes; }
  /** Per-setting validation errors keyed by setting path (settings routes, HTTP 400). */
  get errors(): Record<string, string> | undefined { return this.error?.errors; }
}

type AuthMode = "none" | "token" | "keys" | "signed" | "admin";

function seg(value: string): string {
  if (!value) throw new Error("identifier is required");
  return encodeURIComponent(value);
}

function queryString(params?: Record<string, any>): string {
  if (!params) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    const text = value instanceof Date ? value.toISOString() : typeof value === "boolean" ? (value ? "true" : "false") : String(value);
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`);
  }
  return parts.join("&");
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function subtle(): Promise<SubtleCrypto> {
  const g: any = globalThis as any;
  if (g.crypto?.subtle) return g.crypto.subtle;
  // Node 18 does not expose globalThis.crypto by default; the variable specifier keeps bundlers and tsc from resolving it.
  const moduleName = "node:crypto";
  const nodeCrypto: any = await import(moduleName);
  return nodeCrypto.webcrypto.subtle;
}

function randomHex(bytes: number): string {
  const g: any = globalThis as any;
  const array = new Uint8Array(bytes);
  if (g.crypto?.getRandomValues) g.crypto.getRandomValues(array);
  else for (let i = 0; i < bytes; i++) array[i] = Math.floor(Math.random() * 256);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** HTTP transport: authentication, request signing, JSON, errors, and server-sent events. */
export class Transport {
  /** Optional cancellation for requests and streams, including interactive console Ctrl+C. */
  abortSignal?: AbortSignal;
  baseUrl: string;
  mode: AuthMode = "none";
  token?: string;
  accessKey?: string;
  secretKey?: string;
  adminApiKey?: string;
  tenantId?: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  tenantPath(suffix: string): string {
    if (!this.tenantId) throw new Error("Set tenantId on the client (or log in) before calling tenant-scoped APIs.");
    return `/v1.0/api/tenants/${seg(this.tenantId)}${suffix}`;
  }

  private async headers(method: string, path: string, query: string, body?: string | ArrayBuffer): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    if (this.mode === "token" && this.token) headers["Authorization"] = `Bearer ${this.token}`;
    else if (this.mode === "keys") { headers["x-access-key"] = this.accessKey ?? ""; headers["x-secret-key"] = this.secretKey ?? ""; }
    else if (this.mode === "admin") { headers["x-api-key"] = this.adminApiKey ?? ""; if (this.tenantId) headers["x-tenant-id"] = this.tenantId; }
    else if (this.mode === "signed") {
      const crypto = await subtle();
      const encoder = new TextEncoder();
      const date = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      const nonce = randomHex(16);
      const bodyHash = hex(await crypto.digest("SHA-256", typeof body === "string" ? encoder.encode(body) : (body ?? encoder.encode(""))));
      const canonical = [method.toUpperCase(), path, query, this.tenantId ?? "", date, nonce, bodyHash].join("\n");
      const key = await crypto.importKey("raw", encoder.encode(this.secretKey ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signature = hex(await crypto.sign("HMAC", key, encoder.encode(canonical)));
      headers["x-access-key"] = this.accessKey ?? "";
      headers["x-date"] = date;
      headers["x-nonce"] = nonce;
      headers["x-signature"] = signature;
      if (this.tenantId) headers["x-tenant-id"] = this.tenantId;
    }
    return headers;
  }

  private async send(method: string, path: string, params?: Record<string, any>, body?: unknown, contentType?: string, accept?: string, additionalHeaders?: Record<string, string>): Promise<Response> {
    const query = queryString(params);
    let text: string | ArrayBuffer | undefined;
    const extra: Record<string, string> = {};
    if (body !== undefined && body !== null) {
      text = body instanceof Uint8Array ? new Uint8Array(body).buffer : typeof body === "string" ? body : JSON.stringify(body);
      extra["Content-Type"] = body instanceof Uint8Array ? (contentType ?? "application/octet-stream") : typeof body === "string" ? (contentType ?? "application/json") : "application/json";
    }
    if (accept) extra["Accept"] = accept;
    if (additionalHeaders) Object.assign(extra, additionalHeaders);
    const headers = { ...extra, ...(await this.headers(method, path, query, text)) };
    const response = await fetch(this.baseUrl + path + (query ? `?${query}` : ""), { method, headers, body: text, signal: this.abortSignal });
    if (!response.ok) throw new GarrisonError(response.status, await response.text());
    return response;
  }

  /** Send a JSON request. additionalHeaders (for example Idempotency-Key) are sent as given. */
  async request<T = any>(method: string, path: string, params?: Record<string, any>, body?: unknown, contentType?: string, additionalHeaders?: Record<string, string>): Promise<T> {
    const response = await this.send(method, path, params, body, contentType, undefined, additionalHeaders);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async requestBytes(path: string, params?: Record<string, any>): Promise<Uint8Array> {
    return new Uint8Array(await (await this.send("GET", path, params)).arrayBuffer());
  }

  async requestText(method: string, path: string, params?: Record<string, any>, body?: unknown): Promise<string> {
    const response = await this.send(method, path, params, body);
    return response.text();
  }

  /** Yield server-sent events until the server closes the stream. */
  async *stream(path: string, params?: Record<string, any>): AsyncGenerator<{ event: string; id?: string; data: string }> {
    const response = await this.send("GET", path, params, undefined, undefined, "text/event-stream");
    if (!response.body) return;
    yield* readServerSentEvents(response.body);
  }
}

/** Parse a server-sent event stream into events until the body ends. */
async function* readServerSentEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; id?: string; data: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event: string | undefined;
  let id: string | undefined;
  let data: string[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf("\n")) >= 0) {
        let line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line === "") {
          if (data.length > 0 || event) yield { event: event ?? "message", id, data: data.join("\n") };
          event = undefined; id = undefined; data = [];
          continue;
        }
        if (line.startsWith(":")) continue;
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        let fieldValue = colon < 0 ? "" : line.slice(colon + 1);
        if (fieldValue.startsWith(" ")) fieldValue = fieldValue.slice(1);
        if (field === "event") event = fieldValue;
        else if (field === "id") id = fieldValue;
        else if (field === "data") data.push(fieldValue);
      }
    }
    if (data.length > 0) yield { event: event ?? "message", id, data: data.join("\n") };
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** Standard list, get, create, update, delete for a tenant-scoped collection. */
export class Resource<T = Json> {
  protected readonly t: Transport;
  private readonly segment: string;

  constructor(transport: Transport, segment: string) {
    this.t = transport;
    this.segment = segment;
  }

  protected base(): string { return this.t.tenantPath(`/${this.segment}`); }
  protected item(id: string): string { return `${this.base()}/${seg(id)}`; }

  list(query?: EnumerationQuery): Promise<EnumerationResult<T>> { return this.t.request("GET", this.base(), query as any); }
  get(id: string): Promise<T> { return this.t.request("GET", this.item(id)); }
  create(body: Partial<T> | Json): Promise<T> { return this.t.request("POST", this.base(), undefined, body); }
  update(id: string, body: Partial<T> | Json): Promise<T> { return this.t.request("PUT", this.item(id), undefined, body); }
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.item(id)); }
}

/** Collected files: metadata, binary transfers, and download-only links. */
export class Artifacts {
  constructor(private t: Transport) {}
  private base(): string { return this.t.tenantPath("/artifacts"); }
  private item(id: string): string { return `${this.base()}/${seg(id)}`; }
  list(query?: EnumerationQuery & { runId?: string; storeId?: string }): Promise<EnumerationResult<Artifact>> { return this.t.request("GET", this.base(), query as any); }
  get(id: string): Promise<Artifact> { return this.t.request("GET", this.item(id)); }
  download(id: string): Promise<Uint8Array> { return this.t.requestBytes(`${this.item(id)}/content`); }
  downloadUrl(id: string): Promise<ArtifactDownload> { return this.t.request("POST", `${this.item(id)}/download-url`); }
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.item(id)); }
  /** Upload only for an active run/epoch and configured store/glob. */
  upload(runId: string, storeId: string, name: string, content: Uint8Array, epoch: number, repairAttempt = 0, mediaType = "application/octet-stream"): Promise<Artifact> {
    return this.t.request("POST", this.t.tenantPath(`/runs/${seg(runId)}/artifacts`), { storeId, name, epoch, repairAttempt, mediaType }, content, "application/octet-stream");
  }
}

/** Agent assets addressed by identifier or name; versions by number. delete fails with 409 AssetInUse while a revision pins the asset. */
export class AgentAssets extends Resource<AgentAsset> {
  /** List assets, optionally filtered by kind. */
  list(query?: EnumerationQuery & { kind?: AgentAssetKind }): Promise<EnumerationResult<AgentAsset>> { return this.t.request("GET", this.base(), query as any); }
  /** Versions of an asset, newest first (a plain array). */
  listVersions(asset: string): Promise<AgentAssetVersion[]> { return this.t.request("GET", this.item(asset) + "/versions"); }
  /** Read one version by number. */
  getVersion(asset: string, number: number): Promise<AgentAssetVersion> { return this.t.request("GET", this.item(asset) + `/versions/${number}`); }
  /** Upload a new version; content is base64-encoded here. Identical files return the current version. */
  uploadVersion(asset: string, files: AgentAssetUpload[], changeNote?: string): Promise<AgentAssetVersion> {
    const body = {
      changeNote,
      files: files.map((f) => ({ path: f.path, mediaType: f.mediaType, contentBase64: toBase64(typeof f.content === "string" ? new TextEncoder().encode(f.content) : f.content) })),
    };
    return this.t.request("POST", this.item(asset) + "/versions", undefined, body);
  }
  /** Upload a single-file version as raw bytes. */
  uploadRaw(asset: string, path: string, content: Uint8Array | string, mediaType?: string, changeNote?: string): Promise<AgentAssetVersion> {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    return this.t.request("POST", this.item(asset) + "/versions", { path, mediaType, changeNote }, bytes, "application/octet-stream");
  }
  /** Download one file of a version as bytes. */
  downloadFile(asset: string, number: number, path: string): Promise<Uint8Array> {
    return this.t.requestBytes(this.item(asset) + `/versions/${number}/files`, { path });
  }
}

/**
 * Capability catalog: agents (from their latest published revision), MCP server tools, and harness built-ins, plus
 * manual descriptors. get takes an ID (cap_...) or a name. create, update, and delete work on manual descriptors only;
 * derived ones fail with 409 CapabilityDerived. create and update fail with 400 InvalidJsonSchema for a schema that is
 * not JSON Schema and 409 NameConflict for a duplicate manual name.
 */
export class Capabilities extends Resource<CapabilityDescriptor> {
  /** List descriptors (every match in one page), ordered by kind and name. */
  list(query?: CapabilityListQuery): Promise<EnumerationResult<CapabilityDescriptor>> { return this.t.request("GET", this.base(), query as any); }
  /** Create a manual descriptor (201). */
  create(body: CapabilityDescriptorInput): Promise<CapabilityDescriptor> { return this.t.request("POST", this.base(), undefined, body); }
  /** Replace a manual descriptor's content. */
  update(id: string, body: CapabilityDescriptorInput): Promise<CapabilityDescriptor> { return this.t.request("PUT", this.item(id), undefined, body); }
  /** Refresh derived descriptors now, or only one MCP server's tools (404 when it names no active server). */
  refresh(mcpServerId?: string): Promise<CapabilityRefreshResult> { return this.t.request("POST", this.base() + "/refresh", { mcpServerId }); }
}

/**
 * Agentic apps: groups of agents behind one chat UI. list, get (identifier or name), create, update, and delete need
 * Read, Create, Update, and Delete on AgenticApp. An agent that belongs to an app cannot be deleted (409 AgentInUse).
 * End users reach an app through {@link AppGatewayClient}.
 */
export class Apps extends Resource<AgenticApp> {
  /** Each member's delegation policy derived from the graph, with drift against its latest published revision. */
  delegation(id: string): Promise<AppDelegationPlan> { return this.t.request("GET", this.item(id) + "/delegation"); }
  /**
   * Write the graph's policy into a draft revision of each drifting member (nothing is published). A member whose open
   * draft already changes its delegation another way is skipped with skippedReason DraftConflict.
   */
  applyDelegation(id: string): Promise<AppDelegationPlan> { return this.t.request("POST", this.item(id) + "/delegation"); }
  /** The app's revisions, newest first. */
  async revisions(id: string): Promise<AppRevision[]> { return (await this.t.request("GET", this.item(id) + "/revisions")) ?? []; }
  /**
   * Take a draft app revision pinning every member's latest published revision and copying the edges. Rejects with 409
   * NoPublishedRevision when a member has none.
   */
  createRevision(id: string, changeNote?: string): Promise<AppRevision> {
    return this.t.request("POST", this.item(id) + "/revisions", undefined, changeNote ? { changeNote } : {});
  }
  /** Read an app revision by identifier (apv_) or number. */
  getRevision(id: string, revision: string | number): Promise<AppRevision> {
    return this.t.request("GET", `${this.item(id)}/revisions/${seg(String(revision))}`);
  }
  /** Publish a draft app revision (identifier or number). Rejects with 409 RevisionPublished when it already is. */
  publishRevision(id: string, revision: string | number): Promise<AppRevision> {
    return this.t.request("POST", `${this.item(id)}/revisions/${seg(String(revision))}/publish`);
  }
  /**
   * Promote a published app revision between environments: every member's pin moves to every deployment of that member
   * in the target environment together, under one promotion record (roll back with promotions.rollback). Rejects with
   * 409 NoTargetDeployments naming a member without a deployment there. Needs Execute on Promotion for the target.
   */
  promote(id: string, request: AppPromotionRequest): Promise<PromotionRecord> {
    const body = { ...request, appRevision: request.appRevision === undefined ? undefined : String(request.appRevision) };
    return this.t.request("POST", this.item(id) + "/promote", undefined, body);
  }
}

/**
 * Studio drafts: manifest documents designed before anything changes in live configuration, applied only after a person
 * approves the DraftApply approval {@link StudioDrafts.requestApply} creates (decide it with approvals.decide). Every
 * change names the draft version you read and rejects with 409 DraftVersionConflict when the draft moved on, or 409
 * DraftNotOpen when it is not Open. Also reads and sets the prompt of architect deployments.
 */
export class StudioDrafts {
  constructor(private readonly t: Transport) {}
  private base(): string { return this.t.tenantPath("/studio/drafts"); }
  private item(id: string): string { return `${this.base()}/${seg(id)}`; }
  /** List drafts, newest change first. mine lists only your own. */
  list(query: StudioDraftListQuery = {}): Promise<EnumerationResult<StudioDraft>> { return this.t.request("GET", this.base(), query as any); }
  /** Start a draft, empty or from an existing app (fromApp) with everything it references. */
  create(request: StudioDraftCreateRequest = {}): Promise<StudioDraft> { return this.t.request("POST", this.base(), undefined, request); }
  /** Read a draft with its items and layout. */
  get(id: string): Promise<StudioDraft> { return this.t.request("GET", this.item(id)); }
  /** Discard a draft. A pending DraftApply approval is cancelled. */
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.item(id)); }
  /**
   * Create or replace one item at the version you read. document is one manifest document whose kind and name match
   * (400 DocumentMismatch otherwise); operation Delete needs no document.
   */
  putItem(id: string, kind: string, name: string, version: number, document: string, operation?: StudioDraftOperation): Promise<StudioDraft> {
    return this.t.request("PUT", `${this.item(id)}/items/${seg(kind)}/${seg(name)}`, undefined, { version, operation, document });
  }
  /** Remove one item at the version you read. */
  removeItem(id: string, kind: string, name: string, version: number): Promise<StudioDraft> {
    return this.t.request("DELETE", `${this.item(id)}/items/${seg(kind)}/${seg(name)}`, { version });
  }
  /** Compare each item with live configuration (a manifest dry run). */
  diff(id: string): Promise<StudioDraftDiff> { return this.t.request("GET", this.item(id) + "/diff"); }
  /** Validate the draft; the same comparison as diff. */
  validate(id: string): Promise<StudioDraftDiff> { return this.t.request("POST", this.item(id) + "/validate"); }
  /**
   * Ask a person to approve applying the draft at the version you read. Returns the DraftApply approval and moves the
   * draft to PendingApproval. Rejects with 400 DraftStale, DraftInvalid, or DraftEmpty.
   */
  requestApply(id: string, version: number): Promise<Approval> { return this.t.request("POST", this.item(id) + "/request-apply", undefined, { version }); }
  /** The draft's apps as a graph of apps, agents, and call edges. */
  graph(id: string): Promise<StudioGraph> { return this.t.request("GET", this.item(id) + "/graph"); }
  /** Apply one graph operation; member and edge operations rewrite the draft's AgenticApp item. */
  graphOperation(id: string, request: StudioGraphOperationRequest): Promise<StudioGraph> {
    return this.t.request("POST", this.item(id) + "/graph-operations", undefined, request);
  }
  /**
   * Try the draft in the playground: its document for request.agent (default the target app's entry agent) becomes that
   * agent's draft revision, then runs on an ephemeral deployment in the draft environment. Live configuration does not
   * change. Needs Update on StudioDraft and on AgentRevision. Rejects with 400 AgentNotLive for an agent the draft creates.
   */
  playgroundInvoke(id: string, request: PlaygroundInvokeRequest): Promise<Run> {
    return this.t.request("POST", this.item(id) + "/playground/invoke", undefined, { wait: true, waitSeconds: 120, ...request });
  }
  /** Architect prompts: built-ins first, then tenant clones of them, then other tenant System templates. */
  async listArchitectPrompts(): Promise<ArchitectPromptEntry[]> { return (await this.t.request("GET", this.t.tenantPath("/studio/architect-prompts"))) ?? []; }
  /** The prompt an architect deployment (identifier or name) uses. */
  getArchitectPrompt(deploymentId: string): Promise<ArchitectPromptSelection> {
    return this.t.request("GET", this.t.tenantPath(`/studio/architects/${seg(deploymentId)}/prompt`));
  }
  /**
   * Choose the prompt an architect deployment uses (template identifier or name; version pins one, omitted follows the
   * current version). Takes effect on its next turn. Rejects with 400 NotAnArchitectDeployment or InvalidArchitectPrompt.
   */
  setArchitectPrompt(deploymentId: string, templateId: string, version?: number): Promise<ArchitectPromptSelection> {
    return this.t.request("PUT", this.t.tenantPath(`/studio/architects/${seg(deploymentId)}/prompt`), undefined, { architectPromptTemplateId: templateId, architectPromptVersion: version ?? null });
  }
}

/**
 * Client for an agentic app's end-user gateway at /v1.0/apps/{slug}/. It needs no management credentials: start a
 * session with an email and password, or anonymously when the app allows it, and the session token (prefix gas_) is
 * kept and sent as a bearer token. The token works only on this app's gateway and reaches only the conversations its
 * owner started (anything else is 404). Errors reject with {@link GarrisonError}: 401 InvalidCredentials,
 * AppSignInRequired, AnonymousDisabled, or an expired session; 403 AppAccessDenied; 409 AppNotDeployed,
 * ConversationBusy, or AppRateLimited.
 */
export class AppGatewayClient {
  /** Server base URL without a trailing slash. */
  readonly baseUrl: string;
  /** App URL name. */
  readonly slug: string;
  /** Session token sent as Authorization: Bearer; set by startSession and cleared by endSession. */
  token?: string;
  /** The last session started, or undefined. */
  session?: AppSessionResponse;
  /** Optional cancellation for requests and streams. */
  abortSignal?: AbortSignal;

  constructor(baseUrl: string, slug: string) {
    if (!slug) throw new Error("slug is required");
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.slug = slug;
  }

  private path(suffix = ""): string { return `/v1.0/apps/${seg(this.slug)}${suffix}`; }
  private conversationPath(id: string, suffix = ""): string { return this.path(`/conversations/${seg(id)}${suffix}`); }

  private async request(method: string, path: string, params?: Record<string, any>, body?: unknown, headers: Record<string, string> = {}): Promise<Response> {
    const query = queryString(params);
    const all: Record<string, string> = { ...headers };
    if (this.token) all["Authorization"] = `Bearer ${this.token}`;
    let text: string | undefined;
    if (body !== undefined) { text = JSON.stringify(body); all["Content-Type"] = "application/json"; }
    const response = await fetch(this.baseUrl + path + (query ? `?${query}` : ""), { method, headers: all, body: text, signal: this.abortSignal });
    if (!response.ok) throw new GarrisonError(response.status, await response.text());
    return response;
  }

  private async json<T>(method: string, path: string, params?: Record<string, any>, body?: unknown): Promise<T> {
    const text = await (await this.request(method, path, params, body)).text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** Branding and how to sign in. Needs no session. */
  info(): Promise<AppInfo> { return this.json("GET", this.path()); }
  /** Absolute URL of the app's logo image (404 when the app has none). */
  logoUrl(): string { return this.baseUrl + this.path("/logo"); }
  /** The app's logo image bytes; rejects with 404 when the app has none. */
  async logo(): Promise<Uint8Array> { return new Uint8Array(await (await this.request("GET", this.path("/logo"))).arrayBuffer()); }

  /**
   * Start a session with an email and password, or with no credentials for an anonymous session (only when the app's
   * authMode is Anonymous and anonymous use is enabled). The token is kept for later calls.
   */
  async startSession(credentials?: { email: string; password: string }): Promise<AppSessionResponse> {
    const previous = this.token;
    this.token = undefined;
    try {
      const session = await this.json<AppSessionResponse>("POST", this.path("/session"), undefined, credentials ? { email: credentials.email, password: credentials.password } : undefined);
      this.token = session.token;
      this.session = session;
      return session;
    } catch (e) {
      this.token = previous;
      throw e;
    }
  }

  /** Sign out and forget the token. */
  async endSession(): Promise<void> {
    await this.request("DELETE", this.path("/session"));
    this.token = undefined;
    this.session = undefined;
  }

  /** The session owner's conversations in the app. */
  async conversations(): Promise<AppConversationView[]> { return (await this.json<AppConversationView[]>("GET", this.path("/conversations"))) ?? []; }
  /** Start a conversation with the app's entry agent on the live environment's entry deployment. */
  startConversation(message: string): Promise<AppConversationStart> { return this.json("POST", this.path("/conversations"), undefined, { message }); }
  /** One of the owner's conversations with its turns. */
  conversation(id: string): Promise<AppConversationView> { return this.json("GET", this.conversationPath(id)); }
  /** Send the next message; rejects with 409 ConversationBusy while the previous turn runs. */
  send(id: string, message: string): Promise<AppTurnView> { return this.json("POST", this.conversationPath(id, "/messages"), undefined, { message }); }

  /**
   * Stream a turn's visible events until turn.completed, calling onEvent for each. When the connection drops before
   * then, it reconnects and resumes after the last event id it saw (Last-Event-ID). Resolves with the completed turn.
   * HTTP errors reject at once; repeated connection failures reject after options.maxReconnects attempts.
   */
  async streamTurn(id: string, runId: string, onEvent: (event: AppTurnStreamEvent) => void | Promise<void>, options: AppTurnStreamOptions = {}): Promise<AppTurnView> {
    const maxReconnects = options.maxReconnects ?? 5;
    const delayMs = options.reconnectDelayMs ?? 1000;
    let lastEventId = options.lastEventId;
    let failures = 0;
    while (true) {
      let received = false;
      let failure: unknown = new Error("The turn stream closed before turn.completed.");
      try {
        const headers: Record<string, string> = { Accept: "text/event-stream" };
        if (lastEventId) headers["Last-Event-ID"] = lastEventId;
        const response = await this.request("GET", this.conversationPath(id, `/turns/${seg(runId)}/stream`), undefined, undefined, headers);
        if (response.body) {
          for await (const message of readServerSentEvents(response.body)) {
            received = true;
            if (message.id) lastEventId = message.id;
            if (message.event !== "turn.event" && message.event !== "turn.status" && message.event !== "turn.completed") continue;
            const data = message.data ? JSON.parse(message.data) : undefined;
            await onEvent({ event: message.event, id: message.id, data } as AppTurnStreamEvent);
            if (message.event === "turn.completed") return data as AppTurnView;
          }
        }
      } catch (e) {
        if (e instanceof GarrisonError || this.abortSignal?.aborted) throw e;
        failure = e;
      }
      failures = received ? 1 : failures + 1;
      if (failures > maxReconnects) throw failure;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  /**
   * Poll the conversation until the turn with runId reaches a terminal status or timeoutMs elapses (default 120000);
   * resolves with the turn as it stands then. Rejects when the turn is not listed before the timeout.
   */
  async waitForTurn(id: string, runId: string, timeoutMs = 120000, pollMs = 500): Promise<AppTurnView> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const view = await this.conversation(id);
      const turn = (view.turns ?? []).find((t) => t.runId === runId);
      if (turn && (TERMINAL_STATUSES.includes(turn.status) || Date.now() >= deadline)) return turn;
      if (Date.now() >= deadline) throw new Error(`Turn ${runId} was not listed in conversation ${id} before the timeout.`);
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }

  /**
   * Stream files.changed events for the conversation (the first lists every current file), calling onEvent for each.
   * Resolves when onEvent returns false, the server closes the stream, or abortSignal aborts (which rejects).
   */
  async streamFiles(id: string, onEvent: (event: AppFilesChanged) => boolean | void | Promise<boolean | void>): Promise<void> {
    const response = await this.request("GET", this.conversationPath(id, "/files/stream"), undefined, undefined, { Accept: "text/event-stream" });
    if (!response.body) return;
    const reader = readServerSentEvents(response.body);
    try {
      for await (const message of reader) {
        if (message.event !== "files.changed" || !message.data) continue;
        if ((await onEvent(JSON.parse(message.data) as AppFilesChanged)) === false) return;
      }
    } finally {
      await reader.return(undefined);
      await response.body.cancel().catch(() => undefined);
    }
  }

  /** List the conversation's files. */
  files(id: string): Promise<FileSpaceListing> { return this.json("GET", this.conversationPath(id, "/files")); }
  /** Read a file's content (the current version, or the given version). */
  async readFile(id: string, path: string, version?: number): Promise<Uint8Array> {
    return new Uint8Array(await (await this.request("GET", this.conversationPath(id, "/files/content"), { path, version })).arrayBuffer());
  }
  /** A file's versions, newest first. */
  fileVersions(id: string, path: string): Promise<ConversationFileVersion[]> { return this.json("GET", this.conversationPath(id, "/files/versions"), { path }); }
  /** A short-lived download URL for a file (the current version, or the given version). */
  downloadUrl(id: string, path: string, version?: number): Promise<FileDownloadUrl> {
    return this.json("POST", this.conversationPath(id, "/files/download-url"), { path, version });
  }
}

/**
 * Fan-out groups: child runs a run started with the garrison_fan_out MCP tool. Groups are only created by runs, so this
 * client reads and cancels them. A group that does not exist or belongs to another tenant fails with 404.
 */
export class FanOutGroups {
  constructor(private readonly t: Transport) {}
  private item(groupId: string): string { return this.t.tenantPath(`/fan-out-groups/${seg(groupId)}`); }
  /** List the fan-out groups a run started, oldest first (404 when the run does not exist). */
  async listByRun(runId: string): Promise<FanOutGroup[]> {
    return (await this.t.request("GET", this.t.tenantPath(`/runs/${seg(runId)}/fan-out-groups`))) ?? [];
  }
  /** Read a fan-out group with its members' state and results. */
  get(groupId: string): Promise<FanOutGroup> { return this.t.request("GET", this.item(groupId)); }
  /** Cancel a fan-out group; members still running are cancelled. Returns the group as it stands afterwards. */
  cancel(groupId: string): Promise<FanOutGroup> { return this.t.request("POST", this.item(groupId) + "/cancel"); }
}

/**
 * Conversation file spaces: versioned files shared by a conversation's turns. Every method takes the owner
 * ("conversations" or "runs") and the conversation or run ID. Errors: 400 InvalidFilePath, 404,
 * 413 FileTooLarge / FileSpaceFull / TooManyFiles.
 */
export class FileSpaces {
  constructor(private readonly t: Transport) {}
  private files(owner: FileSpaceOwner, id: string): string {
    if (owner !== "conversations" && owner !== "runs") throw new Error(`owner must be "conversations" or "runs", got ${owner}`);
    return this.t.tenantPath(`/${owner}/${seg(id)}/files`);
  }
  /** List the files in the space. */
  list(owner: FileSpaceOwner, id: string, includeDeleted = false): Promise<FileSpaceListing> {
    return this.t.request("GET", this.files(owner, id), { includeDeleted: includeDeleted ? "true" : "false" });
  }
  /** Read a file's content as bytes (the current version unless version is given). */
  read(owner: FileSpaceOwner, id: string, path: string, version?: number): Promise<Uint8Array> {
    return this.t.requestBytes(this.files(owner, id) + "/content", { path, version });
  }
  /** Read a file's content decoded as UTF-8. */
  async readText(owner: FileSpaceOwner, id: string, path: string, version?: number): Promise<string> {
    return new TextDecoder().decode(await this.read(owner, id, path, version));
  }
  /** Versions of a file, newest first. */
  versions(owner: FileSpaceOwner, id: string, path: string): Promise<ConversationFileVersion[]> {
    return this.t.request("GET", this.files(owner, id) + "/versions", { path });
  }
  /** Write a file. String content is sent as text, bytes as base64. A stale baseVersion writes under a conflict name and returns conflict true. */
  write(owner: FileSpaceOwner, id: string, path: string, content: Uint8Array | string, options: FileSpaceWriteOptions = {}): Promise<FileSpaceUploadResult> {
    const body = typeof content === "string"
      ? { path, content, mediaType: options.mediaType, baseVersion: options.baseVersion }
      : { path, contentBase64: toBase64(content), mediaType: options.mediaType, baseVersion: options.baseVersion };
    return this.t.request("POST", this.files(owner, id), undefined, body);
  }
  /** Write a file as a raw application/octet-stream body (strings are UTF-8 encoded). */
  writeRaw(owner: FileSpaceOwner, id: string, path: string, content: Uint8Array | string, options: FileSpaceWriteOptions = {}): Promise<FileSpaceUploadResult> {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    return this.t.request("POST", this.files(owner, id), { path, mediaType: options.mediaType, baseVersion: options.baseVersion }, bytes, "application/octet-stream");
  }
  /** Delete a file (204). */
  delete(owner: FileSpaceOwner, id: string, path: string): Promise<void> {
    return this.t.request("DELETE", this.files(owner, id), { path });
  }
  /** Issue a short-lived download-only URL that needs no credentials. */
  downloadUrl(owner: FileSpaceOwner, id: string, path: string, version?: number): Promise<FileDownloadUrl> {
    return this.t.request("POST", this.files(owner, id) + "/download-url", { path, version });
  }
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    out += BASE64_ALPHABET[a >> 2] + BASE64_ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? "=" : BASE64_ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? "=" : BASE64_ALPHABET[c & 63];
  }
  return out;
}

/** Daily UTC quotas and accounting. Null limits are unlimited; zero disallows usage only when enforcement is enabled. */
export interface UsageQuota extends Json {
  /** False by default. Limits apply only when this and active are true. */
  enforcementEnabled?: boolean;
  id: string; tenantId: string; name: string; description?: string | null;
  scope: "Tenant" | "Agent" | "Deployment"; resourceId: string;
  dailyRunLimit?: number | null; dailyTokenLimit?: number | null;
  dailyCostUsdLimit?: number | null; maxConcurrentRuns?: number | null;
  active: boolean; isProtected: boolean; createdUtc: string; lastUpdateUtc: string;
}
export interface UsageQuotaUsage extends Json {
  quotaId: string; windowStartUtc: string; windowEndUtc: string;
  runsUsed: number; tokensUsed: number; costUsd: number; unknownCostRuns: number; activeRuns: number; costAccountingComplete: boolean;
}
export class UsageQuotas extends Resource<UsageQuota> {
  usage(id: string): Promise<UsageQuotaUsage> { return this.t.request("GET", this.item(id) + "/usage"); }
}

export class Users extends Resource {
  permissions(id: string): Promise<Json> { return this.t.request("GET", this.item(id) + "/permissions"); }
}

export class Credentials extends Resource {
  /** create() returns { credential, accessKey, secretKey }; the secret is shown only once. */
  rotate(id: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/rotate"); }
  permissions(id: string): Promise<Json> { return this.t.request("GET", this.item(id) + "/permissions"); }
}

export class Roles extends Resource {
  clone(id: string, name: string, description?: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/clone", undefined, { name, description }); }
}

export class Agents extends Resource<Agent> {
  /** Invoke an agent by identifier or name. With wait (default true) the finished run returns when it completes in time. */
  invoke(agent: string, input: string, options: InvokeOptions = {}): Promise<Run> {
    return this.t.request("POST", this.item(agent) + "/invoke", undefined, {
      input, wait: options.wait ?? true, waitSeconds: options.waitSeconds ?? 60, parameters: options.parameters ?? {},
      deploymentId: options.deploymentId, priority: options.priority ?? 0, cancelOnDisconnect: options.cancelOnDisconnect,
      conversationId: options.conversationId, startConversation: options.startConversation,
      inputContentType: options.inputContentType,
    });
  }
  /**
   * Run an agent's revision (identifier or name) in the studio playground, on an ephemeral copy of one of its
   * deployments in the reserved draft environment. The run has kind Playground. Needs Execute on Agent.
   */
  playgroundInvoke(agent: string, request: PlaygroundInvokeRequest): Promise<Run> {
    return this.t.request("POST", this.item(agent) + "/playground/invoke", undefined, { wait: true, waitSeconds: 120, ...request });
  }
  card(id: string): Promise<Json> { return this.t.request("GET", this.item(id) + "/card"); }
  register(agent: Partial<Agent>): Promise<Agent> { return this.t.request("POST", this.base() + "/register", undefined, agent); }
  /** Revisions of an agent (identifier or name), newest first. */
  listRevisions(agent: string, query?: EnumerationQuery): Promise<EnumerationResult<AgentRevision>> {
    return this.t.request("GET", this.item(agent) + "/revisions", query as any);
  }
  /** Create or replace the agent's single open draft revision. */
  saveDraft(agent: string, content: Partial<AgentRevision> | Json): Promise<AgentRevision> {
    return this.t.request("POST", this.item(agent) + "/revisions", undefined, content);
  }
  /** Read a revision by arv_ identifier or number. */
  getRevision(agent: string, revision: string | number): Promise<AgentRevision> {
    return this.t.request("GET", this.item(agent) + `/revisions/${seg(String(revision))}`);
  }
  /** Delete a revision (identifier or number). */
  deleteRevision(agent: string, revision: string | number): Promise<unknown> {
    return this.t.request("DELETE", this.item(agent) + `/revisions/${seg(String(revision))}`);
  }
  /** Publish a draft revision. */
  publishRevision(agent: string, revision: string | number, request: RevisionPublishRequest = {}): Promise<AgentRevision> {
    return this.t.request("POST", this.item(agent) + `/revisions/${seg(String(revision))}/publish`, undefined, request);
  }
  /** Field-level diff between two revisions (identifiers or numbers). */
  diffRevisions(agent: string, from: string | number, to: string | number): Promise<AgentRevisionDiff> {
    return this.t.request("GET", this.item(agent) + "/revisions/diff", { from: String(from), to: String(to) });
  }
}

/** Ordered tenant environments used by promotion. */
export class Environments {
  constructor(private t: Transport) {}
  get(): Promise<TenantEnvironmentList> { return this.t.request("GET", this.t.tenantPath("/environments")); }
  /** Replace the tenant's environment list. */
  update(list: TenantEnvironmentList): Promise<TenantEnvironmentList> { return this.t.request("PUT", this.t.tenantPath("/environments"), undefined, list); }
}

/** Promote agent revisions between environments, and roll promotions back. */
export class Promotions {
  constructor(private t: Transport) {}
  private base(): string { return this.t.tenantPath("/promotions"); }
  list(filter: EnumerationQuery & { agentId?: string; appId?: string } = {}): Promise<EnumerationResult<PromotionRecord>> { return this.t.request("GET", this.base(), filter as any); }
  get(id: string): Promise<PromotionRecord> { return this.t.request("GET", `${this.base()}/${seg(id)}`); }
  promote(request: PromotionRequest): Promise<PromotionRecord> { return this.t.request("POST", this.base(), undefined, request); }
  rollback(id: string, request: PromotionRollbackRequest = {}): Promise<PromotionRecord> {
    return this.t.request("POST", `${this.base()}/${seg(id)}/rollback`, undefined, request);
  }
}

export class Deployments extends Resource<Deployment> {
  /** Compile the deployment with sample input; secret values are redacted. options select another agent revision or environment. */
  compilePreview(id: string, input = "Hello from the compile preview.", parameters: Record<string, string> = {}, options: CompilePreviewOptions = {}): Promise<CompilePreviewResponse> {
    return this.t.request("POST", this.item(id) + "/compile-preview", undefined, { input, parameters, agentRevisionId: options.agentRevisionId, environment: options.environment });
  }
  test(id: string, input: string, options: InvokeOptions = {}): Promise<Run> {
    return this.t.request("POST", this.item(id) + "/test", undefined, {
      input, wait: options.wait ?? true, waitSeconds: options.waitSeconds ?? 60,
      conversationId: options.conversationId, startConversation: options.startConversation,
    });
  }
}

export class HarnessProfiles extends Resource<HarnessProfile> {
  builtin(): Promise<HarnessProfile[]> { return this.t.request("GET", "/v1.0/api/harness-profiles/builtin"); }
  clone(id: string, name: string): Promise<HarnessProfile> { return this.t.request("POST", this.item(id) + "/clone", undefined, { name }); }
}

export class PromptTemplates extends Resource {
  versions(id: string): Promise<Json[]> { return this.t.request("GET", this.item(id) + "/versions"); }
  version(id: string, version: number): Promise<Json> { return this.t.request("GET", this.item(id) + `/versions/${version}`); }
  restore(id: string, version: number): Promise<Json> { return this.t.request("POST", this.item(id) + `/restore/${version}`); }
  clone(id: string, name: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/clone", undefined, { name }); }
  reset(id: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/reset"); }
  render(id: string, context?: Json, deploymentId?: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/render", undefined, { context, deploymentId }); }
  renderContent(content: string, context?: Json): Promise<Json> { return this.t.request("POST", this.base() + "/render", undefined, { content, context }); }
}

export class McpServers extends Resource<McpServer> {
  test(id: string, nodeId?: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/test", { nodeId }); }
}

export class Secrets extends Resource {
  setValue(id: string, value: string): Promise<Json> { return this.t.request("PUT", this.item(id) + "/value", undefined, { value }); }
  rotate(id: string, value: string): Promise<Json> { return this.t.request("POST", this.item(id) + "/rotate", undefined, { value }); }
}

export class Manifests {
  constructor(private readonly t: Transport) {}
  /** Apply YAML or JSON manifests (multi-document). */
  apply(content: string, options: { dryRun?: boolean; allowSecretValues?: boolean } = {}): Promise<ManifestApply> {
    const trimmed = content.trimStart();
    const contentType = trimmed.startsWith("{") || trimmed.startsWith("[") ? "application/json" : "application/yaml";
    return this.t.request("POST", this.t.tenantPath("/manifests/apply"), { dryRun: options.dryRun ?? false, allowSecretValues: options.allowSecretValues ? true : undefined }, content, contentType);
  }
  /**
   * Export a multi-document YAML bundle that apply accepts unchanged. Secret values are never exported; the leading Bundle
   * document lists requiredSecrets, requiredArtifactStores, and requiredBuiltIns. Rejects with GarrisonError 400
   * (fieldCodes UnknownKind, InvalidSelector) or 404 when a selected resource does not exist.
   */
  export(options: ManifestExportOptions = {}): Promise<string> {
    return this.t.requestText("GET", this.t.tenantPath("/manifests/export"), {
      kinds: options.kinds && options.kinds.length > 0 ? options.kinds.join(",") : undefined,
      resources: options.resources && options.resources.length > 0 ? options.resources.join(",") : undefined,
      followReferences: options.followReferences ? true : undefined,
      includeBuiltIn: options.includeBuiltIn ? true : undefined,
    });
  }
  applies(query?: EnumerationQuery): Promise<EnumerationResult<Json>> { return this.t.request("GET", this.t.tenantPath("/manifests/applies"), query as any); }
  getApply(id: string): Promise<Json> { return this.t.request("GET", this.t.tenantPath(`/manifests/applies/${seg(id)}`)); }
}

export class Runs {
  pollIntervalMs = 500;
  constructor(private readonly t: Transport) {}
  private p(suffix = ""): string { return this.t.tenantPath("/runs" + suffix); }

  create(request: { input: string; agentId?: string; agentName?: string; deploymentId?: string; parameters?: Record<string, string>; priority?: number; wait?: boolean; waitSeconds?: number; cancelOnDisconnect?: boolean; conversationId?: string; startConversation?: boolean }): Promise<Run> {
    return this.t.request("POST", this.p(), undefined, { parameters: {}, ...request });
  }
  get(id: string): Promise<Run> { return this.t.request("GET", this.p(`/${seg(id)}`)); }
  /** Explain current placement without leasing or reserving capacity. */
  placement(id: string): Promise<RunPlacementResponse> { return this.t.request("GET", this.p(`/${seg(id)}/placement`)); }
  /** Read database statement totals by completed run lifecycle operation. */
  databaseUsage(id: string): Promise<RunDatabaseUsage[]> { return this.t.request("GET", this.p(`/${seg(id)}/database-usage`)); }
  operations(id: string): Promise<EffectOperation[]> { return this.t.request("GET", this.p(`/${seg(id)}/operations`)); }
  list(filter: RunFilter = {}): Promise<EnumerationResult<Run>> { return this.t.request("GET", this.p(), filter as any); }
  cancel(id: string): Promise<Run> { return this.t.request("POST", this.p(`/${seg(id)}/cancel`)); }
  retry(id: string): Promise<Run> { return this.t.request("POST", this.p(`/${seg(id)}/retry`)); }
  events(id: string, afterSequence = 0, limit = 500): Promise<{ runId: string; status: string; events: RunEvent[]; lastSequence: number; hasMore: boolean }> {
    return this.t.request("GET", this.p(`/${seg(id)}/events`), { afterSequence, limit });
  }
  /** Stream run events until the run finishes; the last item is run.completed carrying the final run. */
  async *stream(id: string, afterSequence = 0): AsyncGenerator<RunStreamItem> {
    for await (const message of this.t.stream(this.p(`/${seg(id)}/events/stream`), { afterSequence })) {
      const item: RunStreamItem = { name: message.event, data: message.data };
      if (message.event === "run.event") item.event = JSON.parse(message.data);
      else if (message.event === "run.completed") item.run = JSON.parse(message.data);
      yield item;
      if (message.event === "run.completed") return;
    }
  }
  children(id: string): Promise<EnumerationResult<Run>> { return this.t.request("GET", this.p(`/${seg(id)}/children`)); }
  /** A run's transcript as Markdown (secrets redacted). Rejects with GarrisonError 404 for an unknown run. */
  transcriptMarkdown(id: string, options: { includeThinking?: boolean } = {}): Promise<string> {
    return this.t.requestText("GET", this.p(`/${seg(id)}/transcript`), { format: "markdown", includeThinking: options.includeThinking ?? false });
  }
  /** A run's transcript as the typed JSON document. */
  transcript(id: string, options: { includeThinking?: boolean } = {}): Promise<Transcript> {
    return this.t.request("GET", this.p(`/${seg(id)}/transcript`), { format: "json", includeThinking: options.includeThinking ?? false });
  }
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.p(`/${seg(id)}`)); }
  async waitForCompletion(id: string, timeoutMs = 300000): Promise<Run> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const run = await this.get(id);
      if (TERMINAL_STATUSES.includes(run.status) || Date.now() >= deadline) return run;
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
  }
}

/**
 * Multi-turn conversations. Start one with startConversation on agents.invoke, runs.create, or deployments.test, and
 * continue it with conversationId.
 */
export class Conversations {
  constructor(private readonly t: Transport) {}
  private p(suffix = ""): string { return this.t.tenantPath("/conversations" + suffix); }

  /** List conversations, optionally filtered by agent, A2A context, caller, or search text. */
  list(filter: ConversationFilter = {}): Promise<EnumerationResult<Conversation>> { return this.t.request("GET", this.p(), filter as any); }
  /** Read a conversation. Rejects with GarrisonError 404 when it does not exist. */
  get(id: string): Promise<Conversation> { return this.t.request("GET", this.p(`/${seg(id)}`)); }
  /** Delete a conversation (its runs are kept). Rejects with GarrisonError 409 ConversationBusy while a turn is unfinished. */
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.p(`/${seg(id)}`)); }
  /** A conversation's turns (runs), oldest first. */
  listRuns(id: string, query: { maxResults?: number; skip?: number } = {}): Promise<EnumerationResult<Run>> {
    return this.t.request("GET", this.p(`/${seg(id)}/runs`), query as any);
  }
  /** A conversation's transcript (every turn, oldest first) as Markdown. */
  transcriptMarkdown(id: string, options: { includeThinking?: boolean } = {}): Promise<string> {
    return this.t.requestText("GET", this.p(`/${seg(id)}/transcript`), { format: "markdown", includeThinking: options.includeThinking ?? false });
  }
  /** A conversation's transcript (every turn, oldest first) as the typed JSON document. */
  transcript(id: string, options: { includeThinking?: boolean } = {}): Promise<Transcript> {
    return this.t.request("GET", this.p(`/${seg(id)}/transcript`), { format: "json", includeThinking: options.includeThinking ?? false });
  }
}

/** Permission approvals: list, read, decide, and approval check against a deployment's rules. */
export class Approvals {
  constructor(private readonly t: Transport) {}
  /** List approvals. For a pending count, pass { status: "Pending", maxResults: 1 } and read totalRecords. */
  list(filter: ApprovalFilter = {}): Promise<EnumerationResult<Approval>> { return this.t.request("GET", this.t.tenantPath("/approvals"), filter as any); }
  get(id: string): Promise<Approval> { return this.t.request("GET", this.t.tenantPath(`/approvals/${seg(id)}`)); }
  /** Decide a pending approval. Rejects with GarrisonError (409, ApprovalNotPending) when it was already decided. */
  decide(id: string, request: ApprovalDecideRequest): Promise<Approval> {
    return this.t.request("POST", this.t.tenantPath(`/approvals/${seg(id)}/decide`), undefined, request);
  }
  /** Evaluate a deployment's approval rules against a sample tool call without recording anything. */
  check(deploymentId: string, request: ApprovalCheckRequest): Promise<ApprovalCheckResponse> {
    return this.t.request("POST", this.t.tenantPath(`/deployments/${seg(deploymentId)}/approval-check`), undefined, request);
  }
}

/** Pipeline definitions (by identifier or name), start, and prompt preview. */
export class Pipelines extends Resource<Pipeline> {
  /**
   * Start a pipeline. Needs Pipeline Execute and Agent Execute on every stage agent. Rejects with GarrisonError 409
   * (PipelineInactive, PipelineEmpty, or IdempotencyKeyConflict when the key was used with a different input).
   */
  start(id: string, request: PipelineStartRequest, options: PipelineStartOptions = {}): Promise<PipelineRun> {
    const headers = options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : undefined;
    return this.t.request("POST", this.item(id) + "/start", undefined, request, undefined, headers);
  }
  /** Render each stage prompt from sample input and sample earlier outputs, with secrets redacted. */
  preview(id: string, request: PipelinePreviewRequest = {}): Promise<PipelinePreviewResponse> {
    return this.t.request("POST", this.item(id) + "/preview", undefined, request);
  }
}

/**
 * Triggers: cron schedules and signed webhooks that start an agent run or a pipeline run. Create and update need Execute
 * on the target; the trigger runs as the caller. signingSecret is returned only by create and rotateSecret.
 */
export class Triggers extends Resource<Trigger> {
  /** List triggers; type narrows to Cron or Webhook. */
  list(query?: EnumerationQuery & { type?: TriggerType }): Promise<EnumerationResult<Trigger>> { return this.t.request("GET", this.base(), query as any); }
  /** Replace a webhook trigger's signing secret; the new one is in signingSecret of the response only. */
  rotateSecret(id: string): Promise<Trigger> { return this.t.request("POST", this.item(id) + "/rotate-secret"); }
  /** Fire a trigger now; the optional payload reaches the input template as webhook.body. */
  fire(id: string, request: TriggerFireRequest = {}): Promise<TriggerFire> { return this.t.request("POST", this.item(id) + "/fire", undefined, request); }
  /** List a trigger's fires, newest first. */
  listFires(id: string, filter: { outcome?: TriggerFireOutcome; maxResults?: number; skip?: number } = {}): Promise<EnumerationResult<TriggerFire>> {
    return this.t.request("GET", this.item(id) + "/fires", filter as any);
  }
  /**
   * Deliver a signed webhook to a Webhook trigger as an external sender would (signed with signWebhook at the current time).
   * A repeated deliveryId returns the earlier fire with duplicate true. Rejects with GarrisonError 401 InvalidSignature,
   * 409 TriggerInactive, or 413.
   */
  async deliverWebhook(id: string, signingSecret: string, body: string | Uint8Array, options: { contentType?: string; deliveryId?: string } = {}): Promise<TriggerFire> {
    const bytes = webhookBytes(body);
    const headers: Record<string, string> = { [WEBHOOK_SIGNATURE_HEADER]: await signWebhook(signingSecret, Math.floor(Date.now() / 1000), bytes) };
    if (options.deliveryId) headers[WEBHOOK_DELIVERY_HEADER] = options.deliveryId;
    return this.t.request("POST", this.item(id) + "/webhook", undefined, bytes, options.contentType ?? "application/json", headers);
  }
}

/**
 * Notification endpoints: URLs that receive signed JSON notifications for run, pipeline, and approval events. Receivers check
 * each request with verifyWebhook and ignore repeated X-Garrison-Delivery values (delivery is at least once).
 */
export class NotificationEndpoints extends Resource<NotificationEndpoint> {
  /** Replace the signing secret; the new one is in signingSecret of the response only. */
  rotateSecret(id: string): Promise<NotificationEndpoint> { return this.t.request("POST", this.item(id) + "/rotate-secret"); }
  /** Send a test notification now; resolves with the delivery after its first attempt. */
  test(id: string): Promise<NotificationDelivery> { return this.t.request("POST", this.item(id) + "/test"); }
  /** List an endpoint's deliveries, newest first. */
  listDeliveries(id: string, filter: { status?: NotificationDeliveryStatus; maxResults?: number; skip?: number } = {}): Promise<EnumerationResult<NotificationDelivery>> {
    return this.t.request("GET", this.item(id) + "/deliveries", filter as any);
  }
  /** Read one delivery with its payload and last attempt. */
  getDelivery(id: string, deliveryId: string): Promise<NotificationDelivery> { return this.t.request("GET", this.item(id) + `/deliveries/${seg(deliveryId)}`); }
}

/** Pipeline runs: list, read (optionally waiting), cancel, resume, delete. */
export class PipelineRuns {
  pollIntervalMs = 500;
  constructor(private readonly t: Transport) {}
  private p(suffix = ""): string { return this.t.tenantPath("/pipeline-runs" + suffix); }
  list(filter: PipelineRunFilter = {}): Promise<EnumerationResult<PipelineRun>> { return this.t.request("GET", this.p(), filter as any); }
  /** Read a pipeline run with stages, stage runs, and reviews. waitSeconds (at most 600) waits until it ends or awaits a review. */
  get(id: string, waitSeconds?: number): Promise<PipelineRun> { return this.t.request("GET", this.p(`/${seg(id)}`), waitSeconds ? { waitSeconds } : undefined); }
  /** Cancel an active pipeline run. Rejects with GarrisonError 409 PipelineRunFinished when it already ended. */
  cancel(id: string): Promise<PipelineRun> { return this.t.request("POST", this.p(`/${seg(id)}/cancel`)); }
  /** Resume a Failed, TimedOut, or Cancelled pipeline run at its stopped stage. Rejects with 409 PipelineRunNotRetryable otherwise. */
  retry(id: string): Promise<PipelineRun> { return this.t.request("POST", this.p(`/${seg(id)}/retry`)); }
  /** Delete a finished pipeline run and its reviews. Rejects with 409 PipelineRunActive while it is active. */
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.p(`/${seg(id)}`)); }
  /** Poll until the pipeline run is terminal (or awaiting review when untilReview is true) or the timeout passes. */
  async waitFor(id: string, timeoutMs = 300000, untilReview = false): Promise<PipelineRun> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const run = await this.get(id);
      if (PIPELINE_TERMINAL_STATUSES.includes(run.status) || (untilReview && run.status === "AwaitingReview") || Date.now() >= deadline) return run;
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
  }
}

/** Pipeline stage reviews (authorized as Approval Read and Update). */
export class PipelineReviews {
  constructor(private readonly t: Transport) {}
  private p(suffix = ""): string { return this.t.tenantPath("/pipeline-reviews" + suffix); }
  list(filter: PipelineReviewFilter = {}): Promise<EnumerationResult<PipelineReview>> { return this.t.request("GET", this.p(), filter as any); }
  get(id: string): Promise<PipelineReview> { return this.t.request("GET", this.p(`/${seg(id)}`)); }
  /**
   * Decide a pending review. Rejects with GarrisonError 400 (RequestChanges without a comment) or 409 (ReviewNotPending,
   * RevisionLimitReached).
   */
  decide(id: string, request: PipelineReviewDecideRequest): Promise<PipelineReview> {
    return this.t.request("POST", this.p(`/${seg(id)}/decide`), undefined, request);
  }
}

/** Tenant analytics. */
export class Analytics {
  constructor(private readonly t: Transport) {}
  /** Aggregate run metrics over time. Rejects with GarrisonError (400) when from is not before to, the range needs more than 400 buckets, or a parameter is invalid. */
  runs(query: RunAnalyticsQuery = {}): Promise<RunAnalytics> { return this.t.request("GET", this.t.tenantPath("/analytics/runs"), query as any); }
  /** Distinct agents, harnesses, deployments, and served models among runs in a range, for analytics filters. Rejects with GarrisonError (400) when from is not before to. */
  dimensions(query: RunAnalyticsDimensionsQuery = {}): Promise<RunAnalyticsDimensions> { return this.t.request("GET", this.t.tenantPath("/analytics/runs/dimensions"), query as any); }
}

/** Platform-level collection (tenants, nodes, node pools). */
export class GlobalResource<T = Json> {
  constructor(protected readonly t: Transport, protected readonly path: string) {}
  list(query?: EnumerationQuery): Promise<EnumerationResult<T>> { return this.t.request("GET", this.path, query as any); }
  get(id: string): Promise<T> { return this.t.request("GET", `${this.path}/${seg(id)}`); }
  create(body: Json): Promise<T> { return this.t.request("POST", this.path, undefined, body); }
  update(id: string, body: Json): Promise<T> { return this.t.request("PUT", `${this.path}/${seg(id)}`, undefined, body); }
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", `${this.path}/${seg(id)}`); }
}

export class Nodes extends GlobalResource<WorkerNode> {
  cordon(id: string): Promise<Json> { return this.t.request("POST", `${this.path}/${seg(id)}/cordon`); }
  uncordon(id: string): Promise<Json> { return this.t.request("POST", `${this.path}/${seg(id)}/uncordon`); }
  drain(id: string): Promise<Json> { return this.t.request("POST", `${this.path}/${seg(id)}/drain`); }
}

/** Control-plane replicas (control nodes). Read-only: each replica maintains its own record. */
export class ControlNodes {
  constructor(private readonly t: Transport) {}
  list(query?: EnumerationQuery): Promise<ControlNodeListResponse> { return this.t.request("GET", "/v1.0/api/control-nodes", query as any); }
  get(id: string): Promise<ControlNode> { return this.t.request("GET", `/v1.0/api/control-nodes/${seg(id)}`); }
}

export class RequestHistory {
  constructor(private readonly t: Transport) {}
  list(filter: Json = {}): Promise<Json> { return this.t.request("GET", "/v1.0/api/request-history", filter); }
  summary(fromUtc: string | Date, toUtc: string | Date, bucketMinutes = 15): Promise<Json> { return this.t.request("GET", "/v1.0/api/request-history/summary", { fromUtc, toUtc, bucketMinutes }); }
  get(id: string): Promise<Json> { return this.t.request("GET", `/v1.0/api/request-history/${seg(id)}`); }
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", `/v1.0/api/request-history/${seg(id)}`); }
  deleteMany(filter: Json = {}): Promise<Json> { return this.t.request("DELETE", "/v1.0/api/request-history", filter); }
}

export class Audit {
  constructor(private readonly t: Transport) {}
  list(filter: Json = {}): Promise<Json> { return this.t.request("GET", this.t.tenantPath("/audit"), filter); }
  get(id: string): Promise<Json> { return this.t.request("GET", this.t.tenantPath(`/audit/${seg(id)}`)); }
  delete(id: string): Promise<unknown> { return this.t.request("DELETE", this.t.tenantPath(`/audit/${seg(id)}`)); }
  deleteMany(filter: Json = {}): Promise<Json> { return this.t.request("DELETE", this.t.tenantPath("/audit"), filter); }
}

export class Settings {
  constructor(private readonly t: Transport) {}
  get(): Promise<Json> { return this.t.request("GET", "/v1.0/api/settings"); }
  update(values: { path: string; value?: string | null }[]): Promise<Json> { return this.t.request("PUT", "/v1.0/api/settings", undefined, { values }); }
  restart(): Promise<Json> { return this.t.request("POST", "/v1.0/api/settings/restart"); }
  rotateMasterKey(): Promise<MasterKeyRotationResponse> { return this.t.request("POST", "/v1.0/api/settings/keys/rotate"); }
  testDatabase(): Promise<Json> { return this.t.request("POST", "/v1.0/api/settings/database/test"); }
}

/** Operator-configured USD rates for an exact tenant, harness, and served model. */
export interface ModelPrice extends Json {
  id: string; tenantId: string; name: string; model: string; harnessType: string;
  description?: string | null;
  inputUsdPerMillion: number; outputUsdPerMillion: number;
  cachedInputUsdPerMillion?: number | null; reasoningUsdPerMillion?: number | null;
  /** True when cached tokens are a subset of inputTokens; false for Claude Code cache reads. */
  inputIncludesCachedTokens: boolean;
  /** True when reasoning tokens are a subset of outputTokens. */
  outputIncludesReasoningTokens: boolean;
  active: boolean; isProtected: boolean; createdUtc: string; lastUpdateUtc: string;
}

/** Garrison API client. Authenticate, then use the module properties. */
export class GarrisonClient {
  readonly transport: Transport;
  readonly tenants: GlobalResource;
  readonly users: Users;
  readonly credentials: Credentials;
  readonly roles: Roles;
  readonly permissions: Resource;
  readonly rolePermissions: Resource;
  readonly userRoleAssignments: Resource;
  readonly credentialScopeAssignments: Resource;
  readonly agents: Agents;
  readonly deployments: Deployments;
  readonly environments: Environments;
  readonly promotions: Promotions;
  readonly agentAssets: AgentAssets;
  /** Conversation file spaces, addressed by conversation or run. */
  readonly fileSpaces: FileSpaces;
  /** Capability catalog: agents, MCP tools, and harness built-ins. */
  readonly capabilities: Capabilities;
  /** Fan-out groups: read and cancel the groups of child runs a run started with garrison_fan_out. */
  readonly fanOutGroups: FanOutGroups;
  /** Agentic apps: definitions, delegation plans, app revisions, and promotion. */
  readonly apps: Apps;
  /** Studio drafts and architect prompts. */
  readonly studioDrafts: StudioDrafts;
  readonly harnessProfiles: HarnessProfiles;
  readonly promptTemplates: PromptTemplates;
  readonly mcpServers: McpServers;
  readonly secrets: Secrets;
  readonly workspaceTemplates: Resource<WorkspaceTemplate>;
  readonly artifactStores: Resource<ArtifactStore>;
  readonly artifacts: Artifacts;
  readonly modelPrices: Resource<ModelPrice>;
  readonly usageQuotas: UsageQuotas;
  readonly manifests: Manifests;
  readonly runs: Runs;
  readonly conversations: Conversations;
  readonly approvals: Approvals;
  readonly pipelines: Pipelines;
  readonly pipelineRuns: PipelineRuns;
  readonly pipelineReviews: PipelineReviews;
  readonly triggers: Triggers;
  readonly notificationEndpoints: NotificationEndpoints;
  readonly analytics: Analytics;
  readonly nodes: Nodes;
  readonly controlNodes: ControlNodes;
  readonly nodePools: GlobalResource;
  readonly requestHistory: RequestHistory;
  readonly audit: Audit;
  readonly settings: Settings;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    const t = (this.transport = new Transport(baseUrl));
    this.tenants = new GlobalResource(t, "/v1.0/api/tenants");
    this.users = new Users(t, "users");
    this.credentials = new Credentials(t, "credentials");
    this.roles = new Roles(t, "roles");
    this.permissions = new Resource(t, "permissions");
    this.rolePermissions = new Resource(t, "role-permissions");
    this.userRoleAssignments = new Resource(t, "user-role-assignments");
    this.credentialScopeAssignments = new Resource(t, "credential-scope-assignments");
    this.agents = new Agents(t, "agents");
    this.deployments = new Deployments(t, "deployments");
    this.environments = new Environments(t);
    this.promotions = new Promotions(t);
    this.agentAssets = new AgentAssets(t, "agent-assets");
    this.fileSpaces = new FileSpaces(t);
    this.capabilities = new Capabilities(t, "capabilities");
    this.fanOutGroups = new FanOutGroups(t);
    this.apps = new Apps(t, "apps");
    this.studioDrafts = new StudioDrafts(t);
    this.harnessProfiles = new HarnessProfiles(t, "harness-profiles");
    this.promptTemplates = new PromptTemplates(t, "prompt-templates");
    this.mcpServers = new McpServers(t, "mcp-servers");
    this.secrets = new Secrets(t, "secrets");
    this.workspaceTemplates = new Resource<WorkspaceTemplate>(t, "workspace-templates");
    this.artifactStores = new Resource<ArtifactStore>(t, "artifact-stores");
    this.artifacts = new Artifacts(t);
    this.modelPrices = new Resource<ModelPrice>(t, "model-prices");
    this.usageQuotas = new UsageQuotas(t, "usage-quotas");
    this.manifests = new Manifests(t);
    this.runs = new Runs(t);
    this.conversations = new Conversations(t);
    this.approvals = new Approvals(t);
    this.pipelines = new Pipelines(t, "pipelines");
    this.pipelineRuns = new PipelineRuns(t);
    this.pipelineReviews = new PipelineReviews(t);
    this.triggers = new Triggers(t, "triggers");
    this.notificationEndpoints = new NotificationEndpoints(t, "notification-endpoints");
    this.analytics = new Analytics(t);
    this.nodes = new Nodes(t, "/v1.0/api/nodes");
    this.controlNodes = new ControlNodes(t);
    this.nodePools = new GlobalResource(t, "/v1.0/api/node-pools");
    this.requestHistory = new RequestHistory(t);
    this.audit = new Audit(t);
    this.settings = new Settings(t);
  }

  get tenantId(): string | undefined { return this.transport.tenantId; }
  set tenantId(value: string | undefined) { this.transport.tenantId = value; }

  /**
   * An end-user gateway client for the app with this slug, on the same server. It starts with no session and never
   * sends this client's management credentials.
   */
  appGateway(slug: string): AppGatewayClient { return new AppGatewayClient(this.transport.baseUrl, slug); }

  private async issue(body: Json): Promise<TokenResponse> {
    const previous = this.transport.mode;
    this.transport.mode = "none";
    try {
      const issued = await this.transport.request<TokenResponse>("POST", "/v1.0/token", undefined, body);
      this.useToken(issued.token, issued.tenantId);
      return issued;
    } catch (e) {
      this.transport.mode = previous;
      throw e;
    }
  }

  login(email: string, password: string, tenantId?: string): Promise<TokenResponse> { return this.issue({ email, password, tenantId }); }
  loginWithKeys(accessKey: string, secretKey: string): Promise<TokenResponse> { return this.issue({ accessKey, secretKey }); }
  useToken(token: string, tenantId?: string): void { Object.assign(this.transport, { mode: "token", token, tenantId }); }
  useAccessKey(accessKey: string, secretKey: string, tenantId: string): void { Object.assign(this.transport, { mode: "keys", accessKey, secretKey, tenantId }); }
  useSignedRequests(accessKey: string, secretKey: string, tenantId: string): void { Object.assign(this.transport, { mode: "signed", accessKey, secretKey, tenantId }); }
  useAdminApiKey(adminApiKey: string, tenantId?: string): void { Object.assign(this.transport, { mode: "admin", adminApiKey, tenantId }); }

  tokenDetails(): Promise<Json> { return this.transport.request("GET", "/v1.0/token/details"); }
  async refresh(): Promise<TokenResponse> {
    const issued = await this.transport.request<TokenResponse>("POST", "/v1.0/token/refresh");
    this.useToken(issued.token, issued.tenantId ?? this.tenantId);
    return issued;
  }
  async logout(): Promise<void> { await this.transport.request("DELETE", "/v1.0/token"); this.transport.mode = "none"; this.transport.token = undefined; }
  health(): Promise<Json> { return this.transport.request("GET", "/v1.0/api/health"); }
  serverInfo(): Promise<Json> { return this.transport.request("GET", "/v1.0/api/server-info"); }
  overview(): Promise<Json> { return this.transport.request("GET", this.transport.tenantPath("/overview")); }
  queueSummary(): Promise<Json[]> { return this.transport.request("GET", this.transport.tenantPath("/queue/summary")); }
}

export default GarrisonClient;
