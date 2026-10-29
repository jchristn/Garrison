package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Studio draft statuses (StudioDraft.Status). Only an Open draft changes; PendingApproval is frozen until its
// DraftApply approval is decided, expires, or is cancelled.
const (
	StudioDraftStatusOpen            = "Open"
	StudioDraftStatusPendingApproval = "PendingApproval"
	StudioDraftStatusApplied         = "Applied"
	StudioDraftStatusDiscarded       = "Discarded"
)

// Studio draft item operations (StudioDraftItem.Operation). Upsert creates or updates the resource on apply; Delete
// deletes it (Agent, Deployment, Pipeline, and AgenticApp only).
const (
	StudioDraftOperationUpsert = "Upsert"
	StudioDraftOperationDelete = "Delete"
)

// Studio graph operations (StudioGraphOperationRequest.Operation).
const (
	StudioGraphOperationAddMember    = "AddMember"
	StudioGraphOperationRemoveMember = "RemoveMember"
	StudioGraphOperationConnect      = "Connect"
	StudioGraphOperationDisconnect   = "Disconnect"
	StudioGraphOperationSetEntry     = "SetEntry"
	StudioGraphOperationMoveNode     = "MoveNode"
)

// Management access of a deployment's run tokens (Deployment.ManagementAccess). None is the default; Drafts lets the
// agent architect edit studio drafts for the person who started the run, and never apply them.
const (
	ManagementAccessNone   = "None"
	ManagementAccessDrafts = "Drafts"
)

// ResourceTypeStudioDraft is the resource type name of studio drafts in permissions and the operation scope map.
const ResourceTypeStudioDraft = "StudioDraft"

// StudioDraftItem is one manifest document in a draft, keyed by Kind and Name. Document is the YAML as stored (empty
// for a Delete). BaseHash is the hash of the live document the item started from, nil when the resource did not exist.
type StudioDraftItem struct {
	Kind          string  `json:"kind"`
	Name          string  `json:"name"`
	Operation     string  `json:"operation"`
	Document      string  `json:"document"`
	BaseHash      *string `json:"baseHash,omitempty"`
	LastUpdateUTC string  `json:"lastUpdateUtc,omitempty"`
}

// StudioDraftNode is a canvas position of a graph node, keyed by node key (for example Agent/researcher).
type StudioDraftNode struct {
	NodeKey string  `json:"nodeKey"`
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
}

// StudioDraft is a set of manifest documents designed in the studio and applied only after a person approves. ID has
// the prefix sdr_. Version rises by one on every change; every change names the version the caller read (409
// DraftVersionConflict otherwise). ApprovalID names the DraftApply approval while one exists, and ManifestApplyID the
// manifest apply once Applied.
type StudioDraft struct {
	ID              string            `json:"id"`
	TenantID        string            `json:"tenantId"`
	Title           string            `json:"title"`
	OwnerUserID     *string           `json:"ownerUserId,omitempty"`
	OwnerName       *string           `json:"ownerName,omitempty"`
	ConversationID  *string           `json:"conversationId,omitempty"`
	TargetApp       *string           `json:"targetApp,omitempty"`
	Version         int               `json:"version"`
	Status          string            `json:"status"`
	ApprovalID      *string           `json:"approvalId,omitempty"`
	PublishOnApply  bool              `json:"publishOnApply"`
	ManifestApplyID *string           `json:"manifestApplyId,omitempty"`
	Items           []StudioDraftItem `json:"items"`
	Layout          []StudioDraftNode `json:"layout"`
	CreatedUTC      string            `json:"createdUtc,omitempty"`
	LastUpdateUTC   string            `json:"lastUpdateUtc,omitempty"`
}

// StudioDraftDiffItem compares one draft item with live configuration. Change is Create, Update, Delete, Unchanged,
// or Failed; Changes lists the fields of an Update; Message and ErrorCode say why an item Failed. Stale is true when
// the live resource changed after the draft was based on it.
type StudioDraftDiffItem struct {
	Kind      string                `json:"kind"`
	Name      string                `json:"name"`
	Change    string                `json:"change"`
	Changes   []ManifestFieldChange `json:"changes,omitempty"`
	Message   *string               `json:"message,omitempty"`
	ErrorCode *string               `json:"errorCode,omitempty"`
	Stale     bool                  `json:"stale"`
}

