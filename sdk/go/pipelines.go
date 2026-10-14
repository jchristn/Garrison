package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Pipeline run statuses (PipelineRun.Status). Succeeded, Failed, Cancelled, and TimedOut are terminal.
const (
	PipelineRunStatusRunning        = "Running"
	PipelineRunStatusAwaitingReview = "AwaitingReview"
	PipelineRunStatusCancelling     = "Cancelling"
	PipelineRunStatusSucceeded      = "Succeeded"
	PipelineRunStatusFailed         = "Failed"
	PipelineRunStatusCancelled      = "Cancelled"
	PipelineRunStatusTimedOut       = "TimedOut"
)

// Pipeline run outcomes (PipelineRun.Outcome). None while the pipeline run is active.
const (
	PipelineRunOutcomeNone             = "None"
	PipelineRunOutcomeSucceeded        = "Succeeded"
	PipelineRunOutcomeStageFailed      = "StageFailed"
	PipelineRunOutcomeStageStartFailed = "StageStartFailed"
	PipelineRunOutcomeReviewRejected   = "ReviewRejected"
	PipelineRunOutcomeReviewExpired    = "ReviewExpired"
	PipelineRunOutcomeCancelled        = "Cancelled"
	PipelineRunOutcomeTimedOut         = "TimedOut"
	PipelineRunOutcomeInternalError    = "InternalError"
)

// Pipeline run stage statuses (PipelineRunStage.Status).
const (
	PipelineStageStatusPending        = "Pending"
	PipelineStageStatusRunning        = "Running"
	PipelineStageStatusAwaitingReview = "AwaitingReview"
	PipelineStageStatusSucceeded      = "Succeeded"
	PipelineStageStatusFailed         = "Failed"
	PipelineStageStatusCancelled      = "Cancelled"
)

// Pipeline review statuses (PipelineReview.Status). Pending is the only state that can change.
const (
	PipelineReviewStatusPending          = "Pending"
	PipelineReviewStatusApproved         = "Approved"
	PipelineReviewStatusChangesRequested = "ChangesRequested"
	PipelineReviewStatusRejected         = "Rejected"
	PipelineReviewStatusExpired          = "Expired"
	PipelineReviewStatusCancelled        = "Cancelled"
)

// Pipeline review decisions (PipelineReviewDecideRequest.Decision, PipelineReview.Decision and TimeoutAction,
// PipelineStage.ReviewTimeoutAction).
const (
	PipelineReviewDecisionApprove        = "Approve"
	PipelineReviewDecisionRequestChanges = "RequestChanges"
	PipelineReviewDecisionReject         = "Reject"
)

// Pipeline review decision sources (PipelineReview.DecisionSource).
const (
	PipelineReviewSourceUser      = "User"
	PipelineReviewSourceTimeout   = "Timeout"
	PipelineReviewSourceCancelled = "Cancelled"
)

