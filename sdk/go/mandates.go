package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// Mandate statuses (Mandate.Status). Only Active mandates are woken by the scheduler.
const (
	MandateStatusDraft      = "Draft"
	MandateStatusActive     = "Active"
	MandateStatusPaused     = "Paused"
	MandateStatusFrozen     = "Frozen"
	MandateStatusCapReached = "CapReached"
	MandateStatusRetired    = "Retired"
)

// Mandate revision states (MandateRevision.State) and sources (MandateRevision.Source).
const (
	MandateRevisionStateDraft     = "Draft"
	MandateRevisionStatePublished = "Published"

	MandateRevisionSourceHuman     = "Human"
	MandateRevisionSourceBoard     = "Board"
	MandateRevisionSourceExecutive = "Executive"
	MandateRevisionSourceArchitect = "Architect"
)

// Wake modes (MandateRevision.WakeMode): Fixed keeps the interval at the minimum; Backoff multiplies it by the backoff
// factor after each Quiet tick, up to the maximum.
const (
	WakeModeFixed   = "Fixed"
	WakeModeBackoff = "Backoff"
)

// Wake sources (MandateTick.WakeSource and Mandate.PendingWakeSource).
const (
	WakeSourceTimer            = "Timer"
	WakeSourceManual           = "Manual"
	WakeSourceMessage          = "Message"
	WakeSourceEscalationAnswer = "EscalationAnswer"
	WakeSourceWebhook          = "Webhook"
	WakeSourceReport           = "Report"
)

// Tick outcomes (MandateTick.Outcome, Mandate.LastTickOutcome). The run reports Quiet, Acted, Attention, or
// Escalated; the scheduler records Failed, Skipped, and Unreported itself.
const (
	TickOutcomeQuiet      = "Quiet"
	TickOutcomeActed      = "Acted"
	TickOutcomeAttention  = "Attention"
	TickOutcomeEscalated  = "Escalated"
	TickOutcomeFailed     = "Failed"
	TickOutcomeSkipped    = "Skipped"
	TickOutcomeUnreported = "Unreported"
)

// MandateRevisionSignal is one signal a keeper watches: a named thing to check on each tick, in Order (from 0).
type MandateRevisionSignal struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	Order       int     `json:"order"`
}

// MandateRevision is one revision of a keeper mandate: objective, signals, wake schedule, and budgets. A draft becomes
// current when published; published revisions never change. Zero numeric fields are omitted so the server defaults
// apply (minimum interval 900 seconds, maximum 86400, backoff factor 2.0). Warnings is set on create responses only;
// see FieldWarning (the cluster floor raises a MinIntervalSeconds below it, default 60).
type MandateRevision struct {
	ID                string  `json:"id,omitempty"`
	TenantID          string  `json:"tenantId,omitempty"`
	MandateID         string  `json:"mandateId,omitempty"`
	Number            int     `json:"number,omitempty"`
	State             string  `json:"state,omitempty"`
	Objective         string  `json:"objective"`
	HealthyDefinition *string `json:"healthyDefinition,omitempty"`
	Autonomy          *string `json:"autonomy,omitempty"`
	EscalationPolicy  *string `json:"escalationPolicy,omitempty"`
	// EscalationTargetKind and EscalationTargetID set the keeper's default escalation target (EscalationTarget*); nil
	// means the principal that saved the revision. Every kind except Manager needs an identifier.
	EscalationTargetKind *string                 `json:"escalationTargetKind,omitempty"`
	EscalationTargetID   *string                 `json:"escalationTargetId,omitempty"`
	Direction            *string                 `json:"direction,omitempty"`
	Signals              []MandateRevisionSignal `json:"signals,omitempty"`
	// WakeMode is WakeModeFixed or WakeModeBackoff (default when empty).
	WakeMode           string   `json:"wakeMode,omitempty"`
	MinIntervalSeconds int      `json:"minIntervalSeconds,omitempty"`
	MaxIntervalSeconds int      `json:"maxIntervalSeconds,omitempty"`
	BackoffFactor      float64  `json:"backoffFactor,omitempty"`
	JitterPercent      *int     `json:"jitterPercent,omitempty"`
	BudgetPerTickUsd   *float64 `json:"budgetPerTickUsd,omitempty"`
	BudgetPerDayUsd    *float64 `json:"budgetPerDayUsd,omitempty"`
	MaxTokensPerTick   *int64   `json:"maxTokensPerTick,omitempty"`
	// BriefIntervalHours is the hours between board briefs (1 to 720), nil for none. Only the CEO is asked for briefs.
	BriefIntervalHours *int `json:"briefIntervalHours,omitempty"`
	// Source is a MandateRevisionSource* constant (default Human).
	Source       string         `json:"source,omitempty"`
	Author       *string        `json:"author,omitempty"`
	ChangeNote   *string        `json:"changeNote,omitempty"`
	CreatedUTC   string         `json:"createdUtc,omitempty"`
	PublishedUTC *string        `json:"publishedUtc,omitempty"`
	Warnings     []FieldWarning `json:"warnings,omitempty"`
}

