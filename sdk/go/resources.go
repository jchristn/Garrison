package garrison

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func (o *ListOptions) values() url.Values {
	v := url.Values{}
	if o == nil {
		return v
	}
	if o.MaxResults > 0 {
		v.Set("maxResults", strconv.Itoa(o.MaxResults))
	}
	if o.Skip > 0 {
		v.Set("skip", strconv.Itoa(o.Skip))
	}
	if o.Ordering != "" {
		v.Set("ordering", o.Ordering)
	}
	if o.Search != "" {
		v.Set("search", o.Search)
	}
	if o.ActiveOnly {
		v.Set("activeOnly", "true")
	}
	if o.IncludeBuiltIn {
		v.Set("includeBuiltIn", "true")
	}
	return v
}

// Resource provides list, get, create, update, and delete for a tenant-scoped collection. Results decode
// into the out argument, so callers choose their own struct (for example Agent or map[string]any).
type Resource struct {
	c       *Client
	segment string
}

func (r *Resource) base() string          { return r.c.TenantPath("/" + r.segment) }
func (r *Resource) item(id string) string { return r.base() + "/" + url.PathEscape(id) }

// List decodes a page into out (for example *EnumerationResult[Agent]).
func (r *Resource) List(ctx context.Context, opts *ListOptions, out any) error {
	return r.c.Do(ctx, http.MethodGet, r.base(), opts.values(), nil, out)
}

// Get decodes one object into out.
func (r *Resource) Get(ctx context.Context, id string, out any) error {
	return r.c.Do(ctx, http.MethodGet, r.item(id), nil, nil, out)
}

// Create posts body and decodes the created object into out.
func (r *Resource) Create(ctx context.Context, body any, out any) error {
	return r.c.Do(ctx, http.MethodPost, r.base(), nil, body, out)
}

// Update puts body and decodes the updated object into out.
func (r *Resource) Update(ctx context.Context, id string, body any, out any) error {
	return r.c.Do(ctx, http.MethodPut, r.item(id), nil, body, out)
}

// Delete removes an object.
func (r *Resource) Delete(ctx context.Context, id string) error {
	return r.c.Do(ctx, http.MethodDelete, r.item(id), nil, nil, nil)
}

// Action posts to a sub-path of an object (for example "rotate" or "clone") and decodes into out.
func (r *Resource) Action(ctx context.Context, id, action string, body any, out any) error {
	return r.c.Do(ctx, http.MethodPost, r.item(id)+"/"+action, nil, body, out)
}

// AgentsClient manages agents and invokes them.
type AgentsClient struct{ Resource }