// StudioDraftDiff is a draft compared with live configuration by manifest dry run. Valid is true when nothing failed
// and nothing is stale.
type StudioDraftDiff struct {
	DraftID string                `json:"draftId"`
	Version int                   `json:"version"`
	Valid   bool                  `json:"valid"`
	Items   []StudioDraftDiffItem `json:"items"`
}

// StudioGraphNode is an app or agent in a draft's graph. Key is Kind/Name. InDraft is true when the draft holds the
// resource, Deleted when the draft deletes it. EntryOf and MemberOf name the apps the agent is the entry of or belongs
// to. Capabilities lists, for an agent the draft holds, the capabilities its document names (host tools such as
// pandoc). X and Y are nil until the node is placed.
type StudioGraphNode struct {
	Key          string   `json:"key"`
	Kind         string   `json:"kind"`
	Name         string   `json:"name"`
	InDraft      bool     `json:"inDraft"`
	Deleted      bool     `json:"deleted"`
	EntryOf      []string `json:"entryOf"`
	MemberOf     []string `json:"memberOf"`
	Capabilities []string `json:"capabilities"`
	X            *float64 `json:"x,omitempty"`
	Y            *float64 `json:"y,omitempty"`
}

// StudioGraphEdge is a call one member of App may make to another, by agent name. Depth is the delegation depth the
// edge needs: one plus the longest chain of calls below the called member (minimum 1).
type StudioGraphEdge struct {
	App    string `json:"app"`
	From   string `json:"from"`
	To     string `json:"to"`
	FanOut bool   `json:"fanOut"`
	Depth  int    `json:"depth"`
}

// StudioGraph is a draft's apps drawn as nodes and call edges, at the draft's Version.
type StudioGraph struct {
	DraftID string            `json:"draftId"`
	Version int               `json:"version"`
	Nodes   []StudioGraphNode `json:"nodes"`
	Edges   []StudioGraphEdge `json:"edges"`
}

// StudioGraphOperationRequest is one graph operation at the draft Version the caller read. Operation is a
// StudioGraphOperation* constant. App defaults to the draft's target app. AddMember takes Agent and optional Role;
// RemoveMember and SetEntry take Agent; Connect takes From, To, and optional FanOut (nil means true); Disconnect
// takes From and To; MoveNode takes NodeKey, X, and Y.
type StudioGraphOperationRequest struct {
	Version   int     `json:"version"`
	Operation string  `json:"operation"`
	App       string  `json:"app,omitempty"`
	Agent     string  `json:"agent,omitempty"`
	Role      string  `json:"role,omitempty"`
	From      string  `json:"from,omitempty"`
	To        string  `json:"to,omitempty"`
	FanOut    *bool   `json:"fanOut,omitempty"`
	NodeKey   string  `json:"nodeKey,omitempty"`
	X         float64 `json:"x,omitempty"`
	Y         float64 `json:"y,omitempty"`
}

// ArchitectPromptEntry is a System prompt the agent architect can use. Built-ins come first, then tenant clones of
// them (matched by BuiltInKey), then the tenant's other System templates. IsDefault marks builtin/agent-architect,
// and Deployments names the architect deployments that bind the template.
type ArchitectPromptEntry struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Description    *string  `json:"description,omitempty"`
	IsBuiltIn      bool     `json:"isBuiltIn"`
	BuiltInKey     *string  `json:"builtInKey,omitempty"`
	CurrentVersion int      `json:"currentVersion"`
	IsDefault      bool     `json:"isDefault"`
	Deployments    []string `json:"deployments"`
}

// ArchitectPromptSelection is the prompt an architect deployment uses. ArchitectPromptVersion is nil when the
// deployment follows the template's current version (CurrentVersion).
type ArchitectPromptSelection struct {
	DeploymentID              string `json:"deploymentId"`
	ArchitectPromptTemplateID string `json:"architectPromptTemplateId"`
	ArchitectPromptName       string `json:"architectPromptName"`
	ArchitectPromptVersion    *int   `json:"architectPromptVersion,omitempty"`
	CurrentVersion            int    `json:"currentVersion"`
}