// Mandate is a keeper: a standing objective that wakes its agent on a schedule. Ticks run as the principal that last
// created or changed it. Created with an inline CurrentRevision, that revision is published as revision 1 and the
// mandate becomes Active. Update changes only Name, Description, and DeploymentID (the agent cannot change); an
// omitted Description clears it. Warnings is set on create and publish responses and carries the current revision's.
type Mandate struct {
	ID                     string           `json:"id,omitempty"`
	TenantID               string           `json:"tenantId,omitempty"`
	Name                   string           `json:"name,omitempty"`
	Description            *string          `json:"description,omitempty"`
	AgentID                string           `json:"agentId,omitempty"`
	DeploymentID           string           `json:"deploymentId,omitempty"`
	Status                 string           `json:"status,omitempty"`
	CurrentRevisionID      *string          `json:"currentRevisionId,omitempty"`
	CurrentRevisionNumber  int              `json:"currentRevisionNumber,omitempty"`
	CurrentRevision        *MandateRevision `json:"currentRevision,omitempty"`
	NextWakeUTC            *string          `json:"nextWakeUtc,omitempty"`
	PendingWakeSource      *string          `json:"pendingWakeSource,omitempty"`
	CurrentIntervalSeconds int              `json:"currentIntervalSeconds,omitempty"`
	ConsecutiveQuietTicks  int              `json:"consecutiveQuietTicks,omitempty"`
	LastTickUTC            *string          `json:"lastTickUtc,omitempty"`
	LastTickOutcome        *string          `json:"lastTickOutcome,omitempty"`
	ActiveRunID            *string          `json:"activeRunId,omitempty"`
	ActiveTickID           *string          `json:"activeTickId,omitempty"`
	TickCount              int64            `json:"tickCount,omitempty"`
	RunAsType              string           `json:"runAsType,omitempty"`
	RunAsID                *string          `json:"runAsId,omitempty"`
	RunAsName              *string          `json:"runAsName,omitempty"`
	CreatedBy              *string          `json:"createdBy,omitempty"`
	CreatedUTC             string           `json:"createdUtc,omitempty"`
	LastUpdateUTC          string           `json:"lastUpdateUtc,omitempty"`
	Warnings               []FieldWarning   `json:"warnings,omitempty"`
}

// MandateTick is one wake of a keeper and the run it started. RunID is nil for a Skipped tick.
type MandateTick struct {
	ID                       string   `json:"id"`
	TenantID                 string   `json:"tenantId"`
	MandateID                string   `json:"mandateId"`
	RevisionID               *string  `json:"revisionId"`
	RevisionNumber           int      `json:"revisionNumber"`
	WakeSource               string   `json:"wakeSource"`
	ScheduledUTC             string   `json:"scheduledUtc"`
	StartedUTC               string   `json:"startedUtc"`
	FinishedUTC              *string  `json:"finishedUtc"`
	RunID                    *string  `json:"runId"`
	Outcome                  *string  `json:"outcome"`
	Reported                 bool     `json:"reported"`
	RequestedNextWakeSeconds *int     `json:"requestedNextWakeSeconds"`
	AppliedIntervalSeconds   *int     `json:"appliedIntervalSeconds"`
	CostUsd                  *float64 `json:"costUsd"`
	Summary                  *string  `json:"summary"`
	TemplateName             *string  `json:"templateName"`
	TemplateVersion          int      `json:"templateVersion"`
	ErrorCode                *string  `json:"errorCode"`
	ErrorMessage             *string  `json:"errorMessage"`
	CreatedUTC               string   `json:"createdUtc"`
}

// MandatesClient manages keeper mandates. Create and Update need Execute on the agent; ticks run as the caller. An
// id argument accepts an identifier or a name. Pause, Resume, and Wake need Execute on the mandate.
type MandatesClient struct{ Resource }

