package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// Agent revision states (AgentRevision.State).
const (
	AgentRevisionStateDraft     = "Draft"
	AgentRevisionStatePublished = "Published"
)

// Revision diff change types (AgentRevisionChange.ChangeType).
const (
	RevisionChangeChanged = "Changed"
	RevisionChangeAdded   = "Added"
	RevisionChangeRemoved = "Removed"
)

// Promotion kinds (PromotionRecord.Kind) and outcomes (PromotionRecord.Outcome).
const (
	PromotionKindPromote  = "Promote"
	PromotionKindRollback = "Rollback"

	PromotionOutcomeApplied    = "Applied"
	PromotionOutcomeRolledBack = "RolledBack"
)

// AgentRevisionPromptPin pins a prompt role to a template; PinnedVersion nil follows the latest template version.
type AgentRevisionPromptPin struct {
	Role          string `json:"role"`
	TemplateID    string `json:"templateId"`
	PinnedVersion *int   `json:"pinnedVersion,omitempty"`
}

// AgentRevision is an immutable (once published) snapshot of an agent's content. An agent has at most one open draft.
type AgentRevision struct {
	ID       string `json:"id,omitempty"`
	TenantID string `json:"tenantId,omitempty"`
	AgentID  string `json:"agentId,omitempty"`
	Number   int    `json:"number,omitempty"`
	// State is AgentRevisionStateDraft or AgentRevisionStatePublished.
	State                    string                   `json:"state,omitempty"`
	ContentHash              string                   `json:"contentHash,omitempty"`
	DisplayName              string                   `json:"displayName,omitempty"`
	Description              string                   `json:"description,omitempty"`
	InputMode                string                   `json:"inputMode,omitempty"`
	InputSchemaJSON          string                   `json:"inputSchemaJson,omitempty"`
	OutputSchemaJSON         string                   `json:"outputSchemaJson,omitempty"`
	DelegationMode           string                   `json:"delegationMode,omitempty"`
	DelegationMaxDepth       int                      `json:"delegationMaxDepth,omitempty"`
	DelegationAllowRecursion bool                     `json:"delegationAllowRecursion,omitempty"`
	DelegationAllowList      []string                 `json:"delegationAllowList,omitempty"`
	PromptPins               []AgentRevisionPromptPin `json:"promptPins,omitempty"`
	AssetPins                []AgentRevisionAssetPin  `json:"assetPins,omitempty"`
	Capabilities             []string                 `json:"capabilities,omitempty"`
	Tags                     []string                 `json:"tags,omitempty"`
	AuthorUserID             *string                  `json:"authorUserId,omitempty"`
	AuthorName               *string                  `json:"authorName,omitempty"`
	ChangeNote               *string                  `json:"changeNote,omitempty"`
	PublishedByUserID        *string                  `json:"publishedByUserId,omitempty"`
	PublishedByName          *string                  `json:"publishedByName,omitempty"`
	PublishedUTC             *string                  `json:"publishedUtc,omitempty"`
	CreatedUTC               string                   `json:"createdUtc,omitempty"`
	LastUpdateUTC            string                   `json:"lastUpdateUtc,omitempty"`
}

// AgentRevisionChange is one field difference between two revisions; From and To are display values.
type AgentRevisionChange struct {
	Field string `json:"field"`
	// ChangeType is RevisionChangeChanged, RevisionChangeAdded, or RevisionChangeRemoved.
	ChangeType string  `json:"changeType"`
	From       *string `json:"from"`
	To         *string `json:"to"`
}

// AgentRevisionDiff compares two revisions of one agent.
type AgentRevisionDiff struct {
	AgentID        string                `json:"agentId"`
	FromRevisionID string                `json:"fromRevisionId"`
	FromNumber     int                   `json:"fromNumber"`
	ToRevisionID   string                `json:"toRevisionId"`
	ToNumber       int                   `json:"toNumber"`
	Identical      bool                  `json:"identical"`
	Changes        []AgentRevisionChange `json:"changes"`
}

