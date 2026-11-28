package garrison

import (
	"context"
	"errors"
	"net/http"
	"net/url"
)

// RunTrailNode is one step of an activity trail. The server leaves out properties that are null, so optional fields are
// pointers. Lane is "caller" for Caller, Trigger, and Reply steps and the agent identifier otherwise. A Redacted
// placeholder carries RedactedKind, the kind of the step you may not read. ToolName names an Effect's tool, never its
// arguments. EntrySurface says how the work came in, on the Caller node and on Run nodes that start a leg of
// the work.
type RunTrailNode struct {
	ID           string   `json:"id"`
	Kind         string   `json:"kind"`
	State        *string  `json:"state,omitempty"`
	AgentID      *string  `json:"agentId,omitempty"`
	AgentName    *string  `json:"agentName,omitempty"`
	UnitID       *string  `json:"unitId,omitempty"`
	UnitName     *string  `json:"unitName,omitempty"`
	DeploymentID *string  `json:"deploymentId,omitempty"`
	StartedUTC   *string  `json:"startedUtc,omitempty"`
	EndedUTC     *string  `json:"endedUtc,omitempty"`
	DurationMs   *int64   `json:"durationMs,omitempty"`
	InputTokens  *int64   `json:"inputTokens,omitempty"`
	OutputTokens *int64   `json:"outputTokens,omitempty"`
	CostUSD      *float64 `json:"costUsd,omitempty"`
	RunKind      *string  `json:"runKind,omitempty"`
	IsFocus      bool     `json:"isFocus"`
	Lane         string   `json:"lane"`
	CallerType   *string  `json:"callerType,omitempty"`
	CallerName   *string  `json:"callerName,omitempty"`
	ToolName     *string  `json:"toolName,omitempty"`
	RedactedKind *string  `json:"redactedKind,omitempty"`
	EntrySurface *string  `json:"entrySurface,omitempty"`
}

// RunTrailEdge links two trail steps, from cause to effect. Kind is one of the RunTrailEdge* constants.
type RunTrailEdge struct {
	FromID string `json:"fromId"`
	ToID   string `json:"toId"`
	Kind   string `json:"kind"`
	AtUTC  string `json:"atUtc"`
}

// RunTrail is a run's activity trail: every step from where the work started (OriginID) through the runs and records it
// reached, back to the reply. FocusRunID is the run asked about. Truncation is one of the RunTrailTruncation* constants.
// No text an agent wrote is included.
type RunTrail struct {
	OriginID     string         `json:"originId"`
	FocusRunID   string         `json:"focusRunId"`
	Nodes        []RunTrailNode `json:"nodes"`
	Edges        []RunTrailEdge `json:"edges"`
	Truncation   string         `json:"truncation"`
	NodeCount    int            `json:"nodeCount"`
	HopCount     int            `json:"hopCount"`
	GeneratedUTC string         `json:"generatedUtc"`
}

// Entry surfaces: how a run came in (Run.EntrySurface and RunTrailNode.EntrySurface). The dashboard calls the REST
// API, so its runs are Rest; Dashboard is reserved.
const (
	EntrySurfaceRest       = "Rest"
	EntrySurfaceMcp        = "Mcp"
	EntrySurfaceA2a        = "A2a"
	EntrySurfaceApp        = "App"
	EntrySurfaceDashboard  = "Dashboard"
	EntrySurfaceTrigger    = "Trigger"
	EntrySurfaceKeeper     = "Keeper"
	EntrySurfaceMessage    = "Message"
	EntrySurfaceEscalation = "Escalation"
	EntrySurfaceEval       = "Eval"
	EntrySurfaceShadow     = "Shadow"
	EntrySurfaceInternal   = "Internal"
)

// Activity trail node kinds.
const (
	RunTrailNodeCaller      = "Caller"
	RunTrailNodeTrigger     = "Trigger"
	RunTrailNodeKeeperTick  = "KeeperTick"
	RunTrailNodeRun         = "Run"
	RunTrailNodeMessage     = "Message"
	RunTrailNodeReport      = "Report"
	RunTrailNodeEscalation  = "Escalation"
	RunTrailNodeApproval    = "Approval"
	RunTrailNodeEffect      = "Effect"
	RunTrailNodeFanOutGroup = "FanOutGroup"
	RunTrailNodePipelineRun = "PipelineRun"
	RunTrailNodeReply       = "Reply"
	RunTrailNodeRedacted    = "Redacted"
)

// Activity trail edge kinds.
const (
	RunTrailEdgeStarted   = "Started"
	RunTrailEdgeSpawned   = "Spawned"
	RunTrailEdgeFannedOut = "FannedOut"
	RunTrailEdgeRetried   = "Retried"
	RunTrailEdgeSent      = "Sent"
	RunTrailEdgeWoke      = "Woke"
	RunTrailEdgeFiled     = "Filed"
	RunTrailEdgeRaised    = "Raised"
	RunTrailEdgeRouted    = "Routed"
	RunTrailEdgeAnswered  = "Answered"
	RunTrailEdgeRequested = "Requested"
	RunTrailEdgeDecided   = "Decided"
	RunTrailEdgePerformed = "Performed"
	RunTrailEdgeReplied   = "Replied"
	RunTrailEdgeDelivered = "Delivered"
	RunTrailEdgeShadowed  = "Shadowed"
)

// Activity trail truncation values. None means the trail is complete.
const (
	RunTrailTruncationNone    = "None"
	RunTrailTruncationNodeCap = "NodeCap"
	RunTrailTruncationHopCap  = "HopCap"
	RunTrailTruncationSpanCap = "SpanCap"
)

// RunTrailOptions tunes GetRunTrail. A nil IncludeEffects uses the RunTrail.IncludeEffects cluster setting (default true).
type RunTrailOptions struct {
	IncludeEffects *bool
}

// GetRunTrail reads a run's activity trail: every step from where the work started through child runs, fan-out groups,
// retries, messages, reports, escalations, approvals, and effects, back to the reply. Steps you may not read come back as
// Redacted placeholders. Needs Read on Run. A 404 is an unknown run; a 403 RunTokenTrailNotAllowed is a run token.
func (r *RunsClient) GetRunTrail(ctx context.Context, id string, opts *RunTrailOptions) (*RunTrail, error) {
	if id == "" {
		return nil, errors.New("garrison: id is required")
	}
	var query url.Values
	if opts != nil && opts.IncludeEffects != nil {
		query = url.Values{}
		if *opts.IncludeEffects {
			query.Set("includeEffects", "true")
		} else {
			query.Set("includeEffects", "false")
		}
	}
	var out RunTrail
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/trail"), query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
