package garrison

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
)

// Capability kinds (CapabilityDescriptor.Kind).
const (
	CapabilityKindAgent          = "Agent"
	CapabilityKindMcpTool        = "McpTool"
	CapabilityKindHarnessBuiltIn = "HarnessBuiltIn"
)

// Capability origins (CapabilityDescriptor.Origin). Derived descriptors follow their source and cannot be changed or
// deleted (409 CapabilityDerived); Manual ones are written through the API.
const (
	CapabilityOriginDerived = "Derived"
	CapabilityOriginManual  = "Manual"
)

// Capability hint statuses (CapabilityHints.Status). Unknown until enough runs finish, then Known.
const (
	CapabilityHintStatusUnknown = "Unknown"
	CapabilityHintStatusKnown   = "Known"
)

// HarnessToolProbeArguments are the arguments a harness tool probe may pass (at most one; default "--version").
var HarnessToolProbeArguments = []string{"--version", "-version", "-v", "-V", "version", "--help", "-h"}

// HarnessToolProbe is a tool a harness can use when its host has it installed, such as pandoc. Workers run the probe and
// report the tool as the node label garrison.io/tool-{name}=true; each probe becomes a HarnessBuiltIn capability. Name is
// 1 to 63 lowercase letters, digits, dots, and hyphens; Executable is a bare file name on the worker's PATH; Arguments
// holds at most one of HarnessToolProbeArguments.
type HarnessToolProbe struct {
	Name        string   `json:"name"`
	Executable  string   `json:"executable"`
	Arguments   []string `json:"arguments,omitempty"`
	Description *string  `json:"description,omitempty"`
}

// CapabilityRequirement is a node label a run needs when its agent uses a capability, for example
// garrison.io/tool-pandoc=true.
type CapabilityRequirement struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// CapabilityHints are cost and latency hints from recent finished runs. Every value is nil while Status is Unknown.
type CapabilityHints struct {
	Status           string   `json:"status,omitempty"`
	SampleSize       int      `json:"sampleSize,omitempty"`
	MedianDurationMs *int64   `json:"medianDurationMs,omitempty"`
	P90DurationMs    *int64   `json:"p90DurationMs,omitempty"`
	MeanCostUSD      *float64 `json:"meanCostUsd,omitempty"`
	WindowDays       int      `json:"windowDays,omitempty"`
	ComputedUTC      *string  `json:"computedUtc,omitempty"`
}

// CapabilityDescriptor is one capability catalog entry: an agent, an MCP tool, or a harness built-in. TenantID is nil
// for descriptors every tenant shares. InputSchema and OutputSchema are JSON Schema documents as JSON values (usually objects), nil when none. On create and update the server
// uses Name, Kind, Summary, the schemas, Tags, Requirements, and the optional SourceAgentID, SourceMcpServerID, and
// SourceToolName, and sets the rest.
type CapabilityDescriptor struct {
	ID                     string                  `json:"id,omitempty"`
	TenantID               *string                 `json:"tenantId,omitempty"`
	Name                   string                  `json:"name"`
	Kind                   string                  `json:"kind"`
	Origin                 string                  `json:"origin,omitempty"`
	SourceKey              string                  `json:"sourceKey,omitempty"`
	SourceAgentID          *string                 `json:"sourceAgentId,omitempty"`
	SourceRevisionID       *string                 `json:"sourceRevisionId,omitempty"`
	SourceMcpServerID      *string                 `json:"sourceMcpServerId,omitempty"`
	SourceToolName         *string                 `json:"sourceToolName,omitempty"`
	SourceHarnessProfileID *string                 `json:"sourceHarnessProfileId,omitempty"`
	SourceHarnessType      *string                 `json:"sourceHarnessType,omitempty"`
	Summary                *string                 `json:"summary,omitempty"`
	InputSchema            json.RawMessage         `json:"inputSchema,omitempty"`
	OutputSchema           json.RawMessage         `json:"outputSchema,omitempty"`
	Tags                   []string                `json:"tags,omitempty"`
	Requirements           []CapabilityRequirement `json:"requirements,omitempty"`
	Hints                  *CapabilityHints        `json:"hints,omitempty"`
	RefreshWarning         *string                 `json:"refreshWarning,omitempty"`
	LastRefreshedUTC       *string                 `json:"lastRefreshedUtc,omitempty"`
	CreatedUTC             string                  `json:"createdUtc,omitempty"`
	LastUpdateUTC          string                  `json:"lastUpdateUtc,omitempty"`
}

