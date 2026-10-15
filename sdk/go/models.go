package garrison

import "encoding/json"

// TerminalStatuses lists run statuses that will not change again.
var TerminalStatuses = []string{"Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected"}

// IsTerminal reports whether status is terminal.
func IsTerminal(status string) bool {
	for _, s := range TerminalStatuses {
		if s == status {
			return true
		}
	}
	return false
}

// Run outcome codes (Run.Outcome). RunOutcomeSchemaValidationFailed means the final output did not validate
// against the agent's output schema, after the one repair attempt or at once when the harness cannot resume.
const (
	RunOutcomeNone                   = "None"
	RunOutcomeSucceeded              = "Succeeded"
	RunOutcomeHarnessFailed          = "HarnessFailed"
	RunOutcomeNotInstalled           = "NotInstalled"
	RunOutcomeNotCredentialed        = "NotCredentialed"
	RunOutcomeMcpPreflightFailed     = "McpPreflightFailed"
	RunOutcomeNodeLost               = "NodeLost"
	RunOutcomeOutputLimitExceeded    = "OutputLimitExceeded"
	RunOutcomeSchemaValidationFailed = "SchemaValidationFailed"
	RunOutcomeTimedOut               = "TimedOut"
	RunOutcomeCancelled              = "Cancelled"
	RunOutcomeStaleLease             = "StaleLease"
	RunOutcomeCompileFailed          = "CompileFailed"
	RunOutcomeWorkspaceFailed        = "WorkspaceFailed"
	RunOutcomeRejected               = "Rejected"
	RunOutcomeNoCapableWorker        = "NoCapableWorker"
	RunOutcomeInternalError          = "InternalError"
	RunOutcomeRepetitionDetected     = "RepetitionDetected"
	RunOutcomeNoProgress             = "NoProgress"
	// RunOutcomePodFailed means the run pod of a KubernetesJob run failed outside the harness (unschedulable,
	// image pull failure, OOMKilled, evicted, or exited without reporting a completion).
	RunOutcomePodFailed = "PodFailed"
	// RunOutcomeConversationStateLost means a conversation turn asked to resume a harness session on its affinity
	// node, but the conversation's directories were gone there and the fallback requeue was not possible.
	RunOutcomeConversationStateLost = "ConversationStateLost"
)

// Conversation fallback reasons (Run.ConversationFallbackReason, Conversation.LastFallbackReason): why a conversation
// turn started a fresh harness session seeded with the transcript of the earlier turns instead of resuming.
const (
	// ConversationFallbackAffinityNodeLost means the affinity node is no longer Ready, so another node took the turn.
	ConversationFallbackAffinityNodeLost = "AffinityNodeLost"
	// ConversationFallbackAffinityWaitExpired means the affinity node did not claim the turn within the affinity wait.
	ConversationFallbackAffinityWaitExpired = "AffinityWaitExpired"
	// ConversationFallbackWorkspaceLost means the conversation's directories were gone on the affinity node.
	ConversationFallbackWorkspaceLost = "WorkspaceLost"
	// ConversationFallbackSessionMissing means no earlier turn reported a harness session to resume.
	ConversationFallbackSessionMissing = "SessionMissing"
	// ConversationFallbackHarnessChanged means the deployment's harness profile changed since the session was recorded.
	ConversationFallbackHarnessChanged = "HarnessChanged"
	// ConversationFallbackResumeUnsupported means the deployment's harness profile does not support resume.
	ConversationFallbackResumeUnsupported = "ResumeUnsupported"
	// ConversationFallbackExecutorWithoutState means the run's executor keeps no state between runs (KubernetesJob).
	ConversationFallbackExecutorWithoutState = "ExecutorWithoutState"
)

// Run executors (Deployment.Executor, NodePool.DefaultExecutor, Run.Executor, Node.Executors).
const (
	// RunExecutorProcess runs the harness as a subprocess of the worker.
	RunExecutorProcess = "Process"
	// RunExecutorKubernetesJob runs the harness in its own Kubernetes Job (pod per run).
	RunExecutorKubernetesJob = "KubernetesJob"
)

// Trust levels (Deployment.TrustLevel, Run.TrustLevel). An empty Deployment.TrustLevel means TrustLevelTrusted.
const (
	// TrustLevelTrusted runs on any executor, including Process. The default.
	TrustLevelTrusted = "Trusted"
	// TrustLevelUntrusted needs at least Container isolation; an unset executor resolves to KubernetesJob and a run no
	// Ready worker can isolate stays Queued with BlockedReason "NoIsolatingWorker". A tenant with
	// requireUntrustedDeployments rejects Trusted deployments (field code TenantRequiresUntrusted).
	TrustLevelUntrusted = "Untrusted"
)

// Egress rule protocols (DeploymentEgressRule.Protocol). An empty Protocol means EgressProtocolTCP.
const (
	EgressProtocolTCP = "TCP"
	EgressProtocolUDP = "UDP"
)

// DeploymentEgressRule is one entry of a deployment's egress allowlist. With any rules, run pods reach only DNS, the
// Garrison MCP port, and the rules; an unset executor resolves to KubernetesJob and a run no Ready worker can enforce
// stays Queued with BlockedReason "NoIsolatingWorker". The server rejects an invalid CIDR (InvalidCidr), a port
// outside 1 to 65535 (PortOutOfRange), more than 64 rules (TooManyEgressRules), Process executor with rules
// (EgressRulesNeedKubernetesJob), and Warm cold start with rules (EgressRulesNeedColdStart).
type DeploymentEgressRule struct {
	// CIDR is the destination network address in CIDR notation, for example "203.0.113.0/24"; host names are not accepted.
	CIDR string `json:"cidr"`
	// Port is the destination port, 1 to 65535; nil allows every port.
	Port *int `json:"port,omitempty"`
	// Protocol is EgressProtocolTCP (the default when empty) or EgressProtocolUDP.
	Protocol string `json:"protocol,omitempty"`
}

// Effect policies (Deployment.EffectPolicy, Run.EffectPolicy): what happens to a run that was already Running when its
// worker was lost. An empty Deployment.EffectPolicy on create means EffectPolicyAtMostOnce. The deprecated
// retryOnNodeLoss is still accepted on input (true is AtLeastOnce, false is AtMostOnce); sending both with different
// meanings is a 400 with field code EffectPolicyConflict.
const (
	// EffectPolicyAtMostOnce fails a lost started run with outcome NodeLost. The default for new deployments.
	EffectPolicyAtMostOnce = "AtMostOnce"
	// EffectPolicyAtLeastOnce requeues a lost started run while attempts remain; its effects may repeat.
	EffectPolicyAtLeastOnce = "AtLeastOnce"
	// EffectPolicyJournaled behaves as EffectPolicyAtMostOnce until the effect journal exists.
	EffectPolicyJournaled = "Journaled"
)

