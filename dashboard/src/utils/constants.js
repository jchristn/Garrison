// Application-wide constants for the Garrison dashboard.

export const APP_VERSION = '0.1.0-alpha';

export const STORAGE_KEYS = {
  serverUrl: 'garrison_server_url',
  token: 'garrison_token',
  tenant: 'garrison_tenant',
  theme: 'garrison_theme',
  locale: 'garrison.locale',
  pageSize: 'garrison_page_size',
  columns: 'garrison_columns',
  apiExplorerHistory: 'garrison_api_explorer_history',
  setupDismissed: 'garrison_setup_dismissed',
  tourDone: 'garrison_tour_done',
  sidebarCollapsed: 'garrison_sidebar_collapsed',
  explainers: 'garrison_explainers_hidden',
  invokeStopOnLeave: 'garrison_invoke_stop_on_leave'
};

export const GITHUB_URL = 'https://github.com/jchristn/Garrison';

/** Default API URL: runtime config from /config.js, else the page origin (nginx or Vite proxy). */
export function defaultServerUrl() {
  const configured = typeof window !== 'undefined' ? window.GARRISON_CONFIG?.apiUrl : '';
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:8700';
}

// Development defaults pre-filled into the login form.
export const DEV_DEFAULTS = {
  tenantId: 'default',
  email: 'admin@garrison',
  accessKey: 'access_garrison_default'
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];
export const DEFAULT_PAGE_SIZE = 25;

// Auto-refresh interval options, in seconds. 0 disables.
export const AUTO_REFRESH_OPTIONS = [0, 5, 15, 30, 60, 120, 300];
export const DEFAULT_AUTO_REFRESH = 15;

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];

