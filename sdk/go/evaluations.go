package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Eval set states (EvalSet.State). A Draft may be edited; an Approved version is immutable, and editing it creates
// the next version as a Draft. Only an Approved set gates a promotion or a change rule.
const (
	EvalSetStateDraft    = "Draft"
	EvalSetStateApproved = "Approved"
)

// Eval set origins (EvalSet.Origin): Human (written by a person), Evaluator (written by an evaluator agent; a run
// token's set always has this origin), or Playground (assembled from studio playground runs).
const (
	EvalSetOriginHuman      = "Human"
	EvalSetOriginEvaluator  = "Evaluator"
	EvalSetOriginPlayground = "Playground"
)

// Eval scorers (EvalCaseCheck.Scorer). ExactMatch compares the trimmed output with the argument (or the case's
// expected text); Contains looks for it in the output; JsonSchemaValid validates the output against the JSON Schema
// in the argument; Judge asks the set's judge agent, with the argument as the criteria.
const (
	EvalScorerExactMatch      = "ExactMatch"
	EvalScorerContains        = "Contains"
	EvalScorerJSONSchemaValid = "JsonSchemaValid"
	EvalScorerJudge           = "Judge"
)

// Eval run statuses (EvalRun.Status). Completed runs have a score and Passed; Failed runs carry FailureReason.
const (
	EvalRunStatusPending   = "Pending"
	EvalRunStatusRunning   = "Running"
	EvalRunStatusCompleted = "Completed"
	EvalRunStatusFailed    = "Failed"
	EvalRunStatusCancelled = "Cancelled"
)

// Eval run targets (EvalRun.TargetType): an agent revision run on an ephemeral deployment, or a deployment as it is
// configured now.
const (
	EvalRunTargetAgentRevision = "AgentRevision"
	EvalRunTargetDeployment    = "Deployment"
)

// Eval run input modes (EvalRun.InputMode): Cases runs each case of the set in order; RecentInputs replays the
// inputs of the target deployment's most recent finished runs (RecentInputCount of them), scored with the set's checks.
const (
	EvalRunInputModeCases        = "Cases"
	EvalRunInputModeRecentInputs = "RecentInputs"
)

// Shadow trial statuses (ShadowTrial.Status). Stopped means a person stopped it; Failed carries StopReason.
const (
	ShadowTrialStatusRunning   = "Running"
	ShadowTrialStatusCompleted = "Completed"
	ShadowTrialStatusStopped   = "Stopped"
	ShadowTrialStatusFailed    = "Failed"
)

// Canary release statuses (CanaryRelease.Status). RolledBack means a threshold was crossed and weights were
// restored (NotificationEventCanaryRolledBack fires); Aborted means a person aborted it.
const (
	CanaryStatusRunning    = "Running"
	CanaryStatusPromoted   = "Promoted"
	CanaryStatusRolledBack = "RolledBack"
	CanaryStatusAborted    = "Aborted"
)

// Resource type names of the evaluation resources in permissions and the operation scope map.
const (
	ResourceTypeEvalSet       = "EvalSet"
	ResourceTypeEvalRun       = "EvalRun"
	ResourceTypeShadowTrial   = "ShadowTrial"
	ResourceTypeCanaryRelease = "CanaryRelease"
)

// EvalCaseCheck is one scorer applied to a case's output. Scorer is an EvalScorer constant. Argument is the text to
// match, the JSON Schema, or the judging criteria; empty for ExactMatch and Contains means the case's expected text.
// Weight is 0 to 100 (default 1 when nil); values outside are clamped with a ValueClamped warning.
type EvalCaseCheck struct {
	Scorer   string         `json:"scorer"`
	Argument *string        `json:"argument,omitempty"`
	Weight   *float64       `json:"weight,omitempty"`
	Warnings []FieldWarning `json:"warnings,omitempty"`
}

// EvalCaseFile is a file placed in the case run's workspace: inline ContentText, or an agent asset (AssetID and
// AssetPath).
type EvalCaseFile struct {
	Path        string  `json:"path"`
	MediaType   *string `json:"mediaType,omitempty"`
	ContentText *string `json:"contentText,omitempty"`
	AssetID     *string `json:"assetId,omitempty"`
	AssetPath   *string `json:"assetPath,omitempty"`
}

