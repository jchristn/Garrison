package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// Agentic app sign-in modes (AgenticApp.AuthMode). TenantUsers lets any active user of the app's tenant in; AppUsers
// (the default) lets in tenant users holding the built-in AppUserRole on the app; Anonymous lets anyone with the URL in,
// but only when AnonymousEnabled is also true. Signed-in users still work under Anonymous.
const (
	AppAuthModeTenantUsers = "TenantUsers"
	AppAuthModeAppUsers    = "AppUsers"
	AppAuthModeAnonymous   = "Anonymous"
)

// AppUserRole is the built-in role that lets a user use one agentic app's chat UI. Assign it with resource scope on the
// app identifier; it grants nothing in the management API.
const AppUserRole = "AppUser"

// ResourceTypeAgenticApp is the resource type name of agentic apps in permissions and the operation scope map.
const ResourceTypeAgenticApp = "AgenticApp"

// AgenticAppMember is one agent in an agentic app. AgentID accepts an agent name on create and update; AgentName is
// filled in on read. Role is optional free text.
type AgenticAppMember struct {
	AgentID   string  `json:"agentId"`
	AgentName *string `json:"agentName,omitempty"`
	Role      *string `json:"role,omitempty"`
}

// AgenticAppEdge is a call one member may make to another (a name is accepted for either end on create and update).
// FanOutAllowed nil means the server default, true: the caller may reach the callee through garrison_fan_out.
type AgenticAppEdge struct {
	CallerAgentID string `json:"callerAgentId"`
	CalleeAgentID string `json:"calleeAgentId"`
	FanOutAllowed *bool  `json:"fanOutAllowed,omitempty"`
}

// AgenticAppEnvironment is the entry deployment the app uses in one environment (DeploymentID nil when none is set).
type AgenticAppEnvironment struct {
	Environment  string  `json:"environment"`
	DeploymentID *string `json:"deploymentId,omitempty"`
}

// AgenticApp is a group of agents behind one chat UI at /apps/{slug}/. ID has the prefix app_. Name is unique in the
// tenant (1 to 64 lowercase letters, digits, and hyphens); Slug is unique across the cluster (409 AppSlugTaken) and
// defaults to the name. EntryAgentID (a name is accepted on write) talks to end users. LiveEnvironment (default dev) is
// the environment the app UI uses. AuthMode is one of the AppAuthMode constants (default AppUsers). Active nil means
// the server default, true. The server checks that the entry agent is a member, edges connect members, every member is
// reachable from the entry agent, and the edges have no cycle.
type AgenticApp struct {
	ID                        string                  `json:"id,omitempty"`
	TenantID                  string                  `json:"tenantId,omitempty"`
	Name                      string                  `json:"name"`
	Slug                      string                  `json:"slug,omitempty"`
	Description               *string                 `json:"description,omitempty"`
	EntryAgentID              string                  `json:"entryAgentId"`
	LiveEnvironment           string                  `json:"liveEnvironment,omitempty"`
	AuthMode                  string                  `json:"authMode,omitempty"`
	AnonymousEnabled          bool                    `json:"anonymousEnabled"`
	ShowOperatorDetail        bool                    `json:"showOperatorDetail"`
	DisplayName               *string                 `json:"displayName,omitempty"`
	LogoAssetID               *string                 `json:"logoAssetId,omitempty"`
	PrimaryColor              *string                 `json:"primaryColor,omitempty"`
	AccentColor               *string                 `json:"accentColor,omitempty"`
	WelcomeText               *string                 `json:"welcomeText,omitempty"`
	Members                   []AgenticAppMember      `json:"members"`
	Edges                     []AgenticAppEdge        `json:"edges,omitempty"`
	Environments              []AgenticAppEnvironment `json:"environments,omitempty"`
	LatestPublishedRevisionID *string                 `json:"latestPublishedRevisionId,omitempty"`
	Active                    *bool                   `json:"active,omitempty"`
	CreatedUTC                string                  `json:"createdUtc,omitempty"`
	LastUpdateUTC             string                  `json:"lastUpdateUtc,omitempty"`
}