// Enumerations mirrored from Garrison.Core.Enums (string values on the wire).
export const ENUMS = {
  harnessType: ['ClaudeCode', 'Codex', 'Mux', 'GeminiCli', 'Generic', 'ProviderApi'],
  promptDelivery: ['Stdin', 'Argument', 'File', 'CodexAppServer'],
  systemPromptDelivery: ['File', 'Argument', 'Environment', 'PrependToPrompt', 'None'],
  mcpConfigFormat: ['None', 'ClaudeJson', 'CodexToml', 'MuxJson', 'GeminiSettings'],
  outputParser: ['ClaudeStreamJson', 'CodexJsonl', 'CodexAppServer', 'MuxJsonl', 'GeminiStreamJson', 'GenericJsonl', 'PlainText', 'ProviderApiJsonl'],
  resultSource: ['ParserFinalEvent', 'LastMessageFile', 'Stdout'],
  successPolicy: ['FinalEvent', 'ExitCode', 'FinalEventAndExitCode'],
  fileBaseDirectory: ['Config', 'Workspace', 'Home'],
  promptTemplateKind: ['System', 'Task', 'Fragment', 'ToolDescription', 'ConfigFile', 'Other'],
  mcpTransport: ['Http', 'Stdio'],
  secretKind: ['AnthropicApiKey', 'ClaudeCodeOAuthToken', 'OpenAiApiKey', 'CodexAuthJson', 'GeminiApiKey', 'GenericEnv', 'GenericFile', 'BearerToken', 'BasicAuth', 'GitCredential'],
  secretStatus: ['Ok', 'NeedsReauthentication'],
  workspaceKind: ['Empty', 'GitRepository', 'Seeded', 'PersistentVolume'],
  runExecutor: ['Process', 'KubernetesJob', 'RemoteA2A', 'RemoteMcp'],
  workspaceRetention: ['Delete', 'Keep', 'KeepOnFailure'],
  artifactStoreKind: ['Database', 'Filesystem', 'S3'],
  agentKind: ['Hosted', 'Remote'],
  agentInputMode: ['Text', 'Structured'],
  delegationMode: ['None', 'AllowList', 'Any'],
  remoteProtocol: ['A2A', 'Mcp'],
  resourceBindingKind: ['McpServer', 'Secret'],
  argumentOverrideOperation: ['Append', 'Prepend', 'Remove', 'Replace'],
  runOverrideValidation: ['Any', 'Enum', 'Regex', 'IntegerRange'],
  nodeStatus: ['Ready', 'Draining', 'Cordoned', 'Lost', 'Offline'],
  controlNodeStatus: ['Starting', 'Ready', 'Draining', 'Offline'],
  backplane: ['Local', 'Polling', 'PostgresNotify'],
  runStatus: ['Pending', 'Queued', 'Leased', 'Running', 'Cancelling', 'Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected', 'Suspended'],
  runOutcome: ['None', 'Succeeded', 'HarnessFailed', 'NotInstalled', 'NotCredentialed', 'McpPreflightFailed', 'NodeLost', 'OutputLimitExceeded', 'SchemaValidationFailed', 'TimedOut', 'Cancelled', 'StaleLease', 'CompileFailed', 'WorkspaceFailed', 'Rejected', 'InternalError', 'NoCapableWorker', 'RepetitionDetected', 'NoProgress', 'PodFailed', 'ConversationStateLost'],
  runBlockedReason: ['NoReadyWorker', 'NoCapableWorker', 'NoMatchingPool', 'NoIsolatingWorker'],
  // Deployment and run trust level (P11.14): Untrusted runs need at least Container isolation.
  trustLevel: ['Trusted', 'Untrusted'],
  // Deployment and run effect policy (P12.29): what happens to a started run whose worker is lost.
  effectPolicy: ['AtMostOnce', 'AtLeastOnce', 'Journaled'],
  conversationFallbackReason: ['AffinityNodeLost', 'AffinityWaitExpired', 'WorkspaceLost', 'SessionMissing', 'HarnessChanged', 'ResumeUnsupported', 'ExecutorWithoutState'],
  runEventType: ['Lifecycle', 'AssistantText', 'Thinking', 'ToolCall', 'ToolResult', 'Usage', 'Progress', 'Warning', 'Error', 'Stdout', 'Stderr', 'Result'],
  permissionType: ['Permit', 'Deny'],
  resourceScope: ['Tenant', 'Resource'],
  usageQuotaScope: ['Tenant', 'Agent', 'Deployment'],
  resourceType: ['All', 'Account', 'Tenant', 'Admin', 'User', 'Credential', 'Session', 'Role', 'Permission', 'Assignment', 'Audit', 'RequestHistory', 'Settings', 'HarnessProfile', 'PromptTemplate', 'Agent', 'Deployment', 'McpServer', 'Secret', 'Workspace', 'ArtifactStore', 'ModelPrice', 'UsageQuota', 'Run', 'Node', 'NodePool', 'Manifest', 'Conversation', 'Approval', 'Artifact', 'Pipeline', 'PipelineRun', 'Trigger', 'NotificationEndpoint'],
  operationType: ['All', 'Create', 'Read', 'Write', 'Update', 'Delete', 'Execute', 'Admin'],
  auditEventType: ['AuthSuccess', 'AuthFailure', 'SessionIssued', 'SessionRevoked', 'CredentialCreated', 'CredentialRotated', 'CredentialUsed', 'AuthorizationDenied', 'AuthorizationBypass', 'RoleChanged', 'PermissionChanged', 'AssignmentChanged', 'ConfigurationChanged', 'SecretChanged', 'SettingsChanged', 'RestartRequested', 'ManifestApplied', 'NodeRegistered', 'NodeStatusChanged', 'RunCancelled', 'ConversationDeleted', 'ApprovalDecided', 'PipelineReviewDecided', 'PipelineRunCancelled', 'SigningSecretRotated', 'QueueFull'],
  // Permission approvals (P12.3).
  approvalStatus: ['Pending', 'Approved', 'Denied', 'Expired', 'Cancelled'],
  approvalDecision: ['Allow', 'Deny'],
  approvalSource: ['Rule', 'Default', 'User', 'Timeout', 'Cancelled', 'DurableResume'],
  approvalRuleAction: ['Allow', 'Deny', 'Ask'],
  approvalKind: ['Tool', 'Command', 'FileChange'],
  // Pipelines (P12.9): ordered agent stages with optional review gates.
  pipelineRunStatus: ['Running', 'AwaitingReview', 'Cancelling', 'Succeeded', 'Failed', 'Cancelled', 'TimedOut'],
  pipelineRunOutcome: ['None', 'Succeeded', 'StageFailed', 'StageStartFailed', 'ReviewRejected', 'ReviewExpired', 'Cancelled', 'TimedOut', 'InternalError'],
  pipelineStageStatus: ['Pending', 'Running', 'AwaitingReview', 'Succeeded', 'Failed', 'Cancelled'],
  pipelineReviewStatus: ['Pending', 'Approved', 'ChangesRequested', 'Rejected', 'Expired', 'Cancelled'],
  pipelineReviewDecision: ['Approve', 'RequestChanges', 'Reject'],
  pipelineReviewSource: ['User', 'Timeout', 'Cancelled'],
  // Triggers (P12.5): cron schedules and signed webhooks that start runs or pipeline runs.
  triggerType: ['Cron', 'Webhook'],
  triggerTargetType: ['Agent', 'Pipeline'],
  triggerFireSource: ['Cron', 'Webhook', 'Manual'],
  triggerFireOutcome: ['Started', 'Failed', 'Skipped'],
  // Notifications (P12.14): outbound signed webhooks about runs, pipeline runs, and approvals.
  notificationEvent: ['RunSucceeded', 'RunFailed', 'RunCancelled', 'RunTimedOut', 'PipelineCompleted', 'PipelineFailed', 'ApprovalRequested', 'Test'],
  notificationDeliveryStatus: ['Pending', 'Delivering', 'Succeeded', 'Failed'],
  runKind: ['Invoke', 'Delegated', 'Test', 'Retry', 'Pipeline', 'Trigger'],
  credentialAuthMode: ['DirectHeader', 'SignedRequest', 'SessionExchange', 'Hybrid'],
  principalType: ['Administrator', 'User', 'Credential', 'Run']
};

