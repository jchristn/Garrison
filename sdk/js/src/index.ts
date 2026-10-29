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
}

/** State of a permission approval. Pending is the only state that can change. */
export type ApprovalStatus = "Pending" | "Approved" | "Denied" | "Expired" | "Cancelled";
/** What the harness is told. */
export type ApprovalDecision = "Allow" | "Deny";
/** Who or what decided an approval. */
export type ApprovalSource = "Rule" | "Default" | "User" | "Timeout" | "Cancelled" | "DurableResume";
/** Action of an approval rule or of the deployment default. */
export type ApprovalRuleAction = "Allow" | "Deny" | "Ask";
/** Where a permission request came from: a Claude Code tool call, a Codex command (evaluated as Bash), or a Codex file change (evaluated as Edit). */
export type ApprovalKind = "Tool" | "Command" | "FileChange";

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

export interface HarnessProfile extends Json, WithWarnings { id: string; name: string; harnessType: string; executable: string; sessionFormat?: string | null; }

/** An MCP server definition. */
export interface McpServer extends Json, WithWarnings {
  id: string; tenantId: string; name: string; transport: string; toolTimeoutSeconds?: number;
}

export type RunStatus = "Queued" | "Leased" | "Running" | "Cancelling" | "Succeeded" | "Failed" | "Cancelled" | "TimedOut" | "Rejected" | "Suspended";
export const RUN_STATUSES: readonly RunStatus[] = ["Queued", "Leased", "Running", "Cancelling", "Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected", "Suspended"] as const;
export const QUEUE_FULL_ERROR = "QueueFull" as const;
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

/** Why a queued run cannot be handed to any worker right now. */
export type RunBlockedReason = "NoReadyWorker" | "NoCapableWorker" | "NoMatchingPool" | "NoIsolatingWorker";
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
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let event: string | undefined;
    let id: string | undefined;
    let data: string[] = [];
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
  compilePreview(id: string, input = "Hello from the compile preview.", parameters: Record<string, string> = {}): Promise<Json> {
    return this.t.request("POST", this.item(id) + "/compile-preview", undefined, { input, parameters });
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
