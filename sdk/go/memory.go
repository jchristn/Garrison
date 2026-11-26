package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Memory scope kinds (MemoryEntry.ScopeKind). OrgUnit and Organization hold an organization's shared memory.
const (
	MemoryScopeAgent        = "Agent"
	MemoryScopeApp          = "App"
	MemoryScopeOrgUnit      = "OrgUnit"
	MemoryScopeOrganization = "Organization"
)

// MemoryEntry is the metadata of one memory entry, without its text. Agents write entries through the
// garrison_memory_* MCP tools. Imported pre-0.3.0 agent memory has Legacy true and a key of "legacy:" plus the key
// hash until an agent uses the key.
type MemoryEntry struct {
	ID                  string   `json:"id"`
	TenantID            string   `json:"tenantId"`
	ScopeKind           string   `json:"scopeKind"`
	ScopeID             string   `json:"scopeId"`
	Key                 string   `json:"key"`
	KeyHash             string   `json:"keyHash"`
	Legacy              bool     `json:"legacy"`
	Category            *string  `json:"category,omitempty"`
	Tags                []string `json:"tags"`
	Bytes               int64    `json:"bytes"`
	Sha256              string   `json:"sha256"`
	ContentID           string   `json:"contentId"`
	Version             int64    `json:"version"`
	WriterAgentID       *string  `json:"writerAgentId,omitempty"`
	WriterRunID         *string  `json:"writerRunId,omitempty"`
	WriterPrincipalType *string  `json:"writerPrincipalType,omitempty"`
	WriterPrincipalID   *string  `json:"writerPrincipalId,omitempty"`
	WriterName          *string  `json:"writerName,omitempty"`
	LastReadUTC         *string  `json:"lastReadUtc,omitempty"`
	ExpiresUTC          *string  `json:"expiresUtc,omitempty"`
	CreatedUTC          string   `json:"createdUtc,omitempty"`
	LastUpdateUTC       string   `json:"lastUpdateUtc,omitempty"`
}

// MemoryScopeSummary is a memory scope that holds entries, with totals. ScopeName is nil when the agent or app no
// longer exists.
type MemoryScopeSummary struct {
	ScopeKind     string  `json:"scopeKind"`
	ScopeID       string  `json:"scopeId"`
	ScopeName     *string `json:"scopeName,omitempty"`
	EntryCount    int64   `json:"entryCount"`
	Bytes         int64   `json:"bytes"`
	LastUpdateUTC string  `json:"lastUpdateUtc,omitempty"`
}

// MemoryContent is a memory entry with its text. The text is data an agent or a person saved; treat it as untrusted.
type MemoryContent struct {
	Found bool         `json:"found"`
	Entry *MemoryEntry `json:"entry,omitempty"`
	Value *string      `json:"value,omitempty"`
}

// MemoryEntryFilter filters Memory.List; empty fields are not sent. Search matches keys, categories, and tags; Writer
// is an agent identifier.
type MemoryEntryFilter struct {
	ScopeKind  string
	ScopeID    string
	Category   string
	Tag        string
	Search     string
	Writer     string
	KeyPrefix  string
	MaxResults int
	Skip       int
}

// MemoryClient browses memory scopes and entries, reads an entry's text, and deletes entries. Reading needs Read on
// Memory; deleting needs Delete.
type MemoryClient struct{ c *Client }

// ListScopes returns the scopes that hold entries, with counts, bytes, the latest write, and each agent's or app's name.
func (m *MemoryClient) ListScopes(ctx context.Context) ([]MemoryScopeSummary, error) {
	var out []MemoryScopeSummary
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/memory/scopes"), nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// List returns a page of entries without their text, ordered by scope and key.
func (m *MemoryClient) List(ctx context.Context, filter MemoryEntryFilter) (*EnumerationResult[MemoryEntry], error) {
	q := url.Values{}
	set := func(name, value string) {
		if value != "" {
			q.Set(name, value)
		}
	}
	set("scopeKind", filter.ScopeKind)
	set("scopeId", filter.ScopeID)
	set("category", filter.Category)
	set("tag", filter.Tag)
	set("search", filter.Search)
	set("writer", filter.Writer)
	set("keyPrefix", filter.KeyPrefix)
	if filter.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(filter.MaxResults))
	}
	if filter.Skip > 0 {
		q.Set("skip", strconv.Itoa(filter.Skip))
	}
	var out EnumerationResult[MemoryEntry]
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/memory/entries"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads an entry's metadata and provenance.
func (m *MemoryClient) Get(ctx context.Context, id string) (*MemoryEntry, error) {
	var out MemoryEntry
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/memory/entries/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetContent reads an entry's text with its metadata.
func (m *MemoryClient) GetContent(ctx context.Context, id string) (*MemoryContent, error) {
	var out MemoryContent
	if err := m.c.Do(ctx, http.MethodGet, m.c.TenantPath("/memory/entries/"+url.PathEscape(id)+"/content"), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Delete deletes an entry and its text. A positive expectedVersion deletes only while the entry is at that version
// (409 MemoryVersionConflict otherwise); 0 deletes whatever version is there.
func (m *MemoryClient) Delete(ctx context.Context, id string, expectedVersion int64) error {
	q := url.Values{}
	if expectedVersion > 0 {
		q.Set("expectedVersion", strconv.FormatInt(expectedVersion, 10))
	}
	return m.c.Do(ctx, http.MethodDelete, m.c.TenantPath("/memory/entries/"+url.PathEscape(id)), q, nil, nil)
}