export const TERMINAL_RUN_STATUSES = ['Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected'];

/** Semantic tone for a run status pill. */
export function runStatusTone(status) {
  switch (status) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
    case 'TimedOut':
    case 'Rejected':
      return 'danger';
    case 'Cancelled':
    case 'Cancelling':
      return 'warning';
    case 'Running':
    case 'Leased':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Semantic tone for an approval status pill: Pending needs a person, Approved and Denied are final verdicts. */
export function approvalStatusTone(status) {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'Approved':
      return 'success';
    case 'Denied':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Semantic tone for an approval decision or rule action pill (Allow, Deny, Ask). */
export function approvalActionTone(action) {
  switch (action) {
    case 'Allow':
      return 'success';
    case 'Deny':
      return 'danger';
    case 'Ask':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Approval timeout range in seconds (deployment approvalTimeoutSeconds), and the server default. */
export const APPROVAL_TIMEOUT = { min: 10, max: 3600, default: 300 };

/** How often the sidebar badge re-reads the pending approval count, in milliseconds, when no live push arrives. */
export const APPROVAL_POLL_MS = 30000;

/** Pipeline run statuses after which nothing changes unless someone retries the run (P12.9). */
export const TERMINAL_PIPELINE_RUN_STATUSES = ['Succeeded', 'Failed', 'Cancelled', 'TimedOut'];

/** Pipeline run statuses POST pipeline-runs/{id}/retry accepts: it resumes at the stage where the run stopped. */
export const RETRYABLE_PIPELINE_RUN_STATUSES = ['Failed', 'TimedOut', 'Cancelled'];

/**
 * Pipeline definition ranges, matching the server's validation (P12.9). Durations are seconds; 0 means no limit for
 * maxDurationSeconds and wait indefinitely for reviewTimeoutSeconds. maxStages is the default of the cluster setting
 * Runtime.PipelineMaxStages; the server enforces the configured value.
 */
export const PIPELINE_LIMITS = {
  maxDurationSeconds: { min: 0, max: 2592000, default: 0 },
  outputCharLimit: { min: 1000, max: 200000, default: 16000 },
  maxAttempts: { min: 1, max: 5, default: 1 },
  reviewTimeoutSeconds: { min: 0, max: 2592000, default: 0 },
  maxRevisions: { min: 0, max: 10, default: 3 },
  maxStages: 20,
  commentMax: 8000
};

/** How often (ms) a pipeline run page re-reads the run while it is unfinished and no live push arrives. */
export const PIPELINE_RUN_POLL_MS = 3000;

/** Semantic tone for a pipeline run status pill. */
export function pipelineRunStatusTone(status) {
  switch (status) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
    case 'TimedOut':
      return 'danger';
    case 'Cancelled':
    case 'Cancelling':
    case 'AwaitingReview':
      return 'warning';
    case 'Running':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Semantic tone for a pipeline stage status pill. */
export function pipelineStageStatusTone(status) {
  switch (status) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
      return 'danger';
    case 'Cancelled':
    case 'AwaitingReview':
      return 'warning';
    case 'Running':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Semantic tone for a pipeline review status pill: Pending needs a person. */
export function pipelineReviewStatusTone(status) {
  switch (status) {
    case 'Pending':
    case 'ChangesRequested':
      return 'warning';
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Semantic tone for a pipeline review decision pill. */
export function pipelineReviewDecisionTone(decision) {
  switch (decision) {
    case 'Approve':
      return 'success';
    case 'Reject':
      return 'danger';
    case 'RequestChanges':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Events a notification endpoint can subscribe to (Test is only sent by the test action). */
export const SUBSCRIBABLE_NOTIFICATION_EVENTS = ['RunSucceeded', 'RunFailed', 'RunCancelled', 'RunTimedOut', 'PipelineCompleted', 'PipelineFailed', 'ApprovalRequested'];

/** Trigger and notification endpoint ranges, matching the server's validation (P12.5, P12.14). */
export const TRIGGER_LIMITS = {
  priority: { min: -100, max: 100, default: 0 },
  resultTextMaxChars: { min: 1, max: 16000, default: 1000 },
  descriptionMax: 4000
};

/** Semantic tone for a trigger fire outcome pill. */
export function triggerFireOutcomeTone(outcome) {
  switch (outcome) {
    case 'Started':
      return 'success';
    case 'Failed':
      return 'danger';
    case 'Skipped':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Semantic tone for a notification delivery status pill. */
export function notificationDeliveryStatusTone(status) {
  switch (status) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
      return 'danger';
    case 'Delivering':
      return 'info';
    case 'Pending':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Semantic tone for a node status pill. */
export function nodeStatusTone(status) {
  switch (status) {
    case 'Ready':
      return 'success';
    case 'Draining':
    case 'Cordoned':
      return 'warning';
    case 'Lost':
    case 'Offline':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Semantic tone for a control node (control-plane replica) status pill. */
export function controlNodeStatusTone(status) {
  switch (status) {
    case 'Ready':
      return 'success';
    case 'Starting':
      return 'info';
    case 'Draining':
      return 'warning';
    case 'Offline':
      return 'danger';
    default:
      return 'neutral';
  }
}

/**
 * Chart range presets. Bucket sizes and counts are exact: Last Hour 60 x 1 minute, Last Day 96 x 15 minutes,
 * Last Week 84 x 2 hours, Last Month 120 x 6 hours.
 */
export const REQUEST_RANGES = {
  hour: { id: 'hour', bucketMinutes: 1, bucketCount: 60, windowMs: 60 * 60 * 1000 },
  day: { id: 'day', bucketMinutes: 15, bucketCount: 96, windowMs: 24 * 60 * 60 * 1000 },
  week: { id: 'week', bucketMinutes: 120, bucketCount: 84, windowMs: 7 * 24 * 60 * 60 * 1000 },
  month: { id: 'month', bucketMinutes: 360, bucketCount: 120, windowMs: 30 * 24 * 60 * 60 * 1000 }
};

/** Compute { fromUtc, toUtc, bucketMinutes } for a chart range preset. */
export function requestRangeToParams(rangeId, now = new Date()) {
  const range = REQUEST_RANGES[rangeId] || REQUEST_RANGES.day;
  const from = new Date(now.getTime() - range.windowMs);
  return { fromUtc: from.toISOString(), toUtc: now.toISOString(), bucketMinutes: range.bucketMinutes };
}

/** Sample manifest applied by the setup wizard: a fake-harness agent that needs no credentials. */
export const SAMPLE_MANIFEST = `apiVersion: garrison/v1
kind: Agent
metadata:
  name: echo-agent
spec:
  displayName: Echo Agent
  description: Sample agent backed by the built-in fake harness. Echoes its input.
  exposure: { a2a: true, mcpTool: false }
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: echo-agent-default
spec:
  agent: echo-agent
  harnessProfile: builtin/fake
  timeoutSeconds: 120
`;
