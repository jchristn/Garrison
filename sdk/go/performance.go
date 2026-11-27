package garrison

import (
	"context"
	"net/http"
	"net/url"
	"time"
)

// PerformanceMetrics covers runs created in the window by the agents in scope; eval, shadow, and playground runs are
// left out. SuccessRate is Succeeded / (Succeeded + Failed), 0 to 1, nil with no finished runs. The latency percentiles
// are over finished runs and nil when there are none. EscalationRate is EscalationsRaised / Runs, nil with no runs.
// EvalScore is the mean score (0 to 1) of completed eval runs on the scope's deployments, scheduled checks included.
// SampleRunIDs holds at most 5 runs: the newest failures first, then the newest successes.
type PerformanceMetrics struct {
	Runs                int      `json:"runs"`
	Succeeded           int      `json:"succeeded"`
	Failed              int      `json:"failed"`
	Cancelled           int      `json:"cancelled"`
	SuccessRate         *float64 `json:"successRate"`
	CostUSD             float64  `json:"costUsd"`
	LatencyP50Ms        *int64   `json:"latencyP50Ms"`
	LatencyP95Ms        *int64   `json:"latencyP95Ms"`
	LatencyP99Ms        *int64   `json:"latencyP99Ms"`
	EscalationsRaised   int      `json:"escalationsRaised"`
	EscalationRate      *float64 `json:"escalationRate"`
	LoopGuardRejections int      `json:"loopGuardRejections"`
	EvalScore           *float64 `json:"evalScore"`
	EvalRuns            int      `json:"evalRuns"`
	SampleRunIDs        []string `json:"sampleRunIds"`
}

// OrgUnitPerformance is one unit's entry in OrgPerformance, with metrics over the unit's whole subtree.
type OrgUnitPerformance struct {
	UnitID       string             `json:"unitId"`
	UnitName     string             `json:"unitName"`
	ParentUnitID *string            `json:"parentUnitId"`
	LeadAgentID  *string            `json:"leadAgentId"`
	Metrics      PerformanceMetrics `json:"metrics"`
}

// AgentPerformance is one agent positioned in the live tree.
type AgentPerformance struct {
	AgentID   string             `json:"agentId"`
	AgentName *string            `json:"agentName"`
	UnitID    string             `json:"unitId"`
	UnitName  *string            `json:"unitName"`
	IsLead    bool               `json:"isLead"`
	Metrics   PerformanceMetrics `json:"metrics"`
}

// PerformanceCheck is a scheduled check: a trigger with target EvalSet whose deployment belongs to an agent in scope,
// with its newest eval run. LastStatus is an EvalRunStatus constant.
type PerformanceCheck struct {
	TriggerID      string   `json:"triggerId"`
	TriggerName    *string  `json:"triggerName"`
	Active         bool     `json:"active"`
	EvalSetID      string   `json:"evalSetId"`
	EvalSetName    *string  `json:"evalSetName"`
	DeploymentID   string   `json:"deploymentId"`
	AgentID        *string  `json:"agentId"`
	CronExpression *string  `json:"cronExpression"`
	NextFireUTC    *string  `json:"nextFireUtc"`
	LastEvalRunID  *string  `json:"lastEvalRunId"`
	LastRunUTC     *string  `json:"lastRunUtc"`
	LastStatus     *string  `json:"lastStatus"`
	LastScore      *float64 `json:"lastScore"`
	LastPassed     *bool    `json:"lastPassed"`
}

// OrgPerformance is an organization's performance over a window, computed by the server on each read: units in chart
// order (each covering its subtree), agents in the live tree, and the scheduled checks on their deployments.
type OrgPerformance struct {
	OrganizationID string               `json:"organizationId"`
	Name           string               `json:"name"`
	FromUTC        string               `json:"fromUtc"`
	ToUTC          string               `json:"toUtc"`
	GeneratedUTC   string               `json:"generatedUtc"`
	Units          []OrgUnitPerformance `json:"units"`
	Agents         []AgentPerformance   `json:"agents"`
	Checks         []PerformanceCheck   `json:"checks"`
}

// PerformanceQuery is the window and scope of a performance read. A zero FromUTC or ToUTC uses the server default
// (the last 7 days ending now); the span is at most 90 days. UnitID restricts the response to that unit's subtree.
type PerformanceQuery struct {
	FromUTC time.Time
	ToUTC   time.Time
	UnitID  string
}

// PerformanceClient reads organization performance per unit and per agent over a window, with scheduled checks. It
// needs Read on Organization.
type PerformanceClient struct{ c *Client }

// Get reads an organization's performance. A span over 90 days answers 400; a UnitID outside the organization answers
// 404.
func (p *PerformanceClient) Get(ctx context.Context, orgID string, query PerformanceQuery) (*OrgPerformance, error) {
	q := url.Values{}
	if !query.FromUTC.IsZero() {
		q.Set("fromUtc", query.FromUTC.UTC().Format(time.RFC3339Nano))
	}
	if !query.ToUTC.IsZero() {
		q.Set("toUtc", query.ToUTC.UTC().Format(time.RFC3339Nano))
	}
	if query.UnitID != "" {
		q.Set("unitId", query.UnitID)
	}
	var out OrgPerformance
	if err := p.c.Do(ctx, http.MethodGet, p.c.TenantPath("/organizations/"+url.PathEscape(orgID)+"/performance"), q, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
