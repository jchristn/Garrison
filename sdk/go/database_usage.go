package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// RunDatabaseUsage contains exact SQL attempts from completed run lifecycle scopes.
// Shared polling, telemetry persistence, and incomplete scopes lost to a process crash are excluded.
type RunDatabaseUsage struct {
	TenantID             string `json:"tenantId"`
	RunID                string `json:"runId"`
	Operation            string `json:"operation"`
	Statements           int64  `json:"statements"`
	Reads                int64  `json:"reads"`
	Writes               int64  `json:"writes"`
	Errors               int64  `json:"errors"`
	Transactions         int64  `json:"transactions"`
	DurationMicroseconds int64  `json:"durationMicroseconds"`
}

// DatabaseUsage reads exact database totals by completed run lifecycle operation.
func (r *RunsClient) DatabaseUsage(ctx context.Context, id string) ([]RunDatabaseUsage, error) {
	var out []RunDatabaseUsage
	if err := r.c.Do(ctx, http.MethodGet, r.p("/"+url.PathEscape(id)+"/database-usage"), nil, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}