// EvalCase is one input of an eval set with its checks. ID has the prefix evc_; Order is assigned by the server.
// InputText is required (InputRequired). A case without checks is scored ExactMatch against ExpectedText, or by the
// judge when it has no expected text. Hidden cases are redacted for run tokens (scorers only). Name is at most 256
// characters.
type EvalCase struct {
	ID            string          `json:"id,omitempty"`
	TenantID      string          `json:"tenantId,omitempty"`
	SetID         string          `json:"setId,omitempty"`
	Order         int             `json:"order"`
	Name          *string         `json:"name,omitempty"`
	InputText     string          `json:"inputText"`
	Hidden        bool            `json:"hidden"`
	ExpectedText  *string         `json:"expectedText,omitempty"`
	Checks        []EvalCaseCheck `json:"checks"`
	Files         []EvalCaseFile  `json:"files"`
	SourceRunID   *string         `json:"sourceRunId,omitempty"`
	Warnings      []FieldWarning  `json:"warnings,omitempty"`
	CreatedUTC    string          `json:"createdUtc,omitempty"`
	LastUpdateUTC string          `json:"lastUpdateUtc,omitempty"`
}

// EvalSet is one version of a named eval set. ID has the prefix evs_. State is an EvalSetState constant and Origin an
// EvalSetOrigin constant. JudgeAgent names the agent that scores Judge checks. CaseCount is filled on read.
type EvalSet struct {
	ID                 string   `json:"id"`
	TenantID           string   `json:"tenantId"`
	Name               string   `json:"name"`
	Description        *string  `json:"description,omitempty"`
	Version            int      `json:"version"`
	PreviousVersionID  *string  `json:"previousVersionId,omitempty"`
	State              string   `json:"state"`
	Origin             string   `json:"origin"`
	ApprovedByID       *string  `json:"approvedById,omitempty"`
	ApprovedByName     *string  `json:"approvedByName,omitempty"`
	ApprovedUTC        *string  `json:"approvedUtc,omitempty"`
	AuthoringOrgUnitID *string  `json:"authoringOrgUnitId,omitempty"`
	AuthoredByType     string   `json:"authoredByType,omitempty"`
	AuthoredByID       *string  `json:"authoredById,omitempty"`
	AuthoredByName     *string  `json:"authoredByName,omitempty"`
	AuthoredByAgentID  *string  `json:"authoredByAgentId,omitempty"`
	JudgeAgent         *string  `json:"judgeAgent,omitempty"`
	Tags               []string `json:"tags"`
	CaseCount          int      `json:"caseCount"`
	CreatedUTC         string   `json:"createdUtc,omitempty"`
	LastUpdateUTC      string   `json:"lastUpdateUtc,omitempty"`
}

// EvalSetRequest creates an eval set (Name, 1 to 128 characters, and optional Cases) or edits one (Description, at
// most 2000 characters; JudgeAgent, at most 128; Tags, each at most 64). Origin is Human or Playground for a person;
// Evaluator is refused (EvaluatorIsForAgents). Editing an approved version answers with its next version, a draft.
type EvalSetRequest struct {
	Name        *string    `json:"name,omitempty"`
	Description *string    `json:"description,omitempty"`
	Origin      *string    `json:"origin,omitempty"`
	JudgeAgent  *string    `json:"judgeAgent,omitempty"`
	Tags        []string   `json:"tags,omitempty"`
	Cases       []EvalCase `json:"cases,omitempty"`
}

// EvalSetFilter filters EvalSets.List; empty fields are not sent. State is an EvalSetState constant and Origin an
// EvalSetOrigin constant. LatestOnly returns the newest version of each name.
type EvalSetFilter struct {
	State      string
	Origin     string
	Tag        string
	LatestOnly bool
	Search     string
	MaxResults int
	Skip       int
}