// AppRevisionMember is one member of an app revision with the published agent revision it pins.
type AppRevisionMember struct {
	AgentID             string  `json:"agentId"`
	AgentName           *string `json:"agentName,omitempty"`
	AgentRevisionID     string  `json:"agentRevisionId"`
	AgentRevisionNumber *int    `json:"agentRevisionNumber,omitempty"`
}

// AppRevision pins every member's published agent revision and copies the app's edges. ID has the prefix apv_; State is
// AgentRevisionStateDraft or AgentRevisionStatePublished.
type AppRevision struct {
	ID              string              `json:"id"`
	TenantID        string              `json:"tenantId"`
	AppID           string              `json:"appId"`
	Number          int                 `json:"number"`
	State           string              `json:"state"`
	Members         []AppRevisionMember `json:"members"`
	Edges           []AgenticAppEdge    `json:"edges"`
	AuthorName      *string             `json:"authorName,omitempty"`
	ChangeNote      *string             `json:"changeNote,omitempty"`
	PublishedByName *string             `json:"publishedByName,omitempty"`
	PublishedUTC    *string             `json:"publishedUtc,omitempty"`
	CreatedUTC      string              `json:"createdUtc"`
}

// AppDelegationMember is one member's delegation policy derived from the app graph (Desired*) next to its latest
// published revision's (Published*, nil when it has none). DesiredMode is AllowList, or None for a member that calls
// nobody. Drift marks a difference. After an apply, DraftRevisionNumber names the draft written, or SkippedReason (for
// example DraftConflict) says why the member was left alone.
type AppDelegationMember struct {
	AgentID             string   `json:"agentId"`
	AgentName           string   `json:"agentName"`
	DesiredMode         string   `json:"desiredMode"`
	DesiredAllowList    []string `json:"desiredAllowList"`
	DesiredMaxDepth     int      `json:"desiredMaxDepth"`
	PublishedMode       *string  `json:"publishedMode,omitempty"`
	PublishedAllowList  []string `json:"publishedAllowList"`
	PublishedMaxDepth   *int     `json:"publishedMaxDepth,omitempty"`
	Drift               bool     `json:"drift"`
	DraftRevisionNumber *int     `json:"draftRevisionNumber,omitempty"`
	SkippedReason       *string  `json:"skippedReason,omitempty"`
}

// AppDelegationPlan holds each member's delegation policy derived from the app graph. Applied is true on the answer to
// ApplyDelegation.
type AppDelegationPlan struct {
	AppID   string                `json:"appId"`
	Applied bool                  `json:"applied"`
	Members []AppDelegationMember `json:"members"`
}

// AppRevisionRequest is the body of taking an app revision.
type AppRevisionRequest struct {
	ChangeNote *string `json:"changeNote,omitempty"`
}

// AppPromotionRequest promotes a published app revision. TargetEnvironment empty means the environment after the
// source; AppRevision (an apv_ identifier or a number) empty means the latest published app revision.
type AppPromotionRequest struct {
	SourceEnvironment string `json:"sourceEnvironment"`
	TargetEnvironment string `json:"targetEnvironment,omitempty"`
	AppRevision       string `json:"appRevision,omitempty"`
	AllowSkip         bool   `json:"allowSkip,omitempty"`
	Note              string `json:"note,omitempty"`
}

// AppsClient manages agentic apps: groups of agents behind one chat UI. List, Get (identifier or name), Create, Update,
// and Delete need Read, Create, Update, and Delete on AgenticApp. An agent that belongs to an app cannot be deleted
// (409 AgentInUse).
type AppsClient struct{ c *Client }

func (a *AppsClient) base() string { return a.c.TenantPath("/apps") }
func (a *AppsClient) item(idOrName string) string {
	return a.base() + "/" + url.PathEscape(idOrName)
}
func (a *AppsClient) revision(idOrName, revision string) string {
	return a.item(idOrName) + "/revisions/" + url.PathEscape(revision)
}

