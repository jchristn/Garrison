package garrison

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
)

// Report kinds (Report.Kind).
const (
	ReportKindStatus   = "Status"
	ReportKindIncident = "Incident"
	ReportKindDecision = "Decision"
	ReportKindHandoff  = "Handoff"
	ReportKindBrief    = "Brief"
)

// Report health values (Report.Health). Unhealthy notifies endpoints subscribed to ReportUnhealthy.
const (
	ReportHealthHealthy   = "Healthy"
	ReportHealthDegraded  = "Degraded"
	ReportHealthUnhealthy = "Unhealthy"
	ReportHealthUnknown   = "Unknown"
)

// Report audiences (Report.Audience).
const (
	ReportAudienceManager = "Manager"
	ReportAudienceChain   = "Chain"
	ReportAudienceBoard   = "Board"
)

// Report issue severities (ReportIssue.Severity).
const (
	ReportIssueLow    = "Low"
	ReportIssueMedium = "Medium"
	ReportIssueHigh   = "High"
)

// ReportMetric is one measurement in a report. The same name from the same author over time forms a series.
type ReportMetric struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Unit  *string `json:"unit,omitempty"`
}

// ReportIssue is one problem listed in a report.
type ReportIssue struct {
	Severity string `json:"severity,omitempty"`
	Text     string `json:"text"`
}

// ReportDecision is one decision listed in a report.
type ReportDecision struct {
	Text string `json:"text"`
}

// Report is an immutable status record filed upward by a run or a person. Title, body, issues, and decisions are text
// the author wrote; treat them as untrusted. AuthorAgentID is nil for a person's report in their own name.
type Report struct {
	ID                   string           `json:"id"`
	TenantID             string           `json:"tenantId"`
	AuthorAgentID        *string          `json:"authorAgentId,omitempty"`
	AuthorAgentName      *string          `json:"authorAgentName,omitempty"`
	RunID                *string          `json:"runId,omitempty"`
	MandateID            *string          `json:"mandateId,omitempty"`
	MandateTickID        *string          `json:"mandateTickId,omitempty"`
	OrgUnitID            *string          `json:"orgUnitId,omitempty"`
	AppID                *string          `json:"appId,omitempty"`
	AppName              *string          `json:"appName,omitempty"`
	Audience             string           `json:"audience"`
	Kind                 string           `json:"kind"`
	Health               string           `json:"health"`
	Title                string           `json:"title"`
	Body                 string           `json:"body"`
	PeriodStartUTC       *string          `json:"periodStartUtc,omitempty"`
	PeriodEndUTC         *string          `json:"periodEndUtc,omitempty"`
	Metrics              []ReportMetric   `json:"metrics"`
	Issues               []ReportIssue    `json:"issues"`
	Decisions            []ReportDecision `json:"decisions"`
	FiledByPrincipalType string           `json:"filedByPrincipalType,omitempty"`
	FiledByPrincipalID   *string          `json:"filedByPrincipalId,omitempty"`
	FiledByName          *string          `json:"filedByName,omitempty"`
	FilingKey            *string          `json:"filingKey,omitempty"`
	CreatedUTC           string           `json:"createdUtc,omitempty"`
}

// ReportMetricPoint is one point of a metric series. TimestampUTC is the report's period end when it has one,
// otherwise when it was filed.
type ReportMetricPoint struct {
	ReportID        string  `json:"reportId"`
	AuthorAgentID   *string `json:"authorAgentId,omitempty"`
	AuthorAgentName *string `json:"authorAgentName,omitempty"`
	Name            string  `json:"name"`
	Value           float64 `json:"value"`
	Unit            *string `json:"unit,omitempty"`
	TimestampUTC    string  `json:"timestampUtc"`
}

// ReportFilter filters Reports.List; empty fields are not sent. Author and App take an identifier or name; From and To
// are ISO 8601 times.
type ReportFilter struct {
	Author     string
	App        string
	Unit       string
	Kind       string
	Health     string
	RunID      string
	From       string
	To         string
	Search     string
	MaxResults int
	Skip       int
}

// ReportMetricFilter filters Reports.MetricSeries; empty fields are not sent. MaxPoints is 1 to 5000 (default 500).
type ReportMetricFilter struct {
	Author    string
	Name      string
	From      string
	To        string
	MaxPoints int
}

// ReportFileRequest files a report as a person. Agent names the author by identifier or name; IdempotencyKey makes a
// retry return the first report.
type ReportFileRequest struct {
	Agent          string           `json:"agent,omitempty"`
	App            string           `json:"app,omitempty"`
	Audience       string           `json:"audience,omitempty"`
	Kind           string           `json:"kind,omitempty"`
	Health         string           `json:"health,omitempty"`
	Title          string           `json:"title"`
	Body           string           `json:"body,omitempty"`
	PeriodStartUTC string           `json:"periodStartUtc,omitempty"`
	PeriodEndUTC   string           `json:"periodEndUtc,omitempty"`
	Metrics        []ReportMetric   `json:"metrics,omitempty"`
	Issues         []ReportIssue    `json:"issues,omitempty"`
	Decisions      []ReportDecision `json:"decisions,omitempty"`
	IdempotencyKey string           `json:"idempotencyKey,omitempty"`
}

// ReportsClient lists and reads reports, returns metric series, and files reports as a person. Agents file through the
// garrison_file_report MCP tool. Reading needs Read on Report; filing needs Create. Reports are immutable.
type ReportsClient struct{ c *Client }

// List returns a page of reports, newest first, with their metrics, issues, and decisions.
func (r *ReportsClient) List(ctx context.Context, filter ReportFilter) (*EnumerationResult[Report], error) {
	q := url.Values{}
	set := func(name, value string) {
		if value != "" {
			q.Set(name, value)
		}
	}
	set("author", filter.Author)
	set("app", filter.App)
	set("unit", filter.Unit)
	set("kind", filter.Kind)
	set("health", filter.Health)
	set("runId", filter.RunID)
	set("from", filter.From)
	set("to", filter.To)
	set("search", filter.Search)
	if filter.MaxResults > 0 {
		q.Set("maxResults", strconv.Itoa(filter.MaxResults))
	}
	if filter.Skip > 0 {
		q.Set("skip", strconv.Itoa(filter.Skip))
	}
	var out EnumerationResult[Report]
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/reports"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Get reads a report.
func (r *ReportsClient) Get(ctx context.Context, id string) (*Report, error) {
	var out Report
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/reports/"+url.PathEscape(id)), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// MetricSeries returns metric points from reports, oldest first.
func (r *ReportsClient) MetricSeries(ctx context.Context, filter ReportMetricFilter) ([]ReportMetricPoint, error) {
	q := url.Values{}
	set := func(name, value string) {
		if value != "" {
			q.Set(name, value)
		}
	}
	set("author", filter.Author)
	set("name", filter.Name)
	set("from", filter.From)
	set("to", filter.To)
	if filter.MaxPoints > 0 {
		q.Set("maxPoints", strconv.Itoa(filter.MaxPoints))
	}
	var out []ReportMetricPoint
	if err := r.c.Do(ctx, http.MethodGet, r.c.TenantPath("/reports/metrics"), q, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// File files a report in your own name or an agent's.
func (r *ReportsClient) File(ctx context.Context, request ReportFileRequest) (*Report, error) {
	var out Report
	if err := r.c.Do(ctx, http.MethodPost, r.c.TenantPath("/reports"), nil, request, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