// EvalRunRequest starts an eval run. SetID is an eval set identifier or name (SetRequired); SetVersion picks a
// version (nil for the newest). TargetType is an EvalRunTarget constant (nil infers it: DeploymentID means
// Deployment). AgentID with AgentRevisionID evaluates a revision; StudioDraftID evaluates a studio draft. InputMode is
// an EvalRunInputMode constant (default Cases); RecentInputCount is 1 to 1000 (default 20). Threshold is 0 to 1 (nil
// for the server default) and BudgetUsd 0 to 100000 (nil for no budget). Needs Execute on the agent too.
type EvalRunRequest struct {
	SetID            string   `json:"setId"`
	SetVersion       *int     `json:"setVersion,omitempty"`
	TargetType       *string  `json:"targetType,omitempty"`
	AgentID          *string  `json:"agentId,omitempty"`
	AgentRevisionID  *string  `json:"agentRevisionId,omitempty"`
	DeploymentID     *string  `json:"deploymentId,omitempty"`
	StudioDraftID    *string  `json:"studioDraftId,omitempty"`
	InputMode        *string  `json:"inputMode,omitempty"`
	RecentInputCount *int     `json:"recentInputCount,omitempty"`
	Threshold        *float64 `json:"threshold,omitempty"`
	BudgetUsd        *float64 `json:"budgetUsd,omitempty"`
}

// EvalRun is one run of an eval set against a target. ID has the prefix evr_. Status is an EvalRunStatus constant;
// Score (0 to 1) is the check-weighted mean of case scores, and Passed is Score >= Threshold once Completed.
type EvalRun struct {
	ID               string   `json:"id"`
	TenantID         string   `json:"tenantId"`
	SetID            string   `json:"setId"`
	SetName          string   `json:"setName"`
	SetVersion       int      `json:"setVersion"`
	TargetType       string   `json:"targetType"`
	AgentID          *string  `json:"agentId,omitempty"`
	AgentRevisionID  *string  `json:"agentRevisionId,omitempty"`
	DeploymentID     *string  `json:"deploymentId,omitempty"`
	StudioDraftID    *string  `json:"studioDraftId,omitempty"`
	Status           string   `json:"status"`
	InputMode        string   `json:"inputMode"`
	RecentInputCount int      `json:"recentInputCount"`
	Score            *float64 `json:"score,omitempty"`
	Threshold        *float64 `json:"threshold,omitempty"`
	Passed           *bool    `json:"passed,omitempty"`
	BudgetUsd        *float64 `json:"budgetUsd,omitempty"`
	CostUsd          float64  `json:"costUsd"`
	TotalCases       int      `json:"totalCases"`
	CompletedCases   int      `json:"completedCases"`
	PassedCases      int      `json:"passedCases"`
	ErroredCases     int      `json:"erroredCases"`
	FailureReason    *string  `json:"failureReason,omitempty"`
	StartedByType    string   `json:"startedByType,omitempty"`
	StartedByID      *string  `json:"startedById,omitempty"`
	StartedByName    *string  `json:"startedByName,omitempty"`
	OriginRunID      *string  `json:"originRunId,omitempty"`
	// TriggerID is the EvalSet trigger that started the run as a scheduled check, or nil.
	TriggerID     *string        `json:"triggerId,omitempty"`
	Warnings      []FieldWarning `json:"warnings,omitempty"`
	CreatedUTC    string         `json:"createdUtc,omitempty"`
	StartedUTC    *string        `json:"startedUtc,omitempty"`
	CompletedUTC  *string        `json:"completedUtc,omitempty"`
	LastUpdateUTC string         `json:"lastUpdateUtc,omitempty"`
}

// EvalCaseCheckResult is the outcome of one check on a case's output: Score 0 to 1, Passed, the judge run for a
// Judge check, and the scorer's Note.
type EvalCaseCheckResult struct {
	Scorer     string  `json:"scorer"`
	Weight     float64 `json:"weight"`
	Score      float64 `json:"score"`
	Passed     bool    `json:"passed"`
	JudgeRunID *string `json:"judgeRunId,omitempty"`
	Note       *string `json:"note,omitempty"`
}

// EvalCaseResult is the outcome of one case of an eval run. ID has the prefix evx_. RunID is the case's Eval run;
// OutputText its output (nil for a hidden case seen by a run token).
type EvalCaseResult struct {
	ID           string                `json:"id"`
	TenantID     string                `json:"tenantId"`
	EvalRunID    string                `json:"evalRunId"`
	CaseID       *string               `json:"caseId,omitempty"`
	Order        int                   `json:"order"`
	SourceRunID  *string               `json:"sourceRunId,omitempty"`
	RunID        *string               `json:"runId,omitempty"`
	OutputText   *string               `json:"outputText,omitempty"`
	Score        float64               `json:"score"`
	Passed       bool                  `json:"passed"`
	ErrorMessage *string               `json:"errorMessage,omitempty"`
	CostUsd      float64               `json:"costUsd"`
	CheckResults []EvalCaseCheckResult `json:"checkResults"`
	CreatedUTC   string                `json:"createdUtc,omitempty"`
}

