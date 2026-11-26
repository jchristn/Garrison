package garrison

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
)

// Board is the board view of an organization, computed by the server on each read. Escalations (pending, newest
// first), Proposals (awaiting a decision, without diffs), and UnhealthyReports (Degraded or Unhealthy in the last 7
// days) are capped by the limit passed to Get. LatestBrief is the newest Brief report from the organization's agents.
// Briefs and reports are agent output; treat them as untrusted text.
type Board struct {
	OrganizationID string  `json:"organizationId"`
	Name           string  `json:"name"`
	Mission        *string `json:"mission"`
	// Status is an OrganizationStatus* constant.
	Status       string `json:"status"`
	GeneratedUTC string `json:"generatedUtc"`
	// Chart is the live revision's chart; its Units are empty when nothing is published.
	Chart OrgChart `json:"chart"`
	// Ceo is the root unit's lead, or nil when the root unit has no lead.
	Ceo              *BoardCeo         `json:"ceo"`
	UnitHealth       []BoardUnitHealth `json:"unitHealth"`
	Escalations      []Escalation      `json:"escalations"`
	Proposals        []OrgProposal     `json:"proposals"`
	Spend            []OrgUnitSpend    `json:"spend"`
	LatestBrief      *Report           `json:"latestBrief"`
	UnhealthyReports []Report          `json:"unhealthyReports"`
	Freezes          []Freeze          `json:"freezes"`
	KillSwitch       KillSwitchState   `json:"killSwitch"`
}

// BoardCeo is the CEO on the board view: the root unit's lead, its mandate in the live revision, and that mandate's
// deployment, which board messages run on. BriefIntervalHours comes from the mandate's published revision (nil when
// briefs are off); LastBriefUTC is when the CEO last filed a Brief report.
type BoardCeo struct {
	AgentID            string  `json:"agentId"`
	AgentName          *string `json:"agentName"`
	UnitID             string  `json:"unitId"`
	UnitName           *string `json:"unitName"`
	MandateID          *string `json:"mandateId"`
	MandateName        *string `json:"mandateName"`
	DeploymentID       *string `json:"deploymentId"`
	BriefIntervalHours *int    `json:"briefIntervalHours"`
	LastBriefUTC       *string `json:"lastBriefUtc"`
}

// BoardUnitHealth is one unit's row on the board view. Health is a ReportHealth* value (Unknown when the unit has no
// report); Frozen is true when an active freeze covers the unit or the organization; OverBudget is true when a spend
// row for the unit has reached its budget.
type BoardUnitHealth struct {
	UnitID          string  `json:"unitId"`
	UnitName        string  `json:"unitName"`
	Health          string  `json:"health"`
	LastReportID    *string `json:"lastReportId"`
	LastReportUTC   *string `json:"lastReportUtc"`
	OpenEscalations int     `json:"openEscalations"`
	Frozen          bool    `json:"frozen"`
	OverBudget      bool    `json:"overBudget"`
}

// BoardDirectionRequest is direction for the CEO: Direction is required (1 to 4000 characters); ChangeNote is at most
// 2000 characters and defaults to "Board direction".
type BoardDirectionRequest struct {
	Direction  string  `json:"direction"`
	ChangeNote *string `json:"changeNote,omitempty"`
}

// BoardMessageRequest is a message to the CEO: Input is required (1 to 32000 characters); ConversationID continues an
// earlier board conversation.
type BoardMessageRequest struct {
	Input          string  `json:"input"`
	ConversationID *string `json:"conversationId,omitempty"`
}

// BoardClient is the board: the people who direct an autonomous organization. Get needs Read on Organization; Direct
// and SendMessage need Update. The organization takes an identifier or a name. Without a CEO mandate the calls fail
// with 409 BoardCeoMissing; SendMessage fails with 409 BoardCeoUnavailable when the CEO mandate has no deployment.
type BoardClient struct{ c *Client }

func (b *BoardClient) path(orgID, suffix string) string {
	return b.c.TenantPath("/organizations/" + url.PathEscape(orgID) + suffix)
}

// Get reads the board view. limit (1 to 100) caps Escalations, Proposals, and UnhealthyReports; 0 uses the server
// default of 20.
func (b *BoardClient) Get(ctx context.Context, orgID string, limit int) (*Board, error) {
	if limit < 0 || limit > 100 {
		return nil, fmt.Errorf("garrison: board limit must be from 1 to 100, or 0 for the default; got %d", limit)
	}
	q := url.Values{}
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	var out Board
	if err := b.c.Do(ctx, http.MethodGet, b.path(orgID, "/board"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Direct gives the CEO direction: the server publishes a new revision of the CEO's mandate with Direction set and
// source Board, and returns it. Allowed while the organization is frozen.
func (b *BoardClient) Direct(ctx context.Context, orgID string, request BoardDirectionRequest) (*MandateRevision, error) {
	var out MandateRevision
	if err := b.c.Do(ctx, http.MethodPost, b.path(orgID, "/direction"), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SendMessage talks to the CEO: the server starts a run on the CEO mandate's deployment as the caller and answers 202
// with it. Follow the run with Runs and continue with its ConversationID.
func (b *BoardClient) SendMessage(ctx context.Context, orgID string, request BoardMessageRequest) (*Run, error) {
	var out Run
	if err := b.c.Do(ctx, http.MethodPost, b.path(orgID, "/board/messages"), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListConversations returns the conversations the board started with the CEO, newest first.
func (b *BoardClient) ListConversations(ctx context.Context, orgID string) (*EnumerationResult[Conversation], error) {
	var out EnumerationResult[Conversation]
	if err := b.c.Do(ctx, http.MethodGet, b.path(orgID, "/board/conversations"), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