// RevisionPublishRequest is the optional body of a publish.
type RevisionPublishRequest struct {
	ChangeNote *string `json:"changeNote,omitempty"`
}

// TenantEnvironment is one environment in a tenant's promotion order (lowest Position first).
type TenantEnvironment struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	Position    int     `json:"position"`
}

// TenantEnvironmentList is a tenant's ordered environment list. IsDefault is true (read only) when the tenant has not
// configured its own list and the default dev, staging, prod order applies.
type TenantEnvironmentList struct {
	Environments []TenantEnvironment `json:"environments"`
	IsDefault    bool                `json:"isDefault,omitempty"`
}

// PromotionRequest promotes an agent revision from one environment to the next (or to TargetEnvironment).
// AgentRevisionID nil promotes the revision the source environment runs (or the latest published one when the source
// is unpinned). AllowSkip permits a target more than one step ahead.
type PromotionRequest struct {
	AgentID           string  `json:"agentId"`
	SourceEnvironment string  `json:"sourceEnvironment"`
	TargetEnvironment *string `json:"targetEnvironment,omitempty"`
	AgentRevisionID   *string `json:"agentRevisionId,omitempty"`
	AllowSkip         bool    `json:"allowSkip,omitempty"`
	Note              *string `json:"note,omitempty"`
}

// PromotionRollbackRequest is the optional body of a rollback.
type PromotionRollbackRequest struct {
	Note *string `json:"note,omitempty"`
}

// PromotionItem is one deployment a promotion or rollback repinned.
type PromotionItem struct {
	DeploymentID       string  `json:"deploymentId"`
	DeploymentName     string  `json:"deploymentName"`
	AgentID            string  `json:"agentId"`
	PreviousRevisionID *string `json:"previousRevisionId"`
	NewRevisionID      *string `json:"newRevisionId"`
}

// PromotionRecord is the audit record of one promotion or rollback.
type PromotionRecord struct {
	ID       string `json:"id"`
	TenantID string `json:"tenantId"`
	// Kind is PromotionKindPromote or PromotionKindRollback.
	Kind string `json:"kind"`
	// Outcome is PromotionOutcomeApplied, or PromotionOutcomeRolledBack once a later rollback reverted it.
	Outcome             string          `json:"outcome"`
	AgentID             *string         `json:"agentId"`
	AppID               *string         `json:"appId"`
	AppRevisionID       *string         `json:"appRevisionId"`
	AgentRevisionID     *string         `json:"agentRevisionId"`
	SourceEnvironment   string          `json:"sourceEnvironment"`
	TargetEnvironment   string          `json:"targetEnvironment"`
	SkippedEnvironments bool            `json:"skippedEnvironments"`
	RollbackOfID        *string         `json:"rollbackOfId"`
	RolledBackByID      *string         `json:"rolledBackById"`
	ActorType           string          `json:"actorType"`
	ActorID             *string         `json:"actorId"`
	ActorName           *string         `json:"actorName"`
	Note                *string         `json:"note"`
	Items               []PromotionItem `json:"items"`
	CreatedUTC          string          `json:"createdUtc"`
}

func (a *AgentsClient) revisions(agent string) string { return a.item(agent) + "/revisions" }