// List lists mandates; status (MandateStatus constants), agentID, and deploymentID narrow the list when not empty.
func (m *MandatesClient) List(ctx context.Context, opts *ListOptions, status, agentID, deploymentID string) (*EnumerationResult[Mandate], error) {
	query := opts.values()
	if status != "" {
		query.Set("status", status)
	}
	if agentID != "" {
		query.Set("agentId", agentID)
	}
	if deploymentID != "" {
		query.Set("deploymentId", deploymentID)
	}
	var out EnumerationResult[Mandate]
	if err := m.c.Do(ctx, http.MethodGet, m.base(), query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a mandate with its current revision.
func (m *MandatesClient) Get(ctx context.Context, id string) (*Mandate, error) {
	var out Mandate
	if err := m.Resource.Get(ctx, id, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create creates a mandate. An inline CurrentRevision is published as revision 1 and the mandate becomes Active.
func (m *MandatesClient) Create(ctx context.Context, mandate Mandate) (*Mandate, error) {
	var out Mandate
	if err := m.Resource.Create(ctx, mandate, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update changes a mandate's Name, Description, and DeploymentID.
func (m *MandatesClient) Update(ctx context.Context, id string, mandate Mandate) (*Mandate, error) {
	var out Mandate
	if err := m.Resource.Update(ctx, id, mandate, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteForce deletes a mandate with its revisions and tick history. With force false, a tick in progress answers
// 409 MandateActive; with force true it cancels the tick's run. Delete is the same without force.
func (m *MandatesClient) DeleteForce(ctx context.Context, id string, force bool) error {
	query := url.Values{}
	if force {
		query.Set("force", "true")
	}
	return m.c.Do(ctx, http.MethodDelete, m.item(id), query, nil, nil)
}

// ListRevisions lists a mandate's revisions, newest first.
func (m *MandatesClient) ListRevisions(ctx context.Context, id string, opts *ListOptions) (*EnumerationResult[MandateRevision], error) {
	var out EnumerationResult[MandateRevision]
	if err := m.c.Do(ctx, http.MethodGet, m.item(id)+"/revisions", opts.values(), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetRevision reads one revision of a mandate.
func (m *MandatesClient) GetRevision(ctx context.Context, id, revisionID string) (*MandateRevision, error) {
	var out MandateRevision
	if err := m.c.Do(ctx, http.MethodGet, m.item(id)+"/revisions/"+url.PathEscape(revisionID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CreateRevision drafts a new revision; it takes effect when published. Warnings lists clamped values.
func (m *MandatesClient) CreateRevision(ctx context.Context, id string, revision MandateRevision) (*MandateRevision, error) {
	var out MandateRevision
	if err := m.Action(ctx, id, "revisions", revision, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// PublishRevision publishes a draft revision: it becomes current, backoff resets, a Draft mandate becomes Active, and
// an Active mandate wakes now. A revision that is not a draft answers 409 RevisionPublished.
func (m *MandatesClient) PublishRevision(ctx context.Context, id, revisionID string) (*Mandate, error) {
	var out Mandate
	if err := m.Action(ctx, id, "revisions/"+url.PathEscape(revisionID)+"/publish", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Pause stops wakes until the mandate is resumed. A mandate that is not Active answers 409 MandateNotActive.
func (m *MandatesClient) Pause(ctx context.Context, id string) (*Mandate, error) {
	var out Mandate
	if err := m.Action(ctx, id, "pause", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Resume wakes a paused mandate now with its interval reset. A mandate that is not Paused answers 409
// MandateNotPaused.
func (m *MandatesClient) Resume(ctx context.Context, id string) (*Mandate, error) {
	var out Mandate
	if err := m.Action(ctx, id, "resume", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Wake asks an Active mandate to wake now (after the running tick, if one is running). The server answers 202 and the
// tick starts on the next scheduler sweep, so poll ListTicks for it. A mandate that is not Active answers 409
// MandateNotActive.
func (m *MandatesClient) Wake(ctx context.Context, id string) (*Mandate, error) {
	var out Mandate
	if err := m.Action(ctx, id, "wake", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListTicks lists a mandate's ticks, newest first; outcome (TickOutcome constants) narrows it when not empty.
func (m *MandatesClient) ListTicks(ctx context.Context, id, outcome string, opts *ListOptions) (*EnumerationResult[MandateTick], error) {
	query := opts.values()
	if outcome != "" {
		query.Set("outcome", outcome)
	}
	var out EnumerationResult[MandateTick]
	if err := m.c.Do(ctx, http.MethodGet, m.item(id)+"/ticks", query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetTick reads one tick by identifier.
func (m *MandatesClient) GetTick(ctx context.Context, tickID string) (*MandateTick, error) {
	var out MandateTick
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/mandate-ticks/"+url.PathEscape(tickID)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
