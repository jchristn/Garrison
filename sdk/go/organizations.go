package garrison

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
)

// Organization statuses (Organization.Status). The first publish makes a Draft organization Active.
const (
	OrganizationStatusDraft   = "Draft"
	OrganizationStatusActive  = "Active"
	OrganizationStatusFrozen  = "Frozen"
	OrganizationStatusRetired = "Retired"
)

// Organization revision states (OrgRevision.State). Publishing a revision supersedes the one that was live.
const (
	OrgRevisionStateDraft      = "Draft"
	OrgRevisionStatePublished  = "Published"
	OrgRevisionStateSuperseded = "Superseded"
)

// Budget periods (OrgUnitBudget.Period, OrgUnitSpend.Period).
const (
	BudgetPeriodDay   = "Day"
	BudgetPeriodMonth = "Month"
)

// Organization chart sources (OrgChart.Source): the live revision, or the working tree before the first publish.
const (
	OrgChartSourceLive    = "Live"
	OrgChartSourceWorking = "Working"
)

// OrgUnitMember is a member of a unit other than its lead. In a request, AgentID and MandateID take an identifier or a
// name.
type OrgUnitMember struct {
	AgentID   string  `json:"agentId"`
	AgentName *string `json:"agentName,omitempty"`
	Title     *string `json:"title,omitempty"`
	MandateID *string `json:"mandateId,omitempty"`
}

// OrgUnitPeerLine is a line to another unit of the same organization; it works in both directions.
type OrgUnitPeerLine struct {
	PeerUnitID   string  `json:"peerUnitId"`
	PeerUnitName *string `json:"peerUnitName,omitempty"`
}

// OrgUnitBudget caps the spend of a unit's subtree over one period. AmountUSD is greater than 0 and at most
// 10,000,000, and at most the nearest ancestor's budget for the same period.
type OrgUnitBudget struct {
	Period    string  `json:"period"`
	AmountUSD float64 `json:"amountUsd"`
}

// OrgUnit is a unit of an organization's working tree or of a revision's snapshot. ParentUnitID is nil for the root.
// In a request, ParentUnitID, LeadAgentID, LeadMandateID, and AppID take an identifier or a name.
type OrgUnit struct {
	ID             string            `json:"id,omitempty"`
	TenantID       string            `json:"tenantId,omitempty"`
	OrganizationID string            `json:"organizationId,omitempty"`
	ParentUnitID   *string           `json:"parentUnitId,omitempty"`
	Name           string            `json:"name"`
	Description    *string           `json:"description,omitempty"`
	LeadAgentID    *string           `json:"leadAgentId,omitempty"`
	LeadAgentName  *string           `json:"leadAgentName,omitempty"`
	LeadTitle      *string           `json:"leadTitle,omitempty"`
	LeadMandateID  *string           `json:"leadMandateId,omitempty"`
	AppID          *string           `json:"appId,omitempty"`
	Members        []OrgUnitMember   `json:"members,omitempty"`
	PeerLines      []OrgUnitPeerLine `json:"peerLines,omitempty"`
	Budgets        []OrgUnitBudget   `json:"budgets,omitempty"`
	CreatedUTC     string            `json:"createdUtc,omitempty"`
	LastUpdateUTC  string            `json:"lastUpdateUtc,omitempty"`
}

// Organization is a tree of org units with a mission. Units holds the working tree, root first, when one organization
// is read; it is nil on lists. The server sets Status (OrganizationStatus constants), RootUnitID, and the current
// revision; an update may set Status to Retired or back to Active.
type Organization struct {
	ID                    string  `json:"id,omitempty"`
	TenantID              string  `json:"tenantId,omitempty"`
	Name                  string  `json:"name"`
	Description           *string `json:"description,omitempty"`
	Mission               *string `json:"mission,omitempty"`
	Status                string  `json:"status,omitempty"`
	RootUnitID            *string `json:"rootUnitId,omitempty"`
	CurrentRevisionID     *string `json:"currentRevisionId,omitempty"`
	CurrentRevisionNumber int     `json:"currentRevisionNumber,omitempty"`
	CreatedBy             *string `json:"createdBy,omitempty"`
	// BudgetFreezeMarginPercent is how far past a unit budget, in percent (0 to 100, default 10), the subtree may spend
	// before the budget guard freezes the unit; 0 freezes at the cap. nil leaves the server default or current value.
	BudgetFreezeMarginPercent *int      `json:"budgetFreezeMarginPercent,omitempty"`
	Units                     []OrgUnit `json:"units,omitempty"`
	CreatedUTC                string    `json:"createdUtc,omitempty"`
	LastUpdateUTC             string    `json:"lastUpdateUtc,omitempty"`
}