// ListRevisions lists an agent's (identifier or name) revisions, newest first.
func (a *AgentsClient) ListRevisions(ctx context.Context, agent string, opts *ListOptions) (*EnumerationResult[AgentRevision], error) {
	var out EnumerationResult[AgentRevision]
	if err := a.c.Do(ctx, http.MethodGet, a.revisions(agent), opts.values(), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SaveDraft creates or replaces the agent's single open draft revision with content.
func (a *AgentsClient) SaveDraft(ctx context.Context, agent string, content AgentRevision) (*AgentRevision, error) {
	var out AgentRevision
	if err := a.c.Do(ctx, http.MethodPost, a.revisions(agent), nil, content, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetRevision reads one revision; revision is an arv_ identifier or a revision number.
func (a *AgentsClient) GetRevision(ctx context.Context, agent, revision string) (*AgentRevision, error) {
	var out AgentRevision
	if err := a.c.Do(ctx, http.MethodGet, a.revisions(agent)+"/"+url.PathEscape(revision), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteRevision deletes a revision (identifier or number).
func (a *AgentsClient) DeleteRevision(ctx context.Context, agent, revision string) error {
	return a.c.Do(ctx, http.MethodDelete, a.revisions(agent)+"/"+url.PathEscape(revision), nil, nil, nil)
}

// PublishRevision publishes a draft revision; changeNote is optional (empty sends none).
func (a *AgentsClient) PublishRevision(ctx context.Context, agent, revision, changeNote string) (*AgentRevision, error) {
	req := RevisionPublishRequest{}
	if changeNote != "" {
		req.ChangeNote = &changeNote
	}
	var out AgentRevision
	if err := a.c.Do(ctx, http.MethodPost, a.revisions(agent)+"/"+url.PathEscape(revision)+"/publish", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DiffRevisions compares two revisions (identifiers or numbers).
func (a *AgentsClient) DiffRevisions(ctx context.Context, agent, from, to string) (*AgentRevisionDiff, error) {
	query := url.Values{}
	query.Set("from", from)
	query.Set("to", to)
	var out AgentRevisionDiff
	if err := a.c.Do(ctx, http.MethodGet, a.revisions(agent)+"/diff", query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// EnvironmentsClient reads and replaces the tenant's ordered promotion environments.
type EnvironmentsClient struct{ c *Client }

// Get reads the environment list.
func (e *EnvironmentsClient) Get(ctx context.Context) (*TenantEnvironmentList, error) {
	var out TenantEnvironmentList
	if err := e.c.Do(ctx, http.MethodGet, e.c.TenantPath("/environments"), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update replaces the environment list.
func (e *EnvironmentsClient) Update(ctx context.Context, list TenantEnvironmentList) (*TenantEnvironmentList, error) {
	var out TenantEnvironmentList
	if err := e.c.Do(ctx, http.MethodPut, e.c.TenantPath("/environments"), nil, list, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// PromotionsClient promotes agent revisions between environments and rolls promotions back.
type PromotionsClient struct{ c *Client }

// List lists promotion records, newest first; agentID and appID narrow it when not empty.
func (p *PromotionsClient) List(ctx context.Context, agentID, appID string, opts *ListOptions) (*EnumerationResult[PromotionRecord], error) {
	query := opts.values()
	if agentID != "" {
		query.Set("agentId", agentID)
	}
	if appID != "" {
		query.Set("appId", appID)
	}
	var out EnumerationResult[PromotionRecord]
	if err := p.c.Do(ctx, http.MethodGet, p.c.TenantPath("/promotions"), query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads one promotion record.
func (p *PromotionsClient) Get(ctx context.Context, id string) (*PromotionRecord, error) {
	var out PromotionRecord
	if err := p.c.Do(ctx, http.MethodGet, p.c.TenantPath("/promotions/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Promote pins the target environment's deployments of the agent to a revision.
func (p *PromotionsClient) Promote(ctx context.Context, req PromotionRequest) (*PromotionRecord, error) {
	var out PromotionRecord
	if err := p.c.Do(ctx, http.MethodPost, p.c.TenantPath("/promotions"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Rollback reverts a promotion, restoring each deployment's previous pin; note is optional (empty sends none).
func (p *PromotionsClient) Rollback(ctx context.Context, id, note string) (*PromotionRecord, error) {
	req := PromotionRollbackRequest{}
	if note != "" {
		req.Note = &note
	}
	var out PromotionRecord
	if err := p.c.Do(ctx, http.MethodPost, p.c.TenantPath("/promotions/"+url.PathEscape(id)+"/rollback"), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
