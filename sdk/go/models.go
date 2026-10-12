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
)

// Run executors (Deployment.Executor, NodePool.DefaultExecutor, Run.Executor, Node.Executors).
const (
	// RunExecutorProcess runs the harness as a subprocess of the worker.
	RunExecutorProcess = "Process"
	// RunExecutorKubernetesJob runs the harness in its own Kubernetes Job (pod per run).
	RunExecutorKubernetesJob = "KubernetesJob"
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

// Node is a worker node. Executors lists what it can run; empty means Process only.
type Node struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Status     string   `json:"status"`
	NodePoolID string   `json:"nodePoolId,omitempty"`
	Executors  []string `json:"executors,omitempty"`
}

// WorkspaceTemplate defines how a run workspace is prepared.
type WorkspaceTemplate struct {
	ID                    string `json:"id,omitempty"`
	TenantID              string `json:"tenantId,omitempty"`
	Name                  string `json:"name"`
	Kind                  string `json:"kind,omitempty"`
	PersistentVolumeClaim string `json:"persistentVolumeClaim,omitempty"`
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
}

// Deployment binds an agent to a harness profile and model.
type Deployment struct {
	ID               string `json:"id,omitempty"`
	TenantID         string `json:"tenantId,omitempty"`
	AgentID          string `json:"agentId"`
	Name             string `json:"name"`
	HarnessProfileID string `json:"harnessProfileId"`
	Model            string `json:"model,omitempty"`
	// Executor is RunExecutorProcess or RunExecutorKubernetesJob; nil uses the node pool's default, then Process.
	Executor *string `json:"executor,omitempty"`
	// PodResources are the run pod requests and limits for KubernetesJob runs.
	PodResources *RunPodResources `json:"podResources,omitempty"`
	CreatedUTC   string           `json:"createdUtc,omitempty"`
}

// HarnessProfile describes how to run a harness CLI.
type HarnessProfile struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	HarnessType string `json:"harnessType"`
	Executable  string `json:"executable"`
	BuiltIn     bool   `json:"builtIn"`
}

// Run is one execution of an agent.
type Run struct {
	ID           string   `json:"id"`
	TenantID     string   `json:"tenantId"`
	AgentID      string   `json:"agentId"`
	AgentName    string   `json:"agentName"`
	DeploymentID string   `json:"deploymentId"`
	Status       string   `json:"status"`
	Outcome      string   `json:"outcome"`
	Executor     string   `json:"executor,omitempty"`
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
	// BlockedReason is computed by the server on read: NoReadyWorker, NoCapableWorker, or NoMatchingPool when the
	// queued run cannot be handed to any worker right now; nil otherwise.
	BlockedReason *string `json:"blockedReason"`
	// OutputSchemaValid reports whether the final output validated against the agent's output schema; nil when the
	// agent has no output schema or nothing was validated.
	OutputSchemaValid *bool `json:"outputSchemaValid"`
	// SchemaValidationErrors holds the first few errors of the most recent failed schema validation; nil otherwise.
	SchemaValidationErrors *string `json:"schemaValidationErrors"`
	// RepairAttempts is the number of structured output repairs started (0 or 1). Default 0.
	RepairAttempts int `json:"repairAttempts"`
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
}

// RunFilter filters run listings. Empty fields are omitted.
type RunFilter struct {
	Status, AgentID, DeploymentID, HarnessType, NodeID, ParentRunID, RootRunID, Outcome, Ordering string
	MaxResults, Skip                                                                              int
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