// OrgRevisionMandate is the mandate revision an organization revision pins.
type OrgRevisionMandate struct {
	MandateID             string  `json:"mandateId"`
	MandateName           *string `json:"mandateName,omitempty"`
	MandateRevisionID     string  `json:"mandateRevisionId"`
	MandateRevisionNumber *int    `json:"mandateRevisionNumber,omitempty"`
}

// OrgRevision is a snapshot of an organization's tree. State is an OrgRevisionState constant. Units and Mandates are
// empty on lists.
type OrgRevision struct {
	ID                   string  `json:"id"`
	TenantID             string  `json:"tenantId"`
	OrganizationID       string  `json:"organizationId"`
	Number               int     `json:"number"`
	State                string  `json:"state"`
	Note                 *string `json:"note,omitempty"`
	RollbackOfRevisionID *string `json:"rollbackOfRevisionId,omitempty"`
	// DraftID and RevertDraftID are set on a revision recorded when an executive's draft was applied: the draft, and a
	// draft holding the records as they were before, which a rollback past this revision applies.
	DraftID       *string              `json:"draftId,omitempty"`
	RevertDraftID *string              `json:"revertDraftId,omitempty"`
	AuthorType    string               `json:"authorType,omitempty"`
	AuthorID      *string              `json:"authorId,omitempty"`
	AuthorName    *string              `json:"authorName,omitempty"`
	Units         []OrgUnit            `json:"units"`
	Mandates      []OrgRevisionMandate `json:"mandates"`
	PublishedUTC  *string              `json:"publishedUtc,omitempty"`
	CreatedUTC    string               `json:"createdUtc,omitempty"`
}

// OrgChartMember is a lead or member on the organization chart.
type OrgChartMember struct {
	AgentID        string  `json:"agentId"`
	AgentName      *string `json:"agentName,omitempty"`
	Title          *string `json:"title,omitempty"`
	UnitID         string  `json:"unitId"`
	UnitName       *string `json:"unitName,omitempty"`
	MandateID      *string `json:"mandateId,omitempty"`
	MandateName    *string `json:"mandateName,omitempty"`
	MandateSummary *string `json:"mandateSummary,omitempty"`
}

// OrgChartUnit is a unit on the organization chart.
type OrgChartUnit struct {
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Description  *string          `json:"description,omitempty"`
	ParentUnitID *string          `json:"parentUnitId,omitempty"`
	Depth        int              `json:"depth"`
	AppID        *string          `json:"appId,omitempty"`
	Lead         *OrgChartMember  `json:"lead,omitempty"`
	Members      []OrgChartMember `json:"members"`
	PeerUnitIDs  []string         `json:"peerUnitIds"`
	ChildUnitIDs []string         `json:"childUnitIds"`
	Budgets      []OrgUnitBudget  `json:"budgets"`
}

// OrgChart is the organization chart. Source is OrgChartSourceLive or OrgChartSourceWorking.
type OrgChart struct {
	OrganizationID string         `json:"organizationId"`
	Name           string         `json:"name"`
	Mission        *string        `json:"mission,omitempty"`
	RevisionID     *string        `json:"revisionId,omitempty"`
	RevisionNumber int            `json:"revisionNumber"`
	Source         string         `json:"source"`
	Units          []OrgChartUnit `json:"units"`
}

