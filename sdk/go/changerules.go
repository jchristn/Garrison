package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Change classes (ChangeRuleClass.Class, ChangeRuleLimit.Class, ChangeRuleMatchItem.Classes): the kinds of executive
// change a change rule may pre-authorize. A change with no class always waits for a person.
const (
	ChangeClassPromptRetune     = "PromptRetune"
	ChangeClassWakeTuning       = "WakeTuning"
	ChangeClassMandateTextEdit  = "MandateTextEdit"
	ChangeClassAddWorker        = "AddWorker"
	ChangeClassRemoveWorker     = "RemoveWorker"
	ChangeClassModelChange      = "ModelChange"
	ChangeClassDeploymentWeight = "DeploymentWeight"
)

// ResourceTypeChangeRule is the resource type name of change rules in permissions and the operation scope map.
const ResourceTypeChangeRule = "ChangeRule"

// ChangeRuleClass is one class of change a rule pre-authorizes (a ChangeClass constant).
type ChangeRuleClass struct {
	Class string `json:"class"`
}

// ChangeRuleLimit is a bound a change must stay within for the rule to cover it. Class must be listed on the rule
// (otherwise field code ClassNotInRule). Name is count (any class); minIntervalSeconds, maxIntervalSeconds,
// backoffFactor, or jitterPercent (WakeTuning); or weight (DeploymentWeight); any other name is refused with
// UnknownLimit. Give Minimum, Maximum, or both (BoundRequired), zero or more, with Minimum not above Maximum.
type ChangeRuleLimit struct {
	Class   string   `json:"class"`
	Name    string   `json:"name"`
	Minimum *float64 `json:"minimum,omitempty"`
	Maximum *float64 `json:"maximum,omitempty"`
}

// ChangeRule is a person's pre-authorization of narrow classes of executive change for a unit's subtree: an
// executive's draft applies without a person when every change in it falls inside the rule's unit subtree, has only
// classes the rule lists, and stays within its limits. ID has the prefix cru_. In a request OrganizationID and UnitID
// take an identifier or a name; OrganizationName and UnitName are filled on read. ExpiresUTC nil means no expiry; when
// set it must be in the future (ExpiryInPast). The organization cannot change on update. Active is always sent, so set
// it to true for a rule in force.
type ChangeRule struct {
	ID               string            `json:"id,omitempty"`
	TenantID         string            `json:"tenantId,omitempty"`
	OrganizationID   string            `json:"organizationId"`
	OrganizationName *string           `json:"organizationName,omitempty"`
	UnitID           string            `json:"unitId"`
	UnitName         *string           `json:"unitName,omitempty"`
	Name             string            `json:"name"`
	Description      *string           `json:"description,omitempty"`
	Active           bool              `json:"active"`
	ExpiresUTC       *string           `json:"expiresUtc,omitempty"`
	Classes          []ChangeRuleClass `json:"classes"`
	Limits           []ChangeRuleLimit `json:"limits"`
	CreatedByType    string            `json:"createdByType,omitempty"`
	CreatedByID      *string           `json:"createdById,omitempty"`
	CreatedByName    *string           `json:"createdByName,omitempty"`
	UpdatedByName    *string           `json:"updatedByName,omitempty"`
	CreatedUTC       string            `json:"createdUtc,omitempty"`
	LastUpdateUTC    string            `json:"lastUpdateUtc,omitempty"`
}

// ChangeRuleFilter filters ChangeRules.List; empty fields are not sent. Organization and Unit take an identifier or a
// name; Unit needs Organization.
type ChangeRuleFilter struct {
	Organization string
	Unit         string
	ActiveOnly   bool
	Search       string
	MaxResults   int
	Skip         int
}