// Pipeline is an ordered list of agent stages with optional human review gates. Zero-valued optional fields are
// omitted when sent, so the server applies its defaults.
type Pipeline struct {
	ID          string  `json:"id,omitempty"`
	TenantID    string  `json:"tenantId,omitempty"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	// Version starts at 1 and advances on every update; started pipeline runs keep their snapshot.
	Version int `json:"version,omitempty"`
	// MaxDurationSeconds bounds a pipeline run, review waits included; 0 means no limit.
	MaxDurationSeconds int `json:"maxDurationSeconds,omitempty"`
	// Active defaults to true when nil; inactive pipelines cannot be started.
	Active        *bool           `json:"active,omitempty"`
	IsProtected   bool            `json:"isProtected,omitempty"`
	CreatedUTC    string          `json:"createdUtc,omitempty"`
	LastUpdateUTC string          `json:"lastUpdateUtc,omitempty"`
	Stages        []PipelineStage `json:"stages"`
}

// PipelineStage is one stage of a pipeline. Position comes from the order in Pipeline.Stages.
type PipelineStage struct {
	ID          string  `json:"id,omitempty"`
	PipelineID  string  `json:"pipelineId,omitempty"`
	TenantID    string  `json:"tenantId,omitempty"`
	Position    int     `json:"position,omitempty"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	// AgentID is the agent that runs the stage. Required.
	AgentID string `json:"agentId"`
	// DeploymentID pins a deployment of the agent; nil uses the agent's weighted selection.
	DeploymentID *string `json:"deploymentId,omitempty"`
	// HandoffTemplateID is a PipelineStage prompt template; nil uses the deployment binding, then the built-in.
	HandoffTemplateID *string `json:"handoffTemplateId,omitempty"`
	// HandoffTemplateVersion pins a template version; nil uses the current version.
	HandoffTemplateVersion *int `json:"handoffTemplateVersion,omitempty"`
	// OutputCharLimit cuts earlier stage output handed to this stage (1000 to 200000); 0 means 16000.
	OutputCharLimit int `json:"outputCharLimit,omitempty"`
	// MaxAttempts is attempts per execution (1 to 5); 0 means 1.
	MaxAttempts       int  `json:"maxAttempts,omitempty"`
	ContinueOnFailure bool `json:"continueOnFailure,omitempty"`
	RequiresReview    bool `json:"requiresReview,omitempty"`
	// ReviewTimeoutSeconds is how long a review waits; 0 waits forever.
	ReviewTimeoutSeconds int `json:"reviewTimeoutSeconds,omitempty"`
	// ReviewTimeoutAction is PipelineReviewDecisionApprove or PipelineReviewDecisionReject; empty means Reject.
	ReviewTimeoutAction string `json:"reviewTimeoutAction,omitempty"`
	// MaxRevisions is how many times a reviewer may request changes (0 to 10); nil means 3.
	MaxRevisions *int                     `json:"maxRevisions,omitempty"`
	Parameters   []PipelineStageParameter `json:"parameters,omitempty"`
}

// PipelineStageParameter is a run parameter override for a stage, validated against the deployment's allowed overrides.
type PipelineStageParameter struct {
	ID       string `json:"id,omitempty"`
	StageID  string `json:"stageId,omitempty"`
	TenantID string `json:"tenantId,omitempty"`
	Name     string `json:"name"`
	Value    string `json:"value"`
}

// PipelineRun is one execution of a pipeline. Detail reads carry Stages, Reviews, and Runs.
type PipelineRun struct {
	ID               string                    `json:"id"`
	TenantID         string                    `json:"tenantId"`
	PipelineID       string                    `json:"pipelineId"`
	PipelineName     string                    `json:"pipelineName"`
	PipelineVersion  int                       `json:"pipelineVersion"`
	Status           string                    `json:"status"`
	Outcome          string                    `json:"outcome"`
	CurrentPosition  int                       `json:"currentPosition"`
	StageCount       int                       `json:"stageCount"`
	CasVersion       int                       `json:"casVersion"`
	InputText        string                    `json:"inputText"`
	InputContentType string                    `json:"inputContentType"`
	CallerType       string                    `json:"callerType"`
	CallerID         *string                   `json:"callerId"`
	CallerName       *string                   `json:"callerName"`
	IdempotencyKey   *string                   `json:"idempotencyKey"`
	Priority         int                       `json:"priority"`
	FinalRunID       *string                   `json:"finalRunId"`
	ErrorMessage     *string                   `json:"errorMessage"`
	DeadlineUTC      *string                   `json:"deadlineUtc"`
	CancelRequested  bool                      `json:"cancelRequested"`
	TraceParent      *string                   `json:"traceParent"`
	StartedUTC       *string                   `json:"startedUtc"`
	CompletedUTC     *string                   `json:"completedUtc"`
	CreatedUTC       string                    `json:"createdUtc"`
	LastUpdateUTC    string                    `json:"lastUpdateUtc"`
	Stages           []PipelineRunStage        `json:"stages"`
	Reviews          []PipelineReview          `json:"reviews"`
	Runs             []PipelineStageRunSummary `json:"runs"`
}

