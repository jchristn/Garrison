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
	CostUSD      *float64 `json:"costUsd"`
	Depth        int      `json:"depth"`
	ParentRunID  string   `json:"parentRunId"`
	CreatedUTC   string   `json:"createdUtc"`
	StartedUTC   string   `json:"startedUtc"`
	CompletedUTC string   `json:"completedUtc"`
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