// Invoke runs an agent (identifier or name). With req.Wait the finished run returns when it completes in time.
func (a *AgentsClient) Invoke(ctx context.Context, agent string, req InvokeRequest) (*Run, error) {
	var run Run
	if err := a.c.Do(ctx, http.MethodPost, a.item(agent)+"/invoke", nil, req, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// HarnessProfilesClient manages harness profiles.
type HarnessProfilesClient struct{ Resource }

// Builtin lists the built-in harness profiles.
func (h *HarnessProfilesClient) Builtin(ctx context.Context) ([]HarnessProfile, error) {
	var out []HarnessProfile
	err := h.c.Do(ctx, http.MethodGet, "/v1.0/api/harness-profiles/builtin", nil, nil, &out)
	return out, err
}

// GlobalResource is a platform-level collection (tenants, nodes, node pools).
type GlobalResource struct {
	c    *Client
	path string
}

// List decodes a page into out.
func (g *GlobalResource) List(ctx context.Context, opts *ListOptions, out any) error {
	return g.c.Do(ctx, http.MethodGet, g.path, opts.values(), nil, out)
}

// Get decodes one object into out.
func (g *GlobalResource) Get(ctx context.Context, id string, out any) error {
	return g.c.Do(ctx, http.MethodGet, g.path+"/"+url.PathEscape(id), nil, nil, out)
}

// Create posts body and decodes the result into out.
func (g *GlobalResource) Create(ctx context.Context, body any, out any) error {
	return g.c.Do(ctx, http.MethodPost, g.path, nil, body, out)
}

// Update puts body and decodes the result into out.
func (g *GlobalResource) Update(ctx context.Context, id string, body any, out any) error {
	return g.c.Do(ctx, http.MethodPut, g.path+"/"+url.PathEscape(id), nil, body, out)
}

// Delete removes an object.
func (g *GlobalResource) Delete(ctx context.Context, id string) error {
	return g.c.Do(ctx, http.MethodDelete, g.path+"/"+url.PathEscape(id), nil, nil, nil)
}

// Action posts to a sub-path of an object (for example "cordon" or "drain").
func (g *GlobalResource) Action(ctx context.Context, id, action string, out any) error {
	return g.c.Do(ctx, http.MethodPost, g.path+"/"+url.PathEscape(id)+"/"+action, nil, nil, out)
}

// ManifestsClient applies and exports declarative manifests.
type ManifestsClient struct{ c *Client }

// Apply applies YAML or JSON manifests (multi-document allowed).
func (m *ManifestsClient) Apply(ctx context.Context, content string, dryRun, allowSecretValues bool) (*ManifestApply, error) {
	q := url.Values{"dryRun": {strconv.FormatBool(dryRun)}}
	if allowSecretValues {
		q.Set("allowSecretValues", "true")
	}
	contentType := "application/yaml"
	if t := strings.TrimSpace(content); strings.HasPrefix(t, "{") || strings.HasPrefix(t, "[") {
		contentType = "application/json"
	}
	resp, err := m.c.send(ctx, http.MethodPost, m.c.TenantPath("/manifests/apply"), q, []byte(content), contentType, "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var out ManifestApply
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

// RunsClient creates, inspects, cancels, and streams runs.
type RunsClient struct {
	c *Client
	// PollInterval is the delay between polls in WaitForCompletion. Default 500ms.
	PollInterval time.Duration
}

func (r *RunsClient) p(suffix string) string { return r.c.TenantPath("/runs" + suffix) }

// Create queues a run.
func (r *RunsClient) Create(ctx context.Context, req RunCreateRequest) (*Run, error) {
	var run Run
	if err := r.c.Do(ctx, http.MethodPost, r.p(""), nil, req, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// Get returns a run.
func (r *RunsClient) Get(ctx context.Context, id string) (*Run, error) {
	var run Run
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)), nil, nil, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// List lists runs matching filter.
func (r *RunsClient) List(ctx context.Context, f RunFilter) (*EnumerationResult[Run], error) {
	q := url.Values{}
	set := func(k, v string) {
		if v != "" {
			q.Set(k, v)
		}
	}
	set("status", f.Status)
	set("agentId", f.AgentID)
	set("deploymentId", f.DeploymentID)
	set("harnessType", f.HarnessType)
	set("nodeId", f.NodeID)
	set("parentRunId", f.ParentRunID)
	set("rootRunId", f.RootRunID)
	set("outcome", f.Outcome)
	set("ordering", f.Ordering)
	if f.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(f.MaxResults))
	}
	if f.Skip > 0 {
		q.Set("skip", strconv.Itoa(f.Skip))
	}
	var out EnumerationResult[Run]
	if err := r.c.Do(ctx, http.MethodGet, r.p(""), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Cancel requests cancellation of a run.
func (r *RunsClient) Cancel(ctx context.Context, id string) (*Run, error) {
	var run Run
	if err := r.c.Do(ctx, http.MethodPost, r.p("/"+url.PathEscape(id)+"/cancel"), nil, nil, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// Retry creates a new run with the same input.
func (r *RunsClient) Retry(ctx context.Context, id string) (*Run, error) {
	var run Run
	if err := r.c.Do(ctx, http.MethodPost, r.p("/"+url.PathEscape(id)+"/retry"), nil, nil, &run); err != nil {
		return nil, err
	}
	return &run, nil
}

// Events returns events after afterSequence.
func (r *RunsClient) Events(ctx context.Context, id string, afterSequence int64, limit int) (*RunEventPage, error) {
	q := url.Values{"afterSequence": {strconv.FormatInt(afterSequence, 10)}, "limit": {strconv.Itoa(limit)}}
	var out RunEventPage
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/events"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Stream calls fn for each streamed item until run.completed (whose item carries the final Run), fn returns
// false, or ctx is cancelled.
func (r *RunsClient) Stream(ctx context.Context, id string, afterSequence int64, fn func(RunStreamItem) bool) error {
	q := url.Values{"afterSequence": {strconv.FormatInt(afterSequence, 10)}}
	return r.c.Stream(ctx, r.p("/"+url.PathEscape(id)+"/events/stream"), q, func(m SSEMessage) (bool, error) {
		item := RunStreamItem{Name: m.Event, Data: m.Data}
		switch m.Event {
		case "run.event":
			item.Event = &RunEvent{}
			if err := json.Unmarshal([]byte(m.Data), item.Event); err != nil {
				return false, err
			}
		case "run.completed":
			item.Run = &Run{}
			if err := json.Unmarshal([]byte(m.Data), item.Run); err != nil {
				return false, err
			}
		}
		return fn(item) && m.Event != "run.completed", nil
	})
}

// WaitForCompletion polls until the run is terminal or ctx is done.
func (r *RunsClient) WaitForCompletion(ctx context.Context, id string) (*Run, error) {
	interval := r.PollInterval
	if interval <= 0 {
		interval = 500 * time.Millisecond
	}
	for {
		run, err := r.Get(ctx, id)
		if err != nil || IsTerminal(run.Status) {
			return run, err
		}
		select {
		case <-ctx.Done():
			return run, ctx.Err()
		case <-time.After(interval):
		}
	}
}

// AnalyticsClient reports aggregate tenant analytics.
type AnalyticsClient struct {
	c *Client
}

// Runs returns run metrics bucketed over time. The server returns HTTP 400 (as *Error) when From is not
// before To, when the range needs more than 400 buckets, or for an invalid interval, groupBy, harness type,
// or date.
func (a *AnalyticsClient) Runs(ctx context.Context, query AnalyticsQuery) (*RunAnalytics, error) {
	q := url.Values{}
	set := func(k, v string) {
		if v != "" {
			q.Set(k, v)
		}
	}
	set("from", query.From)
	set("to", query.To)
	set("interval", query.Interval)
	set("agentId", query.AgentID)
	set("harnessType", query.HarnessType)
	set("deploymentId", query.DeploymentID)
	set("groupBy", query.GroupBy)
	var out RunAnalytics
	if err := a.c.Do(ctx, http.MethodGet, a.c.TenantPath("/analytics/runs"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