// PipelineRunStage is a stage snapshot taken when the pipeline run started, with its progress.
type PipelineRunStage struct {
	ID                     string                      `json:"id"`
	PipelineRunID          string                      `json:"pipelineRunId"`
	TenantID               string                      `json:"tenantId"`
	Position               int                         `json:"position"`
	Name                   string                      `json:"name"`
	Description            *string                     `json:"description"`
	AgentID                string                      `json:"agentId"`
	AgentName              string                      `json:"agentName"`
	DeploymentID           *string                     `json:"deploymentId"`
	HandoffTemplateID      *string                     `json:"handoffTemplateId"`
	HandoffTemplateVersion *int                        `json:"handoffTemplateVersion"`
	OutputCharLimit        int                         `json:"outputCharLimit"`
	MaxAttempts            int                         `json:"maxAttempts"`
	ContinueOnFailure      bool                        `json:"continueOnFailure"`
	RequiresReview         bool                        `json:"requiresReview"`
	ReviewTimeoutSeconds   int                         `json:"reviewTimeoutSeconds"`
	ReviewTimeoutAction    string                      `json:"reviewTimeoutAction"`
	MaxRevisions           int                         `json:"maxRevisions"`
	Status                 string                      `json:"status"`
	Executions             int                         `json:"executions"`
	Attempts               int                         `json:"attempts"`
	Revisions              int                         `json:"revisions"`
	CurrentRunID           *string                     `json:"currentRunId"`
	LastRunID              *string                     `json:"lastRunId"`
	BlockedReason          *string                     `json:"blockedReason"`
	NextAttemptUTC         *string                     `json:"nextAttemptUtc"`
	StartedUTC             *string                     `json:"startedUtc"`
	CompletedUTC           *string                     `json:"completedUtc"`
	Parameters             []PipelineRunStageParameter `json:"parameters"`
}

// PipelineRunStageParameter is a snapshot of a stage parameter.
type PipelineRunStageParameter struct {
	ID         string `json:"id"`
	RunStageID string `json:"runStageId"`
	TenantID   string `json:"tenantId"`
	Name       string `json:"name"`
	Value      string `json:"value"`
}

// PipelineReview is a human review gate on one execution of a stage.
type PipelineReview struct {
	ID             string  `json:"id"`
	TenantID       string  `json:"tenantId"`
	PipelineRunID  string  `json:"pipelineRunId"`
	PipelineID     string  `json:"pipelineId"`
	PipelineName   string  `json:"pipelineName"`
	RunStageID     string  `json:"runStageId"`
	Position       int     `json:"position"`
	StageName      string  `json:"stageName"`
	RunID          string  `json:"runId"`
	Execution      int     `json:"execution"`
	Status         string  `json:"status"`
	Decision       *string `json:"decision"`
	DecisionSource *string `json:"decisionSource"`
	Comment        *string `json:"comment"`
	DecidedBy      *string `json:"decidedBy"`
	DecidedByID    *string `json:"decidedById"`
	TimeoutAction  string  `json:"timeoutAction"`
	RequestedUTC   string  `json:"requestedUtc"`
	ExpiresUTC     *string `json:"expiresUtc"`
	DecidedUTC     *string `json:"decidedUtc"`
	CreatedUTC     string  `json:"createdUtc"`
	LastUpdateUTC  string  `json:"lastUpdateUtc"`
}

// PipelineStageRunSummary summarizes one stage run of a pipeline run.
type PipelineStageRunSummary struct {
	RunID        string  `json:"runId"`
	Position     int     `json:"position"`
	Execution    int     `json:"execution"`
	AgentName    string  `json:"agentName"`
	Status       string  `json:"status"`
	Outcome      *string `json:"outcome"`
	ErrorMessage *string `json:"errorMessage"`
	CreatedUTC   string  `json:"createdUtc"`
	CompletedUTC *string `json:"completedUtc"`
}