// EvalRunFilter filters EvalRuns.List; empty fields are not sent. Set is an eval set identifier or name; Status is an
// EvalRunStatus constant.
type EvalRunFilter struct {
	Set        string
	Deployment string
	Revision   string
	Status     string
	MaxResults int
	Skip       int
}

// ShadowTrial copies a sample of a source deployment's inputs to a candidate deployment of the same agent as Shadow
// runs that cannot act, and compares the outputs. ID has the prefix shd_. In a request SourceDeploymentID and
// CandidateDeploymentID take an identifier or a name; SamplePercent is 1 to 100 (default 10 when zero); EndsUTC nil
// runs until stopped and must otherwise be in the future (EndsInPast); Name is at most 128 characters. Status is a
// ShadowTrialStatus constant.
type ShadowTrial struct {
	ID                    string         `json:"id,omitempty"`
	TenantID              string         `json:"tenantId,omitempty"`
	Name                  *string        `json:"name,omitempty"`
	AgentID               *string        `json:"agentId,omitempty"`
	SourceDeploymentID    string         `json:"sourceDeploymentId"`
	CandidateDeploymentID string         `json:"candidateDeploymentId"`
	SamplePercent         int            `json:"samplePercent,omitempty"`
	EndsUTC               *string        `json:"endsUtc,omitempty"`
	ComparisonEvalSetID   *string        `json:"comparisonEvalSetId,omitempty"`
	UseJudge              bool           `json:"useJudge"`
	Status                string         `json:"status,omitempty"`
	StopReason            *string        `json:"stopReason,omitempty"`
	ComparedCount         int64          `json:"comparedCount"`
	AgreedCount           int64          `json:"agreedCount"`
	DivergedCount         int64          `json:"divergedCount"`
	CandidateFailureCount int64          `json:"candidateFailureCount"`
	CreatedByType         string         `json:"createdByType,omitempty"`
	CreatedByID           *string        `json:"createdById,omitempty"`
	CreatedByName         *string        `json:"createdByName,omitempty"`
	Warnings              []FieldWarning `json:"warnings,omitempty"`
	CreatedUTC            string         `json:"createdUtc,omitempty"`
	CompletedUTC          *string        `json:"completedUtc,omitempty"`
	LastUpdateUTC         string         `json:"lastUpdateUtc,omitempty"`
}

// ShadowTrialFilter filters ShadowTrials.List; empty fields are not sent. Status is a ShadowTrialStatus constant.
type ShadowTrialFilter struct {
	Source     string
	Candidate  string
	Status     string
	MaxResults int
	Skip       int
}

// CanaryReleaseStep is one step of a canary release: the candidate receives WeightPercent (1 to 100) of the agent's
// traffic until it has MinimumRuns (0 to 1000000, default 20) runs and MinimumMinutes (0 to 43200, default 10)
// minutes have passed. Weights must rise and the last step must be 100 (NotIncreasing, LastStepNotFull).
type CanaryReleaseStep struct {
	WeightPercent  int            `json:"weightPercent"`
	MinimumRuns    int            `json:"minimumRuns"`
	MinimumMinutes int            `json:"minimumMinutes"`
	Warnings       []FieldWarning `json:"warnings,omitempty"`
}