// ArchitectPromptRequest chooses an architect deployment's prompt: a System template by identifier or name, and an
// optional version to pin (nil follows the current version).
type ArchitectPromptRequest struct {
	ArchitectPromptTemplateID string `json:"architectPromptTemplateId"`
	ArchitectPromptVersion    *int   `json:"architectPromptVersion,omitempty"`
}

// Architect is an agent architect: a tenant deployment that may edit studio drafts for the person it works for. ID is
// the deployment identifier; AgentID is normally the built-in agent-architect. ArchitectPromptVersion is nil when the
// architect follows the template's current version (ArchitectPromptCurrentVersion).
type Architect struct {
	ID                            string  `json:"id"`
	TenantID                      string  `json:"tenantId"`
	Name                          string  `json:"name"`
	Description                   *string `json:"description,omitempty"`
	AgentID                       string  `json:"agentId"`
	AgentName                     *string `json:"agentName,omitempty"`
	HarnessProfileID              string  `json:"harnessProfileId"`
	Model                         *string `json:"model,omitempty"`
	Active                        bool    `json:"active"`
	ArchitectPromptTemplateID     string  `json:"architectPromptTemplateId"`
	ArchitectPromptName           string  `json:"architectPromptName"`
	ArchitectPromptVersion        *int    `json:"architectPromptVersion,omitempty"`
	ArchitectPromptCurrentVersion int     `json:"architectPromptCurrentVersion"`
	ConfigVersion                 int     `json:"configVersion"`
	IsProtected                   bool    `json:"isProtected"`
	CreatedUTC                    string  `json:"createdUtc,omitempty"`
	LastUpdateUTC                 string  `json:"lastUpdateUtc,omitempty"`
}

// ArchitectRequest creates or changes an agent architect. Name and HarnessProfileID are required. Active is sent as
// is, so set it to true for an architect that accepts runs. ArchitectPromptTemplateID (a System template identifier or
// name) nil binds builtin/agent-architect on create and keeps the current prompt on update; ArchitectPromptVersion pins
// a version (1 or more), nil follows the current one.
type ArchitectRequest struct {
	Name                      string  `json:"name"`
	Description               *string `json:"description,omitempty"`
	HarnessProfileID          string  `json:"harnessProfileId"`
	Model                     *string `json:"model,omitempty"`
	Active                    *bool   `json:"active,omitempty"`
	ArchitectPromptTemplateID *string `json:"architectPromptTemplateId,omitempty"`
	ArchitectPromptVersion    *int    `json:"architectPromptVersion,omitempty"`
}

type studioDraftCreateRequest struct {
	Title   string `json:"title,omitempty"`
	FromApp string `json:"fromApp,omitempty"`
}

type studioDraftItemRequest struct {
	Version   int    `json:"version"`
	Operation string `json:"operation,omitempty"`
	Document  string `json:"document"`
}

type studioDraftVersionRequest struct {
	Version int `json:"version"`
}

// StudioDraftsClient manages studio drafts, agent architects, and architect prompts. Listing and reading drafts need
// Read on StudioDraft, creating Create, editing and requesting apply Update, and deleting Delete. Applying happens only
// when a person decides the DraftApply approval Allow through Approvals.Decide. Architect prompt calls need Read on
// PromptTemplate (listing), Read on Deployment (reading a selection), and Update on Deployment (changing it). Architect
// calls need Read, Create, Update, or Delete on Deployment.
type StudioDraftsClient struct{ c *Client }

func (s *StudioDraftsClient) base() string { return s.c.TenantPath("/studio/drafts") }
func (s *StudioDraftsClient) item(id string) string {
	return s.base() + "/" + url.PathEscape(id)
}
func (s *StudioDraftsClient) draftItem(id, kind, name string) string {
	return s.item(id) + "/items/" + url.PathEscape(kind) + "/" + url.PathEscape(name)
}
func (s *StudioDraftsClient) architects() string { return s.c.TenantPath("/studio/architects") }
func (s *StudioDraftsClient) architectItem(deploymentID string) string {
	return s.architects() + "/" + url.PathEscape(deploymentID)
}
func (s *StudioDraftsClient) architect(deploymentID string) string {
	return s.architectItem(deploymentID) + "/prompt"
}