// PipelineStartRequest is the body of POST .../pipelines/{id}/start.
type PipelineStartRequest struct {
	// Input is the caller's task, given to every stage.
	Input string `json:"input"`
	// InputContentType is the media type of Input; empty means text/plain.
	InputContentType string `json:"inputContentType,omitempty"`
	Priority         int    `json:"priority,omitempty"`
	// Wait waits up to WaitSeconds (0 to 600; 0 means 60) until the pipeline run ends or waits for a review.
	Wait        bool `json:"wait,omitempty"`
	WaitSeconds int  `json:"waitSeconds,omitempty"`
}

// PipelinePreviewRequest is the body of POST .../pipelines/{id}/preview.
type PipelinePreviewRequest struct {
	// Input is the sample caller input.
	Input string `json:"input"`
	// SampleOutputs are sample outputs of the earlier stages, by position.
	SampleOutputs []string `json:"sampleOutputs,omitempty"`
}

// PipelinePreviewResponse holds every stage prompt rendered from sample input, secrets redacted.
type PipelinePreviewResponse struct {
	PipelineID   string                 `json:"pipelineId"`
	PipelineName string                 `json:"pipelineName"`
	Stages       []PipelinePreviewStage `json:"stages"`
}

// PipelinePreviewStage is one rendered stage prompt, or the error that stopped it.
type PipelinePreviewStage struct {
	Position       int     `json:"position"`
	StageName      string  `json:"stageName"`
	AgentName      string  `json:"agentName"`
	DeploymentID   *string `json:"deploymentId"`
	DeploymentName *string `json:"deploymentName"`
	Success        bool    `json:"success"`
	Prompt         *string `json:"prompt"`
	ErrorCode      *string `json:"errorCode"`
	ErrorMessage   *string `json:"errorMessage"`
}

// PipelineReviewDecideRequest is the body of POST .../pipeline-reviews/{id}/decide.
type PipelineReviewDecideRequest struct {
	// Decision is a PipelineReviewDecision* constant. Required.
	Decision string `json:"decision"`
	// Comment is at most 8000 characters; required for RequestChanges. Approve notes reach the next stage.
	Comment string `json:"comment,omitempty"`
}

// PipelineRunFilter filters pipeline run listings. Empty fields are omitted. FromUTC and ToUTC are ISO 8601 UTC times.
type PipelineRunFilter struct {
	PipelineID, Status, CallerID, FromUTC, ToUTC, Ordering string
	MaxResults, Skip                                       int
}

// PipelineReviewFilter filters pipeline review listings. Empty fields are omitted.
type PipelineReviewFilter struct {
	Status, PipelineRunID, PipelineID, RunID, DecisionSource, FromUTC, ToUTC, Ordering string
	MaxResults, Skip                                                                   int
}

// PipelinesClient manages pipeline definitions (List, Get, Create, Update, Delete from Resource accept an
// identifier or a name) and starts and previews them.
type PipelinesClient struct{ Resource }