// CanaryRelease moves an agent's traffic from a baseline deployment to a candidate in steps, rolling back when the
// candidate's error rate exceeds MaxErrorRatePercent (0 to 100, default 5) or its newest eval score on EvalSetID drops
// below MinEvalScore (0 to 1; give both or neither, EvalGateIncomplete). ID has the prefix cnr_. In a request AgentID,
// CandidateDeploymentID, and BaselineDeploymentID take an identifier or a name. The initial weights are recorded by
// the server and restored on rollback or abort. Status is a CanaryStatus constant.
type CanaryRelease struct {
	ID                     string              `json:"id,omitempty"`
	TenantID               string              `json:"tenantId,omitempty"`
	AgentID                string              `json:"agentId"`
	CandidateDeploymentID  string              `json:"candidateDeploymentId"`
	BaselineDeploymentID   string              `json:"baselineDeploymentId"`
	BaselineInitialWeight  int                 `json:"baselineInitialWeight,omitempty"`
	CandidateInitialWeight int                 `json:"candidateInitialWeight,omitempty"`
	Steps                  []CanaryReleaseStep `json:"steps"`
	CurrentStepIndex       int                 `json:"currentStepIndex"`
	StepStartedUTC         *string             `json:"stepStartedUtc,omitempty"`
	MaxErrorRatePercent    *float64            `json:"maxErrorRatePercent,omitempty"`
	MinEvalScore           *float64            `json:"minEvalScore,omitempty"`
	EvalSetID              *string             `json:"evalSetId,omitempty"`
	Status                 string              `json:"status,omitempty"`
	RollbackReason         *string             `json:"rollbackReason,omitempty"`
	CreatedByType          string              `json:"createdByType,omitempty"`
	CreatedByID            *string             `json:"createdById,omitempty"`
	CreatedByName          *string             `json:"createdByName,omitempty"`
	Warnings               []FieldWarning      `json:"warnings,omitempty"`
	CreatedUTC             string              `json:"createdUtc,omitempty"`
	CompletedUTC           *string             `json:"completedUtc,omitempty"`
	LastUpdateUTC          string              `json:"lastUpdateUtc,omitempty"`
}

// CanaryReleaseFilter filters CanaryReleases.List; empty fields are not sent. Status is a CanaryStatus constant.
type CanaryReleaseFilter struct {
	Agent      string
	Status     string
	MaxResults int
	Skip       int
}

type reasonBody struct {
	Reason *string `json:"reason,omitempty"`
}

func reasonOf(reason string) reasonBody {
	if reason == "" {
		return reasonBody{}
	}
	return reasonBody{Reason: &reason}
}

func pageQuery(q url.Values, maxResults, skip int) {
	if maxResults > 0 {
		q.Set("maxResults", strconv.Itoa(maxResults))
	}
	if skip > 0 {
		q.Set("skip", strconv.Itoa(skip))
	}
}

func setIf(q url.Values, key, value string) {
	if value != "" {
		q.Set(key, value)
	}
}

// EvalSetsClient manages eval sets and their cases. Read, Create, Update, and Delete on EvalSet; approving is people
// only (403 ApprovalIsPeopleOnly for a run token). A set is addressed by its evs_ identifier or by name (the newest
// version). An approved version is immutable: editing it, or adding, changing, or removing a case, lands on its next
// version, a draft.
type EvalSetsClient struct{ c *Client }

func (e *EvalSetsClient) path(set string) string {
	return e.c.TenantPath("/eval-sets/" + url.PathEscape(set))
}