// CapabilityServerRefresh is the refresh outcome for one MCP server. Error is set when its tool listing failed.
type CapabilityServerRefresh struct {
	McpServerID   string  `json:"mcpServerId"`
	McpServerName string  `json:"mcpServerName"`
	Tools         int     `json:"tools"`
	Removed       int     `json:"removed"`
	Warned        int     `json:"warned"`
	Error         *string `json:"error"`
}

// CapabilityRefreshResult counts the descriptors a refresh created, refreshed, or removed per source.
type CapabilityRefreshResult struct {
	Agents          int                       `json:"agents"`
	HarnessBuiltIns int                       `json:"harnessBuiltIns"`
	Hints           int                       `json:"hints"`
	McpServers      []CapabilityServerRefresh `json:"mcpServers"`
}

// CapabilityListOptions filters Capabilities.List. Empty fields do not filter; Search matches the name or summary,
// ignoring case.
type CapabilityListOptions struct {
	Kind   string
	Tag    string
	Search string
}

// CapabilitiesClient reads the capability catalog (agents from their latest published revision, MCP server tools, and
// harness built-ins) and manages manual descriptors. Create and Update fail with 400 InvalidJsonSchema for a schema that
// is not JSON Schema and 409 NameConflict for a duplicate manual name; Update and Delete fail with 409
// CapabilityDerived for derived descriptors.
type CapabilitiesClient struct{ c *Client }

func (a *CapabilitiesClient) base() string { return a.c.TenantPath("/capabilities") }
func (a *CapabilitiesClient) item(idOrName string) string {
	return a.base() + "/" + url.PathEscape(idOrName)
}

// List lists the descriptors visible to the tenant (every match in one page), ordered by kind and name. opts may be nil.
func (a *CapabilitiesClient) List(ctx context.Context, opts *CapabilityListOptions) (*EnumerationResult[CapabilityDescriptor], error) {
	query := url.Values{}
	if opts != nil {
		if opts.Kind != "" {
			query.Set("kind", opts.Kind)
		}
		if opts.Tag != "" {
			query.Set("tag", opts.Tag)
		}
		if opts.Search != "" {
			query.Set("search", opts.Search)
		}
	}
	var out EnumerationResult[CapabilityDescriptor]
	if err := a.c.Do(ctx, http.MethodGet, a.base(), query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a descriptor by identifier (cap_...) or by name. A name matches the first descriptor in kind order (Agent,
// McpTool, HarnessBuiltIn), the tenant's own before shared ones.
func (a *CapabilitiesClient) Get(ctx context.Context, idOrName string) (*CapabilityDescriptor, error) {
	var out CapabilityDescriptor
	if err := a.c.Do(ctx, http.MethodGet, a.item(idOrName), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Create creates a manual descriptor.
func (a *CapabilitiesClient) Create(ctx context.Context, descriptor CapabilityDescriptor) (*CapabilityDescriptor, error) {
	var out CapabilityDescriptor
	if err := a.c.Do(ctx, http.MethodPost, a.base(), nil, descriptor, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Update replaces a manual descriptor's content.
func (a *CapabilitiesClient) Update(ctx context.Context, id string, descriptor CapabilityDescriptor) (*CapabilityDescriptor, error) {
	var out CapabilityDescriptor
	if err := a.c.Do(ctx, http.MethodPut, a.item(id), nil, descriptor, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete deletes a manual descriptor.
func (a *CapabilitiesClient) Delete(ctx context.Context, id string) error {
	return a.c.Do(ctx, http.MethodDelete, a.item(id), nil, nil, nil)
}

// Refresh refreshes derived descriptors now (agents, harness built-ins, MCP server tools, hints). A non-empty
// mcpServerID refreshes only that server's tools (404 when it names no active server).
func (a *CapabilitiesClient) Refresh(ctx context.Context, mcpServerID string) (*CapabilityRefreshResult, error) {
	query := url.Values{}
	if mcpServerID != "" {
		query.Set("mcpServerId", mcpServerID)
	}
	var out CapabilityRefreshResult
	if err := a.c.Do(ctx, http.MethodPost, a.base()+"/refresh", query, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