// Start starts a pipeline (identifier or name). A non-empty idempotencyKey is sent as the Idempotency-Key header:
// repeating a start with the same key and content returns the same pipeline run. Starting needs Agent Execute on
// every stage agent.
func (p *PipelinesClient) Start(ctx context.Context, pipeline string, req PipelineStartRequest, idempotencyKey string) (*PipelineRun, error) {
	var out PipelineRun
	headers := map[string]string{"Idempotency-Key": idempotencyKey}
	if err := p.c.doWithHeaders(ctx, http.MethodPost, p.item(pipeline)+"/start", nil, headers, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Preview renders every stage prompt from sample input and sample earlier outputs.
func (p *PipelinesClient) Preview(ctx context.Context, pipeline string, req PipelinePreviewRequest) (*PipelinePreviewResponse, error) {
	var out PipelinePreviewResponse
	if err := p.c.Do(ctx, http.MethodPost, p.item(pipeline)+"/preview", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// PipelineRunsClient lists, reads, cancels, retries, and deletes pipeline runs.
type PipelineRunsClient struct{ c *Client }

func (r *PipelineRunsClient) item(id string) string {
	return r.c.TenantPath("/pipeline-runs/" + url.PathEscape(id))
}

// List returns a page of pipeline runs, newest first unless Ordering says otherwise.
func (r *PipelineRunsClient) List(ctx context.Context, f PipelineRunFilter) (*EnumerationResult[PipelineRun], error) {
	q := url.Values{}
	set := func(k, v string) {
		if v != "" {
			q.Set(k, v)
		}
	}
	set("pipelineId", f.PipelineID)
	set("status", f.Status)
	set("callerId", f.CallerID)
	set("fromUtc", f.FromUTC)
	set("toUtc", f.ToUTC)
	set("ordering", f.Ordering)
	if f.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(f.MaxResults))
	}
	if f.Skip > 0 {
		q.Set("skip", strconv.Itoa(f.Skip))
	}
	var out EnumerationResult[PipelineRun]
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/pipeline-runs"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a pipeline run with its stages, stage run summaries, and reviews. A waitSeconds above 0 (at most 600)
// waits until the pipeline run ends or waits for a review.
func (r *PipelineRunsClient) Get(ctx context.Context, id string, waitSeconds int) (*PipelineRun, error) {
	var q url.Values
	if waitSeconds > 0 {
		q = url.Values{"waitSeconds": {strconv.Itoa(waitSeconds)}}
	}
	var out PipelineRun
	if err := r.c.Do(ctx, http.MethodGet, r.item(id), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Cancel cancels an active pipeline run, its pending review, and its current stage run.
func (r *PipelineRunsClient) Cancel(ctx context.Context, id string) (*PipelineRun, error) {
	var out PipelineRun
	if err := r.c.Do(ctx, http.MethodPost, r.item(id)+"/cancel", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Retry resumes a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped.
func (r *PipelineRunsClient) Retry(ctx context.Context, id string) (*PipelineRun, error) {
	var out PipelineRun
	if err := r.c.Do(ctx, http.MethodPost, r.item(id)+"/retry", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete removes a finished pipeline run and its reviews (stage runs are kept). Active pipeline runs answer 409.
func (r *PipelineRunsClient) Delete(ctx context.Context, id string) error {
	return r.c.Do(ctx, http.MethodDelete, r.item(id), nil, nil, nil)
}

// PipelineReviewsClient lists, reads, and decides pipeline stage reviews.
type PipelineReviewsClient struct{ c *Client }

func (r *PipelineReviewsClient) item(id string) string {
	return r.c.TenantPath("/pipeline-reviews/" + url.PathEscape(id))
}

// List returns a page of reviews, newest first unless Ordering says otherwise.
func (r *PipelineReviewsClient) List(ctx context.Context, f PipelineReviewFilter) (*EnumerationResult[PipelineReview], error) {
	q := url.Values{}
	set := func(k, v string) {
		if v != "" {
			q.Set(k, v)
		}
	}
	set("status", f.Status)
	set("pipelineRunId", f.PipelineRunID)
	set("pipelineId", f.PipelineID)
	set("runId", f.RunID)
	set("decisionSource", f.DecisionSource)
	set("fromUtc", f.FromUTC)
	set("toUtc", f.ToUTC)
	set("ordering", f.Ordering)
	if f.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(f.MaxResults))
	}
	if f.Skip > 0 {
		q.Set("skip", strconv.Itoa(f.Skip))
	}
	var out EnumerationResult[PipelineReview]
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/pipeline-reviews"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads one review.
func (r *PipelineReviewsClient) Get(ctx context.Context, id string) (*PipelineReview, error) {
	var out PipelineReview
	if err := r.c.Do(ctx, http.MethodGet, r.item(id), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Decide decides a pending review. The server answers 409 ReviewNotPending when it was already decided and 409
// RevisionLimitReached when the stage used all its revisions.
func (r *PipelineReviewsClient) Decide(ctx context.Context, id string, req PipelineReviewDecideRequest) (*PipelineReview, error) {
	var out PipelineReview
	if err := r.c.Do(ctx, http.MethodPost, r.item(id)+"/decide", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