// ExecutiveRefusal is a hard limit an executive's draft item breaks. Code is OutsideSubtree, SelfModification,
// ForbiddenKind, BudgetIncrease, or AuthorityChange. No change rule lifts it.
type ExecutiveRefusal struct {
	Kind    string `json:"kind"`
	Name    string `json:"name"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ChangeRuleMatchItem is one change of an executive's draft with its classes and the change rule that covers it
// (RuleID, RuleName) or why none does (Reason). Subject is what the change is about; count limits count distinct
// subjects.
type ChangeRuleMatchItem struct {
	Kind     string   `json:"kind"`
	Name     string   `json:"name"`
	Detail   *string  `json:"detail,omitempty"`
	Subject  string   `json:"subject"`
	Classes  []string `json:"classes"`
	RuleID   *string  `json:"ruleId,omitempty"`
	RuleName *string  `json:"ruleName,omitempty"`
	Reason   *string  `json:"reason,omitempty"`
}

// OrgProposal is an executive's studio draft seen from its organization. Status is a StudioDraftStatus constant;
// DecisionSource is Rule when change rules applied it and User when a person did. RuleIDs lists the rules that applied
// it. Diff is filled only when one proposal is read and it is not applied.
type OrgProposal struct {
	DraftID        string           `json:"draftId"`
	Title          string           `json:"title"`
	Status         string           `json:"status"`
	Version        int              `json:"version"`
	OrganizationID string           `json:"organizationId"`
	UnitID         string           `json:"unitId"`
	UnitName       *string          `json:"unitName,omitempty"`
	AgentID        string           `json:"agentId"`
	AgentName      *string          `json:"agentName,omitempty"`
	OriginRunID    *string          `json:"originRunId,omitempty"`
	OwnerName      *string          `json:"ownerName,omitempty"`
	ApprovalID     *string          `json:"approvalId,omitempty"`
	ApprovalStatus *string          `json:"approvalStatus,omitempty"`
	DecisionSource *string          `json:"decisionSource,omitempty"`
	DecidedBy      *string          `json:"decidedBy,omitempty"`
	Reason         *string          `json:"reason,omitempty"`
	RuleIDs        []string         `json:"ruleIds"`
	Diff           *StudioDraftDiff `json:"diff,omitempty"`
	CreatedUTC     string           `json:"createdUtc,omitempty"`
	LastUpdateUTC  string           `json:"lastUpdateUtc,omitempty"`
}

// OrgProposalDecisionRequest decides a proposal waiting for approval: Allow true applies it, false sends it back to
// the executive. Reason is at most 4000 characters.
type OrgProposalDecisionRequest struct {
	Allow  bool    `json:"allow"`
	Reason *string `json:"reason,omitempty"`
}

// OrgProposalFilter filters Organizations.ListProposals; empty fields are not sent. Status is a StudioDraftStatus
// constant.
type OrgProposalFilter struct {
	Status     string
	MaxResults int
	Skip       int
}

// ChangeRulesClient lists, reads, creates, updates, and deletes change rules: people pre-authorize narrow classes of
// executive change for a unit's subtree. Read, Create, Update, and Delete on ChangeRule; run tokens can never write a
// rule (403 RulesArePeopleOnly). A refused field answers 400 with a field code such as UnknownLimit, ClassNotInRule,
// UnitNotFound, BoundRequired, MinimumAboveMaximum, or ExpiryInPast.
type ChangeRulesClient struct{ c *Client }

// List returns a page of change rules, newest first.
func (r *ChangeRulesClient) List(ctx context.Context, filter ChangeRuleFilter) (*EnumerationResult[ChangeRule], error) {
	q := url.Values{}
	if filter.Organization != "" {
		q.Set("organization", filter.Organization)
	}
	if filter.Unit != "" {
		q.Set("unit", filter.Unit)
	}
	if filter.ActiveOnly {
		q.Set("activeOnly", "true")
	}
	if filter.Search != "" {
		q.Set("search", filter.Search)
	}
	if filter.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(filter.MaxResults))
	}
	if filter.Skip > 0 {
		q.Set("skip", strconv.Itoa(filter.Skip))
	}
	var out EnumerationResult[ChangeRule]
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/change-rules"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a change rule.
func (r *ChangeRulesClient) Get(ctx context.Context, id string) (*ChangeRule, error) {
	var out ChangeRule
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/change-rules/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create stores a change rule.
func (r *ChangeRulesClient) Create(ctx context.Context, rule ChangeRule) (*ChangeRule, error) {
	var out ChangeRule
	if err := r.c.Do(ctx, http.MethodPost, r.c.TenantPath("/change-rules"), nil, rule, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update replaces a rule's unit, name, description, active flag, expiry, classes, and limits.
func (r *ChangeRulesClient) Update(ctx context.Context, id string, rule ChangeRule) (*ChangeRule, error) {
	var out ChangeRule
	if err := r.c.Do(ctx, http.MethodPut, r.c.TenantPath("/change-rules/"+url.PathEscape(id)), nil, rule, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete removes a change rule.
func (r *ChangeRulesClient) Delete(ctx context.Context, id string) error {
	return r.c.Do(ctx, http.MethodDelete, r.c.TenantPath("/change-rules/"+url.PathEscape(id)), nil, nil, nil)
}

// ListProposals returns a page of the organization's executive proposals, newest change first, without diffs. Needs
// Read on Organization.
func (o *OrganizationsClient) ListProposals(ctx context.Context, organization string, filter OrgProposalFilter) (*EnumerationResult[OrgProposal], error) {
	q := url.Values{}
	if filter.Status != "" {
		q.Set("status", filter.Status)
	}
	if filter.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(filter.MaxResults))
	}
	if filter.Skip > 0 {
		q.Set("skip", strconv.Itoa(filter.Skip))
	}
	var out EnumerationResult[OrgProposal]
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/proposals", q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetProposal reads a proposal. One not yet applied carries its diff, hard-limit refusals, and the change rule
// matching each change.
func (o *OrganizationsClient) GetProposal(ctx context.Context, organization, draftID string) (*OrgProposal, error) {
	var out OrgProposal
	if err := o.c.Do(ctx, http.MethodGet, o.item(organization)+"/proposals/"+url.PathEscape(draftID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DecideProposal allows (applies, recorded as an org revision that a rollback undoes) or denies (sends back to the
// executive) a proposal waiting for approval. Needs Update on Approval.
func (o *OrganizationsClient) DecideProposal(ctx context.Context, organization, draftID string, request OrgProposalDecisionRequest) (*OrgProposal, error) {
	var out OrgProposal
	if err := o.c.Do(ctx, http.MethodPost, o.item(organization)+"/proposals/"+url.PathEscape(draftID)+"/decide", nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
