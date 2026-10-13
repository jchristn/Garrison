package garrison

import (
	"context"
	"net/http"
	"net/url"
)

// McpServerTestResult is a safe connection outcome, without command, environment or raw output.
type McpServerTestResult struct {
	Success              bool     `json:"success"`
	NodeID               string   `json:"nodeId,omitempty"`
	Tools                []string `json:"tools"`
	MissingRequiredTools []string `json:"missingRequiredTools"`
	Error                string   `json:"error,omitempty"`
	DurationMs           int64    `json:"durationMs"`
}

// TestMcpServer lists HTTP tools, or tests stdio on an explicitly selected Ready worker.
// Empty nodeID is only valid for HTTP servers. The worker must advertise SupportsMcpTests.
func (c *Client) TestMcpServer(ctx context.Context, id, nodeID string) (*McpServerTestResult, error) {
	query := url.Values{}
	if nodeID != "" {
		query.Set("nodeId", nodeID)
	}
	var result McpServerTestResult
	err := c.Do(ctx, http.MethodPost, c.TenantPath("/mcp-servers/"+url.PathEscape(id)+"/test"), query, nil, &result)
	return &result, err
}