// OrgUnitSpend is a unit's subtree spend in the current window of one period. AmountUSD and Fraction are nil without
// a budget; Exhausted is true when new runs in the subtree are refused with BudgetExhausted.
type OrgUnitSpend struct {
	UnitID         string   `json:"unitId"`
	UnitName       string   `json:"unitName"`
	Period         string   `json:"period"`
	AmountUSD      *float64 `json:"amountUsd,omitempty"`
	SpentUSD       float64  `json:"spentUsd"`
	Fraction       *float64 `json:"fraction,omitempty"`
	Exhausted      bool     `json:"exhausted"`
	WindowStartUTC string   `json:"windowStartUtc"`
	WindowEndUTC   string   `json:"windowEndUtc"`
}

// Rollback options for ticks in flight (OrgRollbackRequest.ActiveTicks).
const (
	// RollbackActiveTicksFinish (the default) lets ticks in flight complete without moving any mandate off the restored
	// revisions.
	RollbackActiveTicksFinish = "Finish"
	// RollbackActiveTicksCancel cancels the runs of ticks in flight before the restore.
	RollbackActiveTicksCancel = "Cancel"
)

// OrgRollbackRequest names the revision to return to (empty for the one live before the current one), a note, and
// what to do with ticks in flight (a RollbackActiveTicks* value; empty uses the server default, Finish).
type OrgRollbackRequest struct {
	RevisionID  string `json:"revisionId,omitempty"`
	Note        string `json:"note,omitempty"`
	ActiveTicks string `json:"activeTicks,omitempty"`
}

// CascadeCancelRequest is the body of a cascade cancel: Reason is at most 1024 characters.
type CascadeCancelRequest struct {
	Reason *string `json:"reason,omitempty"`
}

// CascadeCancelResult is what a cascade cancel of a unit stopped. RunIDs lists the cancelled runs.
type CascadeCancelResult struct {
	OrganizationID       string   `json:"organizationId"`
	UnitID               string   `json:"unitId"`
	UnitName             string   `json:"unitName"`
	RunsCancelled        int      `json:"runsCancelled"`
	TicksCancelled       int      `json:"ticksCancelled"`
	EscalationsWithdrawn int      `json:"escalationsWithdrawn"`
	MessagesExpired      int      `json:"messagesExpired"`
	RunIDs               []string `json:"runIds"`
	CompletedUTC         string   `json:"completedUtc"`
}

// OrganizationsClient manages organizations: trees of org units with a mission, per-unit budgets, and revisions. An
// organization argument accepts an identifier or a name. Unit edits change the working tree; the chain of command,
// lines, and budgets follow the live revision only, so publish a revision to make edits take effect. Reading needs
// Read on Organization; units, publishing, and rollback need Update. A refused change returns an error with status 409
// and a code such as OneRoot, Cycle, LeadsTwoUnits, BudgetExceedsParent, or NothingToRollBack.
type OrganizationsClient struct{ Resource }

