package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Escalation statuses (Escalation.Status). Open until answered, timed out, cancelled, or withdrawn by the raising run.
const (
	EscalationStatusOpen      = "Open"
	EscalationStatusAnswered  = "Answered"
	EscalationStatusExpired   = "Expired"
	EscalationStatusCancelled = "Cancelled"
	EscalationStatusWithdrawn = "Withdrawn"
)

// Escalation severities (Escalation.Severity, NotificationEndpoint.EscalationMinimumSeverity). Default Warning.
const (
	EscalationSeverityInfo    = "Info"
	EscalationSeverityWarning = "Warning"
	EscalationSeverityUrgent  = "Urgent"
)

// Escalation modes (Escalation.Mode): NonBlocking lets the run continue; Blocking suspends it until resolved.
const (
	EscalationModeNonBlocking = "NonBlocking"
	EscalationModeBlocking    = "Blocking"
)

// Escalation target kinds (Escalation.TargetKind, MandateRevision.EscalationTargetKind). Manager is refused until
// organizations exist.
const (
	EscalationTargetUser    = "User"
	EscalationTargetRole    = "Role"
	EscalationTargetAgent   = "Agent"
	EscalationTargetManager = "Manager"
)

// Escalation timeout actions (Escalation.TimeoutAction): what happens when nobody answers in time. Default EscalateUp.
const (
	EscalationTimeoutUseDefaultAnswer = "UseDefaultAnswer"
	EscalationTimeoutCancel           = "Cancel"
	EscalationTimeoutEscalateUp       = "EscalateUp"
)

// Escalation resolution sources (Escalation.ResolutionSource).
const (
	EscalationResolvedByUser    = "User"
	EscalationResolvedByAgent   = "Agent"
	EscalationResolvedByTimeout = "Timeout"
	EscalationResolvedByRaiser  = "Raiser"
	EscalationResolvedBySystem  = "System"
)

// EscalationOption is one choice an escalation offers; an answer names it by Key.
type EscalationOption struct {
	Key   string  `json:"key"`
	Label *string `json:"label,omitempty"`
	Order int     `json:"order"`
}

// Escalation is a question a run raised for a person, a role, or another agent, and the answer once there is one.
// A Blocking escalation holds its run until it is resolved. When EscalatedToID is set, answer that escalation instead.
type Escalation struct {
	ID                 string             `json:"id"`
	TenantID           string             `json:"tenantId"`
	RaisingRunID       *string            `json:"raisingRunId,omitempty"`
	LeaseEpoch         int64              `json:"leaseEpoch,omitempty"`
	AgentID            *string            `json:"agentId,omitempty"`
	AgentName          *string            `json:"agentName,omitempty"`
	MandateID          *string            `json:"mandateId,omitempty"`
	MandateTickID      *string            `json:"mandateTickId,omitempty"`
	TargetKind         string             `json:"targetKind"`
	TargetID           *string            `json:"targetId,omitempty"`
	TargetName         *string            `json:"targetName,omitempty"`
	Severity           string             `json:"severity"`
	Mode               string             `json:"mode"`
	Status             string             `json:"status"`
	Question           string             `json:"question"`
	Context            *string            `json:"context,omitempty"`
	Options            []EscalationOption `json:"options"`
	DefaultAnswer      *string            `json:"defaultAnswer,omitempty"`
	TimeoutSeconds     int                `json:"timeoutSeconds,omitempty"`
	ExpiresUTC         *string            `json:"expiresUtc,omitempty"`
	TimeoutAction      string             `json:"timeoutAction,omitempty"`
	ParentEscalationID *string            `json:"parentEscalationId,omitempty"`
	EscalatedToID      *string            `json:"escalatedToId,omitempty"`
	RoutedRunID        *string            `json:"routedRunId,omitempty"`
	AnswerChoice       *string            `json:"answerChoice,omitempty"`
	AnswerText         *string            `json:"answerText,omitempty"`
	ResolvedBy         *string            `json:"resolvedBy,omitempty"`
	ResolutionSource   *string            `json:"resolutionSource,omitempty"`
	ResolvedUTC        *string            `json:"resolvedUtc,omitempty"`
	DeliveredTickID    *string            `json:"deliveredTickId,omitempty"`
	CreatedUTC         string             `json:"createdUtc,omitempty"`
	LastUpdateUTC      string             `json:"lastUpdateUtc,omitempty"`
}

// EscalationFilter filters Escalations.List; empty fields are not sent. Open escalations come first, then the newest.
type EscalationFilter struct {
	Status       string
	Severity     string
	TargetKind   string
	TargetID     string
	AgentID      string
	MandateID    string
	RaisingRunID string
	Search       string
	MaxResults   int
	Skip         int
}

// EscalationAnswerRequest answers an escalation: Choice is one of its option keys when it has options, otherwise Text is
// required (at most 8000 characters).
type EscalationAnswerRequest struct {
	Choice *string `json:"choice,omitempty"`
	Text   *string `json:"text,omitempty"`
}

// EscalationCancelRequest cancels an escalation with an optional reason.
type EscalationCancelRequest struct {
	Reason *string `json:"reason,omitempty"`
}

// EscalationsClient lists, reads, answers, and cancels escalations. Runs raise and withdraw them over MCP. Reading needs
// Read on Escalation; answering and cancelling need Update on Escalation.
type EscalationsClient struct{ c *Client }

// List returns a page of escalations, open first and then newest first.
func (e *EscalationsClient) List(ctx context.Context, f EscalationFilter) (*EnumerationResult[Escalation], error) {
	q := url.Values{}
	set := func(k, v string) {
		if v != "" {
			q.Set(k, v)
		}
	}
	set("status", f.Status)
	set("severity", f.Severity)
	set("targetKind", f.TargetKind)
	set("targetId", f.TargetID)
	set("agentId", f.AgentID)
	set("mandateId", f.MandateID)
	set("raisingRunId", f.RaisingRunID)
	set("search", f.Search)
	if f.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(f.MaxResults))
	}
	if f.Skip > 0 {
		q.Set("skip", strconv.Itoa(f.Skip))
	}
	var out EnumerationResult[Escalation]
	if err := e.c.Do(ctx, http.MethodGet, e.c.TenantPath("/escalations"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads one escalation with its options and answer.
func (e *EscalationsClient) Get(ctx context.Context, id string) (*Escalation, error) {
	var out Escalation
	if err := e.c.Do(ctx, http.MethodGet, e.c.TenantPath("/escalations/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Answer answers an open escalation. A run blocked on it resumes and a keeper that raised it wakes. The server answers
// 409 EscalationNotOpen when it was already resolved and EscalatedUp when it was passed up to another escalation.
func (e *EscalationsClient) Answer(ctx context.Context, id string, req EscalationAnswerRequest) (*Escalation, error) {
	var out Escalation
	if err := e.c.Do(ctx, http.MethodPost, e.c.TenantPath("/escalations/"+url.PathEscape(id)+"/answer"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Cancel cancels an open escalation. A run blocked on it is cancelled too.
func (e *EscalationsClient) Cancel(ctx context.Context, id string, req EscalationCancelRequest) (*Escalation, error) {
	var out Escalation
	if err := e.c.Do(ctx, http.MethodPost, e.c.TenantPath("/escalations/"+url.PathEscape(id)+"/cancel"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
