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
	// OutputTokensPerSecond is output tokens divided by streaming time; nil when not measurable.
	OutputTokensPerSecond *float64 `json:"outputTokensPerSecond,omitempty"`
	// ReasoningTokens is the reasoning token count reported by the harness. Default 0.
	ReasoningTokens int64 `json:"reasoningTokens"`
	// ToolCallCount is the number of tool calls the run made. Default 0.
	ToolCallCount int64 `json:"toolCallCount"`
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

// ManifestApply is the result of applying manifests.
type ManifestApply struct {
	ID          string          `json:"id"`
	DryRun      bool            `json:"dryRun"`
	FailedCount int             `json:"failedCount"`
	Items       json.RawMessage `json:"items"`
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
	// GroupBy is none, agent, or harness.
	GroupBy string
}

// AnalyticsMetrics are the aggregate run metrics reported for totals and for every bucket.
// Nullable averages and percentiles are nil when there are no samples.
type AnalyticsMetrics struct {
	Runs                     int64    `json:"runs"`
	Succeeded                int64    `json:"succeeded"`
	Failed                   int64    `json:"failed"`
	Cancelled                int64    `json:"cancelled"`
	TimedOut                 int64    `json:"timedOut"`
	InputTokens              int64    `json:"inputTokens"`
	OutputTokens             int64    `json:"outputTokens"`
	CachedTokens             int64    `json:"cachedTokens"`
	ReasoningTokens          int64    `json:"reasoningTokens"`
	ToolCalls                int64    `json:"toolCalls"`
	CostUSD                  float64  `json:"costUsd"`
	TimeToFirstTokenMsAvg    *float64 `json:"timeToFirstTokenMsAvg"`
	TimeToFirstTokenMsP50    *float64 `json:"timeToFirstTokenMsP50"`
	TimeToFirstTokenMsP95    *float64 `json:"timeToFirstTokenMsP95"`
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

// AnalyticsSeries is one series. Key is "all", an agent ID, or a harness type depending on GroupBy;
// Label is "All runs", the agent name, or the harness type.
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
