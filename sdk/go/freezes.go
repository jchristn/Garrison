package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Freeze target kinds (Freeze.TargetKind). OrgUnit freezes a unit's subtree and Organization a
// whole organization; TenantAutonomy is the kill switch, set with Freezes.SetKillSwitch.
const (
	FreezeTargetAgent          = "Agent"
	FreezeTargetDeployment     = "Deployment"
	FreezeTargetMandate        = "Mandate"
	FreezeTargetApp            = "App"
	FreezeTargetOrgUnit        = "OrgUnit"
	FreezeTargetOrganization   = "Organization"
	FreezeTargetTenantAutonomy = "TenantAutonomy"
)

// Freeze stops an agent, deployment, mandate, or app until it is lifted: new runs in scope are refused with 409 Frozen
// and keepers in scope stop ticking.
type Freeze struct {
	ID                string  `json:"id"`
	TenantID          string  `json:"tenantId"`
	TargetKind        string  `json:"targetKind"`
	TargetID          string  `json:"targetId"`
	TargetName        *string `json:"targetName,omitempty"`
	Reason            *string `json:"reason,omitempty"`
	CancelActiveRuns  bool    `json:"cancelActiveRuns"`
	CancelledRunCount int     `json:"cancelledRunCount"`
	CreatedByID       *string `json:"createdById,omitempty"`
	CreatedByName     *string `json:"createdByName,omitempty"`
	LiftedByID        *string `json:"liftedById,omitempty"`
	LiftedByName      *string `json:"liftedByName,omitempty"`
	LiftReason        *string `json:"liftReason,omitempty"`
	LiftedUTC         *string `json:"liftedUtc,omitempty"`
	Active            bool    `json:"active"`
	CreatedUTC        string  `json:"createdUtc,omitempty"`
	LastUpdateUTC     string  `json:"lastUpdateUtc,omitempty"`
}

// FreezeRequest applies a freeze. TargetID takes an identifier or a name; CancelActiveRuns also cancels the runs
// already in scope.
type FreezeRequest struct {
	TargetKind       string  `json:"targetKind"`
	TargetID         string  `json:"targetId"`
	Reason           *string `json:"reason,omitempty"`
	CancelActiveRuns bool    `json:"cancelActiveRuns"`
}

// FreezeLiftRequest lifts a freeze with an optional reason.
type FreezeLiftRequest struct {
	Reason *string `json:"reason,omitempty"`
}

// FreezeFilter filters Freezes.List; empty fields are not sent. Active nil lists both active and lifted freezes.
type FreezeFilter struct {
	TargetKind string
	TargetID   string
	Active     *bool
	MaxResults int
	Skip       int
}

// KillSwitchState is the tenant's autonomy kill switch. While Enabled, no keeper ticks start and keeper runs are refused.
type KillSwitchState struct {
	TenantID      string  `json:"tenantId"`
	Enabled       bool    `json:"enabled"`
	FreezeID      *string `json:"freezeId,omitempty"`
	Reason        *string `json:"reason,omitempty"`
	ChangedByName *string `json:"changedByName,omitempty"`
	ChangedUTC    *string `json:"changedUtc,omitempty"`
}

// KillSwitchRequest turns the kill switch on or off.
type KillSwitchRequest struct {
	Enabled bool    `json:"enabled"`
	Reason  *string `json:"reason,omitempty"`
}

// FreezesClient applies, lists, reads, and lifts freezes and reads or sets the kill switch. Reading needs Read on
// Freeze; applying needs Create; lifting and the kill switch need Update. Run tokens never hold these permissions.
type FreezesClient struct{ c *Client }

// List returns a page of freezes, active first and then newest first.
func (f *FreezesClient) List(ctx context.Context, filter FreezeFilter) (*EnumerationResult[Freeze], error) {
	q := url.Values{}
	if filter.TargetKind != "" {
		q.Set("targetKind", filter.TargetKind)
	}
	if filter.TargetID != "" {
		q.Set("targetId", filter.TargetID)
	}
	if filter.Active != nil {
		q.Set("active", strconv.FormatBool(*filter.Active))
	}
	if filter.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(filter.MaxResults))
	}
	if filter.Skip > 0 {
		q.Set("skip", strconv.Itoa(filter.Skip))
	}
	var out EnumerationResult[Freeze]
	if err := f.c.Do(ctx, http.MethodGet, f.c.TenantPath("/freezes"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads one freeze.
func (f *FreezesClient) Get(ctx context.Context, id string) (*Freeze, error) {
	var out Freeze
	if err := f.c.Do(ctx, http.MethodGet, f.c.TenantPath("/freezes/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Apply freezes an agent, deployment, mandate, or app.
func (f *FreezesClient) Apply(ctx context.Context, req FreezeRequest) (*Freeze, error) {
	var out Freeze
	if err := f.c.Do(ctx, http.MethodPost, f.c.TenantPath("/freezes"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Lift lifts an active freeze. A frozen keeper becomes Active again with its next wake spread over a short window.
func (f *FreezesClient) Lift(ctx context.Context, id string, req FreezeLiftRequest) (*Freeze, error) {
	var out Freeze
	if err := f.c.Do(ctx, http.MethodPost, f.c.TenantPath("/freezes/"+url.PathEscape(id)+"/lift"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetKillSwitch reads the autonomy kill switch.
func (f *FreezesClient) GetKillSwitch(ctx context.Context) (*KillSwitchState, error) {
	var out KillSwitchState
	if err := f.c.Do(ctx, http.MethodGet, f.c.TenantPath("/autonomy/kill-switch"), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SetKillSwitch turns the autonomy kill switch on or off; ordinary invocations keep working while it is on.
func (f *FreezesClient) SetKillSwitch(ctx context.Context, req KillSwitchRequest) (*KillSwitchState, error) {
	var out KillSwitchState
	if err := f.c.Do(ctx, http.MethodPut, f.c.TenantPath("/autonomy/kill-switch"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
