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

export interface Agent extends Json {
  id: string; tenantId: string; name: string; displayName?: string; description?: string; kind?: string;
  delegationMode?: string; skills?: Json[]; tags?: string[];
}

/** How a worker executes a run: as a subprocess of the worker, or in its own Kubernetes Job (pod per run). */
export type RunExecutor = "Process" | "KubernetesJob";

/** Executors, in declaration order. */
export const RUN_EXECUTORS: readonly RunExecutor[] = ["Process", "KubernetesJob"] as const;
/** Deployment and run trustLevel values; Trusted is the default. */
export const TRUST_LEVELS: readonly TrustLevel[] = ["Trusted", "Untrusted"] as const;

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

export interface Deployment extends Json {
  id: string; tenantId: string; agentId: string; name: string; harnessProfileId: string; model?: string;
  /** Executor; null uses the node pool's defaultExecutor, then Process. */
  executor?: RunExecutor | null;
  requiredCapabilities?: ExecutorRequirements;
  /** Trust level, default Trusted. Untrusted runs need at least Container isolation (an unset executor resolves to KubernetesJob). */
  trustLevel?: TrustLevel;
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
export type ApprovalSource = "Rule" | "Default" | "User" | "Timeout" | "Cancelled";
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
}

/** A workspace template. persistentVolumeClaim names the claim for PersistentVolume workspaces. */
export interface WorkspaceTemplate extends Json {
  id: string; tenantId: string; name: string; kind: WorkspaceKind; persistentVolumeClaim?: string | null;
}

export interface HarnessProfile extends Json { id: string; name: string; harnessType: string; executable: string; }

export interface Run extends Json {
  id: string; tenantId: string; agentId: string; agentName: string; deploymentId: string; status: string; outcome: string;
  /** Executor the run needs, resolved when it was created. */
  executor?: RunExecutor;
  requiredCapabilities?: ExecutorRequirements;
  /** Deployment trust level when the run was admitted. */
  trustLevel?: TrustLevel;
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
 * node and the fallback requeue was not possible.
 */
export const RUN_OUTCOMES = [
  "None", "Succeeded", "HarnessFailed", "NotInstalled", "NotCredentialed", "McpPreflightFailed", "NodeLost",
  "OutputLimitExceeded", "SchemaValidationFailed", "TimedOut", "Cancelled", "StaleLease", "CompileFailed",
  "WorkspaceFailed", "Rejected", "NoCapableWorker", "InternalError",
  "RepetitionDetected", "NoProgress", "PodFailed", "ConversationStateLost"
] as const;

/** One of {@link RUN_OUTCOMES}. */
export type RunOutcome = typeof RUN_OUTCOMES[number];

/** Why a queued run cannot be handed to any worker right now. */
export type RunBlockedReason = "NoReadyWorker" | "NoCapableWorker" | "NoMatchingPool" | "NoIsolatingWorker";
/** Deployment and run trust level. Tenant requireUntrustedDeployments rejects Trusted deployments (TenantRequiresUntrusted). */
export type TrustLevel = "Trusted" | "Untrusted";

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
}

export interface RunFilter {
  status?: string; agentId?: string; deploymentId?: string; harnessType?: string; nodeId?: string; parentRunId?: string;
  rootRunId?: string; outcome?: string; callerId?: string; fromUtc?: string | Date; toUtc?: string | Date;
  /** Only the turns of this conversation. */
  conversationId?: string;
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

  async requestBytes(path: string): Promise<Uint8Array> {
    return new Uint8Array(await (await this.send("GET", path)).arrayBuffer());
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
    });
  }
  card(id: string): Promise<Json> { return this.t.request("GET", this.item(id) + "/card"); }
  register(agent: Partial<Agent>): Promise<Agent> { return this.t.request("POST", this.base() + "/register", undefined, agent); }
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

export class McpServers extends Resource {
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
  export(): Promise<string> { return this.t.requestText("POST", this.t.tenantPath("/manifests/export")); }
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

export class Nodes extends GlobalResource {
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
  readonly harnessProfiles: HarnessProfiles;
  readonly promptTemplates: PromptTemplates;
  readonly mcpServers: McpServers;
  readonly secrets: Secrets;
  readonly workspaceTemplates: Resource;
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
    this.harnessProfiles = new HarnessProfiles(t, "harness-profiles");
    this.promptTemplates = new PromptTemplates(t, "prompt-templates");
    this.mcpServers = new McpServers(t, "mcp-servers");
    this.secrets = new Secrets(t, "secrets");
    this.workspaceTemplates = new Resource(t, "workspace-templates");
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
