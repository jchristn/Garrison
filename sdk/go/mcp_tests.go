package garrison

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
)

// McpToolDetail is one tool an MCP server test listed. InputSchema is the tool's JSON Schema as a JSON value; nil when
// the server did not report one.
type McpToolDetail struct {
	Name        string          `json:"name"`
	Description *string         `json:"description,omitempty"`
	InputSchema json.RawMessage `json:"inputSchema,omitempty"`
}

// McpServerTestResult is a safe connection outcome, without command, environment or raw output. ToolDetails describes
// each listed tool.
type McpServerTestResult struct {
	Success              bool            `json:"success"`
	NodeID               string          `json:"nodeId,omitempty"`
	Tools                []string        `json:"tools"`
	ToolDetails          []McpToolDetail `json:"toolDetails,omitempty"`
	MissingRequiredTools []string        `json:"missingRequiredTools"`
	Error                string          `json:"error,omitempty"`
	DurationMs           int64           `json:"durationMs"`
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