// List lists the tenant's apps. opts may be nil.
func (a *AppsClient) List(ctx context.Context, opts *ListOptions) (*EnumerationResult[AgenticApp], error) {
	var out EnumerationResult[AgenticApp]
	if err := a.c.Do(ctx, http.MethodGet, a.base(), opts.values(), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads an app by identifier (app_...) or name.
func (a *AppsClient) Get(ctx context.Context, idOrName string) (*AgenticApp, error) {
	var out AgenticApp
	if err := a.c.Do(ctx, http.MethodGet, a.item(idOrName), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create creates an app. It fails with 409 NameConflict or AppSlugTaken, or 400 when the graph is not valid.
func (a *AppsClient) Create(ctx context.Context, app AgenticApp) (*AgenticApp, error) {
	var out AgenticApp
	if err := a.c.Do(ctx, http.MethodPost, a.base(), nil, app, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update replaces an app (identifier or name).
func (a *AppsClient) Update(ctx context.Context, idOrName string, app AgenticApp) (*AgenticApp, error) {
	var out AgenticApp
	if err := a.c.Do(ctx, http.MethodPut, a.item(idOrName), nil, app, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete deletes an app and its revisions.
func (a *AppsClient) Delete(ctx context.Context, idOrName string) error {
	return a.c.Do(ctx, http.MethodDelete, a.item(idOrName), nil, nil, nil)
}

// Delegation computes each member's delegation policy from the graph and compares it with the member's latest published
// revision.
func (a *AppsClient) Delegation(ctx context.Context, idOrName string) (*AppDelegationPlan, error) {
	var out AppDelegationPlan
	if err := a.c.Do(ctx, http.MethodGet, a.item(idOrName)+"/delegation", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ApplyDelegation writes the graph's policy into a draft revision of each drifting member; nothing is published. A
// member whose open draft already changes its delegation another way is skipped with SkippedReason DraftConflict.
func (a *AppsClient) ApplyDelegation(ctx context.Context, idOrName string) (*AppDelegationPlan, error) {
	var out AppDelegationPlan
	if err := a.c.Do(ctx, http.MethodPost, a.item(idOrName)+"/delegation", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Revisions lists the app's revisions, newest first.
func (a *AppsClient) Revisions(ctx context.Context, idOrName string) ([]AppRevision, error) {
	var out []AppRevision
	if err := a.c.Do(ctx, http.MethodGet, a.item(idOrName)+"/revisions", nil, nil, &out); err != nil {
		return nil, err
	}
	if out == nil {
		out = []AppRevision{}
	}
	return out, nil
}

// CreateRevision takes a draft app revision pinning every member's latest published revision and copying the edges.
// changeNote is optional (empty sends none). It fails with 409 NoPublishedRevision when a member has none.
func (a *AppsClient) CreateRevision(ctx context.Context, idOrName, changeNote string) (*AppRevision, error) {
	req := AppRevisionRequest{}
	if changeNote != "" {
		req.ChangeNote = &changeNote
	}
	var out AppRevision
	if err := a.c.Do(ctx, http.MethodPost, a.item(idOrName)+"/revisions", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetRevision reads an app revision; revision is an apv_ identifier or a revision number.
func (a *AppsClient) GetRevision(ctx context.Context, idOrName, revision string) (*AppRevision, error) {
	var out AppRevision
	if err := a.c.Do(ctx, http.MethodGet, a.revision(idOrName, revision), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// PublishRevision publishes a draft app revision (identifier or number). It fails with 409 RevisionPublished when the
// revision already is.
func (a *AppsClient) PublishRevision(ctx context.Context, idOrName, revision string) (*AppRevision, error) {
	var out AppRevision
	if err := a.c.Do(ctx, http.MethodPost, a.revision(idOrName, revision)+"/publish", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Promote promotes a published app revision between environments: every member's pin moves to every deployment of that
// member in the target environment together, under one promotion record (roll back with Promotions.Rollback). It fails
// with 409 NoTargetDeployments naming a member without a deployment there, and needs Execute on Promotion for the
// target environment.
func (a *AppsClient) Promote(ctx context.Context, idOrName string, req AppPromotionRequest) (*PromotionRecord, error) {
	var out PromotionRecord
	if err := a.c.Do(ctx, http.MethodPost, a.item(idOrName)+"/promote", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