// List lists drafts, newest change first. With mine, only the caller's own drafts. opts may be nil; Search finds
// text in the title.
func (s *StudioDraftsClient) List(ctx context.Context, mine bool, opts *ListOptions) (*EnumerationResult[StudioDraft], error) {
	q := opts.values()
	if mine {
		q.Set("mine", "true")
	}
	var out EnumerationResult[StudioDraft]
	if err := s.c.Do(ctx, http.MethodGet, s.base(), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create starts a draft. title may be empty. With fromApp (an app identifier or name) the draft starts with one item
// per document of the app and everything it references; that needs Read on AgenticApp.
func (s *StudioDraftsClient) Create(ctx context.Context, title, fromApp string) (*StudioDraft, error) {
	var out StudioDraft
	if err := s.c.Do(ctx, http.MethodPost, s.base(), nil, studioDraftCreateRequest{Title: title, FromApp: fromApp}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a draft with its items and layout.
func (s *StudioDraftsClient) Get(ctx context.Context, id string) (*StudioDraft, error) {
	var out StudioDraft
	if err := s.c.Do(ctx, http.MethodGet, s.item(id), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete discards a draft. A pending DraftApply approval is cancelled.
func (s *StudioDraftsClient) Delete(ctx context.Context, id string) error {
	return s.c.Do(ctx, http.MethodDelete, s.item(id), nil, nil, nil)
}

// PutItem creates or replaces one item at the version the caller read. operation is a StudioDraftOperation*
// constant (empty means Upsert); document is one manifest document whose kind and name match the path, and is
// ignored for Delete. It fails with 409 DraftVersionConflict or DraftNotOpen, and 400 with field codes
// UnsupportedKind, InvalidDocument, DocumentMismatch, or DeleteNotSupported.
func (s *StudioDraftsClient) PutItem(ctx context.Context, id, kind, name string, version int, document, operation string) (*StudioDraft, error) {
	var out StudioDraft
	if err := s.c.Do(ctx, http.MethodPut, s.draftItem(id, kind, name), nil, studioDraftItemRequest{Version: version, Operation: operation, Document: document}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// RemoveItem removes one item at the version the caller read.
func (s *StudioDraftsClient) RemoveItem(ctx context.Context, id, kind, name string, version int) (*StudioDraft, error) {
	q := url.Values{}
	q.Set("version", strconv.Itoa(version))
	var out StudioDraft
	if err := s.c.Do(ctx, http.MethodDelete, s.draftItem(id, kind, name), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Diff compares each item with live configuration.
func (s *StudioDraftsClient) Diff(ctx context.Context, id string) (*StudioDraftDiff, error) {
	var out StudioDraftDiff
	if err := s.c.Do(ctx, http.MethodGet, s.item(id)+"/diff", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Validate validates the draft by manifest dry run; the result has the same shape as Diff.
func (s *StudioDraftsClient) Validate(ctx context.Context, id string) (*StudioDraftDiff, error) {
	var out StudioDraftDiff
	if err := s.c.Do(ctx, http.MethodPost, s.item(id)+"/validate", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// RequestApply asks a person to approve applying the draft at the version the caller read. It returns the DraftApply
// approval and moves the draft to PendingApproval; nothing changes in live configuration until the approval is
// decided Allow. It fails with 400 DraftStale, DraftInvalid, or DraftEmpty.
func (s *StudioDraftsClient) RequestApply(ctx context.Context, id string, version int) (*Approval, error) {
	var out Approval
	if err := s.c.Do(ctx, http.MethodPost, s.item(id)+"/request-apply", nil, studioDraftVersionRequest{Version: version}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Graph reads the draft's apps as a graph of agents, apps, and call edges.
func (s *StudioDraftsClient) Graph(ctx context.Context, id string) (*StudioGraph, error) {
	var out StudioGraph
	if err := s.c.Do(ctx, http.MethodGet, s.item(id)+"/graph", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GraphOperation applies one graph operation and returns the graph after it. Member and edge operations rewrite the
// draft's AgenticApp item. It fails with 400 field codes NotAMember, SelfEdge, NoSuchEdge, or AppDeleted, and 409
// DraftVersionConflict or DraftNotOpen.
func (s *StudioDraftsClient) GraphOperation(ctx context.Context, id string, req StudioGraphOperationRequest) (*StudioGraph, error) {
	var out StudioGraph
	if err := s.c.Do(ctx, http.MethodPost, s.item(id)+"/graph-operations", nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Architects lists agent architects: deployments of the built-in agent-architect and deployments granted
// managementAccess Drafts. opts may be nil; Search matches part of the name, and ActiveOnly and Ordering apply. Needs
// Read on Deployment.
func (s *StudioDraftsClient) Architects(ctx context.Context, opts *ListOptions) (*EnumerationResult[Architect], error) {
	var out EnumerationResult[Architect]
	if err := s.c.Do(ctx, http.MethodGet, s.architects(), opts.values(), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Architect reads an agent architect by deployment identifier or name. It fails with 404 when the deployment is not an
// architect.
func (s *StudioDraftsClient) Architect(ctx context.Context, deploymentID string) (*Architect, error) {
	var out Architect
	if err := s.c.Do(ctx, http.MethodGet, s.architectItem(deploymentID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CreateArchitect creates an agent architect: a deployment of the built-in agent-architect with draft access, bound to
// the chosen prompt (builtin/agent-architect when none is named). It fails with 400 for a missing name or harness
// profile or InvalidArchitectPrompt, and 409 NameConflict or ArchitectAgentMissing.
func (s *StudioDraftsClient) CreateArchitect(ctx context.Context, req ArchitectRequest) (*Architect, error) {
	var out Architect
	if err := s.c.Do(ctx, http.MethodPost, s.architects(), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UpdateArchitect changes an architect's name, description, harness profile, model, active flag, and prompt. A nil
// ArchitectPromptTemplateID keeps the current prompt; other deployment settings are kept.
func (s *StudioDraftsClient) UpdateArchitect(ctx context.Context, deploymentID string, req ArchitectRequest) (*Architect, error) {
	var out Architect
	if err := s.c.Do(ctx, http.MethodPut, s.architectItem(deploymentID), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteArchitect deletes an agent architect (its deployment). Drafts are kept.
func (s *StudioDraftsClient) DeleteArchitect(ctx context.Context, deploymentID string) error {
	return s.c.Do(ctx, http.MethodDelete, s.architectItem(deploymentID), nil, nil, nil)
}

// ArchitectPrompts lists the System prompts the agent architect can use, one page at a time: built-ins first, then
// tenant clones of them, then the tenant's other System templates. The order is fixed, so Ordering does not apply;
// opts may be nil, and Search matches part of the name.
func (s *StudioDraftsClient) ArchitectPrompts(ctx context.Context, opts *ListOptions) (*EnumerationResult[ArchitectPromptEntry], error) {
	var out EnumerationResult[ArchitectPromptEntry]
	if err := s.c.Do(ctx, http.MethodGet, s.c.TenantPath("/studio/architect-prompts"), opts.values(), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ArchitectPrompt reads the prompt an architect deployment (identifier or name) uses. It fails with 400
// NotAnArchitectDeployment for other deployments.
func (s *StudioDraftsClient) ArchitectPrompt(ctx context.Context, deploymentID string) (*ArchitectPromptSelection, error) {
	var out ArchitectPromptSelection
	if err := s.c.Do(ctx, http.MethodGet, s.architect(deploymentID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SetArchitectPrompt chooses the prompt an architect deployment uses: templateID is a System template identifier or
// name, and version pins a version (nil follows the current one). It takes effect on the architect's next turn. It
// fails with 400 NotAnArchitectDeployment or InvalidArchitectPrompt.
func (s *StudioDraftsClient) SetArchitectPrompt(ctx context.Context, deploymentID, templateID string, version *int) (*ArchitectPromptSelection, error) {
	var out ArchitectPromptSelection
	req := ArchitectPromptRequest{ArchitectPromptTemplateID: templateID, ArchitectPromptVersion: version}
	if err := s.c.Do(ctx, http.MethodPut, s.architect(deploymentID), nil, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