// List returns a page of eval set versions, newest first.
func (e *EvalSetsClient) List(ctx context.Context, filter EvalSetFilter) (*EnumerationResult[EvalSet], error) {
	q := url.Values{}
	setIf(q, "state", filter.State)
	setIf(q, "origin", filter.Origin)
	setIf(q, "tag", filter.Tag)
	if filter.LatestOnly {
		q.Set("latestOnly", "true")
	}
	setIf(q, "search", filter.Search)
	pageQuery(q, filter.MaxResults, filter.Skip)
	var out EnumerationResult[EvalSet]
	if err := e.c.Do(ctx, http.MethodGet, e.c.TenantPath("/eval-sets"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads an eval set version by identifier, or the newest version of a name.
func (e *EvalSetsClient) Get(ctx context.Context, set string) (*EvalSet, error) {
	var out EvalSet
	if err := e.c.Do(ctx, http.MethodGet, e.path(set), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create stores version 1 of an eval set with its cases (409 EvalSetExists when the name is taken).
func (e *EvalSetsClient) Create(ctx context.Context, request EvalSetRequest) (*EvalSet, error) {
	var out EvalSet
	if err := e.c.Do(ctx, http.MethodPost, e.c.TenantPath("/eval-sets"), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update edits a set's description, judge agent, and tags; an approved version answers with its next version.
func (e *EvalSetsClient) Update(ctx context.Context, set string, request EvalSetRequest) (*EvalSet, error) {
	var out EvalSet
	if err := e.c.Do(ctx, http.MethodPut, e.path(set), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete removes a draft version (409 EvalSetImmutable for an approved version).
func (e *EvalSetsClient) Delete(ctx context.Context, set string) error {
	return e.c.Do(ctx, http.MethodDelete, e.path(set), nil, nil, nil)
}

// Approve approves a draft version so it can gate promotions (409 AlreadyApproved or EvalSetEmpty).
func (e *EvalSetsClient) Approve(ctx context.Context, set string) (*EvalSet, error) {
	var out EvalSet
	if err := e.c.Do(ctx, http.MethodPost, e.path(set)+"/approve", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListCases returns a set version's cases in order (run tokens see hidden cases redacted).
func (e *EvalSetsClient) ListCases(ctx context.Context, set string) ([]EvalCase, error) {
	var out []EvalCase
	if err := e.c.Do(ctx, http.MethodGet, e.path(set)+"/cases", nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// CreateCase adds a case at the end; on an approved version it lands on the next version.
func (e *EvalSetsClient) CreateCase(ctx context.Context, set string, item EvalCase) (*EvalCase, error) {
	var out EvalCase
	if err := e.c.Do(ctx, http.MethodPost, e.path(set)+"/cases", nil, item, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetCase reads a case.
func (e *EvalSetsClient) GetCase(ctx context.Context, set, caseID string) (*EvalCase, error) {
	var out EvalCase
	if err := e.c.Do(ctx, http.MethodGet, e.path(set)+"/cases/"+url.PathEscape(caseID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UpdateCase replaces a case; on an approved version the same case of the next version changes.
func (e *EvalSetsClient) UpdateCase(ctx context.Context, set, caseID string, item EvalCase) (*EvalCase, error) {
	var out EvalCase
	if err := e.c.Do(ctx, http.MethodPut, e.path(set)+"/cases/"+url.PathEscape(caseID), nil, item, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteCase removes a case and answers with the draft version it was removed from.
func (e *EvalSetsClient) DeleteCase(ctx context.Context, set, caseID string) (*EvalSet, error) {
	var out EvalSet
	if err := e.c.Do(ctx, http.MethodDelete, e.path(set)+"/cases/"+url.PathEscape(caseID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// EvalRunsClient starts, reads, and cancels eval runs. Read on EvalRun; starting and cancelling need Execute on
// EvalRun and on the agent. Each case runs as a Run with Kind RunKindEval and EvalRunID set.
type EvalRunsClient struct{ c *Client }

func (e *EvalRunsClient) path(id string) string {
	return e.c.TenantPath("/eval-runs/" + url.PathEscape(id))
}

// List returns a page of eval runs, newest first.
func (e *EvalRunsClient) List(ctx context.Context, filter EvalRunFilter) (*EnumerationResult[EvalRun], error) {
	q := url.Values{}
	setIf(q, "set", filter.Set)
	setIf(q, "deployment", filter.Deployment)
	setIf(q, "revision", filter.Revision)
	setIf(q, "status", filter.Status)
	pageQuery(q, filter.MaxResults, filter.Skip)
	var out EnumerationResult[EvalRun]
	if err := e.c.Do(ctx, http.MethodGet, e.c.TenantPath("/eval-runs"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create starts an eval run of a set against a deployment or an agent revision. It answers Pending; poll Get.
func (e *EvalRunsClient) Create(ctx context.Context, request EvalRunRequest) (*EvalRun, error) {
	var out EvalRun
	if err := e.c.Do(ctx, http.MethodPost, e.c.TenantPath("/eval-runs"), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads an eval run with its score and counts.
func (e *EvalRunsClient) Get(ctx context.Context, id string) (*EvalRun, error) {
	var out EvalRun
	if err := e.c.Do(ctx, http.MethodGet, e.path(id), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Results returns an eval run's case results with per-check scores and notes.
func (e *EvalRunsClient) Results(ctx context.Context, id string) ([]EvalCaseResult, error) {
	var out []EvalCaseResult
	if err := e.c.Do(ctx, http.MethodGet, e.path(id)+"/results", nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// Cancel cancels a pending or running eval run and its unfinished case runs (409 EvalRunFinished once finished).
// Reason may be empty.
func (e *EvalRunsClient) Cancel(ctx context.Context, id, reason string) (*EvalRun, error) {
	var out EvalRun
	if err := e.c.Do(ctx, http.MethodPost, e.path(id)+"/cancel", nil, reasonOf(reason), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ShadowTrialsClient starts, reads, and stops shadow trials. People only: a run token is refused with 403
// PeopleOnly. Starting needs Create on ShadowTrial and Execute on the agent; stopping needs Update.
type ShadowTrialsClient struct{ c *Client }

func (s *ShadowTrialsClient) path(id string) string {
	return s.c.TenantPath("/shadow-trials/" + url.PathEscape(id))
}

// List returns a page of shadow trials, newest first.
func (s *ShadowTrialsClient) List(ctx context.Context, filter ShadowTrialFilter) (*EnumerationResult[ShadowTrial], error) {
	q := url.Values{}
	setIf(q, "source", filter.Source)
	setIf(q, "candidate", filter.Candidate)
	setIf(q, "status", filter.Status)
	pageQuery(q, filter.MaxResults, filter.Skip)
	var out EnumerationResult[ShadowTrial]
	if err := s.c.Do(ctx, http.MethodGet, s.c.TenantPath("/shadow-trials"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create starts a shadow trial (409 ShadowTrialAlreadyRunning when the pair already has one).
func (s *ShadowTrialsClient) Create(ctx context.Context, trial ShadowTrial) (*ShadowTrial, error) {
	var out ShadowTrial
	if err := s.c.Do(ctx, http.MethodPost, s.c.TenantPath("/shadow-trials"), nil, trial, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a shadow trial with its compared, agreed, diverged, and candidate failure counts.
func (s *ShadowTrialsClient) Get(ctx context.Context, id string) (*ShadowTrial, error) {
	var out ShadowTrial
	if err := s.c.Do(ctx, http.MethodGet, s.path(id), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Stop stops a running shadow trial (409 ShadowTrialNotRunning otherwise). Shadow runs already started finish and
// are still compared. Reason may be empty and is at most 2000 characters.
func (s *ShadowTrialsClient) Stop(ctx context.Context, id, reason string) (*ShadowTrial, error) {
	var out ShadowTrial
	if err := s.c.Do(ctx, http.MethodPost, s.path(id)+"/stop", nil, reasonOf(reason), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CanaryReleasesClient starts, reads, and aborts canary releases. People only: a run token is refused with 403
// PeopleOnly. Starting needs Create on CanaryRelease and Update on both deployments; aborting needs Update.
type CanaryReleasesClient struct{ c *Client }

func (r *CanaryReleasesClient) path(id string) string {
	return r.c.TenantPath("/canary-releases/" + url.PathEscape(id))
}

// List returns a page of canary releases, newest first.
func (r *CanaryReleasesClient) List(ctx context.Context, filter CanaryReleaseFilter) (*EnumerationResult[CanaryRelease], error) {
	q := url.Values{}
	setIf(q, "agent", filter.Agent)
	setIf(q, "status", filter.Status)
	pageQuery(q, filter.MaxResults, filter.Skip)
	var out EnumerationResult[CanaryRelease]
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/canary-releases"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create starts a canary release and applies its first step's weights (409 CanaryAlreadyRunning when a deployment
// is already in one).
func (r *CanaryReleasesClient) Create(ctx context.Context, release CanaryRelease) (*CanaryRelease, error) {
	var out CanaryRelease
	if err := r.c.Do(ctx, http.MethodPost, r.c.TenantPath("/canary-releases"), nil, release, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a canary release with its current step and rollback reason.
func (r *CanaryReleasesClient) Get(ctx context.Context, id string) (*CanaryRelease, error) {
	var out CanaryRelease
	if err := r.c.Do(ctx, http.MethodGet, r.path(id), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Abort aborts a running canary release (409 CanaryNotRunning otherwise); both deployments go back to their weights
// from before the release. Reason may be empty and is at most 2000 characters.
func (r *CanaryReleasesClient) Abort(ctx context.Context, id, reason string) (*CanaryRelease, error) {
	var out CanaryRelease
	if err := r.c.Do(ctx, http.MethodPost, r.path(id)+"/abort", nil, reasonOf(reason), &out); err != nil {
		return nil, err
	}
	return &out, nil
}
