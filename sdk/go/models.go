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
)

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
	CreatedUTC       string `json:"createdUtc,omitempty"`
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
