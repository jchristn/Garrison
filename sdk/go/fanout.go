package garrison

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
)

// Fan-out group states (FanOutGroup.Status). Every state other than Running is final.
const (
	FanOutGroupStatusRunning        = "Running"
	FanOutGroupStatusJoined         = "Joined"
	FanOutGroupStatusTimedOut       = "TimedOut"
	FanOutGroupStatusBudgetExceeded = "BudgetExceeded"
	FanOutGroupStatusCancelled      = "Cancelled"
)

// Fan-out join policies (FanOutGroup.JoinPolicy). All joins when every member finished; Any when one member succeeded
// (or every member finished without one succeeding); Quorum when Quorum members succeeded (or the quorum can no longer
// be met).
const (
	FanOutJoinPolicyAll    = "All"
	FanOutJoinPolicyAny    = "Any"
	FanOutJoinPolicyQuorum = "Quorum"
)

// FanOutMember is one member of a fan-out group: a child run with its current state and, once finished, its result.
// Status is a run status and Outcome a run outcome (nil until the member finishes). ResultText is cut at the server's
// gather limit, and ResultTruncated reports the cut. FilesWritten holds the paths the member wrote in the shared file
// space. StructuredOutput is the member's structured output as a JSON value; nil when it produced none. Tokens counts
// input plus output tokens.
type FanOutMember struct {
	Label            string          `json:"label"`
	Agent            string          `json:"agent"`
	RunID            string          `json:"runId"`
	Status           string          `json:"status"`
	Outcome          *string         `json:"outcome,omitempty"`
	ResultText       *string         `json:"resultText,omitempty"`
	ResultTruncated  bool            `json:"resultTruncated"`
	StructuredOutput json.RawMessage `json:"structuredOutput,omitempty"`
	ErrorMessage     *string         `json:"errorMessage,omitempty"`
	FilesWritten     []string        `json:"filesWritten,omitempty"`
	CostUSD          *float64        `json:"costUsd,omitempty"`
	Tokens           int64           `json:"tokens"`
}

// FanOutGroup is a group of child runs a run started with the garrison_fan_out MCP tool, with its members' state and
// results. ID has the prefix fog_. Pending lists the labels of members still queued or running; Failed lists those that
// failed, timed out, or were cancelled. CostUSD and Tokens total the members; MaxCostUSD and MaxTokens are the group's
// budget (nil when unset). Times are ISO 8601 UTC. Summary, ContinuationMarker, and ContinuationInstruction are set only
// on the views a harness sees through garrison_gather and are normally nil here.
type FanOutGroup struct {
	ID                      string         `json:"fanOutGroupId"`
	ParentRunID             string         `json:"parentRunId"`
	Status                  string         `json:"status"`
	StatusReason            *string        `json:"statusReason,omitempty"`
	JoinPolicy              string         `json:"joinPolicy"`
	Quorum                  int            `json:"quorum"`
	Total                   int            `json:"total"`
	Finished                int            `json:"finished"`
	Succeeded               int            `json:"succeeded"`
	Pending                 []string       `json:"pending,omitempty"`
	Failed                  []string       `json:"failed,omitempty"`
	Members                 []FanOutMember `json:"members,omitempty"`
	CostUSD                 float64        `json:"costUsd"`
	Tokens                  int64          `json:"tokens"`
	MaxCostUSD              *float64       `json:"maxCostUsd,omitempty"`
	MaxTokens               *int64         `json:"maxTokens,omitempty"`
	DeadlineUTC             *string        `json:"deadlineUtc,omitempty"`
	CreatedUTC              string         `json:"createdUtc"`
	CompletedUTC            *string        `json:"completedUtc,omitempty"`
	Summary                 *string        `json:"summary,omitempty"`
	ContinuationMarker      *string        `json:"continuationMarker,omitempty"`
	ContinuationInstruction *string        `json:"continuationInstruction,omitempty"`
}

// FanOutGroupsClient reads and cancels fan-out groups. Groups are created only by a run calling the garrison_fan_out
// MCP tool, so the client has no create method. A group in another tenant, or one that does not exist, is a 404.
type FanOutGroupsClient struct{ c *Client }

func (a *FanOutGroupsClient) item(groupID string) string {
	return a.c.TenantPath("/fan-out-groups/" + url.PathEscape(groupID))
}

// ListByRun lists the fan-out groups a run started, oldest first. It fails with 404 when the run does not exist.
func (a *FanOutGroupsClient) ListByRun(ctx context.Context, runID string) ([]FanOutGroup, error) {
	var out []FanOutGroup
	if err := a.c.Do(ctx, http.MethodGet, a.c.TenantPath("/runs/"+url.PathEscape(runID)+"/fan-out-groups"), nil, nil, &out); err != nil {
		return nil, err
	}
	if out == nil {
		out = []FanOutGroup{}
	}
	return out, nil
}

// Get reads a fan-out group with its members' state and results.
func (a *FanOutGroupsClient) Get(ctx context.Context, groupID string) (*FanOutGroup, error) {
	var out FanOutGroup
	if err := a.c.Do(ctx, http.MethodGet, a.item(groupID), nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Cancel cancels a fan-out group: members still running are cancelled. It returns the group as it stands afterwards.
func (a *FanOutGroupsClient) Cancel(ctx context.Context, groupID string) (*FanOutGroup, error) {
	var out FanOutGroup
	if err := a.c.Do(ctx, http.MethodPost, a.item(groupID)+"/cancel", nil, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