// Workspace kinds (WorkspaceTemplate.Kind).
const (
	WorkspaceKindEmpty         = "Empty"
	WorkspaceKindGitRepository = "GitRepository"
	WorkspaceKindSeeded        = "Seeded"
	// WorkspaceKindPersistentVolume mounts WorkspaceTemplate.PersistentVolumeClaim at the workspace path
	// (KubernetesJob runs only).
	WorkspaceKindPersistentVolume = "PersistentVolume"
)

// Secret statuses (Secret.Status).
const (
	// SecretStatusOk means the credential is usable or was not checked. Setting a new value returns a secret here.
	SecretStatusOk = "Ok"
	// SecretStatusNeedsReauthentication means the provider rejected a CodexAuthJson login for good (refresh token
	// reused, expired, or revoked). Runs that bind the secret fail with outcome NotCredentialed and an error message
	// starting "SecretNeedsReauthentication:" until the secret's value is replaced with a fresh login.
	SecretStatusNeedsReauthentication = "NeedsReauthentication"
)

// Secret is secret metadata. The value is write-only and never returned. Decode a Client.Secrets response into it.
type Secret struct {
	ID          string `json:"id"`
	TenantID    string `json:"tenantId"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Kind        string `json:"kind"`
	ValueLast4  string `json:"valueLast4,omitempty"`
	Fingerprint string `json:"fingerprint,omitempty"`
	KeyVersion  int    `json:"keyVersion"`
	ExpiresUTC  string `json:"expiresUtc,omitempty"`
	RotatedUTC  string `json:"rotatedUtc,omitempty"`
	Active      bool   `json:"active"`
	IsProtected bool   `json:"isProtected"`
	// Status is SecretStatusOk or SecretStatusNeedsReauthentication.
	Status string `json:"status"`
	// StatusMessage explains the status (the provider error), or is empty when Ok.
	StatusMessage string `json:"statusMessage,omitempty"`
	// StatusUTC is when the status left Ok, or empty.
	StatusUTC string `json:"statusUtc,omitempty"`
	// RefreshedUTC is when the control plane last refreshed this Codex login itself, or empty.
	RefreshedUTC string `json:"refreshedUtc,omitempty"`
	// AccessTokenExpiresUTC is the expiry of the stored ChatGPT access token (CodexAuthJson only), or empty.
	AccessTokenExpiresUTC string `json:"accessTokenExpiresUtc,omitempty"`
	CreatedUTC            string `json:"createdUtc,omitempty"`
	LastUpdateUTC         string `json:"lastUpdateUtc,omitempty"`
}

// ExecutorRequirements are optional placement requirements copied into admitted runs.
// Isolation is Process (default), Container, or SandboxedRuntime. Startup classes match exactly.
type ExecutorRequirements struct {
	Isolation           string  `json:"isolation,omitempty"`
	EgressControl       bool    `json:"egressControl,omitempty"`
	FilesystemSnapshot  bool    `json:"filesystemSnapshot,omitempty"`
	SessionContinuation bool    `json:"sessionContinuation,omitempty"`
	CrossNodeRestore    bool    `json:"crossNodeRestore,omitempty"`
	ColdStartClass      *string `json:"coldStartClass,omitempty"`
}

// ExecutorCapabilities is one worker-reported executor. Missing reports promise no advanced capabilities.
type ExecutorCapabilities struct {
	WarmStart bool `json:"warmStart,omitempty"`
	ExecutorRequirements
	Executor string `json:"executor"`
}

// RunPodResources are requests and limits for the run pod of a KubernetesJob run, as Kubernetes quantities (for
// example "500m", "2", "512Mi", "4Gi"). Nil values use the worker's defaults.
type RunPodResources struct {
	CPURequest              *string `json:"cpuRequest,omitempty"`
	CPULimit                *string `json:"cpuLimit,omitempty"`
	MemoryRequest           *string `json:"memoryRequest,omitempty"`
	MemoryLimit             *string `json:"memoryLimit,omitempty"`
	EphemeralStorageRequest *string `json:"ephemeralStorageRequest,omitempty"`
	EphemeralStorageLimit   *string `json:"ephemeralStorageLimit,omitempty"`
}

// NodePool groups worker nodes. DefaultExecutor applies to deployments in the pool that set none (nil is Process).
type NodePool struct {
	ID              string   `json:"id,omitempty"`
	Name            string   `json:"name"`
	Description     string   `json:"description,omitempty"`
	Tenants         []string `json:"tenants,omitempty"`
	DefaultExecutor *string  `json:"defaultExecutor,omitempty"`
}

// Node is a worker node. Executors lists what it can run; empty means Process only. ChildReserveSlots and
// MaxResidentWaiters are the delegation capacity the worker reported: reserve slots for children of waiting runs, and
// the most runs that may wait on a child at once (0 means MaxConcurrentRuns). Containerized is true when the worker
// reported at registration that it runs inside a container or pod (GARRISON_WORKER_CONTAINERIZED); the built-in Codex
// profiles then default their sandbox to danger-full-access.
type Node struct {
	SupportsMcpTests     bool                   `json:"supportsMcpTests"`
	Containerized        bool                   `json:"containerized"`
	ExecutorCapabilities []ExecutorCapabilities `json:"executorCapabilities,omitempty"`
	ID                   string                 `json:"id"`
	Name                 string                 `json:"name"`
	Status               string                 `json:"status"`
	NodePoolID           string                 `json:"nodePoolId,omitempty"`
	Executors            []string               `json:"executors,omitempty"`
	MaxConcurrentRuns    int                    `json:"maxConcurrentRuns,omitempty"`
	ChildReserveSlots    int                    `json:"childReserveSlots"`
	MaxResidentWaiters   int                    `json:"maxResidentWaiters"`
}

// WorkspaceTemplate defines how a run workspace is prepared.
type WorkspaceTemplate struct {
	ID                    string `json:"id,omitempty"`
	TenantID              string `json:"tenantId,omitempty"`
	Name                  string `json:"name"`
	Kind                  string `json:"kind,omitempty"`
	PersistentVolumeClaim string `json:"persistentVolumeClaim,omitempty"`
	// Warnings is set on create and update responses only; see FieldWarning.
	Warnings []FieldWarning `json:"warnings,omitempty"`
}

// Field warning codes (FieldWarning.Code).
const (
	// FieldWarningValueClamped means the value was outside its allowed range and the nearest allowed value was stored.
	FieldWarningValueClamped = "ValueClamped"
)

// FieldWarning reports one field of a create or update request, or of a manifest document, that the server accepted
// but did not store as given, for example a number outside its range that was clamped (Code ValueClamped). Field is
// the REST field name (maxAttempts, delegationMaxDepth); Given and Stored are the values as text, nil when absent.
// Create and update responses for agents, deployments, harness profiles, MCP servers, and workspace templates carry a
// warnings array (omitted when empty); reads never do.
type FieldWarning struct {
	Field   string  `json:"field"`
	Code    string  `json:"code"`
	Given   *string `json:"given,omitempty"`
	Stored  *string `json:"stored,omitempty"`
	Message string  `json:"message"`
}

// TokenResponse is returned by POST /v1.0/token.
type TokenResponse struct {
	Token         string `json:"token"`
	ExpiresUTC    string `json:"expiresUtc"`
	TenantID      string `json:"tenantId"`
	SessionID     string `json:"sessionId"`
	PrincipalType string `json:"principalType"`
}

// EnumerationResult is a page of results.
type EnumerationResult[T any] struct {
	Success          bool   `json:"success"`
	MaxResults       int    `json:"maxResults"`
	Skip             int    `json:"skip"`
	TotalRecords     int64  `json:"totalRecords"`
	RecordsRemaining int64  `json:"recordsRemaining"`
	EndOfResults     bool   `json:"endOfResults"`
	TimestampUTC     string `json:"timestampUtc"`
	Objects          []T    `json:"objects"`
}

// Control-plane replica (control node) statuses.
const (
	ControlNodeStatusStarting = "Starting"
	ControlNodeStatusReady    = "Ready"
	ControlNodeStatusDraining = "Draining"
	ControlNodeStatusOffline  = "Offline"
)

// ControlNode is a control-plane replica. IsLeader and LeaderEpoch come from the coordination lease; LeaderEpoch is
// set on the leader only, and RespondingNodeID on single-record reads.
type ControlNode struct {
	ID               string  `json:"id"`
	Name             string  `json:"name"`
	Hostname         string  `json:"hostname,omitempty"`
	Address          string  `json:"address,omitempty"`
	Version          string  `json:"version,omitempty"`
	SchemaVersion    int     `json:"schemaVersion"`
	Backplane        string  `json:"backplane,omitempty"`
	Status           string  `json:"status"`
	StartedUTC       string  `json:"startedUtc"`
	LastHeartbeatUTC string  `json:"lastHeartbeatUtc"`
	ActiveRequests   int     `json:"activeRequests"`
	OpenStreams      int     `json:"openStreams"`
	HeldLongPolls    int     `json:"heldLongPolls"`
	IsLeader         bool    `json:"isLeader"`
	LeaderEpoch      *int64  `json:"leaderEpoch,omitempty"`
	RespondingNodeID *string `json:"respondingNodeId,omitempty"`
}

// ControlNodeList is a page of control nodes with the node ID of the replica that answered.
type ControlNodeList struct {
	EnumerationResult[ControlNode]
	RespondingNodeID string `json:"respondingNodeId"`
}

// ListOptions are common enumeration parameters. Zero values are omitted.
type ListOptions struct {
	MaxResults     int
	Skip           int
	Ordering       string
	Search         string
	ActiveOnly     bool
	IncludeBuiltIn bool
}

// Agent is an agent definition.
type Agent struct {
	ID             string   `json:"id,omitempty"`
	TenantID       string   `json:"tenantId,omitempty"`
	Name           string   `json:"name"`
	DisplayName    string   `json:"displayName,omitempty"`
	Description    string   `json:"description,omitempty"`
	Kind           string   `json:"kind,omitempty"`
	DelegationMode string   `json:"delegationMode,omitempty"`
	Tags           []string `json:"tags,omitempty"`
	CreatedUTC     string   `json:"createdUtc,omitempty"`
	// Warnings is set on create and update responses only; see FieldWarning.
	Warnings []FieldWarning `json:"warnings,omitempty"`
}

// Deployment binds an agent to a harness profile and model.
type Deployment struct {
	ArgumentOverrides    []DeploymentArgumentOverride `json:"argumentOverrides,omitempty"`
	ArtifactGlobs        []string                     `json:"artifactGlobs,omitempty"`
	ArtifactStoreID      string                       `json:"artifactStoreId,omitempty"`
	RequiredCapabilities *ExecutorRequirements        `json:"requiredCapabilities,omitempty"`
	ID                   string                       `json:"id,omitempty"`
	TenantID             string                       `json:"tenantId,omitempty"`
	AgentID              string                       `json:"agentId"`
	Name                 string                       `json:"name"`
	HarnessProfileID     string                       `json:"harnessProfileId"`
	Model                string                       `json:"model,omitempty"`
	// Executor is RunExecutorProcess or RunExecutorKubernetesJob; nil uses the node pool's default, then Process.
	Executor *string `json:"executor,omitempty"`
	// TrustLevel is TrustLevelTrusted (the default when empty) or TrustLevelUntrusted.
	TrustLevel string `json:"trustLevel,omitempty"`
	// EgressRules is the egress allowlist; empty means no allowlist (the cluster's default run egress).
	EgressRules []DeploymentEgressRule `json:"egressRules,omitempty"`
	// EffectPolicy is EffectPolicyAtMostOnce (the default when empty), EffectPolicyAtLeastOnce, or EffectPolicyJournaled.
	EffectPolicy string `json:"effectPolicy,omitempty"`
	// PodResources are the run pod requests and limits for KubernetesJob runs.
	PodResources *RunPodResources `json:"podResources,omitempty"`
	// ApprovalsEnabled turns on permission approvals. Only Claude Code profiles and Codex profiles with
	// CodexAppServer delivery accept true. Default false.
	ApprovalsEnabled bool `json:"approvalsEnabled,omitempty"`
	// ApprovalDefaultAction (an ApprovalRuleAction* constant) applies when no rule matches; empty means Ask.
	ApprovalDefaultAction string `json:"approvalDefaultAction,omitempty"`
	// ApprovalTimeoutSeconds is how long a pending approval waits for a person (10 to 3600); 0 means 300.
	ApprovalTimeoutSeconds int `json:"approvalTimeoutSeconds,omitempty"`
	// ApprovalTimeoutDecision (an ApprovalDecision* constant) applies when a pending approval expires; empty means Deny.
	ApprovalTimeoutDecision string `json:"approvalTimeoutDecision,omitempty"`
	// ApprovalRules are the approval rules in display order (at most 500). Deny beats Ask, Ask beats Allow.
	ApprovalRules []DeploymentApprovalRule `json:"approvalRules,omitempty"`
	CreatedUTC    string                   `json:"createdUtc,omitempty"`
	// Warnings is set on create and update responses only; see FieldWarning.
	Warnings []FieldWarning `json:"warnings,omitempty"`
}

// Permission approval statuses (Approval.Status). Pending is the only state that can change.
const (
	ApprovalStatusPending   = "Pending"
	ApprovalStatusApproved  = "Approved"
	ApprovalStatusDenied    = "Denied"
	ApprovalStatusExpired   = "Expired"
	ApprovalStatusCancelled = "Cancelled"
)

// Permission approval decisions (Approval.Decision and TimeoutDecision, ApprovalDecideRequest.Decision).
const (
	ApprovalDecisionAllow = "Allow"
	ApprovalDecisionDeny  = "Deny"
)

// Permission approval decision sources (Approval.DecisionSource, ApprovalCheckResponse.Source).
const (
	ApprovalSourceRule      = "Rule"
	ApprovalSourceDefault   = "Default"
	ApprovalSourceUser      = "User"
	ApprovalSourceTimeout   = "Timeout"
	ApprovalSourceCancelled = "Cancelled"
)

// Approval rule actions (DeploymentApprovalRule.Action, Deployment.ApprovalDefaultAction).
const (
	ApprovalRuleActionAllow = "Allow"
	ApprovalRuleActionDeny  = "Deny"
	ApprovalRuleActionAsk   = "Ask"
)

// Permission approval kinds (Approval.Kind): a Claude Code tool call, a Codex command (evaluated as Bash), or a
// Codex file change (evaluated as Edit).
const (
	ApprovalKindTool       = "Tool"
	ApprovalKindCommand    = "Command"
	ApprovalKindFileChange = "FileChange"
)

// DeploymentApprovalRule is one approval rule of a deployment. Pattern uses Claude Code rule syntax, for example
// Bash(git status:*), Edit(src/**), WebFetch(domain:example.com), or mcp__github__*.
type DeploymentApprovalRule struct {
	// ID (dar_) is stable across updates; leave empty for a new rule.
	ID           string `json:"id,omitempty"`
	DeploymentID string `json:"deploymentId,omitempty"`
	// Action is an ApprovalRuleAction* constant; empty means Ask.
	Action  string `json:"action,omitempty"`
	Pattern string `json:"pattern"`
	// InputPattern is an optional .NET regular expression over the tool input JSON.
	InputPattern *string `json:"inputPattern,omitempty"`
	Description  *string `json:"description,omitempty"`
}

// Approval is a permission request a harness relayed to Garrison and its decision. Decision and DecisionSource
// are nil while Pending; ExpiresUTC is set on approvals waiting for a person.
type Approval struct {
	ID               string  `json:"id"`
	TenantID         string  `json:"tenantId"`
	RunID            string  `json:"runId"`
	RootRunID        *string `json:"rootRunId"`
	AgentID          string  `json:"agentId"`
	AgentName        string  `json:"agentName"`
	DeploymentID     string  `json:"deploymentId"`
	LeaseEpoch       int64   `json:"leaseEpoch"`
	HarnessType      string  `json:"harnessType"`
	Kind             string  `json:"kind"`
	ToolName         string  `json:"toolName"`
	ToolCallID       *string `json:"toolCallId"`
	InputPreview     *string `json:"inputPreview"`
	Summary          *string `json:"summary"`
	SuggestedRule    *string `json:"suggestedRule"`
	Status           string  `json:"status"`
	Decision         *string `json:"decision"`
	DecisionSource   *string `json:"decisionSource"`
	RuleID           *string `json:"ruleId"`
	RulePattern      *string `json:"rulePattern"`
	RememberedRuleID *string `json:"rememberedRuleId"`
	DecidedBy        *string `json:"decidedBy"`
	DecidedByID      *string `json:"decidedById"`
	Reason           *string `json:"reason"`
	TimeoutDecision  string  `json:"timeoutDecision"`
	RequestedUTC     string  `json:"requestedUtc"`
	DecidedUTC       *string `json:"decidedUtc"`
	ExpiresUTC       *string `json:"expiresUtc"`
	// WaitMs is milliseconds between request and decision; nil while Pending.
	WaitMs        *int64 `json:"waitMs"`
	CreatedUTC    string `json:"createdUtc"`
	LastUpdateUTC string `json:"lastUpdateUtc"`
}

// ApprovalFilter filters approval listings. Empty fields are omitted. FromUTC and ToUTC are ISO 8601 UTC times.
type ApprovalFilter struct {
	Status, RunID, RootRunID, AgentID, DeploymentID, DecisionSource, FromUTC, ToUTC, Ordering string
	MaxResults, Skip                                                                          int
}

// ApprovalDecideRequest is the body of POST .../approvals/{id}/decide.
type ApprovalDecideRequest struct {
	// Decision is ApprovalDecisionAllow or ApprovalDecisionDeny. Required.
	Decision string `json:"decision"`
	// Reason is optional (at most 4000 characters) and shown to the harness when denying.
	Reason string `json:"reason,omitempty"`
	// Remember also adds a matching rule to the approval's deployment (needs Update on the deployment).
	Remember bool `json:"remember,omitempty"`
	// RulePattern is the remembered rule's pattern; empty uses the approval's suggested rule.
	RulePattern string `json:"rulePattern,omitempty"`
}

// ApprovalToolInput holds the tool input fields approval rules look at. JSON names follow Claude Code tool inputs.
type ApprovalToolInput struct {
	Command      string   `json:"command,omitempty"`
	Cwd          string   `json:"cwd,omitempty"`
	URL          string   `json:"url,omitempty"`
	FilePath     string   `json:"file_path,omitempty"`
	NotebookPath string   `json:"notebook_path,omitempty"`
	Path         string   `json:"path,omitempty"`
	Paths        []string `json:"paths,omitempty"`
	Pattern      string   `json:"pattern,omitempty"`
	Query        string   `json:"query,omitempty"`
}

// ApprovalCheckRequest is a sample tool call to evaluate against a deployment's approval rules.
type ApprovalCheckRequest struct {
	ToolName string             `json:"toolName"`
	Input    *ApprovalToolInput `json:"input,omitempty"`
}

// ApprovalCheckResponse is what a deployment's approval rules would do with a request. Nothing is recorded.
type ApprovalCheckResponse struct {
	// Action is an ApprovalRuleAction* constant.
	Action string `json:"action"`
	// Source is ApprovalSourceRule when a rule matched, ApprovalSourceDefault when the deployment default applied.
	Source           string  `json:"source"`
	RuleID           *string `json:"ruleId"`
	RulePattern      *string `json:"rulePattern"`
	SuggestedRule    *string `json:"suggestedRule"`
	ApprovalsEnabled bool    `json:"approvalsEnabled"`
}

// HarnessProfile describes how to run a harness CLI.
type HarnessProfile struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	HarnessType string `json:"harnessType"`
	Executable  string `json:"executable"`
	BuiltIn     bool   `json:"builtIn"`
	// Warnings is set on create and update responses only; see FieldWarning.
	Warnings []FieldWarning `json:"warnings,omitempty"`
}

// Run is one execution of an agent.
type Run struct {
	RequiredCapabilities *ExecutorRequirements `json:"requiredCapabilities,omitempty"`
	ID                   string                `json:"id"`
	TenantID             string                `json:"tenantId"`
	AgentID              string                `json:"agentId"`
	AgentName            string                `json:"agentName"`
	DeploymentID         string                `json:"deploymentId"`
	// Kind is Invoke, Delegated, Test, Retry, Pipeline, or Trigger.
	Kind     string `json:"kind"`
	Status   string `json:"status"`
	Outcome  string `json:"outcome"`
	Executor string `json:"executor,omitempty"`
	// TrustLevel is the deployment's trust level when the run was admitted.
	TrustLevel string `json:"trustLevel,omitempty"`
	// EffectPolicy is the deployment's effect policy when the run was admitted.
	EffectPolicy string   `json:"effectPolicy,omitempty"`
	InputText    string   `json:"inputText"`
	ResultText   string   `json:"resultText"`
	ErrorMessage string   `json:"errorMessage"`
	InputTokens  int64    `json:"inputTokens"`
	OutputTokens int64    `json:"outputTokens"`
	CachedTokens int64    `json:"cachedTokens"`
	CostUSD      *float64 `json:"costUsd"`
	Depth        int      `json:"depth"`
	ParentRunID  string   `json:"parentRunId"`
	CreatedUTC   string   `json:"createdUtc"`
	StartedUTC   string   `json:"startedUtc"`
	CompletedUTC string   `json:"completedUtc"`
	// FirstTokenUTC is the ISO 8601 UTC time of the first model output event; nil when absent.
	FirstTokenUTC *string `json:"firstTokenUtc,omitempty"`
	// LastTokenUTC is the ISO 8601 UTC time of the last model output event; nil when absent.
	LastTokenUTC *string `json:"lastTokenUtc,omitempty"`
	// TimeToFirstTokenMs is milliseconds from start to the first output event; nil when not measurable.
	TimeToFirstTokenMs *int64 `json:"timeToFirstTokenMs,omitempty"`
	// StreamingMs is milliseconds from the first to the last output event; nil when not measurable.
	StreamingMs *int64 `json:"streamingMs,omitempty"`
	// ExecutionMs is milliseconds from harness process start to exit; nil when not measurable.
	ExecutionMs *int64 `json:"executionMs,omitempty"`
	// QueueMs is milliseconds from creation to start; nil when not measurable.
	QueueMs *int64 `json:"queueMs,omitempty"`
	// TotalMs is milliseconds from queued to completed (server clock); nil when not measurable.
	TotalMs *int64 `json:"totalMs,omitempty"`
	// DelegationWaitMs is milliseconds the run spent waiting on child runs it started, measured from server
	// timestamps of the child runs whose parentRunId is this run; nil when not measurable.
	DelegationWaitMs *int64 `json:"delegationWaitMs,omitempty"`
	// TimeToFirstTokenExcludingDelegationMs is time to first token minus the delegation wait that happened before
	// the first token, never negative; nil when not measurable.
	TimeToFirstTokenExcludingDelegationMs *int64 `json:"timeToFirstTokenExcludingDelegationMs,omitempty"`
	// OutputTokensPerSecond is output tokens divided by streaming time; nil when not measurable.
	OutputTokensPerSecond *float64 `json:"outputTokensPerSecond,omitempty"`
	// ReasoningTokens is the reasoning token count reported by the harness. Default 0.
	ReasoningTokens int64 `json:"reasoningTokens"`
	// ToolCallCount is the number of tool calls the run made. Default 0.
	ToolCallCount int64 `json:"toolCallCount"`
	// ServedModel is the model the harness reported serving the run; empty when not reported.
	ServedModel string `json:"servedModel,omitempty"`
	// TraceID is the W3C trace ID (32 lowercase hexadecimal characters) of the trace the run was created and
	// compiled in, for finding its spans in Tempo and its logs in Loki; nil for runs created before trace IDs were
	// recorded.
	TraceID *string `json:"traceId"`
	// BlockedReason is computed by the server on read: NoReadyWorker, NoCapableWorker, NoMatchingPool, or
	// NoIsolatingWorker (an Untrusted run no Ready worker can isolate) when the queued run cannot be handed to any
	// worker right now; nil otherwise.
	BlockedReason *string `json:"blockedReason"`
	// OutputSchemaValid reports whether the final output validated against the agent's output schema; nil when the
	// agent has no output schema or nothing was validated.
	OutputSchemaValid *bool `json:"outputSchemaValid"`
	// SchemaValidationErrors holds the first few errors of the most recent failed schema validation; nil otherwise.
	SchemaValidationErrors *string `json:"schemaValidationErrors"`
	// RepairAttempts is the number of structured output repairs started (0 or 1). Default 0.
	RepairAttempts int `json:"repairAttempts"`
	// PendingApprovals is the number of permission approvals of this run waiting for a person (read-only).
	PendingApprovals int `json:"pendingApprovals"`
	// AwaitingApproval is true while PendingApprovals is above zero; the run stays Running.
	AwaitingApproval bool `json:"awaitingApproval"`
	// ApprovalWaitMs is the total time spent waiting for approvals decided by a person or a timeout; nil when the
	// run never waited.
	ApprovalWaitMs *int64 `json:"approvalWaitMs"`
	// ConversationID is the conversation this run is a turn of; nil for a run outside any conversation.
	ConversationID *string `json:"conversationId"`
	// ConversationTurn is the turn number within the conversation, starting at 1; 0 outside a conversation.
	ConversationTurn int `json:"conversationTurn"`
	// ResumeSessionID is the harness session this turn resumes on its affinity node; nil when it starts a new session.
	ResumeSessionID *string `json:"resumeSessionId"`
	// AffinityNodeID is the node this turn prefers because it holds the conversation's directories; nil otherwise.
	AffinityNodeID *string `json:"affinityNodeId"`
	// AffinityUntilUTC is the end of the affinity wait (ISO 8601 UTC); nil when the run has no affinity.
	AffinityUntilUTC *string `json:"affinityUntilUtc"`
	// ConversationFallbackReason is one of the ConversationFallback constants when this turn started a fresh session
	// from the transcript instead of resuming; nil otherwise.
	ConversationFallbackReason *string `json:"conversationFallbackReason"`
	// PipelineRunID is the pipeline run this run is a stage of; nil for runs outside a pipeline.
	PipelineRunID *string `json:"pipelineRunId"`
	// PipelinePosition is the position of the pipeline stage this run executes, starting at 1; 0 outside a pipeline.
	PipelinePosition int `json:"pipelinePosition"`
	// PipelineExecution is the execution number of the stage (retries, revisions, and resumes increase it); 0 outside a pipeline.
	PipelineExecution int `json:"pipelineExecution"`
	// TriggerID is the trigger that started this run (Kind Trigger); nil otherwise.
	TriggerID *string `json:"triggerId"`
}

// Conversation is a multi-turn session with one agent. Each turn is a run; a follow-up turn resumes the harness
// session the earlier turns built. Turns are serialized: a turn sent while another is unfinished fails with HTTP 409
// and code ConversationBusy.
type Conversation struct {
	// ID is the identifier (prefix cnv_).
	ID        string `json:"id"`
	TenantID  string `json:"tenantId"`
	AgentID   string `json:"agentId"`
	AgentName string `json:"agentName"`
	// DeploymentID is the deployment every turn runs on, chosen for the first turn.
	DeploymentID string `json:"deploymentId"`
	HarnessType  string `json:"harnessType"`
	// ContextID is the client-supplied A2A context identifier the conversation was created for; nil otherwise.
	ContextID *string `json:"contextId"`
	// Title is the first line of the first turn's input (at most 200 characters); nil before the first turn.
	Title      *string `json:"title"`
	CallerType string  `json:"callerType"`
	CallerID   *string `json:"callerId"`
	CallerName *string `json:"callerName"`
	// SessionID is the harness session the next turn resumes; nil before the first successful turn.
	SessionID               *string `json:"sessionId"`
	SessionHarnessProfileID *string `json:"sessionHarnessProfileId"`
	// AffinityNodeID is the node holding the conversation's workspace and home directories; nil when none does.
	AffinityNodeID   *string `json:"affinityNodeId"`
	AffinityNodeName *string `json:"affinityNodeName"`
	// ActiveRunID is the run of the turn in progress (or the last one started); check Busy to know if it is unfinished.
	ActiveRunID *string `json:"activeRunId"`
	LastRunID   *string `json:"lastRunId"`
	// TurnCount is the number of turns created, whatever their outcome.
	TurnCount int `json:"turnCount"`
	// FallbackCount is the number of turns that fell back to the transcript instead of resuming.
	FallbackCount      int     `json:"fallbackCount"`
	LastFallbackReason *string `json:"lastFallbackReason"`
	LastFallbackUTC    *string `json:"lastFallbackUtc"`
	LastActivityUTC    *string `json:"lastActivityUtc"`
	// Busy is computed on read: true while a turn is unfinished, so a new turn or a delete would get 409 ConversationBusy.
	Busy          bool   `json:"busy"`
	Active        bool   `json:"active"`
	IsProtected   bool   `json:"isProtected"`
	CreatedUTC    string `json:"createdUtc"`
	LastUpdateUTC string `json:"lastUpdateUtc"`
}

// ConversationFilter filters conversation listings. Empty fields are omitted.
type ConversationFilter struct {
	AgentID string
	// ContextID matches the A2A context identifier the conversation was created for.
	ContextID        string
	CallerID         string
	Search           string
	Ordering         string
	MaxResults, Skip int
}

// RunEvent is one normalized event emitted by a run.
type RunEvent struct {
	ID           string `json:"id"`
	RunID        string `json:"runId"`
	Sequence     int64  `json:"sequence"`
	EventType    string `json:"eventType"`
	TimestampUTC string `json:"timestampUtc"`
	Text         string `json:"text"`
	ToolName     string `json:"toolName"`
	ToolCallID   string `json:"toolCallId"`
}

// RunEventPage is returned by the polling events endpoint.
type RunEventPage struct {
	RunID        string     `json:"runId"`
	Status       string     `json:"status"`
	Events       []RunEvent `json:"events"`
	LastSequence int64      `json:"lastSequence"`
	HasMore      bool       `json:"hasMore"`
}

// RunStreamItem is one item from RunsClient.Stream. Event is set for run.event; Run is set for run.completed.
type RunStreamItem struct {
	Name  string
	Data  string
	Event *RunEvent
	Run   *Run
}

// InvokeRequest is the body of an agent invocation.
type InvokeRequest struct {
	Input        string            `json:"input"`
	Wait         bool              `json:"wait"`
	WaitSeconds  int               `json:"waitSeconds,omitempty"`
	Parameters   map[string]string `json:"parameters,omitempty"`
	DeploymentID string            `json:"deploymentId,omitempty"`
	Priority     int               `json:"priority,omitempty"`
	// CancelOnDisconnect, when waiting, cancels the run if the client disconnects first. Nil means true.
	CancelOnDisconnect *bool `json:"cancelOnDisconnect,omitempty"`
	// ConversationID continues that conversation as its next turn. The server answers 409 ConversationBusy while the
	// previous turn is unfinished (turns are refused, not queued) and 404 when the conversation does not exist.
	ConversationID string `json:"conversationId,omitempty"`
	// StartConversation starts a new conversation with this run as its first turn; the run's ConversationID names it.
	StartConversation bool `json:"startConversation,omitempty"`
}

// RunCreateRequest is the body of POST .../runs.
type RunCreateRequest struct {
	AgentID      string            `json:"agentId,omitempty"`
	AgentName    string            `json:"agentName,omitempty"`
	DeploymentID string            `json:"deploymentId,omitempty"`
	Input        string            `json:"input"`
	Parameters   map[string]string `json:"parameters,omitempty"`
	Priority     int               `json:"priority,omitempty"`
	Wait         bool              `json:"wait,omitempty"`
	WaitSeconds  int               `json:"waitSeconds,omitempty"`
	// CancelOnDisconnect, when waiting, cancels the run if the client disconnects first. Nil means true.
	CancelOnDisconnect *bool `json:"cancelOnDisconnect,omitempty"`
	// ConversationID continues that conversation as its next turn. The server answers 409 ConversationBusy while the
	// previous turn is unfinished (turns are refused, not queued) and 404 when the conversation does not exist.
	ConversationID string `json:"conversationId,omitempty"`
	// StartConversation starts a new conversation with this run as its first turn; the run's ConversationID names it.
	StartConversation bool `json:"startConversation,omitempty"`
}

// RunFilter filters run listings. Empty fields are omitted.
type RunFilter struct {
	Status, AgentID, DeploymentID, HarnessType, NodeID, ParentRunID, RootRunID, Outcome, Ordering string
	MaxResults, Skip                                                                              int
	// ConversationID keeps only the turns of this conversation.
	ConversationID string
	// TriggerID keeps only the runs this trigger started.
	TriggerID string
}

// ManifestApply is the result of applying manifests. Items is kept raw for forward compatibility; call
// ParsedItems for the typed per-document results.
type ManifestApply struct {
	ID          string          `json:"id"`
	DryRun      bool            `json:"dryRun"`
	FailedCount int             `json:"failedCount"`
	Items       json.RawMessage `json:"items"`
}

// ManifestApplyItem is the result for one manifest document.
type ManifestApplyItem struct {
	Position   int    `json:"position"`
	Kind       string `json:"kind"`
	Name       string `json:"name"`
	Result     string `json:"result"`
	ResourceID string `json:"resourceId,omitempty"`
	Message    string `json:"message,omitempty"`
	// ErrorCode is the stable code of a failed document, for example ManifestInvalid; empty otherwise.
	ErrorCode string `json:"errorCode,omitempty"`
	// ErrorField is the path of the field that failed, for example documents[1].spec.kind.
	ErrorField string `json:"errorField,omitempty"`
	// Changes lists field-level changes for Updated items (dry runs report them too); empty otherwise.
	Changes []ManifestFieldChange `json:"changes,omitempty"`
	// Warnings lists values in the document that were accepted but not stored as written (dry runs report them too).
	Warnings []FieldWarning `json:"warnings,omitempty"`
}

// ManifestFieldChange is one changed field of an Updated manifest item. Before and After are strings
// truncated to 200 characters; nil when the field had or has no value.
type ManifestFieldChange struct {
	Field  string  `json:"field"`
	Before *string `json:"before"`
	After  *string `json:"after"`
}

// ParsedItems decodes Items into typed per-document results.
func (m *ManifestApply) ParsedItems() ([]ManifestApplyItem, error) {
	var items []ManifestApplyItem
	if len(m.Items) == 0 || string(m.Items) == "null" {
		return items, nil
	}
	if err := json.Unmarshal(m.Items, &items); err != nil {
		return nil, err
	}
	return items, nil
}

// AnalyticsQuery filters GET .../analytics/runs. Empty fields are omitted.
type AnalyticsQuery struct {
	// From is the inclusive range start as an ISO 8601 UTC string. Server default when empty.
	From string
	// To is the exclusive range end as an ISO 8601 UTC string. Server default when empty.
	To string
	// Interval is minute, hour, day, week, or auto.
	Interval string
	// AgentID limits results to one agent.
	AgentID string
	// HarnessType limits results to one harness type.
	HarnessType string
	// DeploymentID limits results to one deployment.
	DeploymentID string
	// Model limits results to runs whose served model equals this value; "unknown" matches runs
	// without a recorded model.
	Model string
	// GroupBy is none, agent, harness, model, or harnessModel. With harnessModel each series key is
	// "Harness|model" and its label is "Harness / model".
	GroupBy string
}

// AnalyticsMetrics are the aggregate run metrics reported for totals and for every bucket.
// Nullable averages and percentiles are nil when there are no samples.
type AnalyticsMetrics struct {
	Runs                  int64    `json:"runs"`
	Succeeded             int64    `json:"succeeded"`
	Failed                int64    `json:"failed"`
	Cancelled             int64    `json:"cancelled"`
	TimedOut              int64    `json:"timedOut"`
	InputTokens           int64    `json:"inputTokens"`
	OutputTokens          int64    `json:"outputTokens"`
	CachedTokens          int64    `json:"cachedTokens"`
	ReasoningTokens       int64    `json:"reasoningTokens"`
	ToolCalls             int64    `json:"toolCalls"`
	CostUSD               float64  `json:"costUsd"`
	TimeToFirstTokenMsAvg *float64 `json:"timeToFirstTokenMsAvg"`
	TimeToFirstTokenMsP50 *float64 `json:"timeToFirstTokenMsP50"`
	TimeToFirstTokenMsP95 *float64 `json:"timeToFirstTokenMsP95"`
	// TimeToFirstTokenExcludingDelegationMsAvg, P50, and P95 exclude time spent waiting on delegated child runs.
	TimeToFirstTokenExcludingDelegationMsAvg *float64 `json:"timeToFirstTokenExcludingDelegationMsAvg"`
	TimeToFirstTokenExcludingDelegationMsP50 *float64 `json:"timeToFirstTokenExcludingDelegationMsP50"`
	TimeToFirstTokenExcludingDelegationMsP95 *float64 `json:"timeToFirstTokenExcludingDelegationMsP95"`
	// DelegationWaitMsAvg is the average time runs spent waiting on child runs they started.
	DelegationWaitMsAvg      *float64 `json:"delegationWaitMsAvg"`
	StreamingMsAvg           *float64 `json:"streamingMsAvg"`
	ExecutionMsAvg           *float64 `json:"executionMsAvg"`
	ExecutionMsP95           *float64 `json:"executionMsP95"`
	QueueMsAvg               *float64 `json:"queueMsAvg"`
	OutputTokensPerSecondAvg *float64 `json:"outputTokensPerSecondAvg"`
}

// AnalyticsBucket is one time bucket of a series; StartUTC is the bucket start.
type AnalyticsBucket struct {
	StartUTC string `json:"startUtc"`
	AnalyticsMetrics
}

// AnalyticsSeries is one series. Key is "all", an agent ID, a harness type, a served model (or "unknown"),
// or "Harness|model" depending on GroupBy; Label is "All runs", the agent name, the harness type, the
// served model, or "Harness / model".
type AnalyticsSeries struct {
	Key     string            `json:"key"`
	Label   string            `json:"label"`
	Buckets []AnalyticsBucket `json:"buckets"`
}

// RunAnalytics is the response of GET .../analytics/runs.
type RunAnalytics struct {
	FromUTC string `json:"fromUtc"`
	ToUTC   string `json:"toUtc"`
	// Interval is minute, hour, day, week, or auto when the chosen bucket is not one of those.
	Interval string `json:"interval"`
	// BucketSeconds is the authoritative bucket size.
	BucketSeconds int64 `json:"bucketSeconds"`
	// Truncated is true when the server's 100,000-run cap was hit.
	Truncated bool              `json:"truncated"`
	Totals    AnalyticsMetrics  `json:"totals"`
	Series    []AnalyticsSeries `json:"series"`
}

// AnalyticsAgentDimension is an agent with runs in the range. Name falls back to the ID when the run did
// not record one.
type AnalyticsAgentDimension struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// AnalyticsDeploymentDimension is a deployment with runs in the range. Name falls back to the ID when the
// deployment no longer exists.
type AnalyticsDeploymentDimension struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	AgentID string `json:"agentId"`
}

// AnalyticsDimensions is the response of GET .../analytics/runs/dimensions: the distinct agents, harness
// types, deployments, and served models among runs in a range, each list sorted by name.
type AnalyticsDimensions struct {
	Agents []AnalyticsAgentDimension `json:"agents"`
	// Harnesses are harness types such as ClaudeCode or Generic.
	Harnesses   []string                       `json:"harnesses"`
	Deployments []AnalyticsDeploymentDimension `json:"deployments"`
	// Models are served models; "unknown" stands for runs without a recorded model.
	Models []string `json:"models"`
	// Truncated is true when the server's 100,000-run cap was hit.
	Truncated bool `json:"truncated"`
}

// ModelPrice holds operator-configured USD rates for an exact tenant, harness, and served model.
// Reported harness cost takes precedence. Cached and reasoning inclusion flags describe the harness token counts.
type ModelPrice struct {
	ID                            string   `json:"id"`
	TenantID                      string   `json:"tenantId"`
	Name                          string   `json:"name"`
	Description                   *string  `json:"description"`
	Model                         string   `json:"model"`
	HarnessType                   string   `json:"harnessType"`
	InputUsdPerMillion            float64  `json:"inputUsdPerMillion"`
	OutputUsdPerMillion           float64  `json:"outputUsdPerMillion"`
	CachedInputUsdPerMillion      *float64 `json:"cachedInputUsdPerMillion"`
	ReasoningUsdPerMillion        *float64 `json:"reasoningUsdPerMillion"`
	InputIncludesCachedTokens     bool     `json:"inputIncludesCachedTokens"`
	OutputIncludesReasoningTokens bool     `json:"outputIncludesReasoningTokens"`
	Active                        bool     `json:"active"`
	IsProtected                   bool     `json:"isProtected"`
	CreatedUTC                    string   `json:"createdUtc"`
	LastUpdateUTC                 string   `json:"lastUpdateUtc"`
}

// UsageQuota is a tenant-owned limit. Null limits are unlimited; zero disallows usage only when enforcement is enabled.
type UsageQuota struct {
	EnforcementEnabled bool     `json:"enforcementEnabled"`
	ID                 string   `json:"id"`
	TenantID           string   `json:"tenantId"`
	Name               string   `json:"name"`
	Description        *string  `json:"description,omitempty"`
	Scope              string   `json:"scope"`
	ResourceID         string   `json:"resourceId"`
	DailyRunLimit      *int64   `json:"dailyRunLimit,omitempty"`
	DailyTokenLimit    *int64   `json:"dailyTokenLimit,omitempty"`
	DailyCostUSDLimit  *float64 `json:"dailyCostUsdLimit,omitempty"`
	MaxConcurrentRuns  *int     `json:"maxConcurrentRuns,omitempty"`
	Active             bool     `json:"active"`
	IsProtected        bool     `json:"isProtected"`
	CreatedUTC         string   `json:"createdUtc"`
	LastUpdateUTC      string   `json:"lastUpdateUtc"`
}

// UsageQuotaUsage reports a daily UTC window, current concurrency, and known-cost coverage.
type UsageQuotaUsage struct {
	QuotaID                string  `json:"quotaId"`
	WindowStartUTC         string  `json:"windowStartUtc"`
	WindowEndUTC           string  `json:"windowEndUtc"`
	RunsUsed               int64   `json:"runsUsed"`
	TokensUsed             int64   `json:"tokensUsed"`
	CostUSD                float64 `json:"costUsd"`
	UnknownCostRuns        int64   `json:"unknownCostRuns"`
	ActiveRuns             int64   `json:"activeRuns"`
	CostAccountingComplete bool    `json:"costAccountingComplete"`
}

// ArtifactStore configures database, filesystem, or S3 storage. Credentials remain encrypted server-side.
type ArtifactStore struct {
	Description    string `json:"description,omitempty"`
	Active         *bool  `json:"active,omitempty"`
	IsProtected    bool   `json:"isProtected,omitempty"`
	CreatedUTC     string `json:"createdUtc,omitempty"`
	LastUpdateUTC  string `json:"lastUpdateUtc,omitempty"`
	ID             string `json:"id,omitempty"`
	TenantID       string `json:"tenantId,omitempty"`
	Name           string `json:"name"`
	Kind           string `json:"kind,omitempty"`
	PathPrefix     string `json:"pathPrefix,omitempty"`
	Bucket         string `json:"bucket,omitempty"`
	Endpoint       string `json:"endpoint,omitempty"`
	Region         string `json:"region,omitempty"`
	SecretID       string `json:"secretId,omitempty"`
	ForcePathStyle *bool  `json:"forcePathStyle,omitempty"`
}

// Artifact is metadata; binary content is downloaded separately.
type Artifact struct {
	ID              string `json:"id"`
	TenantID        string `json:"tenantId"`
	RunID           string `json:"runId"`
	ArtifactStoreID string `json:"artifactStoreId"`
	Name            string `json:"name"`
	MediaType       string `json:"mediaType"`
	SizeBytes       int64  `json:"sizeBytes"`
	SHA256          string `json:"sha256"`
	Location        string `json:"location"`
	LeaseEpoch      int64  `json:"leaseEpoch"`
	RepairAttempt   int    `json:"repairAttempt"`
	CreatedUTC      string `json:"createdUtc"`
}

// ArtifactDownload is a short-lived download-only link.
type ArtifactDownload struct {
	URL        string `json:"url"`
	ExpiresUTC string `json:"expiresUtc"`
}

// DeploymentArgumentOverride appends, prepends, replaces, or removes a profile argument.
type DeploymentArgumentOverride struct {
	Position  int    `json:"position"`
	Operation string `json:"operation,omitempty"`
	Match     string `json:"match,omitempty"`
	Template  string `json:"template,omitempty"`
	Condition string `json:"condition,omitempty"`
}