// List lists organizations by name.
func (o *OrganizationsClient) List(ctx context.Context, opts *ListOptions) (*EnumerationResult[Organization], error) {
	var out EnumerationResult[Organization]
	if err := o.Resource.List(ctx, opts, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads an organization with its working tree of units.
func (o *OrganizationsClient) Get(ctx context.Context, organization string) (*Organization, error) {
	var out Organization
	if err := o.Resource.Get(ctx, organization, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create creates an organization. It starts as Draft with no units.
func (o *OrganizationsClient) Create(ctx context.Context, body Organization) (*Organization, error) {
	var out Organization
	if err := o.Resource.Create(ctx, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update changes an organization's name, description, and mission, or sets Status to Retired (or Active again).
func (o *OrganizationsClient) Update(ctx context.Context, organization string, body Organization) (*Organization, error) {
	var out Organization
	if err := o.Resource.Update(ctx, organization, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListUnits returns the units of the working tree, root first.
func (o *OrganizationsClient) ListUnits(ctx context.Context, organization string) ([]OrgUnit, error) {
	var out []OrgUnit
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/units", nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetUnit reads a unit of the working tree by identifier or name.
func (o *OrganizationsClient) GetUnit(ctx context.Context, organization, unit string) (*OrgUnit, error) {
	var out OrgUnit
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/units/"+url.PathEscape(unit), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CreateUnit adds a unit to the working tree. The first unit without a parent is the root; a second answers 409 OneRoot.
func (o *OrganizationsClient) CreateUnit(ctx context.Context, organization string, unit OrgUnit) (*OrgUnit, error) {
	var out OrgUnit
	if err := o.c.Do(ctx, http.MethodPost, o.item(organization)+"/units", nil, unit, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UpdateUnit replaces a unit of the working tree.
func (o *OrganizationsClient) UpdateUnit(ctx context.Context, organization, unitID string, unit OrgUnit) (*OrgUnit, error) {
	var out OrgUnit
	if err := o.c.Do(ctx, http.MethodPut, o.item(organization)+"/units/"+url.PathEscape(unitID), nil, unit, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteUnit removes a unit without children, with the peer lines that point at it. A unit with children answers 409
// UnitHasChildren.
func (o *OrganizationsClient) DeleteUnit(ctx context.Context, organization, unit string) error {
	return o.c.Do(ctx, http.MethodDelete, o.item(organization)+"/units/"+url.PathEscape(unit), nil, nil, nil)
}

// Chart returns the organization chart of the live revision, or of the working tree before the first publish.
func (o *OrganizationsClient) Chart(ctx context.Context, organization string) (*OrgChart, error) {
	var out OrgChart
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/chart", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListRevisions lists revisions, newest first, without snapshots.
func (o *OrganizationsClient) ListRevisions(ctx context.Context, organization string) ([]OrgRevision, error) {
	var out []OrgRevision
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/revisions", nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetRevision reads a revision with its snapshot.
func (o *OrganizationsClient) GetRevision(ctx context.Context, organization, revisionID string) (*OrgRevision, error) {
	var out OrgRevision
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/revisions/"+url.PathEscape(revisionID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CreateRevision snapshots the working tree as a Draft revision, pinning the current revision of every mandate it
// names. note may be empty.
func (o *OrganizationsClient) CreateRevision(ctx context.Context, organization, note string) (*OrgRevision, error) {
	body := map[string]any{}
	if note != "" {
		body["note"] = note
	}
	var out OrgRevision
	if err := o.c.Do(ctx, http.MethodPost, o.item(organization)+"/revisions", nil, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Publish makes a Draft revision live and writes a promotion record with subject Organization. A revision that is not
// a draft answers 409 RevisionPublished.
func (o *OrganizationsClient) Publish(ctx context.Context, organization, revisionID string) (*OrgRevision, error) {
	var out OrgRevision
	if err := o.c.Do(ctx, http.MethodPost, o.item(organization)+"/revisions/"+url.PathEscape(revisionID)+"/publish", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Rollback returns to an earlier live revision by publishing a copy of its snapshot. It answers 409 NothingToRollBack
// or AlreadyLive.
func (o *OrganizationsClient) Rollback(ctx context.Context, organization string, request OrgRollbackRequest) (*OrgRevision, error) {
	var out OrgRevision
	if err := o.c.Do(ctx, http.MethodPost, o.item(organization)+"/rollback", nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CancelAll cancels everything active in a unit's subtree of the live tree in one audited action: queued and running
// runs (running runs go to Cancelling), in-flight ticks, open escalations its agents raised, and queued or undelivered
// messages addressed to them. It does not freeze the unit. It needs Execute on Organization, answers 404 for a unit
// outside the organization, and 409 OrganizationNotLive without a live revision.
func (o *OrganizationsClient) CancelAll(ctx context.Context, orgID, unitID string, request CascadeCancelRequest) (*CascadeCancelResult, error) {
	if request.Reason != nil && len(*request.Reason) > 1024 {
		return nil, fmt.Errorf("garrison: cascade cancel reason must be at most 1024 characters; got %d", len(*request.Reason))
	}
	var out CascadeCancelResult
	if err := o.c.Do(ctx, http.MethodPost, o.item(orgID)+"/units/"+url.PathEscape(unitID)+"/cancel-all", nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Spend returns each unit's subtree spend against its budgets in the current day and month windows (live revision).
func (o *OrganizationsClient) Spend(ctx context.Context, organization string) ([]OrgUnitSpend, error) {
	var out []OrgUnitSpend
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/spend", nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}
